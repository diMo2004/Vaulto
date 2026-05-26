import React, { useRef, useState } from "react";
import "../styles/UploadScanner.css";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import BottomNav from "./BottomNav";

export default function UploadScanner() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [textResult, setTextResult] = useState("");
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const handleFile = (file) => {
    setError("");
    if (!file) return;
    setSelectedFileName(file.name || "");
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
      runOcr(file);
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsDataURL(file);
  };

const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const onDragOver = (e) => e.preventDefault();

  const runOcr = async (file) => {
    setProcessing(true);
    setProgress(50); // Simulate progress since backend call is synchronous-like
    setTextResult("");
    setMetadata(null);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const storedToken =
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("accessToken") ||
        null;

      const res = await fetch(`${API_BASE}/coupons/ocr`, {
        method: "POST",
        headers: {
          ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
        },
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("OCR Server Error");
      
      const data = await res.json();
      setProgress(100);
      
      setTextResult(data.rawText || "");
      setMetadata(data.metadata || null);
    } catch (err) {
      console.error(err);
      setError("OCR failed. Check if backend and Docker OCR microservice are running.");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="scanner-page">
      <h1 className="page-title">Upload Coupon Image</h1>

      <div
        className={`drop-zone ${processing ? "disabled" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        role="button"
      >
        <input
          ref={fileRef}
          className="upload-input"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          aria-label="Upload coupon image"
        />

      <div className="drop-content">
          <div className="drop-title">Drag &amp; drop a coupon image</div>
          <div className="drop-sub">or</div>

          <div className="controls">
            <button
              type="button"
              className="choose-btn"
              onClick={() => fileRef.current?.click()}
              disabled={processing}
            >
              Choose File
            </button>
          </div>

      {selectedFileName && <div className="selected-name">{selectedFileName}</div>}
        </div>
      </div>

      {/* processing */}
      {processing && (
        <div className="processing">
          <div className="processing-text">Processing… {Math.round(progress * 100)}%</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {!processing && textResult && (
        <div className="ocr-block">
          <h3>Extracted Text</h3>
          <pre className="ocr-text">{textResult}</pre>

          <h3>Metadata</h3>
          <pre className="ocr-text">{JSON.stringify(metadata, null, 2)}</pre>
        </div>
      )}
      {metadata && !processing && (
        <div className="continue-row">
          <button
            className="continue-btn"
            onClick={() => navigate("/add-coupon", { state: metadata })}
          >
            Continue → Fill Coupon
          </button>
        </div>
      )}
    </div>
  );
  
}