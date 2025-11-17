import React, { useState, useEffect } from "react";
import "../styles/SearchPage.css";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [allCoupons, setAllCoupons] = useState([]);

  useEffect(() => {
    // Fetch coupons from backend
    fetch("http://localhost:8080/coupons/all")
      .then(res => res.json())
      .then(data => setAllCoupons(data))
      .catch(err => console.error(err));
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (!value.trim()) {
      setFilteredCoupons([]);
      return;
    }

    const results = allCoupons.filter(c =>
      c.store.toLowerCase().includes(value.toLowerCase()) ||
      c.code.toLowerCase().includes(value.toLowerCase()) ||
      c.discount?.toLowerCase().includes(value.toLowerCase()) ||
      c.rawText?.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredCoupons(results);
  };

  return (
    <div className="search-page">
      {/* Header */}
      <div className="search-header">
        <h2>Find your saved coupons</h2>

        <div className="search-bar-container">
          <input
            type="text"
            placeholder="Search by store, code, or description..."
            value={query}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      {/* Empty State */}
      {query.length === 0 && (
        <div className="search-empty">
          <div className="search-icon">🔍</div>
          <h3>Search for coupons</h3>
          <p>Start typing to find your coupons</p>
        </div>
      )}

      {/* Results */}
      {query.length > 0 && filteredCoupons.length === 0 && (
        <div className="no-results">No coupons found.</div>
      )}

      {filteredCoupons.length > 0 && (
        <div className="results-container">
          {filteredCoupons.map((c, index) => (
            <div className="coupon-card" key={index}>
              <h3>{c.store}</h3>
              <p><b>Code:</b> {c.code}</p>
              <p><b>Discount:</b> {c.discount}</p>
              <p><b>Expiry:</b> {c.expiry}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
