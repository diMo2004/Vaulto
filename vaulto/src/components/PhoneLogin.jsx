import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Signup.css";

export default function PhoneLogin() {
  const [phone, setPhone] = useState("+91");
  const navigate = useNavigate();

  const handleNext = () => {
    if (phone.length < 4) {
      alert("Enter a valid phone number");
      return;
    }

    // Navigate to OTP page
    navigate("/login/phone-otp", { state: { phone } });
  };

  return (
    <div className="screen">
      <h2 className="heading">Enter phone number</h2>

      <input
        type="text"
        className="input-field"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <p className="subtext">We’ll send you a code to confirm your phone number.</p>

      <button className="next-btn" onClick={handleNext}>
        Next
      </button>
    </div>
  );
}
