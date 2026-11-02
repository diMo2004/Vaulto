from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.future import select
from app.api import endpoints
from app.db.database import engine, Base, AsyncSessionLocal
from app.db.models import Coupon
from app.services.embedding import generate_coupon_text, generate_embedding
from app.services.clustering import train_clusters_async
from app.tasks.workers import start_workers, stop_workers
from datetime import datetime, timedelta, timezone
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_SAMPLE_COUPONS = [
    {"store": "Amazon", "category": "Electronics", "description": "Flat 25% off on gadgets, smart devices and electronics", "discount": 25.0, "tags": "electronics,gadgets,tech,devices"},
    {"store": "Nike", "category": "Fashion", "description": "30% off on premium running shoes and athletic apparel", "discount": 30.0, "tags": "shoes,fitness,apparel,fashion"},
    {"store": "Swiggy", "category": "Food", "description": "50% off on all local restaurant orders and gourmet meals", "discount": 50.0, "tags": "food,dining,takeout,delivery"},
    {"store": "Zomato", "category": "Food", "description": "Flat 40% discount on gourmet dining and fast delivery", "discount": 40.0, "tags": "food,restaurants,pizza,dining"},
    {"store": "Uber", "category": "Travel", "description": "20% off on your next 5 city rides and airport trips", "discount": 20.0, "tags": "travel,cabs,rides,transport"},
    {"store": "Myntra", "category": "Fashion", "description": "Extra 35% discount on top brand trending fashion styles", "discount": 35.0, "tags": "clothing,fashion,style,shoes"},
    {"store": "Starbucks", "category": "Food", "description": "Buy 1 Get 1 free on all handcrafted drinks and cafe menu", "discount": 50.0, "tags": "coffee,cafe,drinks,beverages"},
    {"store": "MakeMyTrip", "category": "Travel", "description": "Save up to $50 on international flights and luxury hotel bookings", "discount": 25.0, "tags": "travel,flights,hotels,vacation"},
    {"store": "Blinkit", "category": "Groceries", "description": "15% off on daily organic groceries and household essentials", "discount": 15.0, "tags": "groceries,fresh,daily,market"},
    {"store": "Apple Store", "category": "Electronics", "description": "10% education and student savings on MacBooks and iPads", "discount": 10.0, "tags": "apple,laptops,tech,tablets"},
    {"store": "Domino's", "category": "Food", "description": "Flat 40% off on medium and large gourmet pizzas", "discount": 40.0, "tags": "pizza,food,dining,fast food"},
    {"store": "Nykaa", "category": "Beauty", "description": "25% discount on cosmetics, skincare and wellness products", "discount": 25.0, "tags": "beauty,skincare,makeup,cosmetics"},
]

async def seed_initial_coupons_if_empty():
    """Ensure cold-start recommendations work immediately even on a brand-new NeonDB."""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Coupon).limit(1))
            existing = result.scalar_one_or_none()
            if existing is None:
                logger.info("Database is empty. Seeding popular coupons for recommendation engine...")
                now = datetime.now(timezone.utc)
                for item in DEFAULT_SAMPLE_COUPONS:
                    c = Coupon(
                        store=item["store"],
                        category=item["category"],
                        description=item["description"],
                        discount=item["discount"],
                        tags=item["tags"],
                        expiry=now + timedelta(days=45),
                        cluster_id=0,
                    )
                    session.add(c)
                await session.commit()

                # Generate embeddings for seeded coupons
                result = await session.execute(select(Coupon))
                coupons = result.scalars().all()
                for c in coupons:
                    text = generate_coupon_text(c)
                    vec = generate_embedding(text)
                    if vec:
                        c.embedding = vec
                await session.commit()
                await train_clusters_async()
                logger.info("Successfully seeded %d sample coupons.", len(coupons))
    except Exception as e:
        logger.warning("Could not auto-seed sample coupons: %s", e)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema initialized successfully.")
        await seed_initial_coupons_if_empty()
    except Exception as e:
        logger.error("Database initialization failed: %s", e)

    try:
        start_workers()
    except Exception as e:
        logger.error("Background worker startup failed: %s", e)
    yield
    # Shutdown
    try:
        stop_workers()
    except Exception as e:
        logger.error("Background worker shutdown failed: %s", e)

app = FastAPI(title="Vaulto Recommendation Service", lifespan=lifespan)

# Enable CORS for frontend and cross-service calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endpoints.router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "vaulto-recommendation"}
