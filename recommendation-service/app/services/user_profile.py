from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models import UserProfile, UserEvent
from app.core.config import settings

async def track_event(db: AsyncSession, user_id: int, coupon_id: int, event_type: str, cluster_id: int):
    # Log the event
    event = UserEvent(user_id=user_id, coupon_id=coupon_id, event_type=event_type)
    db.add(event)
    
    # Get or create profile
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    
    if not profile:
        profile = UserProfile(user_id=user_id, cluster_weights={}, preferred_categories=[])
        db.add(profile)
    
    # Calculate weight based on event
    weight_map = {
        "view": settings.WEIGHT_VIEW,
        "save": settings.WEIGHT_SAVE,
        "claim": settings.WEIGHT_CLAIM,
        "trade": settings.WEIGHT_TRADE,
        "share": settings.WEIGHT_SHARE
    }
    weight = weight_map.get(event_type, 0)
    
    if cluster_id is not None and weight > 0:
        # Clone dict because SQLAlchemy JSON doesn't track mutations easily
        weights = profile.cluster_weights.copy() if profile.cluster_weights else {}
        cluster_str = str(cluster_id)
        weights[cluster_str] = weights.get(cluster_str, 0) + weight
        profile.cluster_weights = weights

    await db.commit()

async def get_user_preferred_clusters(db: AsyncSession, user_id: int) -> dict:
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if profile and profile.cluster_weights:
        return profile.cluster_weights
    return {}
