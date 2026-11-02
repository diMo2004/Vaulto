# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings, normalize_database_url

raw_url = settings.DATABASE_URL
normalized_url = normalize_database_url(raw_url)

engine_kwargs = {"echo": False}

if "postgresql+asyncpg" in normalized_url:
    connect_args = {
        # Required for NeonDB / PgBouncer connection pooling:
        # PgBouncer transaction mode fails if prepared statement cache is enabled.
        "statement_cache_size": 0,
    }
    # Enforce SSL for remote NeonDB / cloud postgres connections
    if "neon.tech" in raw_url or "sslmode=" in raw_url or "ssl=require" in raw_url:
        connect_args["ssl"] = "require"

    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "connect_args": connect_args,
    })

engine = create_async_engine(normalized_url, **engine_kwargs)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
