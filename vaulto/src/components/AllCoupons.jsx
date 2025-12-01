// src/components/AllCoupons.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import CouponModal from "./CouponModal";
import "../styles/AllCoupons.css";

// read ?category= from URL
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// map dashboard label -> DB category string
function mapCategoryToDb(label) {
  switch (label) {
    case "Groceries":
      return "Grocery";
    case "Dining":
      return "Food";
    case "Electronics":
      return "Electronics";
    case "Travel":
      return "Travel";
    case "Beauty":
      return "Beauty";
    case "Health":
      return "Health";
    case "Entertainment":
      return "Entertainment";
    case "Food":
      return "Food";
    case "Fashion":
      return "Fashion";
    case "Grocery":
      return "Grocery";
    case "Other":
      return "Other";
    case "All":
    default:
      return null; // All => no filter
  }
}

export default function AllCoupons() {
  const query = useQuery();
  const navigate = useNavigate();

  const queryCategory = query.get("category");
  const selectedCategory = queryCategory || "All";

  const [allCoupons, setAllCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  // fetch ALL coupons once
  useEffect(() => {
    async function loadCoupons() {
      try {
        setLoading(true);

        const res = await fetch("http://localhost:8080/coupons/all", {
          credentials: "include",
        });

        if (!res.ok) {
          console.error("AllCoupons fetch error:", res.status);
          throw new Error("Failed to load coupons");
        }

        const data = await res.json();
        console.log("AllCoupons: fetched", data.length, "coupons from API");
        setAllCoupons(data);
      } catch (err) {
        console.error("AllCoupons error:", err);
        setAllCoupons([]);
      } finally {
        setLoading(false);
      }
    }

    loadCoupons();
  }, []);

  const apiCategory = mapCategoryToDb(selectedCategory);

  const visibleCoupons =
    apiCategory === null
      ? allCoupons
      : allCoupons.filter(
          (c) =>
            (c.category || "").toLowerCase() ===
            apiCategory.toLowerCase()
        );

  console.log(
    "AllCoupons:",
    "selectedCategory =",
    selectedCategory,
    "apiCategory =",
    apiCategory,
    "visible =",
    visibleCoupons.length
  );

  // delete handler used by both card and modal
  const handleDelete = async (couponId) => {
    const ok = window.confirm("Delete this coupon permanently?");
    if (!ok) return;

    try {
      const res = await fetch(
        `http://localhost:8080/coupons/${couponId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Delete coupon failed:", res.status, data);
        alert(data.message || "Failed to delete coupon.");
        return;
      }

      // remove from state
      setAllCoupons((prev) =>
        prev.filter((c) => c._id !== couponId)
      );

      // if modal is open for this coupon, close it
      setSelectedCoupon((current) =>
        current && current._id === couponId ? null : current
      );
    } catch (err) {
      console.error("Network error while deleting coupon:", err);
      alert("Network error while deleting coupon.");
    }
  };

  return (
    <div className="all-coupons-page">
      <header className="all-coupons-header">
        <button
          className="all-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>

        <div className="all-coupons-title-block">
          <h2 className="all-coupons-title">
            All Coupons — {selectedCategory}
          </h2>
          <span className="all-coupons-subtitle">
            View, inspect, and manage your saved deals
          </span>
        </div>
      </header>

      <main className="all-coupons-content">
        {loading ? (
          <p className="all-coupons-message">Loading…</p>
        ) : visibleCoupons.length === 0 ? (
          <p className="all-coupons-message">
            No coupons found for this category.
          </p>
        ) : (
          <div className="all-coupons-grid">
            {visibleCoupons.map((c) => {
              const isExpired =
                c.expiry && new Date(c.expiry) < new Date();

              return (
                <div
                  key={c._id}
                  className="coupon-card"
                  onClick={() => setSelectedCoupon(c)}
                >
                  {/* delete button in top-right */}
                  <button
                    type="button"
                    className="coupon-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // don't open modal
                      handleDelete(c._id);
                    }}
                    aria-label="Delete coupon"
                  >
                    ×
                  </button>

                  <div className="coupon-title-row">
                    <div>
                      <div className="coupon-store">
                        {c.store || "Untitled coupon"}
                      </div>
                      <div className="coupon-discount">
                        {c.discount || c.code || "No discount text"}
                      </div>
                    </div>
                  </div>

                  <div className="coupon-meta-row">
                    <span className="coupon-tag">
                      <span className="dot" />
                      {c.category || "Uncategorized"}
                    </span>

                    {c.expiry && (
                      <span
                        className={
                          "coupon-expiry" +
                          (isExpired ? " expired" : "")
                        }
                      >
                        {isExpired ? "Expired: " : "Expires: "}
                        {new Date(c.expiry).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bottom-nav-spacer" />
      </main>

      {/* Modal with full coupon details + delete */}
      <CouponModal
        coupon={selectedCoupon}
        onClose={() => setSelectedCoupon(null)}
        onDelete={(coupon) => handleDelete(coupon._id)}
      />

      <BottomNav />
    </div>
  );
}
