import React from "react";
import "../styles/Support.css";

export default function Support() {
  return (
    <div className="page support-page">
      <header className="page-header">
        <h2>Support</h2>
        <p>Need help with Vaulto? We’re here for you.</p>
      </header>

      <section className="support-section">
        <h3>Quick Help</h3>
        <ul className="support-list">
          <li>• How to add a new coupon</li>
          <li>• Why is my coupon not scanning?</li>
          <li>• How are categories detected?</li>
        </ul>
      </section>

      <section className="support-section">
        <h3>Contact Us</h3>
        <p>Email: <span className="highlight">support@vaulto.app</span></p>
        <p>Response time: typically within 24–48 hours.</p>
      </section>

      <section className="support-section">
        <h3>Feedback</h3>
        <p>
          Found a bug or have an idea? Send us your feedback so we can improve
          Vaulto for you.
        </p>
        <button className="support-btn">Send Feedback</button>
      </section>
    </div>
  );
}