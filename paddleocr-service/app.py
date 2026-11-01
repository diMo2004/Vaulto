from fastapi import FastAPI, File, UploadFile
import pytesseract
from PIL import Image
import io
import os
import logging

app = FastAPI()
logger = logging.getLogger(__name__)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        # Perform OCR with Tesseract
        text = pytesseract.image_to_string(image)

        return {"text": text.strip()}
    except Exception as e:
        logger.error(f"OCR error: {e}")
        return {"error": str(e), "text": ""}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
