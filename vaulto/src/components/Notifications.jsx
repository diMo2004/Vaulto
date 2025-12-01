import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Notifications.css";
import BottomNav from "./BottomNav";

export default function Notifications() {
  const navigate = useNavigate();

  // For now using dummy notifications – later you can replace with data from backend
  const notifications = [
    {
      id: 1,
      title: "Coupon expiring soon",
      message: "Your 20% OFF Nike coupon expires tomorrow.",
      time: "2h ago",
      read: false,
    },
    {
      id: 2,
      title: "New offer added",
      message: "Zomato coupons updated in the Food category.",
      time: "Yesterday",
      read: true,
    },
    {
      id: 3,
      title: "Reminder",
      message: "Don't forget to use your Flipkart electronics deal.",
      time: "2 days ago",
      read: true,
    },
  ];

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-header">
        <button className="notif-back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <h2>Notifications</h2>
      </div>

      {/* List */}
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="notifications-empty">
            <p>No notifications yet.</p>
            <span>We'll let you know when there’s something new.</span>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`notification-card ${n.read ? "read" : "unread"}`}
            >
              <div className="notification-main">
                <div className="notification-text">
                  <h3>{n.title}</h3>
                  <p>{n.message}</p>
                </div>
                {!n.read && <span className="notif-dot" />}
              </div>
              <div className="notification-footer">
                <span className="notif-time">{n.time}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
