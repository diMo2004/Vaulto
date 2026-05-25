// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";
import {
  signAccessToken,
  verifyRefreshToken,
} from "../utils/token.js";

dotenv.config();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: "/",
};

export default async function authMiddleware(req, res, next) {
  try {
    const cookies = req.cookies || {};
    const authHeader = req.headers.authorization || req.headers.Authorization;

    console.log("auth cookies:", cookies);
    console.log("auth header:", authHeader);

    const accessFromCookie = cookies.accessToken;
    let accessFromHeader = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessFromHeader = authHeader.split(" ")[1];
    }

    let accessToken = accessFromCookie || accessFromHeader;

    // 1) If we have an access token, try to verify it
    if (accessToken && accessToken !== "null" && accessToken !== "undefined") {
      try {
        const payload = jwt.verify(
          accessToken,
          process.env.JWT_ACCESS_SECRET
        );

        const user = await User.findById(payload.userId).lean();
        if (!user) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = {
          id: user._id,
          email: user.email,
          name: user.name,
          username: user.username,
        };

        return next();
      } catch (err) {
        console.error("access token verify error:", err.message);
        // If it's anything other than "jwt expired", we fail early
        if (err.name !== "TokenExpiredError") {
          return res.status(401).json({ message: "Unauthorized" });
        }
        // else: fall through to refresh-token logic
      }
    }

    // 2) No valid access token → try refresh token
    const refreshToken = cookies.refreshToken;
    if (!refreshToken || refreshToken === "null" || refreshToken === "undefined") {
      return res.status(401).json({ message: "Unauthorized: no token" });
    }

    let refreshPayload;
    try {
      refreshPayload = verifyRefreshToken(refreshToken);
    } catch (err) {
      console.error("refresh token verify error:", err.message);
      return res.status(401).json({ message: "Unauthorized: invalid refresh" });
    }

    const user = await User.findById(refreshPayload.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Unauthorized: refresh mismatch" });
    }

    // 3) Issue a new access token and set cookie
    const newAccessToken = signAccessToken({
      userId: user._id,
      email: user.email,
    });

    res.cookie("accessToken", newAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 15, // 15 minutes
    });

    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      username: user.username,
    };

    return next();
  } catch (err) {
    console.error("auth error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
}
