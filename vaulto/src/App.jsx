// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SignupProvider } from "./context/SignupContext.jsx";

// ✅ Auth / Signup flow
import SignupLanding from "./components/SignupLanding.jsx";
import EmailPage from "./components/EmailPage.jsx";
import PasswordPage from "./components/PasswordPage.jsx";
import SignupDOB from "./components/SignupDOB.jsx";
import SignupGender from "./components/SignupGender.jsx";
import SignupUsername from "./components/SignupUsername.jsx";
import PhoneLogin from "./components/PhoneLogin.jsx";
import PhoneOTP from "./components/PhoneOTP.jsx";

// ✅ Main app pages
import Dashboard from "./components/Dashboard.jsx";
import ScanCoupon from "./components/ScanCoupon.jsx";
import CameraScanner from "./components/CameraScanner.jsx";
import UploadScanner from "./components/UploadScanner.jsx";
import SearchPage from "./components/SearchPage.jsx";
import AddCoupon from "./components/AddCoupon.jsx";
import TradePage from "./components/TradePage.jsx";
import GiftPage from "./components/GiftPage.jsx";
import Profile from "./components/ViewProfile.jsx";
import SettingsPage from "./components/Settings.jsx";
import NotificationsPage from "./components/Notifications.jsx";
import LegalPage from "./components/Legal.jsx";
import SupportPage from "./components/Support.jsx";
import ManualEntryPage from "./components/ManualEntry.jsx";
import AllCouponsPage from "./components/AllCoupons.jsx";

import ExpiryNotifier from "./components/ExpiryNotifier.jsx"; // 👈 NEW

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
