// src/components/Legal.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Legal.css";

export default function Legal() {
  const navigate = useNavigate();

  return (
    <div className="page-container legal-page">
      {/* Header */}
      <div className="legal-header">
        <button className="legal-back" onClick={() => navigate(-1)}>
          ←
        </button>
        <h2>Legal</h2>
      </div>

      <div className="legal-section">
        <h3>Terms of Use</h3>
        <p>
          By using Vaulto, you agree to use the app for lawful purposes only and
          not to misuse coupons, accounts, or any part of the service.
        </p>
      </div>

      <div className="legal-section">
        <h3>Privacy Policy</h3>
        <p>
          Vaulto stores only the data required to provide core features like
          login, coupon storage, and personalization. We do not sell your data
          to third parties.
        </p>
      </div>

      <div className="legal-section">
        <h3>Data & Security</h3>
        <p>
          Your account information and coupons are stored securely in our
          database. You can request deletion of your data by contacting support.
        </p>
      </div>

      <div className="legal-section">
        <h3>Contact</h3>
        <p>
          For legal requests, contact: <br />
          <strong>support@vaulto.app</strong>
        </p>
      </div>
    </div>
  );
}