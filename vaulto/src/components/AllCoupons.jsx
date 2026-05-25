// src/pages/AllCoupons.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Map dashboard category names -> values stored in coupon.category
// (based on your AddCoupon dropdown: Food, Fashion, Electronics, Travel, Grocery, Other)
const CATEGORY_MAP = {
  All: null,          // special: no filter
  Groceries: "Grocery",
  Dining: "Food",
  Electronics: "Electronics",
  Travel: "Travel",
  Beauty: "Beauty",
  Health: "Health",
  Entertainment: "Entertainment",
  Food: "Food",
  Fashion: "Fashion",
  Grocery: "Grocery",
  Other: "Other",
};

export default function AllCoupons() {
  const query = useQuery();
  const navigate = useNavigate();
  const selectedCategory = query.get("category") || "All";

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCoupons() {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/coupons/all`, {
          credentials: "include", // send cookies / auth
        });

        if (!res.ok) {
          throw new Error("Failed to load coupons");
        }

        const data = await res.json(); // array of coupon docs from backend

        // Decide what category to filter by
        const apiCategory =
          CATEGORY_MAP[selectedCategory] ?? selectedCategory;

        let filtered = data;
        if (apiCategory) {
          filtered = data.filter(
            (c) =>
              (c.category || "").toLowerCase() ===
              apiCategory.toLowerCase()
          );
        }

        setCoupons(filtered);
      } catch (err) {
        console.error("Error loading coupons:", err);
        setCoupons([]);
      } finally {
        setLoading(false);
      }
    }

    loadCoupons();
  }, [selectedCategory]);

  const goBack = () => navigate("/dashboard");

  return (
    <div className="all-coupons-page" style={{ padding: 20 }}>
      <button onClick={goBack} style={{ marginBottom: 12 }}>
        ← Back
      </button>

      <h2>
        All Coupons —{" "}
        <span style={{ opacity: 0.8 }}>{selectedCategory}</span>
      </h2>

      {loading ? (
        <p>Loading…</p>
      ) : coupons.length === 0 ? (
        <p>No coupons found for this category.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12,
            marginTop: 16,
          }}
        >
          {coupons.map((c) => (
            <div
              key={c._id}
              className="coupon-card"
              style={{
                padding: 12,
                borderRadius: 10,
                background: "var(--card, #0b1220)",
              }}
            >
              <h3 style={{ margin: 0 }}>
                {c.store || "Untitled coupon"}
              </h3>

              <div style={{ marginTop: 4 }}>
                <strong>
                  {c.discount || c.code || "No discount text"}
                </strong>
              </div>

              <small style={{ opacity: 0.7 }}>
                {c.category || "Uncategorized"}
                {c.expiry && (
                  <>
                    {" • Expires: "}
                    {new Date(c.expiry).toLocaleDateString()}
                  </>
                )}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
