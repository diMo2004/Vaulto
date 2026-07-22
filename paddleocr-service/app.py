from fastapi import FastAPI, File, UploadFile
# pyrefly: ignore [missing-import]
from paddleocr import PaddleOCR
import numpy as np
from PIL import Image
import io
import os
import logging

app = FastAPI()
logger = logging.getLogger(__name__)

ocr = None

def get_ocr():
    global ocr
    if ocr is None:
        logger.info("Loading PaddleOCR model...")
        ocr = PaddleOCR(use_angle_cls=True, lang='en')
    return ocr

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        img_array = np.array(image)
        
        # Perform OCR
        result = get_ocr().ocr(img_array, cls=True)
        
        text_lines = []
        if result and result[0]:
            for line in result[0]:
                text_lines.append(line[1][0])
                
        return {"text": "\n".join(text_lines)}
    except Exception as e:
        return {"error": str(e), "text": ""}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
