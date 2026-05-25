// src/components/ExpiringSoon.jsx
import React, { useEffect, useState, useRef } from "react";
import "../styles/ExpiringSoon.css";

function daysBetween(now, then) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((then - now) / msPerDay);
}

function formatDateISO(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function ExpiringSoon() {
  // threshold to mark "expiring soon" (days)
  const SOON_DAYS = 5;

  const [coupons, setCoupons] = useState([]);
  const [notifyPrefs, setNotifyPrefs] = useState({}); // id -> boolean
  const [alerts, setAlerts] = useState([]); // in-app immediate alerts
  const timersRef = useRef({}); // store active timeouts to clear on unmount

  // Load coupons from backend
  useEffect(() => {
    async function loadCoupons() {
      try {
        const res = await fetch("http://localhost:8080/coupons/all", {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to load coupons");

        const data = await res.json();

        // Only coupons with expiry
        const mapped = data
          .filter((c) => !!c.expiry)
          .map((c) => ({
            ...c,
            id: c._id,
            title: c.store || "Coupon",
            category: c.category || "General",
            expiryDate: new Date(c.expiry),
          }));

        setCoupons(mapped);
      } catch (err) {
        console.error("ExpiringSoon load error:", err);
        setCoupons([]);
      }
    }

    loadCoupons();
  }, []);

  // Request Notification permission once user opens page
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // On coupons or notifyPrefs change, schedule notifications
  useEffect(() => {
    // clear previous timers
    Object.values(timersRef.current).forEach((id) => clearTimeout(id));
    timersRef.current = {};

    const now = new Date();

    coupons.forEach((c) => {
      const id = c.id;
      const pref = notifyPrefs[id];

      if (!pref) return; // user not opted in

      const diffMs = c.expiryDate - now;
      if (diffMs <= 0) {
        // already expired
        pushAlert(`Coupon "${c.title}" already expired.`);
        triggerNotification(
          `Expired: ${c.title}`,
          `Coupon expired on ${formatDateISO(c.expiry)}`
        );
      } else {
        const daysLeft = daysBetween(now, c.expiryDate);
        // If within SOON_DAYS, notify immediately and schedule expiry
        if (daysLeft <= SOON_DAYS) {
          pushAlert(`"${c.title}" expires in ${daysLeft} day(s).`);
          triggerNotification(
            `${c.title} expiring soon`,
            `Expires in ${daysLeft} day(s) — ${formatDateISO(c.expiry)}`
          );
        }
        const timer = setTimeout(() => {
          pushAlert(`"${c.title}" has expired.`);
          triggerNotification(`Expired: ${c.title}`, `Coupon expired.`);
        }, diffMs);
        timersRef.current[id] = timer;
      }
    });

    return () => {
      Object.values(timersRef.current).forEach((id) => clearTimeout(id));
      timersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupons, notifyPrefs]);

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((id) => clearTimeout(id));
      timersRef.current = {};
    };
  }, []);

  function pushAlert(message) {
    setAlerts((prev) => [message, ...prev].slice(0, 5));
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a !== message));
    }, 8000);
  }

  function triggerNotification(title, body) {
    if (!("Notification" in window)) {
      pushAlert(`${title} — ${body}`);
      return;
    }
    if (Notification.permission === "granted") {
      try {
        new Notification(title, { body });
      } catch (e) {
        pushAlert(`${title} — ${body}`);
      }
    } else {
      pushAlert(`${title} — ${body}`);
    }
  }

  function toggleNotify(id) {
    setNotifyPrefs((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      return next;
    });
  }

  // compute status label
  function getStatus(c) {
    const now = new Date();
    const diff = c.expiryDate - now;
    if (diff <= 0) return { label: "Expired", danger: true, days: 0 };
    const d = daysBetween(now, c.expiryDate);
    if (d <= SOON_DAYS) return { label: `Expires in ${d}d`, danger: true, days: d };
    return { label: `Expires in ${d}d`, danger: false, days: d };
  }

  return (
    <div className="es-shell">
      <div className="es-container">
        <header className="es-header">
          <h1>Expiring Soon</h1>
          <p>
            Coupons that are approaching their expiry. Turn on notifications to
            be reminded.
          </p>
        </header>

        <div className="es-alerts">
          {alerts.map((a, i) => (
            <div key={i} className="es-alert">
              {a}
            </div>
          ))}
        </div>

        <main className="es-main">
          {coupons.length === 0 ? (
            <div className="es-empty">No coupons with expiry dates yet.</div>
          ) : (
            <div className="es-list">
              {coupons.map((c) => {
                const status = getStatus(c);
                const isSoon = status.days <= SOON_DAYS && status.days > 0;
                return (
                  <article
                    key={c.id}
                    className={`es-card ${status.danger ? "danger" : ""}`}
                  >
                    <div className="es-left">
                      <div className="es-title">
                        {c.title} {c.discount ? `– ${c.discount}` : ""}
                      </div>
                      <div className="es-meta">
                        <span className="es-cat">{c.category}</span>
                        <span className="es-exp">
                          Expires: {formatDateISO(c.expiry)}
                        </span>
                      </div>
                    </div>

                    <div className="es-right">
                      <div
                        className={`es-status ${
                          isSoon ? "soon" : ""
                        }`}
                      >
                        {status.label}
                      </div>
                      <div className="es-actions">
                        <label className="es-toggle">
                          <input
                            type="checkbox"
                            checked={!!notifyPrefs[c.id]}
                            onChange={() => toggleNotify(c.id)}
                          />
                          <span>Notify me</span>
                        </label>
                        <button
                          className="es-btn"
                          onClick={() => {
                            pushAlert(
                              `Saved coupon "${c.title}" for later.`
                            );
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
