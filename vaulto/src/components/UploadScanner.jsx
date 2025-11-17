import React, { useState } from "react";
import Tesseract from "tesseract.js";
import { extractMetadata } from "../utils/metadataExtractor";
import "../styles/CameraScanner.css";
import { useNavigate } from "react-router-dom";

export default function UploadScanner() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [textResult, setTextResult] = useState("");
  const [metadata, setMetadata] = useState(null);
  const navigate = useNavigate();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result);
        processImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

const processImage = async (img) => {
  setProcessing(true);

  const result = await Tesseract.recognize(img, "eng", {
    logger: (m) => console.log(m),
  });

  const extractedText = result.data.text;
  setTextResult(extractedText);

  const extractedMetadata = extractMetadata(extractedText);
  setMetadata(extractedMetadata);

  console.log("Extracted Meta:", extractedMetadata);

  setProcessing(false);
};


  return (
    <div className="scanner-page">
      <h1>⬆️ Upload Coupon Image</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="upload-input"
      />

      {selectedImage && <img src={selectedImage} alt="upload" className="captured-img" />}

      {processing && <p className="processing">Processing… please wait</p>}

      {!processing && textResult && (
        <>
          <h3>Extracted Text:</h3>
          <pre className="ocr-text">{textResult}</pre>

          <h3>Metadata:</h3>
          <pre className="ocr-text">{JSON.stringify(metadata, null, 2)}</pre>
        </>
      )}
      {metadata && !processing && (
        <button 
        className="continue-btn"
        onClick={() => navigate("/add-coupon", { state: metadata })}
        >
        Continue →
        </button>
      )}
    </div>
  );
  
}
