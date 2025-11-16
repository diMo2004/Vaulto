// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignupLanding from "./components/SignupLanding";
import EmailPage from "./components/EmailPage";
import PasswordPage from "./components/PasswordPage";
import { SignupProvider } from "./context/SignupContext";
import "./App.css";

function App() {
  return (
    <SignupProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SignupLanding />} />
          <Route path="/email" element={<EmailPage />} />
          <Route path="/password" element={<PasswordPage />} />
        </Routes>
      </Router>
    </SignupProvider>
  );
}

export default App;
