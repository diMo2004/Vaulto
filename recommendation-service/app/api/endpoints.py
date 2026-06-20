from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.db.models import Coupon
from app.services.recommendation import generate_recommendations
from app.services.user_profile import track_event
from app.services.clustering import train_clusters, assign_coupon_cluster
from app.services.embedding import generate_coupon_text, generate_embedding, upsert_coupon_embedding

router = APIRouter()

class EventCreate(BaseModel):
    user_id: int
    coupon_id: int
    event_type: str # view, save, claim, share, trade, search

class CouponCreate(BaseModel):
    store: str
    category: str
    description: str
    discount: float
    tags: str
    expiry: Optional[datetime] = None

class ProfileUpdate(BaseModel):
    user_id: int
    categories: List[str]

@router.get("/recommendations/{user_id}")
async def get_recommendations(user_id: int, top_k: int = 10, db: AsyncSession = Depends(get_db)):
    coupons = await generate_recommendations(db, user_id, top_k)
    return {"user_id": user_id, "recommendations": coupons}

@router.post("/events")
async def create_event(event: EventCreate, db: AsyncSession = Depends(get_db)):
    coupon = await db.get(Coupon, event.coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    await track_event(db, event.user_id, event.coupon_id, event.event_type, coupon.cluster_id)
    return {"message": "Event tracked successfully"}

@router.post("/coupons")
async def create_coupon(coupon_data: CouponCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    new_coupon = Coupon(**coupon_data.model_dump())
    db.add(new_coupon)
    await db.commit()
    await db.refresh(new_coupon)

    # Process embedding
    text = generate_coupon_text(new_coupon)
    vector = generate_embedding(text)
    cluster_id = assign_coupon_cluster(vector)
    
    upsert_coupon_embedding(new_coupon.id, text, payload={"cluster_id": cluster_id})
    
    new_coupon.cluster_id = cluster_id
    await db.commit()

    return {"message": "Coupon created", "id": new_coupon.id, "cluster_id": cluster_id}

@router.post("/retrain-clusters")
async def api_retrain_clusters(background_tasks: BackgroundTasks):
    background_tasks.add_task(train_clusters)
    return {"message": "Cluster retraining started in background"}

@router.post("/update-user-profile")
async def update_user_profile(profile_data: ProfileUpdate, db: AsyncSession = Depends(get_db)):
    # pyrefly: ignore [missing-import]
    from sqlalchemy.future import select
    from app.db.models import UserProfile
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == profile_data.user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = UserProfile(user_id=profile_data.user_id, preferred_categories=profile_data.categories)
        db.add(profile)
    else:
        profile.preferred_categories = profile_data.categories
    await db.commit()
    return {"message": "User profile updated"}
