import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import "../styles/Signup.css";

export default function PhoneLogin() {
  const [phone, setPhone] = useState("+91");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleNext = async () => {
    const normalizedPhone = phone.trim().replace(/[\s()-]/g, "");
    if (!/^\+\d{8,15}$/.test(normalizedPhone)) {
      setError("Enter a valid phone number with country code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/phone/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Could not send OTP.");
      }

      navigate("/login/phone-otp", { state: { phone: normalizedPhone } });
    } catch (err) {
      setError(err.message || "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen">
      <h2 className="heading">Enter phone number</h2>

      <input
        type="tel"
        className="input-field"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
      />

      <p className="subtext">We'll send you a code to confirm your phone number.</p>
      {error && <p className="form-error">{error}</p>}

      <button className="next-btn" onClick={handleNext} disabled={loading}>
        {loading ? "Sending..." : "Next"}
      </button>
    </div>
  );
}
