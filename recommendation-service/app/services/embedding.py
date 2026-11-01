from sentence_transformers import SentenceTransformer
from app.core.config import settings
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Initialize model
try:
    model = SentenceTransformer(settings.EMBEDDING_MODEL)
except Exception as e:
    logger.error(f"Failed to load sentence transformer: {e}")
    model = None

def init_qdrant():
    """No-op kept for backward compatibility; vector storage is now in PostgreSQL."""
    logger.info("Vector storage initialized with database persistence.")

def generate_coupon_text(coupon) -> str:
    expiry_str = f"Valid till {coupon.expiry.strftime('%B %d')}" if coupon.expiry else ""
    return f"{coupon.store} {coupon.category}\n{coupon.discount}% off\n{coupon.description}\n{coupon.tags}\n{expiry_str}"

def generate_embedding(text: str) -> list[float]:
    if not model:
        return []
    return model.encode(text).tolist()

def upsert_coupon_embedding(coupon_id: int, text: str, payload: dict = None):
    """Embeddings are persisted directly into the Coupon table in PostgreSQL."""
    pass

def search_similar_coupons(vector: list[float], candidate_coupons: list = None, limit: int = 10):
    """Computes cosine similarity against candidate coupons."""
    if not vector or not candidate_coupons:
        return []
    
    scored = []
    v = np.array(vector)
    v_norm = np.linalg.norm(v)
    if v_norm == 0:
        return candidate_coupons[:limit]

    for c in candidate_coupons:
        if hasattr(c, "embedding") and c.embedding:
            c_vec = np.array(c.embedding)
            c_norm = np.linalg.norm(c_vec)
            if c_norm > 0:
                sim = float(np.dot(v, c_vec) / (v_norm * c_norm))
                scored.append((sim, c))
    
    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:limit]]
