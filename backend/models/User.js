import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true },   // "local" or "google"

    // Local auth
    email: { type: String, unique: true, sparse: true },
    password: { type: String },

    // Extra Profile Fields
    name: { type: String },
    username: { type: String },
    dob: { type: String },
    gender: { type: String },

    // Google login
    googleId: { type: String },
    avatar: { type: String },

    // Refresh token for JWT
    refreshToken: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
