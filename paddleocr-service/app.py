from fastapi import FastAPI, File, UploadFile
from paddleocr import PaddleOCR
import numpy as np
from PIL import Image
import io
import os

app = FastAPI()

# Initialize the model once when the container starts
# use_angle_cls=True to automatically rotate tilted text
ocr = PaddleOCR(use_angle_cls=True, lang='en')

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        img_array = np.array(image)
        
        # Perform OCR
        result = ocr.ocr(img_array, cls=True)
        
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
