import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export function signAccessToken(payload) {
  const secret = process.env.JWT_ACCESS_SECRET;
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES || "15m";
  return jwt.sign(payload, secret, { expiresIn });
}

export function signRefreshToken(payload) {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES || "30d";
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}
