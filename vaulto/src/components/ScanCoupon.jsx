import React, { useEffect } from "react";
import "../styles/ScanCoupon.css";
import { useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav";


export default function ScanCoupon() {
  const navigate = useNavigate();

  // add scan-page-mode to the top-level .app-container while this page is mounted
  useEffect(() => {
    const root = document.querySelector(".app-container");
    if (!root) return;
    root.classList.add("scan-page-mode");

    return () => {
      root.classList.remove("scan-page-mode");
    };
  }, []);

  return (
    <div className="scan-page">
      <div className="scan-header">
        <h1 className="abc">Scan Coupon</h1>
        <p className="capture">Capture or upload the coupon to add it to Vaulto</p>
      </div>

      <div className="scan-option">
        <div className="scan-card" role="group" aria-label="Scan coupon options">
          <button
            className="camera-btn"
            onClick={() => navigate("/scan/camera")}
            aria-label="Open camera to scan coupon"
          >
            Open Camera
          </button>

          <p className="scan-desc">Scan a coupon using your camera</p>
        </div>

        <div
          className="scan-card"
          role="group"
          aria-label="Upload coupon option"
          onClick={() => navigate("/scan/upload")}
          onKeyDown={(e) => { if (e.key === "Enter") navigate("/scan/upload"); }}
          tabIndex={0}
        >
          <button
            className="camera-btn"
            onClick={(e) => { e.stopPropagation(); navigate("/scan/upload"); }}
            aria-label="Upload coupon image"
          >
            Upload Image
          </button>

          <p className="scan-desc">Choose a coupon image from your device</p>
        </div>
      </div>


        <p className="pro-tip">Make sure the coupon is clearly visible and well-lit for best results.</p>

      <BottomNav />
    </div>
  );
}