import os
import urllib.parse
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
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
    """
    Normalizes PostgreSQL connection strings (e.g. from NeonDB) for SQLAlchemy + asyncpg.
    Strips parameters that asyncpg doesn't accept like 'sslmode' and 'channel_binding'.
    """
    if not database_url:
        return "sqlite+aiosqlite:///./test.db"

    database_url = database_url.strip()

    if not (database_url.startswith("postgres://") or database_url.startswith("postgresql://")):
        return database_url

    parsed = urllib.parse.urlsplit(database_url)
    scheme = "postgresql+asyncpg"
    query_params = urllib.parse.parse_qs(parsed.query)

    # asyncpg expects 'ssl', NOT 'sslmode'
    # We strip 'sslmode' and 'channel_binding' from query so asyncpg does not raise unexpected kwarg errors
    query_params.pop("sslmode", None)
    query_params.pop("channel_binding", None)

    new_query = urllib.parse.urlencode(query_params, doseq=True)
    return urllib.parse.urlunsplit((scheme, parsed.netloc, parsed.path, new_query, parsed.fragment))
