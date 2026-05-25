import express from "express";
import bcrypt from "bcrypt";
import passport from "passport";
import dotenv from "dotenv";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/token.js";

dotenv.config();

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: "/",
};

/**
 * POST /auth/register
 * Called from SignupUsername.jsx with signupData:
 * { email, password, dob, gender, username, name }
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, dob, gender, username, name } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      provider: "local",
      email,
      password: hashed,
      dob,
      gender,
      username,
      // fallback so profile.name is always set
      name: name || username || email.split("@")[0],
    });

    console.log("New user created in Mongo:", user);

    return res
      .status(201)
      .json({ message: "User registered", userId: user._id });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /auth/login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = signAccessToken({
      userId: user._id,
      email: user.email,
    });
    const refreshToken = signRefreshToken({ userId: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    const accessCookieOptions = {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 15, // 15 min
    };
    const refreshMaxAge = 1000 * 60 * 60 * 24 * 30; // 30 days

    res.cookie("accessToken", accessToken, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: refreshMaxAge,
    });

    return res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        dob: user.dob,
        gender: user.gender,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Google OAuth start – matches SignupLanding redirect
 * GET /auth/google
 */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * Google OAuth callback
 * GET /auth/google/callback
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect:
      process.env.GOOGLE_FAILURE_REDIRECT || "http://localhost:3000",
  }),
  async (req, res) => {
    try {
      const user = req.user;

      const accessToken = signAccessToken({
        userId: user._id,
        email: user.email,
      });
      const refreshToken = signRefreshToken({ userId: user._id });

      user.refreshToken = refreshToken;
      await user.save();

      res.cookie("accessToken", accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 1000 * 60 * 15,
      });
      res.cookie("refreshToken", refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 1000 * 60 * 60 * 24 * 30,
      });

      return res.redirect(
        process.env.GOOGLE_SUCCESS_REDIRECT ||
          "http://localhost:3000/dashboard"
      );
    } catch (err) {
      console.error("google callback error:", err);
      return res.redirect(
        process.env.GOOGLE_FAILURE_REDIRECT || "http://localhost:3000"
      );
    }
  }
);

router.get("/google/failure", (req, res) => {
  return res.status(401).json({ message: "Google authentication failed" });
});

/**
 * POST /auth/refresh-token
 */
router.post("/refresh-token", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.userId);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = signAccessToken({
      userId: user._id,
      email: user.email,
    });

    res.cookie("accessToken", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 15,
    });

    return res.json({ message: "Access token refreshed" });
  } catch (err) {
    console.error("refresh error:", err);
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }
});

/**
 * POST /auth/logout
 */
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      let payload = null;
      try {
        payload = verifyRefreshToken(token);
      } catch {}

      if (payload) {
        await User.findByIdAndUpdate(payload.userId, {
          $set: { refreshToken: null },
        });
      }
    }

    res.clearCookie("accessToken", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);

    return res.json({ message: "Logged out" });
  } catch (err) {
    console.error("logout error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /auth/me
 * Used by Profile.jsx / ViewProfile.jsx to show profile data
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -refreshToken -__v"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * PUT /auth/me
 * Update current user's profile (name, username, dob, gender, email, avatar)
 */
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const allowedFields = ["name", "username", "dob", "gender", "email", "avatar"];
    const updates = {};

    for (const key of allowedFields) {
      if (key in req.body) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -refreshToken -__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "Profile updated",
      user,
    });
  } catch (err) {
    console.error("update me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
