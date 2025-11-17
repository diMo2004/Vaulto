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
import Dashboard from "./components/Dashboard";
import ScanCoupon from "./components/ScanCoupon";
import CameraScanner from "./components/CameraScanner.jsx";
import UploadScanner from "./components/UploadScanner";
import SearchPage from "./components/SearchPage";
import AddCoupon from "./components/AddCoupon";
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scan" element={<ScanCoupon />} />
          <Route path="/scan/camera" element={<CameraScanner />} />
          <Route path="/scan/upload" element={<UploadScanner />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/add-coupon" element={<AddCoupon />} />
        </Routes>
      </Router>
    </SignupProvider>
  );
}

export default App;
