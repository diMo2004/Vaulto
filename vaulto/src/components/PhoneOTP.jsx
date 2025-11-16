import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Signup.css";

export default function PhoneOTP() {
  const { state } = useLocation();
  const phone = state?.phone || "";
  const navigate = useNavigate();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleNext = () => {
    if (otp.join("").length !== 6) {
      alert("Enter 6-digit code");
      return;
    }

    alert("Phone number verified");
  };

  return (
    <div className="screen">
      <h2 className="heading">Enter your code</h2>

      <div className="otp-container">
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            maxLength={1}
            className="otp-box"
            value={digit}
            onChange={(e) => handleChange(e.target.value, idx)}
          />
        ))}
      </div>

      <p className="subtext">We sent a 6-digit code to {phone}</p>

      <button className="next-btn" onClick={handleNext}>
        Next
      </button>

      <div className="otp-links">
        <p>
          Didn’t receive code?
          <br />
          <a href="#">Resend code</a>
        </p>

        <p>
          <a href="#" onClick={() => navigate("/login/phone")}>
            Edit phone number
          </a>
        </p>
      </div>
    </div>
  );
}
