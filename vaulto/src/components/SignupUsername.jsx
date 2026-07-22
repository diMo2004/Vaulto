import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE } from "../config/api";
import "../styles/Signup.css";

export default function SignupUsername() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const { email, password, dob, gender } = location.state || {};

  const handleCreate = async () => {
    if (!username) {
      setError("Please enter a username.");
      return;
    }
    if (!email || !password) {
      setError("Signup details are missing. Please start again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const registerRes = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          dob,
          gender,
          username,
          name: username,
        }),
      });

      if (!registerRes.ok) {
        const data = await registerRes.json().catch(() => ({}));
        throw new Error(data.message || "Could not create account.");
      }

      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        const data = await loginRes.json().catch(() => ({}));
        throw new Error(data.message || "Account created, but login failed.");
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
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
      {error && <p className="form-error">{error}</p>}

      <div className="terms-box">
        <p>
          By tapping on <strong>‘Create account’</strong>, you agree to the
          CouponSpot <a href="/terms">Terms of Use</a>.
        </p>

        <p>
          To learn more about how CouponSpot collects and protects your
          personal data, please see the CouponSpot <a href="/privacy">Privacy Policy</a>.
        </p>
      </div>

      <button className="create-btn" onClick={handleCreate} disabled={loading}>
        {loading ? "Creating..." : "Create account"}
      </button>
    </div>
  );
}
