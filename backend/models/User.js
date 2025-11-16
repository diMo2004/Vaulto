import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  provider: { type: String, default: "local" }, // 'local' or 'google'
  googleId: { type: String, default: null },
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String },
  password: { type: String }, // hashed for local provider
  refreshToken: { type: String, default: null }, // stored refresh token
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);
