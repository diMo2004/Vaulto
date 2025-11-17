import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import "../styles/AddCoupon.css";
import BottomNav from "./BottomNav";

export default function AddCoupon() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedMetadata = location.state;

  const [formData, setFormData] = useState({
  store: passedMetadata?.store || "",
  discount: passedMetadata?.discount || "",
  code: passedMetadata?.code || "",
  category: passedMetadata?.category || "Other",
  expiry: passedMetadata?.expiry || "",
  description: passedMetadata?.rawText || ""
 });


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:8080/coupons/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      alert("Coupon saved!");
      navigate("/dashboard");
    } else {
      alert("Error saving coupon.");
    }
  };

  return (
    <div className="add-page">
      {/* Header */}
      <div className="add-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

        <h2>Add to Vaulto</h2>
        <p>Save a new coupon to your vault</p>
      </div>

      {/* Form */}
      <form className="add-form" onSubmit={handleSubmit}>
        
        <label>Store/Brand Name *</label>
        <input
          name="store"
          type="text"
          placeholder="e.g., Nike, Starbucks"
          value={formData.store}
          onChange={handleChange}
          required
        />

        <label>Discount *</label>
        <input
          name="discount"
          type="text"
          placeholder="e.g., 20% OFF or ₹100 OFF"
          value={formData.discount}
          onChange={handleChange}
          required
        />

        <label>Coupon Code</label>
        <input
          name="code"
          type="text"
          placeholder="e.g., SAVE20"
          value={formData.code}
          onChange={handleChange}
        />

        <label>Description</label>
        <textarea
          name="description"
          placeholder="Details about the offer..."
          value={formData.description}
          onChange={handleChange}
        />

        <label>Category *</label>
        <select name="category" value={formData.category} onChange={handleChange}>
          <option>Food</option>
          <option>Fashion</option>
          <option>Electronics</option>
          <option>Travel</option>
          <option>Grocery</option>
          <option>Other</option>
        </select>

        <label>Expiry Date</label>
        <input
          name="expiry"
          type="date"
          value={formData.expiry}
          onChange={handleChange}
        />

        <label>Store Logo URL (optional)</label>
        <input
          name="logoUrl"
          type="url"
          placeholder="https://..."
          value={formData.logoUrl}
          onChange={handleChange}
        />

        <button className="save-btn" type="submit">💾 Save Coupon</button>
      </form>
        <BottomNav />
    </div>
  );
}
