// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignupLanding from "./components/SignupLanding";
import EmailPage from "./components/EmailPage";
import PasswordPage from "./components/PasswordPage";
import { SignupProvider } from "./context/SignupContext";
import SignupDOB from "./components/SignupDOB";
import SignupGender from "./components/SignupGender";
import SignupUsername from "./components/SignupUsername";
import PhoneLogin from "./components/PhoneLogin";
import PhoneOTP from "./components/PhoneOTP";
import "./App.css";

function App() {
  return (
    <SignupProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SignupLanding />} />
          <Route path="/email" element={<EmailPage />} />
          <Route path="/password" element={<PasswordPage />} />
          <Route path="/signup/dob" element={<SignupDOB />} />
          <Route path="/signup/gender" element={<SignupGender />} />
          <Route path="/signup/username" element={<SignupUsername />} />
          <Route path="/login/phone" element={<PhoneLogin />} />
          <Route path="/login/phone-otp" element={<PhoneOTP />} />
        </Routes>
      </Router>
    </SignupProvider>
  );
}

export default App;
