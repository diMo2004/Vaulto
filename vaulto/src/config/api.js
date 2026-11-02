// Vaulto API and Service Configuration

export const isLocalBrowser =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1", ""].includes(window.location.hostname);

// Helper to sanitize injected environment variables
function resolveServiceUrl(envVar, localDefault, productionDefault) {
  let raw = "";
  try {
    raw = (envVar || "").trim();
  } catch (e) {
    raw = "";
  }

  const isLocalUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw);
  const isValidHttp = /^https?:\/\/[^/\s]+/i.test(raw);

  // In production (e.g. deployed on Vercel), never use localhost even if baked in at build time
  if (isValidHttp && (!isLocalUrl || isLocalBrowser)) {
    return raw.replace(/\/+$/, "");
  }

  return isLocalBrowser ? localDefault : productionDefault;
}

export const API_BASE = resolveServiceUrl(
  typeof process !== "undefined" && process.env ? process.env.REACT_APP_API_BASE : "",
  "http://localhost:8080",
  "https://vaulto-backend.onrender.com"
);

export const RECOMMENDATION_API_BASE = resolveServiceUrl(
  typeof process !== "undefined" && process.env ? process.env.REACT_APP_RECOMMENDATION_API_BASE : "",
  "http://localhost:8000",
  "https://vaulto-recommendation.onrender.com"
);

export const OCR_API_BASE = resolveServiceUrl(
  typeof process !== "undefined" && process.env ? process.env.REACT_APP_OCR_API_BASE : "",
  "http://localhost:8081",
  "https://vaulto-ocr.onrender.com"
);

/**
 * Returns Authorization header if an auth token is stored in localStorage or sessionStorage.
 */
export function getAuthHeaders() {
  const token =
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("accessToken")) ||
    (typeof localStorage !== "undefined" && (localStorage.getItem("accessToken") || localStorage.getItem("token") || localStorage.getItem("authToken"))) ||
    "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Wrapper around window.fetch that includes:
 * 1. credentials: "include" (for cross-site cookies)
 * 2. Authorization: Bearer <token> (for browsers blocking third-party cookies)
 */
export async function authFetch(url, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };
  return fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });
}
