import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Signup.css";

export default function SignupUsername() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const { email, password, dob, gender } = location.state || {};

  const handleCreate = () => {
    if (!username) {
      alert("Please enter a username");
      return;
    }

    // Here you will call your backend API later
    console.log("Final Signup Data:", {
      email,
      password,
      dob,
      gender,
      username
    });

    alert("Account created successfully!");
  };

  return (
    <div className="screen">
      <h2 className="heading">Create account</h2>

      <label className="title">What should we call you?</label>

      <input
        type="text"
        className="input-field"
        placeholder=""
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <p className="subtext">This appears on your CouponSpot account.</p>

      <div className="terms-box">
        <p>
          By tapping on <strong>‘Create account’</strong>, you agree to the
          CouponSpot <a href="#">Terms of Use</a>.
        </p>

        <p>
          To learn more about how CouponSpot collects and protects your
          personal data, please see the CouponSpot <a href="#">Privacy Policy</a>.
        </p>
      </div>

      <button className="create-btn" onClick={handleCreate}>
        Create account
      </button>
    </div>
  );
}
