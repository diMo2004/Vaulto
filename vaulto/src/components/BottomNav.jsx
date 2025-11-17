import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/BottomNav.css";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="bottom-nav">
      <button 
        className={`nav-btn ${isActive("/dashboard") ? "active" : ""}`}
        onClick={() => navigate("/dashboard")}
      >
        <span className="nav-icon">🏠</span>
        <p>Home</p>
      </button>

      <button 
        className={`nav-btn ${isActive("/scan") ? "active" : ""}`}
        onClick={() => navigate("/scan")}
      >
        <span className="nav-icon">📷</span>
        <p>Scan</p>
      </button>

      <button 
        className={`nav-btn ${isActive("/search") ? "active" : ""}`}
        onClick={() => navigate("/search")}
      >
        <span className="nav-icon">🔍</span>
        <p>Search</p>
      </button>
    </div>
  );
}
