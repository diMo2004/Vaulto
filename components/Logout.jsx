import { useEffect } from "react";

export default function Logout() {
  useEffect(() => {
    localStorage.removeItem("token");
    window.location.href = "/";
  }, []);

  return <p>Logging out...</p>;
}