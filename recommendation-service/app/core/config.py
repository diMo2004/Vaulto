import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    QDRANT_COLLECTION_NAME: str = "coupons"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # Recommendation weights
    WEIGHT_CLUSTER_AFFINITY: float = 0.35
    WEIGHT_EMBEDDING_SIMILARITY: float = 0.25
    WEIGHT_POPULARITY: float = 0.15
    WEIGHT_DISCOUNT: float = 0.15
    WEIGHT_EXPIRY_URGENCY: float = 0.10

    # User profile weights
    WEIGHT_VIEW: int = 1
    WEIGHT_SAVE: int = 3
    WEIGHT_CLAIM: int = 5
    WEIGHT_TRADE: int = 4
    WEIGHT_SHARE: int = 2

    # Clustering
    NUM_CLUSTERS: int = 5

    class Config:
        env_file = ".env"

settings = Settings()

def normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    return database_url
