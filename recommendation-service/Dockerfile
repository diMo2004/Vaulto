FROM python:3.11-slim

WORKDIR /app

# Install minimal system dependencies for asyncpg and scikit-learn
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the lightweight ONNX model (~50MB) during build to ensure fast, offline startup
RUN python -c "from fastembed import TextEmbedding; list(TextEmbedding(model_name='sentence-transformers/all-MiniLM-L6-v2').embed(['test']))"

# Copy application code
COPY ./app ./app

# Expose default port
EXPOSE 8000

# Run the application (respecting Render's dynamic PORT env var)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
