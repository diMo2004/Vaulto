import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import "../styles/CameraScanner.css";
import { useNavigate } from "react-router-dom";

import { API_BASE } from "../config/api";

function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], {type: mimeString});
}

export default function CameraScanner() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);

  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [textResult, setTextResult] = useState("");
  const [metadata, setMetadata] = useState(null);

  // Free-tier hosts put idle services to sleep. Poke the backend (which pokes the OCR service)
  // as soon as this page opens so they are awake by the time a picture is taken/uploaded.
  useEffect(() => {
    fetch(`${API_BASE}/health/ocr`).catch(() => {});
  }, []);

  // Capture a screenshot from webcam
  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    processImage(imageSrc);
  };

  // OCR Processing
  const processImage = async (imageSrc) => {
    setProcessing(true);
    setTextResult("Extracting text via backend…");

    try {
      const blob = dataURItoBlob(imageSrc);
      const formData = new FormData();
      formData.append("image", blob, "webcam_capture.png");

      const storedToken =
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        null;

      const res = await fetch(`${API_BASE}/coupons/ocr`, {
        method: "POST",
        headers: {
          ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
        },
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        let message = "";
        try {
          message = (await res.json())?.message || "";
        } catch (e) {
          /* not JSON */
        }
        const failure = new Error(
          res.status === 401 || res.status === 403
            ? "You are not logged in (or your session expired). Please log in again and retry."
            : message || `OCR server error (HTTP ${res.status}).`
        );
        failure.fromServer = true;
        throw failure;
      }

      const data = await res.json();
      
      setTextResult(data.rawText || "");
      setMetadata(data.metadata || null);
      
      console.log("Extracted Metadata:", data.metadata);
    } catch (err) {
      console.error(err);
      setTextResult(
        err.fromServer
          ? err.message
          : `Cannot reach the backend at ${API_BASE}. Make sure it is running and REACT_APP_API_BASE is correct.`
      );
    } finally {
      setProcessing(false);
    }
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
