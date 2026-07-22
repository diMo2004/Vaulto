import React, { useState, useEffect } from "react";
import "../styles/ViewProfile.css";
import { API_BASE } from "../config/api";
import {
  User,
  Settings,
  LogOut,
  MapPin,
  Calendar,
  ChevronRight,
  Phone,
  Mail,
  CreditCard,
  Ticket,
  HelpCircle,
  Share2,
  AtSign,
  X,
} from "lucide-react";

export default function ViewProfile() {
  // Profile Data State (will be loaded from backend)
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    gender: "",
    dob: "",
    location: "",
    name: "",
  });

  const [editingItem, setEditingItem] = useState(null);
  const [tempValue, setTempValue] = useState("");

  // Fetch profile from backend on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        // data is user document from backend
        setProfile((prev) => ({
          ...prev,
          ...data,
          username: data.username || prev.username,
          email: data.email || prev.email,
          gender: data.gender || prev.gender,
          dob: data.dob || prev.dob,
          name: data.name || prev.name,
        }));
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    }

    fetchProfile();
  }, []);

  const openEditModal = (key, label, type = "text") => {
    setEditingItem({ key, label, type });
    setTempValue(profile[key] ?? "");
  };

  const saveEdit = async () => {
    if (!editingItem) return;

    if (editingItem.type === "tel" && tempValue.trim().length < 6) {
      alert("Please enter a valid phone number.");
      return;
    }
    if (
      editingItem.type === "email" &&
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(tempValue)
    ) {
      alert("Please enter a valid email address.");
      return;
    }

    // Only these fields are saved to backend
    const backendKeys = ["name", "username", "dob", "gender", "email"];

    try {
      if (backendKeys.includes(editingItem.key)) {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            [editingItem.key]: tempValue,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.user) {
          console.error("Profile update failed:", res.status, data);
          alert(`Failed to update: ${data.message || res.status}`);
          return;
        }

        setProfile((prev) => ({
          ...prev,
          ...data.user,
        }));
      } else {
        // Local-only fields (phone, location)
        setProfile((prev) => ({
          ...prev,
          [editingItem.key]: tempValue,
        }));
      }

      setEditingItem(null);
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update. Please try again.");
    }
  };

  const displayDob = (dob) => {
    try {
      const d = new Date(dob);
      if (!isNaN(d)) return d.toLocaleDateString();
    } catch (e) {}
    return dob;
  };

  return (
    <div className="view-profile-root" aria-live="polite">
      <header className="profile-header">
        <div className="avatar-wrapper">
          <div className="avatar-circle" aria-hidden>
            {(profile.name && profile.name[0]?.toUpperCase()) || "U"}
          </div>
          <div className="status-dot" aria-hidden></div>
        </div>
        <h1 className="user-name">{profile.name || "Vaulto User"}</h1>
        <p className="user-handle">
          {profile.username || "@your_username"}
        </p>
      </header>

      <main className="content-scroll" id="main-content">
        <div className="profile-stack">
          {/* PERSONAL INFO */}
          <section aria-labelledby="personal-info" className="section">
            <h2 id="personal-info" className="section-label">
              Personal Info
            </h2>
            <div className="menu-group">
              <button
                className="menu-item"
                onClick={() => openEditModal("username", "Username")}
                aria-label="Edit username"
              >
                <div className="icon-box at">
                  <AtSign />
                </div>
                <div className="item-text">
                  <span className="item-title">Username</span>
                  <span className="item-sub">
                    {profile.username || "@username"}
                  </span>
                </div>
                <ChevronRight size={18} className="chevron" />
              </button>

              <button
                className="menu-item"
                onClick={() =>
                  openEditModal("phone", "Phone Number", "tel")
                }
                aria-label="Edit phone"
              >
                <div className="icon-box phone">
                  <Phone />
                </div>
                <div className="item-text">
                  <span className="item-title">Phone</span>
                  <span className="item-sub">
                    {profile.phone || "Add phone"}
                  </span>
                </div>
                <ChevronRight size={18} className="chevron" />
              </button>

              <button
                className="menu-item"
                onClick={() =>
                  openEditModal("email", "Email Address", "email")
                }
                aria-label="Edit email"
              >
                <div className="icon-box mail">
                  <Mail />
                </div>
                <div className="item-text">
                  <span className="item-title">Email</span>
                  <span className="item-sub">
                    {profile.email || "Add email"}
                  </span>
                </div>
                <ChevronRight size={18} className="chevron" />
              </button>

              <button
                className="menu-item"
                onClick={() => openEditModal("gender", "Gender")}
                aria-label="Edit gender"
              >
                <div className="icon-box user">
                  <User />
                </div>
                <div className="item-text">
                  <span className="item-title">Gender</span>
                  <span className="item-sub">
                    {profile.gender || "Select gender"}
                  </span>
                </div>
                <ChevronRight size={18} className="chevron" />
              </button>

              <button
                className="menu-item"
                onClick={() =>
                  openEditModal("dob", "Date of Birth", "date")
                }
                aria-label="Edit dob"
              >
                <div className="icon-box dob">
                  <Calendar />
                </div>
                <div className="item-text">
                  <span className="item-title">Date of Birth</span>
                  <span className="item-sub">
                    {profile.dob ? displayDob(profile.dob) : "Add DOB"}
                  </span>
                </div>
                <ChevronRight size={18} className="chevron" />
              </button>

              <button
                className="menu-item"
                onClick={() =>
                  openEditModal("location", "Location")
                }
                aria-label="Edit location"
              >
                <div className="icon-box loc">
                  <MapPin />
                </div>
                <div className="item-text">
                  <span className="item-title">Location</span>
                  <span className="item-sub">
                    {profile.location || "Add location"}
                  </span>
                </div>
                <ChevronRight size={18} className="chevron" />
              </button>
            </div>
          </section>

          {/* FINANCE & ACTIVITY */}
          <section aria-labelledby="finance" className="section">
            <h2 id="finance" className="section-label">
              Finance & Activity
            </h2>
            <div className="menu-group">
              <div className="menu-item">
                <div className="icon-box wallet">
                  <CreditCard />
                </div>
                <div className="item-text">
                  <span className="item-title">My Wallet</span>
                  <span className="item-sub">Manage saved cards</span>
                </div>
                <ChevronRight size={18} className="chevron" />
              </div>

              <div className="menu-item">
                <div className="icon-box coupon">
                  <Ticket />
                </div>
                <div className="item-text">
                  <span className="item-title">My Coupons</span>
                  <span className="item-sub">View active rewards</span>
                </div>
                <ChevronRight size={18} className="chevron" />
              </div>
            </div>
          </section>

          {/* APP SETTINGS */}
          <section aria-labelledby="settings" className="section">
            <h2 id="settings" className="section-label">
              App Settings
            </h2>
            <div className="menu-group">
              <div className="menu-item">
                <div className="icon-box gen">
                  <Settings />
                </div>
                <div className="item-text">
                  <span className="item-title">General Settings</span>
                  <span className="item-sub">
                    Preferences & Security
                  </span>
                </div>
                <ChevronRight size={18} className="chevron" />
              </div>

              <div className="menu-item">
                <div className="icon-box share">
                  <Share2 />
                </div>
                <div className="item-text">
                  <span className="item-title">Invite Friends</span>
                  <span className="item-sub">
                    Get referral rewards
                  </span>
                </div>
                <ChevronRight size={18} className="chevron" />
              </div>

              <div className="menu-item">
                <div className="icon-box help">
                  <HelpCircle />
                </div>
                <div className="item-text">
                  <span className="item-title">Help & Support</span>
                  <span className="item-sub">FAQs, Contact Us</span>
                </div>
                <ChevronRight size={18} className="chevron" />
              </div>
            </div>
          </section>

          <div className="logout-container">
            <button
              className="logout-btn"
              onClick={() => alert("Logged out (demo)")}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
            <p className="version-text">Vaulto App v2.4.2</p>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingItem && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="modal-title" className="modal-title">
                Edit {editingItem.label}
              </h3>
              <button
                className="close-btn"
                onClick={() => setEditingItem(null)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>
            <div className="input-group">
              <input
                type={editingItem.type}
                className="modal-input"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                autoFocus
              />
            </div>
            <button className="save-btn" onClick={saveEdit}>
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
