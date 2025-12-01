// src/components/Settings.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Settings.css";
import BottomNav from "./BottomNav";

export default function Settings() {
  const navigate = useNavigate();

  // Local UI state – you can later connect these to backend/user prefs
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [autoScan, setAutoScan] = useState(true);

  return (
    <div className="settings-page">
      {/* Top header */}
      <header className="settings-header">
        <button className="settings-back" onClick={() => navigate(-1)}>
          ←
        </button>
        <div>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your Vaulto experience</p>
        </div>
      </header>

      {/* Scrollable content */}
      <main className="settings-content">
        {/* Account section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Account</h2>

          <div
            className="settings-row settings-row-link"
            onClick={() => navigate("/profile")}
          >
            <div>
              <p className="settings-row-label">Profile</p>
              <p className="settings-row-desc">
                View and edit your personal details
              </p>
            </div>
            <span className="settings-row-arrow">›</span>
          </div>

          <div className="settings-row settings-row-link">
            <div>
              <p className="settings-row-label">Linked accounts</p>
              <p className="settings-row-desc">
                Manage Google or email based sign-in
              </p>
            </div>
            <span className="settings-row-arrow">›</span>
          </div>
        </section>

        {/* Notifications */}
        <section className="settings-section">
          <h2 className="settings-section-title">Notifications</h2>

          <div className="settings-row">
            <div>
              <p className="settings-row-label">Push notifications</p>
              <p className="settings-row-desc">
                Get alerts when coupons are about to expire
              </p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={pushEnabled}
                onChange={() => setPushEnabled((v) => !v)}
              />
              <span className="settings-slider" />
            </label>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-row-label">Email updates</p>
              <p className="settings-row-desc">
                Receive summaries and product tips in your inbox
              </p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={() => setEmailEnabled((v) => !v)}
              />
              <span className="settings-slider" />
            </label>
          </div>
        </section>

        {/* App Preferences */}
        <section className="settings-section">
          <h2 className="settings-section-title">App preferences</h2>

          <div className="settings-row">
            <div>
              <p className="settings-row-label">Dark mode</p>
              <p className="settings-row-desc">
                Keep Vaulto easy on your eyes
              </p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode((v) => !v)}
              />
              <span className="settings-slider" />
            </label>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-row-label">Auto-detect coupon text</p>
              <p className="settings-row-desc">
                Automatically read text from new scans
              </p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={autoScan}
                onChange={() => setAutoScan((v) => !v)}
              />
              <span className="settings-slider" />
            </label>
          </div>
        </section>

        {/* Legal / support */}
        <section className="settings-section">
          <h2 className="settings-section-title">About</h2>

          <div className="settings-row settings-row-link">
            <div>
              <p className="settings-row-label">Terms of Use</p>
            </div>
            <span className="settings-row-arrow">›</span>
          </div>

          <div className="settings-row settings-row-link">
            <div>
              <p className="settings-row-label">Privacy Policy</p>
            </div>
            <span className="settings-row-arrow">›</span>
          </div>

          <div className="settings-row settings-row-link">
            <div>
              <p className="settings-row-label">Support</p>
              <p className="settings-row-desc">
                Get help with your coupons or account
              </p>
            </div>
            <span className="settings-row-arrow">›</span>
          </div>
        </section>

        {/* Danger zone */}
        <section className="settings-section">
          <button
            className="settings-logout"
            onClick={() => {
              // you already have a backend logout route; this just calls it then redirects
              fetch("http://localhost:8080/auth/logout", {
                method: "POST",
                credentials: "include",
              }).finally(() => {
                localStorage.removeItem("token");
                window.location.href = "/";
              });
            }}
          >
            Log out of Vaulto
          </button>
        </section>
      </main>

      {/* Bottom navigation (same as other pages) */}
      <BottomNav />
    </div>
  );
}