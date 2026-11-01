const configuredApiBase =
  typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE;

const isLocalBrowser =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1", ""].includes(window.location.hostname);

export const API_BASE =
  configuredApiBase ||
  (isLocalBrowser
    ? "http://localhost:8080"
    : "https://vaulto-backend.onrender.com");
