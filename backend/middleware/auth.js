import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

export default async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies.accessToken || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.userId).lean();
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = { id: user._id, email: user.email, name: user.name };
    next();
  } catch (err) {
    console.error("auth error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
}
