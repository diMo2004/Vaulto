from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api import endpoints
from app.db.database import engine, Base
from app.services.embedding import init_qdrant
from app.tasks.workers import start_workers, stop_workers
import logging

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    init_qdrant()
    start_workers()
    yield
    # Shutdown
    stop_workers()

app = FastAPI(title="Vaulto Recommendation Service", lifespan=lifespan)

app.include_router(endpoints.router)
