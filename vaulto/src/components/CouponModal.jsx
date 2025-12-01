// src/components/CouponModal.jsx
import React from "react";
import "../styles/CouponModal.css";

export default function CouponModal({ coupon, onClose, onDelete }) {
  if (!coupon) return null;

  const {
    store,
    discount,
    code,
    category,
    expiry,
    rawText,
    image,
  } = coupon;

  const expiryDate =
    expiry && !Number.isNaN(new Date(expiry).getTime())
      ? new Date(expiry).toLocaleString()
      : null;

  return (
    <div className="coupon-modal-backdrop" onClick={onClose}>
      <div
        className="coupon-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="coupon-modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="coupon-modal-header">
          {image && (
            <img
              src={image}
              alt={store || "store logo"}
              className="coupon-modal-logo"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}

          <div className="coupon-modal-title-block">
            <h2>{store || "Coupon"}</h2>
            {discount && (
              <div className="coupon-modal-discount">
                {discount}
              </div>
            )}
          </div>
        </div>

        <div className="coupon-modal-body">
          {code && (
            <div className="coupon-modal-row">
              <span className="label">Code</span>
              <span className="value code">{code}</span>
            </div>
          )}

          {category && (
            <div className="coupon-modal-row">
              <span className="label">Category</span>
              <span className="value chip">{category}</span>
            </div>
          )}

          {expiryDate && (
            <div className="coupon-modal-row">
              <span className="label">Expiry</span>
              <span className="value">{expiryDate}</span>
            </div>
          )}

          {rawText && (
            <div className="coupon-modal-row">
              <span className="label">Details</span>
              <div className="value multiline">{rawText}</div>
            </div>
          )}

          {!rawText && !code && !discount && (
            <div className="coupon-modal-row">
              <span className="value">
                No additional details saved for this coupon.
              </span>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="coupon-modal-footer">
          <button
            type="button"
            className="coupon-modal-close-btn-secondary"
            onClick={onClose}
          >
            Close
          </button>

          {onDelete && (
            <button
              type="button"
              className="coupon-modal-delete-btn"
              onClick={() => onDelete(coupon)}
            >
              Delete coupon
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
