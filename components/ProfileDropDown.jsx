import React, { useState } from "react";
import { ChevronDown, User, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import "../styles/ProfileDropDown.css";
import { useNavigate } from "react-router-dom";
import Profile from "./Profile";
import Logout from "./Logout";

function ProfileDropDown({ onLogout, onProfile }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSettings = () => {
    setOpen(false);          // close dropdown
    navigate("/settings");   // ✅ go to /settings
  };

  return (
    <div className="profile-dropdown-container">
      <button
        className="profile-button"
        onClick={() => setOpen((prev) => !prev)}
      >
        <User size={18} />
        <ChevronDown size={16} />
      </button>

      {open && (
        <motion.div
          className="dropdown-menu"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button className="dropdown-item" onClick={() => { 
            setOpen(false);
            onProfile();
            }}>
            <User size={16} />
            Profile
          </button>

          <button
            className="dropdown-item" onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}>
            <User size={16} />
            Notifications
          </button>


          <button className="dropdown-item" onClick={handleSettings}>
            <User size={16} />
            Settings
          </button>

          <button
            className="dropdown-item" onClick={() => {
              setOpen(false);
              navigate("/legal");
            }}>
            <User size={16} />
            Legal
          </button>

          <button
            className="dropdown-item" onClick={() => {
              setOpen(false);
              navigate("/support");
            }}>
            <User size={16} />
            Customer Care
          </button>

          <button className="dropdown-item" onClick={() => {onLogout();}}>
            <LogOut size={16} />
            Logout
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default ProfileDropDown;