import numpy as np
from sklearn.cluster import KMeans
from app.core.config import settings
from app.services.embedding import qdrant_client
import logging

logger = logging.getLogger(__name__)

kmeans_model = None

def train_clusters():
    global kmeans_model
    try:
        # Fetch all embeddings from Qdrant
        # In a real scenario, handle pagination if millions of vectors
        scroll_result = qdrant_client.scroll(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            limit=10000,
            with_vectors=True
        )
        points = scroll_result[0]
        
        if len(points) < settings.NUM_CLUSTERS:
            logger.info("Not enough data to train clusters.")
            return None

        vectors = [p.vector for p in points]
        ids = [p.id for p in points]
        
        X = np.array(vectors)
        kmeans = KMeans(n_clusters=settings.NUM_CLUSTERS, random_state=42)
        kmeans.fit(X)
        
        kmeans_model = kmeans
        
        # Update cluster assignments in Qdrant (and ideally DB as well)
        for i, cluster_id in enumerate(kmeans.labels_):
            qdrant_client.set_payload(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                payload={"cluster_id": int(cluster_id)},
                points=[ids[i]]
            )
        
        logger.info(f"Successfully trained {settings.NUM_CLUSTERS} clusters.")
        return kmeans
    except Exception as e:
        logger.error(f"Error training clusters: {e}")
        return None

def assign_coupon_cluster(vector: list[float]) -> int:
    global kmeans_model
    if kmeans_model is None:
        return 0 # Fallback cluster if not trained yet
    X = np.array([vector])
    cluster_id = kmeans_model.predict(X)[0]
    return int(cluster_id)

def update_clusters_periodically():
    logger.info("Running periodic cluster training...")
    train_clusters()
