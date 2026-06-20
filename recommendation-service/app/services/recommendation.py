from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from app.db.models import Coupon
from app.services.embedding import search_similar_coupons
from app.services.user_profile import get_user_preferred_clusters
from app.core.config import settings
from datetime import datetime, timezone

async def get_popular_coupons(db: AsyncSession, limit: int = 10):
    # Rule-based fallback: In a real system, you'd calculate popularity via events
    # Here we just return recent/high discount for demo
    result = await db.execute(select(Coupon).order_by(desc(Coupon.discount)).limit(limit))
    return result.scalars().all()

async def generate_recommendations(db: AsyncSession, user_id: int, top_k: int = 10):
    # Step 1: Get preferred clusters
    preferred_clusters = await get_user_preferred_clusters(db, user_id)
    
    # If no preferred clusters (Cold Start) -> return Rule-Based
    if not preferred_clusters:
        return await get_popular_coupons(db, limit=top_k)

    # Step 2: Determine top cluster
    top_cluster_id = max(preferred_clusters, key=preferred_clusters.get)
    
    # Step 3 & 4: Find candidates
    cluster_query = await db.execute(
        select(Coupon).where(Coupon.cluster_id == int(top_cluster_id)).limit(50)
    )
    candidates = cluster_query.scalars().all()
    
    if not candidates:
        return await get_popular_coupons(db, limit=top_k)

    # Step 5: Rank candidates
    ranked_candidates = []
    now = datetime.now(timezone.utc)
    
    for c in candidates:
        # Cluster affinity
        c_cluster_str = str(c.cluster_id)
        cluster_affinity = preferred_clusters.get(c_cluster_str, 0)
        # Normalize roughly (0 to 1) - placeholder logic
        total_weight = sum(preferred_clusters.values())
        norm_affinity = cluster_affinity / total_weight if total_weight > 0 else 0
        
        # Embedding similarity (placeholder)
        embedding_sim = 0.5 
        
        # Popularity (placeholder 0.5)
        popularity = 0.5 
        
        # Discount (normalized, assuming max discount is 100)
        norm_discount = min(c.discount / 100.0, 1.0) if c.discount else 0.0
        
        # Expiry urgency
        if c.expiry:
            # Assumes c.expiry is offset-aware
            days_left = (c.expiry - now).days
            if days_left <= 0:
                expiry_urgency = 0.0 # Expired
            else:
                expiry_urgency = max(0.0, 1.0 - (days_left / 30.0))
        else:
            expiry_urgency = 0.0
            
        score = (
            settings.WEIGHT_CLUSTER_AFFINITY * norm_affinity +
            settings.WEIGHT_EMBEDDING_SIMILARITY * embedding_sim +
            settings.WEIGHT_POPULARITY * popularity +
            settings.WEIGHT_DISCOUNT * norm_discount +
            settings.WEIGHT_EXPIRY_URGENCY * expiry_urgency
        )
        
        ranked_candidates.append((score, c))
    
    # Sort by score desc
    ranked_candidates.sort(key=lambda x: x[0], reverse=True)
    
    return [c for score, c in ranked_candidates[:top_k]]
