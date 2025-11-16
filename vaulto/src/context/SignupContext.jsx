// src/context/SignupContext.jsx
import { createContext, useState } from "react";

export const SignupContext = createContext();

export const SignupProvider = ({ children }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SignupContext.Provider value={{ email, setEmail, password, setPassword }}>
      {children}
    </SignupContext.Provider>
  );
};
