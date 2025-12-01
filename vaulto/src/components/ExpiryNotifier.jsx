// src/components/ExpiryNotifier.jsx
import React, { useEffect, useRef, useState } from "react";

// How many days before expiry we consider "near future"
const THRESHOLD_DAYS = 3;

// How often to poll the backend (ms)
const POLL_INTERVAL_MS = 30 * 1000; // 5 minutes

// LocalStorage key to remember which coupons we've notified about
const STORAGE_KEY = "vaulto_expiry_notified_ids";

function loadNotifiedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveNotifiedIds(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

export default function ExpiryNotifier() {
  const [permissionChecked, setPermissionChecked] = useState(false);
  const notifiedRef = useRef(loadNotifiedIds());
  const timerRef = useRef(null);

  useEffect(() => {
    // Ask for permission once
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission()
          .catch(() => {})
          .finally(() => setPermissionChecked(true));
      } else {
        setPermissionChecked(true);
      }
    } else {
      setPermissionChecked(true);
    }
  }, []);

  useEffect(() => {
    if (!permissionChecked) return;

    async function checkExpiring() {
      try {
        const res = await fetch(
          "http://localhost:8080/coupons/expiring-soon?days=" + THRESHOLD_DAYS,
          {
            credentials: "include",
          }
        );

        if (!res.ok) {
          console.error(
            "ExpiryNotifier: failed to load expiring coupons",
            res.status
          );
          return;
        }

        const coupons = await res.json();
        const now = new Date();
        const notifiedIds = notifiedRef.current;

        coupons.forEach((c) => {
          if (!c._id || !c.expiry) return;

          // Skip if we've already notified about this coupon
          if (notifiedIds.has(c._id)) return;

          const expiryDate = new Date(c.expiry);
          if (Number.isNaN(expiryDate.getTime())) return;

          const diffMs = expiryDate - now;
          const daysLeft = Math.ceil(
            diffMs / (24 * 60 * 60 * 1000)
          );

          if (daysLeft < 0 || daysLeft > THRESHOLD_DAYS) return;

          // Fire a browser notification (if allowed), and record we did it
          triggerNotification(c, daysLeft);
          notifiedIds.add(c._id);
        });

        saveNotifiedIds(notifiedIds);
      } catch (err) {
        console.error("ExpiryNotifier error:", err);
      }
    }

    // Initial check immediately
    checkExpiring();

    // Then poll every few minutes
    timerRef.current = setInterval(checkExpiring, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [permissionChecked]);

  return null; // no UI; runs in background
}

function triggerNotification(coupon, daysLeft) {
  const store = coupon.store || "Your coupon";
  const discount = coupon.discount || coupon.code || "";
  const title = `${store} coupon expiring soon`;
  const body =
    (discount ? discount + " — " : "") +
    (daysLeft === 0
      ? "Expires today!"
      : `Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`);

  if (!("Notification" in window)) {
    // Fallback: simple alert
    alert(`${title}\n\n${body}`);
    return;
  }

  if (Notification.permission === "granted") {
    try {
      new Notification(title, { body });
    } catch (e) {
      console.warn("Notification error:", e);
      alert(`${title}\n\n${body}`);
    }
  } else {
    // If permission denied, just use alert
    alert(`${title}\n\n${body}`);
  }
}
