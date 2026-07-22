import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import "../styles/Signup.css";

export default function PhoneOTP() {
  const { state } = useLocation();
  const phone = state?.phone || "";
  const navigate = useNavigate();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleNext = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/phone/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, otp: code }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid OTP.");
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/phone/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Could not resend OTP.");
      }
    } catch (err) {
      setError(err.message || "Could not resend OTP.");
    } finally {
      setResending(false);
    }
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
            inputMode="numeric"
            autoComplete="one-time-code"
            onChange={(e) => handleChange(e.target.value, idx)}
          />
        ))}
      </div>

      <p className="subtext">We sent a 6-digit code to {phone}</p>
      {error && <p className="form-error">{error}</p>}

      <button className="next-btn" onClick={handleNext} disabled={loading}>
        {loading ? "Verifying..." : "Next"}
      </button>

      <div className="otp-links">
        <p>
          Didn't receive code?
          <br />
          <button
            type="button"
            className="text-link"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
        </p>

        <p>
          <button
            type="button"
            className="text-link"
            onClick={() => navigate("/login/phone")}
          >
            Edit phone number
          </button>
        </p>
      </div>
    </div>
  );
}
