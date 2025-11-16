// src/components/EmailPage.jsx
import { useContext } from "react";
import { SignupContext } from "../context/SignupContext";
import { useNavigate } from "react-router-dom";

export default function EmailPage() {
  const { email, setEmail } = useContext(SignupContext);
  const navigate = useNavigate();

  const handleNext = () => {
    if (!email) {
      alert("Please enter your email.");
      return;
    }
    navigate("/password");
  };

  return (
    <>
      <div className="top-bar">
        <div className="page-title">Create account</div>
      </div>

      <div className="page-container">
        <h2>What's your email?</h2>

        <input
          type="email"
          className="input-box"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <p style={{ color: "#b3b3b3", marginTop: "10px" }}>
          You’ll need to confirm this email later.
        </p>

        <button className="next-btn" onClick={handleNext}>Next</button>
      </div>
    </>
  );
}
