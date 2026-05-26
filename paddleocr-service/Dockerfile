FROM python:3.10-slim

# Install system dependencies required for OpenCV and PaddleOCR
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --default-timeout=1000 --retries 10 --no-cache-dir -r requirements.txt

# Copy source code
COPY app.py .

# Expose the port
EXPOSE 8000

# Run the API
CMD ["python", "app.py"]
