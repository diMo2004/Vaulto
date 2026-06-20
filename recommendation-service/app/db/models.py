from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    # add other user fields as needed

class Coupon(Base):
    __tablename__ = "coupons"
    id = Column(Integer, primary_key=True, index=True)
    store = Column(String, index=True)
    category = Column(String, index=True)
    description = Column(Text)
    discount = Column(Float)
    tags = Column(String)  # Comma separated
    expiry = Column(DateTime(timezone=True))
    cluster_id = Column(Integer, nullable=True)

class UserEvent(Base):
    __tablename__ = "user_events"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    coupon_id = Column(Integer, ForeignKey("coupons.id"))
    event_type = Column(String, index=True)  # view, save, claim, share, trade, search
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class UserProfile(Base):
    __tablename__ = "user_profiles"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    cluster_weights = Column(JSON, default=dict)
    preferred_categories = Column(JSON, default=list)
