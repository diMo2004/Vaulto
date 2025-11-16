// src/components/PasswordPage.jsx
import { useContext } from "react";
import { SignupContext } from "../context/SignupContext";
import { useNavigate } from "react-router-dom";
import "../styles/Signup.css";

export default function PasswordPage() {
  const { password, setPassword } = useContext(SignupContext);
  const navigate = useNavigate();
  const { email } = useContext(SignupContext);

  const handleNext = () => {
    if (!password || password.length < 10) {
      alert("Password must be at least 10 characters.");
      return;
    }
    navigate("/signup/username", {
      state: { email, password }
    });
  };

  return (
    <>
      <div className="page-container">
        <h2>Create a password</h2>

        <input
          type="password"
          className="input-box"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <p style={{ color: "#b3b3b3", marginTop: "10px" }}>
          Use at least 10 characters.
        </p>

        <button className="next-btn" onClick={handleNext}>Next</button>
      </div>
    </>
  );
}
