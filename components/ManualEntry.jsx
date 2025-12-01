// src/components/ManualEntry.jsx
import React, { useState } from "react";
import "../styles/ManualEntry.css";

export default function ManualEntry() {
  const [form, setForm] = useState({
    title: "",
    brand: "",
    code: "",
    expiry: "",
    category: "",
    description: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Manual Coupon Entered:", form);

    alert("Coupon added successfully!");
  };

  return (
    <div className="me-shell">

      <div className="me-container">
        <h1 className="me-title">Manual Entry</h1>
        <p className="me-sub">Add coupon details manually if you cannot scan the QR code.</p>

        <form className="me-form" onSubmit={handleSubmit}>

          <label className="me-label">Coupon Title / Offer</label>
          <input
            type="text"
            name="title"
            className="me-input"
            placeholder="e.g. 50% off Dominos"
            value={form.title}
            onChange={handleChange}
            required
          />

          <label className="me-label">Brand Name</label>
          <input
            type="text"
            name="brand"
            className="me-input"
            placeholder="e.g. Dominos"
            value={form.brand}
            onChange={handleChange}
            required
          />

          <label className="me-label">Coupon Code</label>
          <input
            type="text"
            name="code"
            className="me-input"
            placeholder="e.g. SAVE50"
            value={form.code}
            onChange={handleChange}
            required
          />

          <label className="me-label">Expiry Date</label>
          <input
            type="date"
            name="expiry"
            className="me-input"
            value={form.expiry}
            onChange={handleChange}
            required
          />

          <label className="me-label">Category</label>
          <select
            name="category"
            className="me-input"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            <option>Dining</option>
            <option>Groceries</option>
            <option>Electronics</option>
            <option>Clothing</option>
            <option>Movies</option>
            <option>Entertainment</option>
            <option>Travel</option>
            <option>Other</option>
          </select>

          <label className="me-label">Description (Optional)</label>
          <textarea
            name="description"
            className="me-textarea"
            placeholder="Additional notes..."
            value={form.description}
            onChange={handleChange}
          />

          <button type="submit" className="me-submit-btn">
            Add Coupon
          </button>
        </form>
      </div>

    </div>
  );
}