import React, { useEffect, useState } from "react";
import BottomNav from "./BottomNav";
import "../styles/AddCoupon.css";
import { useNavigate } from "react-router-dom";

export default function TradePage() {
  // ✅ define loading state properly
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCoupons() {
      try {
        // ✅ use the backend route that you KNOW works
        // if you have /coupons/tradeable implemented, you can switch to that later
        const res = await fetch("http://localhost:8080/coupons/all", {
          credentials: "include",          // send cookies / auth
        });

        if (!res.ok) {
          throw new Error("Not authorized or error loading data");
        }

        const data = await res.json();

        // If you have a 'tradable' flag in your Coupon model, and only want those:
        // setCoupons(data.filter(c => c.tradable));
        setCoupons(data);                  // show all for now
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
