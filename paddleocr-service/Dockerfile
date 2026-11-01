FROM python:3.10-slim

# Install Tesseract OCR engine
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY app.py .

# Expose the port
EXPOSE 8000

# Run the API
CMD ["python", "app.py"]
