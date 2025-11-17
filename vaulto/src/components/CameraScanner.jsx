import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";
import { extractMetadata } from "../utils/metadataExtractor";
import "../styles/CameraScanner.css";
import { useNavigate } from "react-router-dom";

export default function CameraScanner() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);

  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [textResult, setTextResult] = useState("");
  const [metadata, setMetadata] = useState(null);

  // Capture a screenshot from webcam
  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    processImage(imageSrc);
  };

  // OCR Processing
  const processImage = async (image) => {
    setProcessing(true);
    setTextResult("Extracting text…");

    const result = await Tesseract.recognize(image, "eng", {
      logger: (m) => console.log(m),
    });

    const text = result.data.text;
    setTextResult(text);

    const extractedMetadata = extractMetadata(text);
    setMetadata(extractedMetadata);

    console.log("Extracted Metadata:", extractedMetadata);

    setProcessing(false);
  };

  return (
    <div className="scanner-page">
      <h1>📷 Scan Coupon</h1>

      {/* CAMERA VIEW */}
      {!capturedImage && (
        <>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/png"
            className="camera-preview"
          />

          <button className="scan-btn" onClick={capturePhoto}>
            Capture
          </button>
        </>
      )}

      {/* IMAGE + RESULTS */}
      {capturedImage && (
        <>
          <img src={capturedImage} alt="Captured" className="captured-img" />

          {processing ? (
            <p className="processing">Processing… please wait</p>
          ) : (
            <>
              {/* OCR TEXT */}
              {textResult && (
                <>
                  <h3>Extracted Text:</h3>
                  <pre className="ocr-text">{textResult}</pre>
                </>
              )}

              {/* METADATA */}
              {metadata && (
                <>
                  <h3>Metadata:</h3>
                  <pre className="ocr-text">{JSON.stringify(metadata, null, 2)}</pre>

                  {/* CONTINUE BUTTON */}
                  <button
                    className="continue-btn"
                    onClick={() => navigate("/add-coupon", { state: metadata })}
                  >
                    Continue →
                  </button>
                </>
              )}

              {/* SCAN AGAIN */}
              <button
                className="scan-btn"
                onClick={() => {
                  setCapturedImage(null);
                  setMetadata(null);
                  setTextResult("");
                }}
              >
                Scan Again
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
