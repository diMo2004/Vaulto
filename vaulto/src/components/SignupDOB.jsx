import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Signup.css";

export default function SignupDOB() {
  const [dob, setDob] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const { email, password } = location.state || {};

  const handleNext = () => {
    if (!dob) {
      alert("Please enter your date of birth");
      return;
    }

    navigate("/signup/gender", {
      state: { email, password, dob }
    });
  };

  return (
    <div className="screen">
      <h2 className="heading">Create account</h2>

      <label className="title">What’s your date of birth?</label>

      <input
        type="date"
        className="input-field"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
      />

      <button className="next-btn" onClick={handleNext}>
        Next
      </button>
    </div>
  );
}
