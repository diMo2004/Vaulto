import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Signup.css";

export default function SignupGender() {
  const [gender, setGender] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const { email, password, dob } = location.state || {};

  const handleNext = () => {
    if (!gender) {
      alert("Please enter your gender");
      return;
    }

    navigate("/signup/username", {
      state: { email, password, dob, gender }
    });
  };

  return (
    <div className="screen">
      <h2 className="heading">Create account</h2>

      <label className="title">What’s your gender?</label>

      <input
        type="text"
        className="input-field"
        placeholder=""
        value={gender}
        onChange={(e) => setGender(e.target.value)}
      />

      <button className="next-btn" onClick={handleNext}>
        Next
      </button>
    </div>
  );
}
