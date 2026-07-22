from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize model
try:
    model = SentenceTransformer(settings.EMBEDDING_MODEL)
except Exception as e:
    logger.error(f"Failed to load sentence transformer: {e}")
    model = None

# Initialize Qdrant client
qdrant_client = QdrantClient(url=settings.QDRANT_URL)

def init_qdrant():
    try:
        qdrant_client.get_collection(settings.QDRANT_COLLECTION_NAME)
    except Exception as e:
        if not model:
            logger.warning("Skipping Qdrant initialization because embedding model is unavailable")
            return
        try:
            qdrant_client.create_collection(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                vectors_config=qmodels.VectorParams(
                    size=model.get_sentence_embedding_dimension(),
                    distance=qmodels.Distance.COSINE
                )
            )
        except Exception as create_e:
            if "already exists" not in str(create_e).lower():
                logger.error("Qdrant initialization failed: %s", create_e)
                return

def generate_coupon_text(coupon) -> str:
    # Example format from requirements
    expiry_str = f"Valid till {coupon.expiry.strftime('%B %d')}" if coupon.expiry else ""
    return f"{coupon.store} {coupon.category}\n{coupon.discount}% off\n{coupon.description}\n{coupon.tags}\n{expiry_str}"

def generate_embedding(text: str) -> list[float]:
    if not model:
        return []
    return model.encode(text).tolist()

def upsert_coupon_embedding(coupon_id: int, text: str, payload: dict = None):
    vector = generate_embedding(text)
    if not vector:
        return
    try:
        qdrant_client.upsert(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            points=[
                qmodels.PointStruct(
                    id=coupon_id,
                    vector=vector,
                    payload=payload or {}
                )
            ]
        )
    except Exception as e:
        logger.error("Failed to upsert coupon embedding %s: %s", coupon_id, e)

def search_similar_coupons(vector: list[float], limit: int = 10):
    try:
        return qdrant_client.search(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            query_vector=vector,
            limit=limit
        )
    except Exception as e:
        logger.error("Qdrant search failed: %s", e)
        return []
