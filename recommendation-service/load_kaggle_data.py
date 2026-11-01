"""
Load Kaggle RetailRocket E-Commerce Dataset into Vaulto Recommendation Service.

Downloads the real RetailRocket dataset and maps it to Vaulto's schema:
  - Items       → Coupons  (with category from the real category tree)
  - Visitors    → Users
  - Events      → UserEvents  (view→view, addtocart→save, transaction→claim)
  - Aggregated  → UserProfiles (cluster_weights from real interactions)

Prerequisites:
  1. pip install kaggle
  2. Place your kaggle.json at  C:\\Users\\<YOU>\\.kaggle\\kaggle.json
     (Download from https://www.kaggle.com/settings → API → Create New Token)
  3. Docker Compose services (db + qdrant) must be running.

Usage:
    # Inside the Docker container:
    docker compose exec recommendation-api python load_kaggle_data.py

    # Or locally:
    python load_kaggle_data.py
"""

from __future__ import annotations

import asyncio
import csv
import logging
import os
import random
import shutil
import subprocess
import sys
import zipfile
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DATASET_SLUG = "retailrocket/ecommerce-dataset"
DATA_DIR = Path("data/retailrocket")

# Limits — set to None or very large number for the full dataset
MAX_ITEMS: int = 5000        # Top N items by event count
MAX_EVENTS: int = 200_000    # Max events to load (from the filtered item set)
MAX_USERS: int = 10_000      # Max unique visitors

# Mapping of top-level category IDs to human-readable "store" names.
# We build this dynamically from the category tree, but these are the
# fallback display names for the root categories.
ROOT_STORE_NAMES = [
    "MegaMart", "TechZone", "FashionHub", "HomeEssentials",
    "SportsPro", "GadgetWorld", "BeautyBox", "FreshGrocery",
    "BookCorner", "ToyLand", "PetCare", "GardenLife",
    "AutoParts", "HealthPlus", "OfficeMax", "TravelDeals",
]

# ---------------------------------------------------------------------------
# Step 1: Download dataset
# ---------------------------------------------------------------------------

def download_dataset():
    """Download the RetailRocket dataset from Kaggle."""
    if (DATA_DIR / "events.csv").exists():
        logger.info("Dataset already downloaded, skipping.")
        return

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = DATA_DIR / "ecommerce-dataset.zip"

    logger.info("Downloading RetailRocket dataset from Kaggle...")
    subprocess.run(
        [
            sys.executable, "-m", "kaggle", "datasets", "download",
            "-d", DATASET_SLUG,
            "-p", str(DATA_DIR),
        ],
        check=True,
    )

    # Find the downloaded zip
    zips = list(DATA_DIR.glob("*.zip"))
    if not zips:
        raise FileNotFoundError("Kaggle download did not produce a zip file.")
    zip_path = zips[0]

    logger.info(f"Extracting {zip_path}...")
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(DATA_DIR)
    zip_path.unlink()  # Remove the zip to save space

    logger.info("Dataset ready.")


# ---------------------------------------------------------------------------
# Step 2: Parse category tree
# ---------------------------------------------------------------------------

def parse_category_tree() -> tuple[dict[int, int | None], dict[int, str], dict[int, str]]:
    """
    Parse category_tree.csv and return:
      - parent_map:   {child_cat_id: parent_cat_id or None}
      - label_map:    {cat_id: "Category <id>"}  (human-readable label)
      - store_map:    {cat_id: root store name}   (which root the cat belongs to)
    """
    parent_map: dict[int, int | None] = {}
    tree_path = DATA_DIR / "category_tree.csv"

    with open(tree_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            child = int(row["categoryid"])
            parent_raw = row.get("parentid", "").strip()
            parent = int(parent_raw) if parent_raw else None
            parent_map[child] = parent

    # Find root categories (no parent)
    roots = [cid for cid, pid in parent_map.items() if pid is None]
    roots.sort()

    # Assign human-readable store names to root categories
    root_to_store: dict[int, str] = {}
    for i, root_id in enumerate(roots):
        name = ROOT_STORE_NAMES[i % len(ROOT_STORE_NAMES)]
        root_to_store[root_id] = name

    # Build ancestry → find root for every category
    def find_root(cid: int) -> int:
        visited = set()
        while parent_map.get(cid) is not None:
            if cid in visited:
                break
            visited.add(cid)
            cid = parent_map[cid]
        return cid

    # Build label and store maps
    label_map: dict[int, str] = {}
    store_map: dict[int, str] = {}
    for cid in parent_map:
        # Build path from leaf to root
        path = []
        cur = cid
        visited = set()
        while cur is not None and cur not in visited:
            path.append(cur)
            visited.add(cur)
            cur = parent_map.get(cur)
        path.reverse()

        label_map[cid] = " > ".join(f"Category_{c}" for c in path)
        root = path[0]
        store_map[cid] = root_to_store.get(root, f"Store_{root}")

    logger.info(f"Parsed category tree: {len(parent_map)} categories, {len(roots)} roots.")
    return parent_map, label_map, store_map


# ---------------------------------------------------------------------------
# Step 3: Parse item properties
# ---------------------------------------------------------------------------

def parse_item_properties(
    label_map: dict[int, str],
    store_map: dict[int, str],
) -> dict[int, dict]:
    """
    Parse item_properties_part1.csv and item_properties_part2.csv.
    Extract categoryid and available for each item.

    Returns: {itemid: {category_id, category_label, store, available, numeric_props}}
    """
    items: dict[int, dict] = defaultdict(lambda: {
        "category_id": None,
        "category_label": "Uncategorized",
        "store": "GeneralStore",
        "available": True,
        "numeric_props": [],
    })

    for part in ["item_properties_part1.csv", "item_properties_part2.csv"]:
        filepath = DATA_DIR / part
        if not filepath.exists():
            # Try without "part" naming
            alt = DATA_DIR / "item_properties.csv"
            if alt.exists():
                filepath = alt
            else:
                logger.warning(f"File {part} not found, skipping.")
                continue

        logger.info(f"Parsing {filepath.name}...")
        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                item_id = int(row["itemid"])
                prop = row["property"]
                value = row["value"].strip()

                if prop == "categoryid":
                    try:
                        cat_id = int(value)
                        items[item_id]["category_id"] = cat_id
                        items[item_id]["category_label"] = label_map.get(cat_id, f"Category_{cat_id}")
                        items[item_id]["store"] = store_map.get(cat_id, "GeneralStore")
                    except ValueError:
                        pass

                elif prop == "available":
                    items[item_id]["available"] = value == "1"

                elif value.startswith("n"):
                    # Numeric property (e.g., price-like)
                    try:
                        num_val = float(value[1:])
                        items[item_id]["numeric_props"].append(num_val)
                    except ValueError:
                        pass

    logger.info(f"Parsed properties for {len(items)} unique items.")
    return dict(items)


# ---------------------------------------------------------------------------
# Step 4: Parse events
# ---------------------------------------------------------------------------

EVENT_TYPE_MAP = {
    "view": "view",
    "addtocart": "save",
    "transaction": "claim",
}


def parse_events(
    valid_item_ids: set[int],
) -> tuple[list[dict], set[int], dict[int, int]]:
    """
    Parse events.csv, filter to valid_item_ids.

    Returns:
      - events: list of {visitor_id, item_id, event_type, timestamp}
      - unique_visitor_ids: set
      - item_event_counts: {item_id: count}  (for popularity / discount proxy)
    """
    events_path = DATA_DIR / "events.csv"
    events: list[dict] = []
    visitor_ids: set[int] = set()
    item_event_counts: dict[int, int] = defaultdict(int)

    logger.info("Parsing events.csv...")
    with open(events_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            item_id = int(row["itemid"])
            if item_id not in valid_item_ids:
                continue

            visitor_id = int(row["visitorid"])
            event_type_raw = row["event"].strip()
            event_type = EVENT_TYPE_MAP.get(event_type_raw)
            if event_type is None:
                continue

            ts_ms = int(row["timestamp"])
            timestamp = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)

            item_event_counts[item_id] += 1

            events.append({
                "visitor_id": visitor_id,
                "item_id": item_id,
                "event_type": event_type,
                "timestamp": timestamp,
            })
            visitor_ids.add(visitor_id)

    logger.info(f"Parsed {len(events)} events from {len(visitor_ids)} visitors.")
    return events, visitor_ids, dict(item_event_counts)


# ---------------------------------------------------------------------------
# Step 5: Select top items by popularity
# ---------------------------------------------------------------------------

def select_top_items(item_props: dict[int, dict], max_items: int) -> set[int]:
    """
    First pass over events.csv to count events per item,
    then select the top N most interacted items.
    """
    logger.info("First pass: counting item popularity...")
    item_counts: dict[int, int] = defaultdict(int)
    events_path = DATA_DIR / "events.csv"

    with open(events_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            item_id = int(row["itemid"])
            if item_id in item_props:
                item_counts[item_id] += 1

    # Sort by count descending, take top N
    sorted_items = sorted(item_counts.items(), key=lambda x: x[1], reverse=True)
    top_ids = {item_id for item_id, _ in sorted_items[:max_items]}
    logger.info(f"Selected top {len(top_ids)} items by event count.")
    return top_ids


# ---------------------------------------------------------------------------
# Step 6: Load into Vaulto DB + Qdrant
# ---------------------------------------------------------------------------

async def load_into_vaulto(
    item_props: dict[int, dict],
    selected_item_ids: set[int],
    events: list[dict],
    visitor_ids: set[int],
    item_event_counts: dict[int, int],
):
    """Insert everything into Postgres and Qdrant."""
    # pyrefly: ignore [missing-import]
    from sqlalchemy.ext.asyncio import AsyncSession
    # pyrefly: ignore [missing-import]
    from sqlalchemy.future import select as sa_select

    from app.db.database import engine, Base, AsyncSessionLocal
    from app.db.models import User, Coupon, UserEvent, UserProfile
    from app.services.embedding import (
        generate_coupon_text,
        generate_embedding,
        upsert_coupon_embedding,
        init_qdrant,
    )
    from app.services.clustering import assign_coupon_cluster, train_clusters

    # Create tables (drop first to clear old synthetic data)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    init_qdrant()

    # Remap visitor IDs to sequential user IDs
    sorted_visitors = sorted(visitor_ids)
    if MAX_USERS and len(sorted_visitors) > MAX_USERS:
        sorted_visitors = sorted_visitors[:MAX_USERS]
    visitor_to_uid: dict[int, int] = {vid: i + 1 for i, vid in enumerate(sorted_visitors)}
    valid_visitors = set(sorted_visitors)

    # Remap item IDs to sequential coupon IDs
    sorted_items = sorted(selected_item_ids)
    item_to_cid: dict[int, int] = {iid: i + 1 for i, iid in enumerate(sorted_items)}

    # Compute max event count for discount normalization
    max_event_count = max(item_event_counts.values()) if item_event_counts else 1

    async with AsyncSessionLocal() as db:
        db: AsyncSession

        # ------------------------------------------------------------------
        # 6a. Insert Users
        # ------------------------------------------------------------------
        logger.info(f"Inserting {len(visitor_to_uid)} users...")
        for vid, uid in visitor_to_uid.items():
            db.add(User(id=uid))
        await db.commit()

        # ------------------------------------------------------------------
        # 6b. Insert Coupons + Embeddings
        # ------------------------------------------------------------------
        logger.info(f"Inserting {len(sorted_items)} coupons with embeddings...")
        coupon_objs: dict[int, Coupon] = {}

        for item_id in sorted_items:
            props = item_props.get(item_id, {})
            cid = item_to_cid[item_id]

            # Derive discount from popularity (more events → higher perceived value)
            event_count = item_event_counts.get(item_id, 0)
            discount = round(5 + (event_count / max_event_count) * 65, 1)  # 5% to 70%

            # Build tags from category path
            cat_label = props.get("category_label", "Uncategorized")
            tags = ",".join(cat_label.replace(" > ", ",").split(",")[:4])

            # Generate a meaningful description
            store = props.get("store", "GeneralStore")
            description = f"{store} offer: {discount}% off on {cat_label} items. Limited time deal!"

            # Expiry: spread across next 1-90 days
            expiry = datetime.now(timezone.utc) + timedelta(days=random.randint(1, 90))

            coupon = Coupon(
                id=cid,
                store=store,
                category=cat_label.split(" > ")[-1] if " > " in cat_label else cat_label,
                description=description,
                discount=discount,
                tags=tags,
                expiry=expiry,
                cluster_id=None,  # Will be set after clustering
            )
            db.add(coupon)
            coupon_objs[cid] = coupon

        await db.commit()
        logger.info("  ✓ Coupons inserted into DB")

        # Generate embeddings
        logger.info("Generating embeddings and saving to DB...")
        for cid, coupon in coupon_objs.items():
            text = generate_coupon_text(coupon)
            vector = generate_embedding(text)
            if vector:
                cluster_id = assign_coupon_cluster(vector)
                coupon.embedding = vector
                coupon.cluster_id = cluster_id

            # Progress logging every 500 items
            if cid % 500 == 0:
                logger.info(f"  ... embedded {cid}/{len(sorted_items)} coupons")

        await db.commit()
        logger.info("  ✓ Embeddings generated and stored in DB")

        # ------------------------------------------------------------------
        # 6c. Train clusters
        # ------------------------------------------------------------------
        logger.info("Training KMeans clusters...")
        from app.services.clustering import train_clusters_async
        await train_clusters_async()
        logger.info("  ✓ Clusters trained and synced")

        # ------------------------------------------------------------------
        # 6d. Insert Events
        # ------------------------------------------------------------------
        filtered_events = [
            e for e in events
            if e["visitor_id"] in valid_visitors and e["item_id"] in item_to_cid
        ]
        if MAX_EVENTS and len(filtered_events) > MAX_EVENTS:
            filtered_events = filtered_events[:MAX_EVENTS]

        logger.info(f"Inserting {len(filtered_events)} real user events...")
        batch_size = 1000
        for i in range(0, len(filtered_events), batch_size):
            batch = filtered_events[i: i + batch_size]
            for ev in batch:
                uid = visitor_to_uid[ev["visitor_id"]]
                cid = item_to_cid[ev["item_id"]]
                db.add(UserEvent(
                    user_id=uid,
                    coupon_id=cid,
                    event_type=ev["event_type"],
                    timestamp=ev["timestamp"],
                ))
            await db.commit()
            if (i + batch_size) % 10000 == 0:
                logger.info(f"  ... inserted {min(i + batch_size, len(filtered_events))}/{len(filtered_events)} events")

        logger.info("  ✓ Events inserted")

        # ------------------------------------------------------------------
        # 6e. Build User Profiles
        # ------------------------------------------------------------------
        logger.info("Building user profiles from real event history...")
        weight_map = {"view": 1, "save": 3, "claim": 5, "trade": 4, "share": 2}

        for uid in visitor_to_uid.values():
            result = await db.execute(
                sa_select(UserEvent).where(UserEvent.user_id == uid)
            )
            user_events = result.scalars().all()
            if not user_events:
                continue

            cluster_weights: dict[str, float] = {}
            seen_categories: set[str] = set()

            for ev in user_events:
                coupon = await db.get(Coupon, ev.coupon_id)
                if coupon and coupon.cluster_id is not None:
                    cid_str = str(coupon.cluster_id)
                    cluster_weights[cid_str] = (
                        cluster_weights.get(cid_str, 0) + weight_map.get(ev.event_type, 0)
                    )
                if coupon:
                    seen_categories.add(coupon.category)

            db.add(UserProfile(
                user_id=uid,
                cluster_weights=cluster_weights,
                preferred_categories=sorted(seen_categories),
            ))

            if uid % 500 == 0:
                logger.info(f"  ... built profile for user {uid}/{len(visitor_to_uid)}")
                await db.commit()

        await db.commit()
        logger.info("  ✓ User profiles built")

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    event_type_counts = defaultdict(int)
    for ev in filtered_events:
        event_type_counts[ev["event_type"]] += 1

    print()
    print("=" * 60)
    print("  KAGGLE RETAILROCKET DATA LOADED SUCCESSFULLY")
    print("=" * 60)
    print(f"  Users:        {len(visitor_to_uid)}")
    print(f"  Coupons:      {len(sorted_items)}")
    print(f"  Events:       {len(filtered_events)}")
    for etype, count in sorted(event_type_counts.items()):
        print(f"    - {etype:10s}: {count}")
    print(f"  Profiles:     {len(visitor_to_uid)}")
    print()
    print("  Test the API:")
    print("    GET  /recommendations/1       → personalized for user 1")
    print("    GET  /recommendations/999999  → cold-start fallback")
    print("    POST /retrain-clusters        → retrain KMeans")
    print("=" * 60)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # Step 1: Download
    download_dataset()

    # Step 2: Parse category tree
    _, label_map, store_map = parse_category_tree()

    # Step 3: Parse item properties
    item_props = parse_item_properties(label_map, store_map)

    # Step 4: Filter to available items only
    available_items = {
        iid: props for iid, props in item_props.items()
        if props.get("available", True)
    }
    logger.info(f"Available items: {len(available_items)} / {len(item_props)}")

    # Step 5: Select top items by popularity
    selected_ids = select_top_items(available_items, MAX_ITEMS)

    # Step 6: Parse events (filtered to selected items)
    events, visitor_ids, item_event_counts = parse_events(selected_ids)

    # Step 7: Load into Vaulto
    asyncio.run(load_into_vaulto(
        item_props=available_items,
        selected_item_ids=selected_ids,
        events=events,
        visitor_ids=visitor_ids,
        item_event_counts=item_event_counts,
    ))


if __name__ == "__main__":
    main()
