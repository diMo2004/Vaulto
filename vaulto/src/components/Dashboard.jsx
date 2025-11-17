import React, { useRef } from "react";
import "../styles/Dashboard.css";
import { useNavigate, useLocation } from "react-router-dom";

export default function Dashboard() {
  const categoryRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();


  // Enable drag + swipe scrolling
  const handleDrag = (e) => {
    const slider = categoryRef.current;
    let isDown = false;
    let startX, scrollLeft;

    slider.addEventListener("mousedown", (e) => {
      isDown = true;
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener("mouseleave", () => (isDown = false));
    slider.addEventListener("mouseup", () => (isDown = false));

    slider.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 1.5;
      slider.scrollLeft = scrollLeft - walk;
    });
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header">
        <button className="profile-btn">👤</button>
        <h1 className="logo">Vaulto</h1>
        <button className="add-btn">+ Add Coupon</button>
      </div>

      {/* Title */}
      <h2 className="subtitle">Your personal coupon vault</h2>

      {/* Swipeable Category Strip */}
      <div
        className="categories-container"
        ref={categoryRef}
        onMouseDown={handleDrag}
      >
        {[
          { label: "All", icon: "📦" },
          { label: "Food", icon: "🍔" },
          { label: "Fashion", icon: "👗" },
          { label: "Electronics", icon: "📱" },
          { label: "Travel", icon: "✈️" },
          { label: "Beauty", icon: "💇‍♀️" },
          { label: "Groceries", icon: "🥕" },
          { label: "Entertainment", icon: "📽️" },
          { label: "Health", icon: "❤️‍🩹" },
        ].map((item) => (
          <div key={item.label} className="category-card">
            <div className="cat-icon">{item.icon}</div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="empty-state">
        <div className="empty-icon">✨</div>
        <h3>No coupons yet</h3>
        <p>Start saving by adding your first coupon!</p>

        <button className="primary-btn" onClick={() => navigate("/add-coupon")}>Add Your First Coupon</button>
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav">
        <button
        className={`nav-btn ${location.pathname === "/dashboard" ? "active" : ""}`}
        onClick={() => navigate("/dashboard")}
        >
        <span className="nav-icon">🏠</span>
        <span className="nav-label">Home</span>
        </button>

        <button
        className={`nav-btn ${location.pathname === "/scan" ? "active" : ""}`}
        onClick={() => navigate("/scan")}
        >
        <span className="nav-icon">📷</span>
        <span className="nav-label">Scan</span>
        </button>

        <button
        className={`nav-btn ${location.pathname === "/search" ? "active" : ""}`}
        onClick={() => navigate("/search")}
        >
        <span className="nav-icon">🔍</span>
        <span className="nav-label">Search</span>
        </button>
      </div>
    </div>
  );
}
