import express from "express";
import bcrypt from "bcrypt";
import passport from "passport";
import User from "../models/User.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/token.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: "/",
};

// Register (email)
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      provider: "local",
      email,
      name,
      password: hashed
    });

    res.status(201).json({ message: "User registered", userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login (email)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = signAccessToken({ userId: user._id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    const accessCookieOptions = { ...COOKIE_OPTIONS, maxAge: 1000 * 60 * 15 }; // 15m
    const refreshMaxAge = 1000 * 60 * 60 * 24 * 30; // 30d
    res.cookie("accessToken", accessToken, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, { ...COOKIE_OPTIONS, maxAge: refreshMaxAge });

    return res.json({ message: "Login successful", user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Google OAuth start
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google OAuth callback
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/auth/google/failure" }),
  async (req, res) => {
    try {
      const user = req.user;
      const accessToken = signAccessToken({ userId: user._id, email: user.email });
      const refreshToken = signRefreshToken({ userId: user._id });
      user.refreshToken = refreshToken;
      await user.save();

      res.cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: 1000 * 60 * 15 });
      res.cookie("refreshToken", refreshToken, { ...COOKIE_OPTIONS, maxAge: 1000 * 60 * 60 * 24 * 30 });

      return res.redirect(process.env.GOOGLE_SUCCESS_REDIRECT || "/dashboard");
    } catch (err) {
      console.error(err);
      return res.redirect("/auth/google/failure");
    }
  }
);

router.get("/google/failure", (req, res) => {
  return res.status(401).json({ message: "Google authentication failed" });
});

// Refresh access token
router.post("/refresh-token", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.userId);
    if (!user || user.refreshToken !== token) return res.status(401).json({ message: "Invalid refresh token" });

    const accessToken = signAccessToken({ userId: user._id, email: user.email });
    res.cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: 1000 * 60 * 15 });
    return res.json({ message: "Access token refreshed" });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      let payload = null;
      try { payload = verifyRefreshToken(token); } catch {}
      if (payload) {
        await User.findByIdAndUpdate(payload.userId, { $set: { refreshToken: null } });
      }
    }
    res.clearCookie("accessToken", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    return res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
