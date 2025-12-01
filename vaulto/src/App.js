// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SignupProvider } from "./context/SignupContext.jsx";

// ✅ Auth / Signup flow
import SignupLanding from "./components/SignupLanding";
import EmailPage from "./components/EmailPage";
import PasswordPage from "./components/PasswordPage";
import SignupDOB from "./components/SignupDOB";
import SignupGender from "./components/SignupGender";
import SignupUsername from "./components/SignupUsername";
import PhoneLogin from "./components/PhoneLogin";
import PhoneOTP from "./components/PhoneOTP";

// ✅ Main app pages
import Dashboard from "./components/Dashboard";
import ScanCoupon from "./components/ScanCoupon";
import CameraScanner from "./components/CameraScanner";
import UploadScanner from "./components/UploadScanner";
import SearchPage from "./components/SearchPage";
import AddCoupon from "./components/AddCoupon";
import TradePage from "./components/TradePage";
import GiftPage from "./components/GiftPage";
import Profile from "./components/ViewProfile";
import SettingsPage from "./components/Settings";
import NotificationsPage from "./components/Notifications";
import LegalPage from "./components/Legal";
import SupportPage from "./components/Support";
import ManualEntryPage from "./components/ManualEntry";
import AllCouponsPage from "./components/AllCoupons";

import ExpiryNotifier from "./components/ExpiryNotifier"; // 👈 NEW

import "./App.css";

function App() {
  return (
    <SignupProvider>
      <Router>
        {/* Runs globally, no UI, just checks expiring coupons */}
        <ExpiryNotifier />

        <Routes>
          {/* ---------- AUTH / SIGNUP FLOW ---------- */}
          <Route path="/" element={<SignupLanding />} />
          <Route path="/email" element={<EmailPage />} />
          <Route path="/password" element={<PasswordPage />} />
          <Route path="/signup/dob" element={<SignupDOB />} />
          <Route path="/signup/gender" element={<SignupGender />} />
          <Route path="/signup/username" element={<SignupUsername />} />
          <Route path="/login/phone" element={<PhoneLogin />} />
          <Route path="/login/phone-otp" element={<PhoneOTP />} />

          {/* ---------- MAIN APP PAGES ---------- */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Scan / Add coupon flow */}
          <Route path="/scan" element={<ScanCoupon />} />
          <Route path="/scan/camera" element={<CameraScanner />} />
          <Route path="/scan/upload" element={<UploadScanner />} />
          <Route path="/add-coupon" element={<AddCoupon />} />
          <Route path="/manual-entry" element={<ManualEntryPage />} />

          {/* Coupons browsing */}
          <Route path="/all-coupons" element={<AllCouponsPage />} />

          {/* Trade & Gift */}
          <Route path="/trade" element={<TradePage />} />
          <Route path="/gift" element={<GiftPage />} />

          {/* Utility pages */}
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/support" element={<SupportPage />} />

          {/* Optional: 404 fallback */}
          {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
      </Router>
    </SignupProvider>
  );
}

export default App;
