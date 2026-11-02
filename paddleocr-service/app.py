"""
Vaulto OCR microservice.

POST /predict  (multipart field "file")  ->  {"text": "..."}  (or {"text": "", "error": "..."})
GET  /health                              ->  {"status": "ok"}

Uses the Tesseract engine (installed in the Dockerfile). The service name is
historical - it no longer uses PaddleOCR.
"""
import io
import logging
import os

import pytesseract
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps, ImageStat

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vaulto-ocr")

app = FastAPI(title="Vaulto OCR")

# Allow cross-origin requests from the frontend and backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_PIXELS = 25_000_000          # guard against decompression bombs
Image.MAX_IMAGE_PIXELS = MAX_PIXELS
MIN_WIDTH = 1000                 # upscale tiny images - Tesseract needs ~30px tall glyphs
MAX_WIDTH = 2400                 # downscale huge camera photos - faster, no accuracy loss
OCR_TIMEOUT_SECONDS = int(os.environ.get("OCR_TIMEOUT_SECONDS", "45"))
OCR_LANG = os.environ.get("OCR_LANG", "eng")


def preprocess(image: Image.Image) -> Image.Image:
    """Make a phone screenshot / camera photo easier for Tesseract to read."""
    # Camera photos store rotation in EXIF; without this they are read sideways.
    image = ImageOps.exif_transpose(image)
    image = image.convert("L")

    # Normalise size.
    width, height = image.size
    if width < MIN_WIDTH:
        scale = MIN_WIDTH / width
        image = image.resize((MIN_WIDTH, int(height * scale)), Image.LANCZOS)
    elif width > MAX_WIDTH:
        scale = MAX_WIDTH / width
        image = image.resize((MAX_WIDTH, int(height * scale)), Image.LANCZOS)

    # Dark-mode screenshots (light text on dark background) -> invert.
    if ImageStat.Stat(image).mean[0] < 110:
        image = ImageOps.invert(image)

    return ImageOps.autocontrast(image)


@app.get("/health")
def health():
    return {"status": "ok"}


# NOTE: plain `def` (not `async def`) on purpose. Tesseract is blocking, and FastAPI
# runs sync endpoints in a worker thread so one slow scan cannot freeze the service.
@app.post("/predict")
def predict(file: UploadFile = File(...)):
    try:
        contents = file.file.read()
        if not contents:
            return {"text": "", "error": "Empty file"}

        image = Image.open(io.BytesIO(contents))
        image = preprocess(image)

        text = pytesseract.image_to_string(
            image, lang=OCR_LANG, timeout=OCR_TIMEOUT_SECONDS
        )
        logger.info("OCR ok: %s, %d chars", file.filename, len(text.strip()))
        return {"text": text.strip()}
    except Exception as e:  # noqa: BLE001 - report every failure to the caller
        logger.exception("OCR error")
        return {"text": "", "error": f"{type(e).__name__}: {e}"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
