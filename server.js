import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import session from "express-session";

import authRoutes from "./routes/auth.js";
import couponRoutes from "./routes/coupon.js";
import authMiddleware from "./middleware/auth.js";

import "./config/passport.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// CORS so React (localhost:3000) can talk to backend
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({limit: "1mb"}));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "coupons_session_secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);
app.use("/coupons", couponRoutes);

// Example protected route (can be used for testing)
app.get("/dashboard", authMiddleware, (req, res) => {
  res.json({
    message: "Protected dashboard for Coupons Project",
    user: req.user,
  });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });