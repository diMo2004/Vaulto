from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api import endpoints
from app.db.database import engine, Base
from app.services.embedding import init_qdrant
from app.tasks.workers import start_workers, stop_workers
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        logger.error("Database initialization failed: %s", e)

    try:
        init_qdrant()
    except Exception as e:
        logger.error("Qdrant initialization failed: %s", e)

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

app.include_router(endpoints.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
