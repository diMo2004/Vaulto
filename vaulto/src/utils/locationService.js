import { API_BASE } from "../config/api";
// src/utils/locationService.js
// Geofencing service for proximity notifications

class LocationService {
  constructor() {
    this.watchId = null;
    this.lastPosition = null;
    this.listeners = new Set();
    this.nearbyCoupons = [];
    this.notifiedCoupons = new Set(); // Track which coupons we've already notified about
    this.isWatching = false;
    this.checkInterval = null;
    
    // Configuration
    this.config = {
      checkIntervalMs: 30000, // Check every 30 seconds
      defaultRadius: 500, // Default search radius in meters
      minDistanceChange: 50, // Minimum distance change to trigger a new check
      notificationCooldownMs: 5 * 60 * 1000, // 5 minutes between repeat notifications for same store
    };
    
    this.notificationTimestamps = new Map(); // Track last notification time per coupon
  }

  /**
   * Start watching user's location
   */
  startWatching() {
    if (this.isWatching) return;
    
    if (!("geolocation" in navigator)) {
      console.warn("Geolocation is not supported by this browser.");
      return false;
    }

    this.isWatching = true;

    // Request permission and start watching
    navigator.geolocation.getCurrentPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handleError(error),
      { enableHighAccuracy: true }
    );

    // Watch for position changes
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handleError(error),
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 10000,
      }
    );

    // Also set up periodic checks
    this.checkInterval = setInterval(() => {
      if (this.lastPosition) {
        this.checkNearbyStores();
      }
    }, this.config.checkIntervalMs);

    console.log("📍 Location watching started");
    return true;
  }

  /**
   * Stop watching user's location
   */
  stopWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.isWatching = false;
    console.log("📍 Location watching stopped");
  }

  /**
   * Handle position update from geolocation API
   */
  handlePositionUpdate(position) {
    const { latitude, longitude, accuracy } = position.coords;
    
    // Check if we've moved significantly
    const shouldCheck = !this.lastPosition || 
      this.calculateDistance(
        this.lastPosition.latitude,
        this.lastPosition.longitude,
        latitude,
        longitude
      ) >= this.config.minDistanceChange;

    this.lastPosition = { latitude, longitude, accuracy, timestamp: Date.now() };

    if (shouldCheck) {
      this.checkNearbyStores();
    }

    // Notify listeners of position update
    this.notifyListeners({ type: "position", position: this.lastPosition });
  }

  /**
   * Handle geolocation errors
   */
  handleError(error) {
    console.error("Geolocation error:", error.message);
    this.notifyListeners({ type: "error", error });
  }

  /**
   * Check for nearby stores with coupons
   */
  async checkNearbyStores() {
    if (!this.lastPosition) return;

    try {
      const { latitude, longitude } = this.lastPosition;
      
      const response = await fetch(
        `${API_BASE}/coupons/nearby?lat=${latitude}&lng=${longitude}&radius=${this.config.defaultRadius}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch nearby coupons");
      }

      const coupons = await response.json();
      this.nearbyCoupons = coupons;

      // Check for new proximity alerts
      for (const coupon of coupons) {
        const couponId = coupon._id;
        const lastNotified = this.notificationTimestamps.get(couponId);
        const now = Date.now();

        // Only notify if we haven't notified recently
        if (!lastNotified || (now - lastNotified) > this.config.notificationCooldownMs) {
          // Check if within geofence radius
          if (coupon.distance <= (coupon.geofenceRadius || 100)) {
            this.triggerProximityNotification(coupon);
            this.notificationTimestamps.set(couponId, now);
          }
        }
      }

      this.notifyListeners({ type: "nearby", coupons: this.nearbyCoupons });
    } catch (error) {
      console.error("Error checking nearby stores:", error);
    }
  }

  /**
   * Trigger a proximity notification for a coupon
   */
  triggerProximityNotification(coupon) {
    // Create notification data
    const notification = {
      id: coupon._id,
      store: coupon.store,
      discount: coupon.discount,
      code: coupon.code,
      distance: coupon.distance,
      expiresAt: coupon.expiry,
    };

    // Notify listeners (for in-app notifications)
    this.notifyListeners({ type: "proximity", coupon: notification });

    // Try to show browser notification if permission granted
    this.showBrowserNotification(notification);
  }

  /**
   * Show a browser notification (if permission granted)
   */
  async showBrowserNotification(notification) {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      this.createNotification(notification);
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        this.createNotification(notification);
      }
    }
  }

  /**
   * Create the actual browser notification
   */
  createNotification(data) {
    const notification = new Notification(`🎫 ${data.store} Nearby!`, {
      body: `You have a ${data.discount} coupon! Only ${data.distance}m away.`,
      icon: "/icons/coupon-icon.png",
      badge: "/icons/badge-icon.png",
      tag: `proximity-${data.id}`,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: data,
    });

    notification.onclick = () => {
      window.focus();
      // Navigate to coupon details or open modal
      window.dispatchEvent(
        new CustomEvent("vaulto:showCoupon", { detail: data })
      );
      notification.close();
    };
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if (!("Notification" in window)) {
      return "unsupported";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Add a listener for location/proximity events
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event) {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error("Listener error:", error);
      }
    });
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * Returns distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get current position (one-time)
   */
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
        reject,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  /**
   * Get nearby coupons (cached)
   */
  getNearbyCoupons() {
    return this.nearbyCoupons;
  }

  /**
   * Check if location services are available
   */
  isSupported() {
    return "geolocation" in navigator;
  }

  /**
   * Get permission status
   */
  async getPermissionStatus() {
    if (!("permissions" in navigator)) {
      return "unknown";
    }

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      return result.state; // 'granted', 'denied', or 'prompt'
    } catch {
      return "unknown";
    }
  }
}

// Export singleton instance
const locationService = new LocationService();
export default locationService;
