// src/components/BottomNav.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, Scan } from "lucide-react";
import "../styles/BottomNav.css";

export default function BottomNav({ setIsAddMenuOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() => {
    const p = window.location.pathname;
    if (p.startsWith("/dashboard")) return "Home";
    if (p.startsWith("/search")) return "Search";
    return "Home";
  });

  useEffect(() => {
    const p = location.pathname;
    if (p.startsWith("/dashboard") || p === "/") setActiveTab("Home");
    else if (p.startsWith("/search")) setActiveTab("Search");
    else setActiveTab("");
  }, [location.pathname]);

  const getHomePath = () => {
    const signedIn =
      !!localStorage.getItem("authToken") ||
      !!localStorage.getItem("vaulto_user");
    return signedIn ? "/dashboard" : "/";
  };

  const handleNav = (path, tab) => {
    if (tab === "Home") {
      navigate(getHomePath());
      setActiveTab("Home");
      return;
    }

    navigate(path);
    setActiveTab(tab);
  };

  return (
    <nav className="navbar">
      {/* Home */}
      <div
        className={`nav-link ${activeTab === "Home" ? "active" : ""}`}
        onClick={() => handleNav("/dashboard", "Home")}
        role="button"
        aria-label="Go home"
      >
        <Home size={20} />
        <span>Home</span>
      </div>

      {/* Scan */}
      <div
        className="scan-action-btn"
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent("vaulto:toggleAdd", { detail: "open" })
          );

          setTimeout(() => {
            const sheet = document.querySelector(".action-sheet");
            const isOpen =
              sheet && sheet.classList.contains("open");
            if (!isOpen) navigate("/scan");
          }, 120);
        }}
        role="button"
        aria-label="Open scan"
      >
        <Scan size={22} />
      </div>

      {/* Search */}
      <div
        className={`nav-link ${activeTab === "Search" ? "active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          handleNav("/search", "Search");
        }}
        role="button"
        aria-label="Search"
      >
        <Search size={20} />
        <span>Search</span>
      </div>
    </nav>
  );
}
