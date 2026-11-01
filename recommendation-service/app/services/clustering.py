import asyncio
import numpy as np
from sklearn.cluster import KMeans
from sqlalchemy.future import select
from app.core.config import settings
from app.db.database import AsyncSessionLocal
from app.db.models import Coupon
import logging

logger = logging.getLogger(__name__)

kmeans_model = None

async def train_clusters_async():
    global kmeans_model
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Coupon).where(Coupon.embedding.isnot(None))
            )
            coupons = result.scalars().all()
            
            if len(coupons) < settings.NUM_CLUSTERS:
                logger.info("Not enough data to train clusters (%d found, %d required).", len(coupons), settings.NUM_CLUSTERS)
                return None

            vectors = [c.embedding for c in coupons if c.embedding]
            if len(vectors) < settings.NUM_CLUSTERS:
                return None
                
            X = np.array(vectors)
            kmeans = KMeans(n_clusters=settings.NUM_CLUSTERS, random_state=42)
            kmeans.fit(X)
            
            kmeans_model = kmeans
            
            for i, c in enumerate(coupons):
                c.cluster_id = int(kmeans.labels_[i])
            await session.commit()
            
            logger.info("Successfully trained %d clusters on %d coupons.", settings.NUM_CLUSTERS, len(coupons))
            return kmeans
    except Exception as e:
        logger.error("Error training clusters: %s", e)
        return None

def train_clusters():
    """Wrapper that can be called synchronously or asynchronously."""
    try:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            return asyncio.create_task(train_clusters_async())
        else:
            return asyncio.run(train_clusters_async())
    except Exception as e:
        logger.error("Error invoking cluster training: %s", e)
        return None

def assign_coupon_cluster(vector: list[float]) -> int:
    global kmeans_model
    if kmeans_model is None or not vector:
        return 0  # Fallback cluster if not trained yet
    try:
        X = np.array([vector])
        cluster_id = kmeans_model.predict(X)[0]
        return int(cluster_id)
    except Exception as e:
        logger.error("Error predicting cluster: %s", e)
        return 0

def update_clusters_periodically():
    logger.info("Running periodic cluster training...")
    train_clusters()
