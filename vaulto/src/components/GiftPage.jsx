import React, { useEffect, useState } from "react";
import BottomNav from "./BottomNav";
import "../styles/AddCoupon.css"; // reuse form styling

export default function GiftPage() {
  const [coupons, setCoupons] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function loadCoupons() {
      try {
        const res = await fetch("http://localhost:8080/coupons/all", {
          credentials: "include"
        });
        const data = await res.json();
        if (res.ok) setCoupons(data);
      } catch (e) {
        console.error("load coupons error", e);
      }
    }
    loadCoupons();
  }, []);

  const handleGift = async (e) => {
    e.preventDefault();
    if (!selectedId || !email) {
      alert("Choose a coupon and enter a friend's email.");
      return;
    }

    const res = await fetch("http://localhost:8080/coupons/gift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ couponId: selectedId, recipientEmail: email })
    });

    const data = await res.json();
    if (res.ok) {
      alert("Coupon gifted successfully!");
    } else {
      alert(data.message || "Could not gift coupon.");
    }
  };

  return (
    <div className="add-page">
      <div className="add-header">
        <h2>Gift a Friend</h2>
        <p>Send one of your coupons to someone’s Vaulto.</p>
      </div>

      <form className="add-form" onSubmit={handleGift}>
        <label>Select a coupon</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Choose…</option>
          {coupons.map((c) => (
            <option key={c._id} value={c._id}>
              {c.store} – {c.discount || c.code}
            </option>
          ))}
        </select>

        <label>Friend's email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@example.com"
        />

        <button className="save-btn" type="submit">
          🎁 Gift Coupon
        </button>
      </form>

      <BottomNav />
    </div>
  );
}