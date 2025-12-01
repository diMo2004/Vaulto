import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    store: { type: String },
    code: { type: String },
    category: { type: String },
    discount: { type: String },
    expiry: { type: Date,
      required: false,
     },

    rawText: { type: String },     // full OCR text
    image: { type: String },       // base64 or image URL

    giftedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isGifted: { type: Boolean, default: false },
    giftedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    isTradable: { type: Boolean, default: false },
    tradeNotes: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", CouponSchema);
