import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import passport from "passport";
import session from "express-session";
import authRoutes from "./routes/auth.js";
import "./config/passport.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || "coupons_session_secret",
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);

import authMiddleware from "./middleware/auth.js";
app.get("/dashboard", authMiddleware, (req, res) => {
  res.json({ message: "Protected dashboard for Coupons Project", user: req.user });
});

mongoose.connect(process.env.MONGO_URI, { })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error("MongoDB connection error:", err);
  });
