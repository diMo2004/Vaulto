import React, { useEffect, useState } from "react";
import BottomNav from "./BottomNav";
import "../styles/AddCoupon.css";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";

export default function TradePage() {
  // ✅ define loading state properly
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCoupons() {
      try {
        const storedToken =
          sessionStorage.getItem("accessToken") ||
          localStorage.getItem("accessToken") ||
          localStorage.getItem("token") ||
          null;

        const res = await fetch(`${API_BASE}/coupons/all`, {
          headers: {
            ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
          },
          credentials: "include",          // send cookies / auth
        });

        if (!res.ok) {
          throw new Error("Not authorized or error loading data");
        }

        const data = await res.json();
        setCoupons(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load coupons:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCoupons();
  }, []);

  if (loading) return <p>Loading tradeable coupons...</p>;

  if (coupons.length === 0)
    return (
      <div className="trade-page">
        <h2>Trade Coupons</h2>
        <p>No coupons available for trade yet 😕</p>
        <BottomNav />
      </div>
    );

  return (
    <div className="trade-page">
      <h2>Trade Coupons</h2>

      {coupons.map((c) => (
        <div key={c._id} className="coupon-card">
          <h3>{c.store}</h3>
          <p>{c.discount}</p>
          <p>Code: {c.code}</p>
          <button onClick={() => navigate("/trade/" + c._id)}>
            Trade This Coupon
          </button>
        </div>
      ))}

      {/* keep your bottom navbar */}
      <BottomNav />
    </div>
  );
}
