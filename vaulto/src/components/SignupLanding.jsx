// src/components/SignupLanding.jsx
import { useNavigate } from "react-router-dom";
import EmailIcon from "../assets/email-icon.svg";
import PhoneIcon from "../assets/phone-icon.svg";
import GoogleIcon from "../assets/google.svg";
import LogoIcon from "../assets/logo-icon.svg";
import "../styles/Signup.css";

export default function SignupLanding() {
  const navigate = useNavigate();

  return (
    <>
      <div className="page-container" style={{ textAlign: "center" }}>
        <img src={LogoIcon} alt="logo"/><h2>Sign up to Vaulto</h2>

        <button className="landing-btn" onClick={() => navigate("/email")}>
          <img src={EmailIcon} alt="email" className="icon" />Continue with email
        </button>

        <button className="landing-btn" onClick={() => navigate("/login/phone")}><img src={PhoneIcon} alt="phone" className="icon" />Continue with phone number</button>
        <button className="landing-btn"><img src={GoogleIcon} alt="google" className="icon" />Continue with Google</button>
      </div>
    </>
  );
}
