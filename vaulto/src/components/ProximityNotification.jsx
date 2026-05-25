// src/components/ProximityNotification.jsx
// In-app notification component for nearby store alerts

import React, { useState, useEffect, useCallback } from "react";
import { MapPin, X, ExternalLink, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import locationService from "../utils/locationService";
import "../styles/ProximityNotification.css";

export default function ProximityNotification() {
  const [notifications, setNotifications] = useState([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("unknown");
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  // Handle location service events
  const handleLocationEvent = useCallback((event) => {
    if (event.type === "proximity") {
      // Add new proximity notification
      setNotifications((prev) => {
        // Don't add duplicate
        if (prev.some((n) => n.id === event.coupon.id)) {
          return prev;
        }
        // Add to front, keep max 5
        return [event.coupon, ...prev].slice(0, 5);
      });
    }
  }, []);

  // Initialize location service
  useEffect(() => {
    const checkPermission = async () => {
      const status = await locationService.getPermissionStatus();
      setPermissionStatus(status);
      
      // Auto-start if already granted
      if (status === "granted") {
        setIsEnabled(true);
        locationService.startWatching();
      }
    };

    checkPermission();

    // Add listener for proximity events
    const removeListener = locationService.addListener(handleLocationEvent);

    return () => {
      removeListener();
    };
  }, [handleLocationEvent]);

  // Enable/disable location tracking
  const toggleLocationTracking = async () => {
    if (isEnabled) {
      locationService.stopWatching();
      setIsEnabled(false);
    } else {
      // Request permissions
      const notifPermission = await locationService.requestNotificationPermission();
      const started = locationService.startWatching();
      
      if (started) {
        setIsEnabled(true);
        setPermissionStatus("granted");
      }
    }
  };

  // Dismiss a notification
  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Copy coupon code
  const copyCode = async (notification) => {
    if (notification.code) {
      await navigator.clipboard.writeText(notification.code);
      setCopiedId(notification.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // View coupon details
  const viewCoupon = (notification) => {
    navigate(`/all-coupons?highlight=${notification.id}`);
    dismissNotification(notification.id);
  };

  // Test notification feature
  const triggerTestNotification = () => {
    const testNotification = {
      id: `test-${Date.now()}`,
      store: "Test Store (Demo)",
      discount: "50% OFF - Test Notification",
      code: "TESTCODE50",
      distance: Math.floor(Math.random() * 100) + 10,
      storeAddress: "123 Test Street, Demo City",
    };
    setNotifications((prev) => [testNotification, ...prev].slice(0, 5));
  };

  return (
    <>
      {/* Location Toggle Button (shown in settings or as a floating button) */}
      <div className="proximity-toggle">
        <button
          className={`location-toggle-btn ${isEnabled ? "active" : ""}`}
          onClick={toggleLocationTracking}
          title={isEnabled ? "Disable proximity alerts" : "Enable proximity alerts"}
        >
          <MapPin size={18} />
          <span>{isEnabled ? "Tracking On" : "Tracking Off"}</span>
        </button>
        <button
          className="test-notification-btn"
          onClick={triggerTestNotification}
          title="Trigger a test notification"
        >
          🔔 Test Alert
        </button>
      </div>

      {/* Notification Stack */}
      <div className="proximity-notifications">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className="proximity-notification"
            style={{
              transform: `translateY(${index * 8}px) scale(${1 - index * 0.02})`,
              opacity: 1 - index * 0.15,
              zIndex: 1000 - index,
            }}
          >
            <div className="notification-icon">
              <MapPin size={24} />
            </div>

            <div className="notification-content">
              <div className="notification-header">
                <h4 className="store-name">{notification.store}</h4>
                <span className="distance-badge">{notification.distance}m away</span>
              </div>

              <p className="discount-info">{notification.discount}</p>

              {notification.code && (
                <div className="code-row">
                  <code className="coupon-code">{notification.code}</code>
                  <button
                    className="copy-btn"
                    onClick={() => copyCode(notification)}
                    title="Copy code"
                  >
                    {copiedId === notification.id ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              )}

              <div className="notification-actions">
                <button
                  className="action-btn primary"
                  onClick={() => viewCoupon(notification)}
                >
                  <ExternalLink size={14} />
                  View Coupon
                </button>
              </div>
            </div>

            <button
              className="dismiss-btn"
              onClick={() => dismissNotification(notification.id)}
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Permission Request Banner (shown when permission not granted) */}
      {permissionStatus === "prompt" && !isEnabled && (
        <div className="permission-banner">
          <MapPin size={20} />
          <div className="banner-text">
            <strong>Enable location alerts?</strong>
            <p>Get notified when you're near a store with coupons.</p>
          </div>
          <button className="enable-btn" onClick={toggleLocationTracking}>
            Enable
          </button>
        </div>
      )}
    </>
  );
}
