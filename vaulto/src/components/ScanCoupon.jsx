import React from "react";
import "../styles/ScanCoupon.css";
import { useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function ScanCoupon() {
    const navigate = useNavigate();
  return (
    <div className="scan-page">
      <div className="scan-header">
        <h1>📷 Scan Coupon</h1>
        <p>Capture or upload to add to Vaulto</p>
      </div>

      <div className="scan-option">
        <div className="scan-card">
          <div className="scan-icon purple">📸</div>
          <button className="camera-btn" onClick={() => navigate("/scan/camera")}>
            <h2>Open Camera</h2>
            </button>
          <p>Scan a coupon using your camera</p>
        </div>

        <div className="scan-card" onClick={() => navigate("/scan/upload")}>
          <div className="scan-icon green">⬆️</div>
          <h2>Upload Image</h2>
          <p>Choose a coupon image from your device</p>
        </div>
      </div>

      <div className="pro-tip">
        <strong>✨ Pro Tip</strong>
        <p>Make sure the coupon is clearly visible and well-lit for best results.</p>
      </div>
      <BottomNav />
    </div>
  );
}
