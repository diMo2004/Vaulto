// backend/routes/coupon.js
import express from "express";
import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /coupons/add
 * Called from CameraScanner / UploadScanner / AddCoupon form
 */
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const {
      store,
      code,
      expiry,
      discount,
      category,
      rawText,
      image,
      giftedFrom,
    } = req.body;

    console.log("HIT /coupons/add with body:", req.body);
    console.log("Current user from authMiddleware:", req.user);

    if (!store || !discount) {
      return res
        .status(400)
        .json({ message: "Store and discount are required" });
    }

    let expiryDate = null;
    if (expiry) {
      const d = new Date(expiry);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ message: "Invalid expiry date" });
      }
      expiryDate = d;
    }

    const coupon = await Coupon.create({
      owner: req.user.id, // owner = logged-in user
      store,
      code,
      expiry: expiryDate,
      discount,
      category,
      rawText,
      image,
      giftedFrom: giftedFrom || null,
    });

    console.log("Coupon created in Mongo:", coupon);

    return res.status(201).json({
      message: "Coupon created",
      coupon,
    });
  } catch (err) {
    console.error("add coupon error:", err);
    return res
      .status(500)
      .json({ message: "Server error while saving coupon" });
  }
});

/**
 * GET /coupons/all
 * All coupons for the logged-in user
 * Use this for Dashboard, Search, etc.
 */
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const coupons = await Coupon.find({ owner: req.user.id }).sort({
      createdAt: -1,
    });

    return res.json(coupons);
  } catch (err) {
    console.error("fetch all coupons error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /coupons/tradeable
 * Coupons owned by the user that are marked as tradable
 */
router.get("/tradeable", authMiddleware, async (req, res) => {
  try {
    const coupons = await Coupon.find({
      owner: req.user.id,
      isTradable: true, // only those explicitly marked as tradable
      // do NOT filter isGifted strictly by false, because undefined would be excluded
      $or: [{ isGifted: { $exists: false } }, { isGifted: false }],
    }).sort({ createdAt: -1 });

    return res.json(coupons);
  } catch (err) {
    console.error("fetch tradeable error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /coupons/gift
 * Gift a coupon to another user by email
 */
router.post("/gift", authMiddleware, async (req, res) => {
  try {
    const { couponId, recipientEmail } = req.body;

    if (!couponId || !recipientEmail) {
      return res
        .status(400)
        .json({ message: "couponId and recipientEmail are required" });
    }

    const coupon = await Coupon.findOne({
      _id: couponId,
      owner: req.user.id,
    });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const recipient = await User.findOne({
      email: recipientEmail.toLowerCase(),
    });
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // create a copy for the recipient
    const giftedCoupon = await Coupon.create({
      owner: recipient._id,
      store: coupon.store,
      code: coupon.code,
      expiry: coupon.expiry,
      discount: coupon.discount,
      category: coupon.category,
      rawText: coupon.rawText,
      image: coupon.image,
      giftedFrom: req.user.id,
      giftedTo: recipient._id,
    });

    // mark original as gifted
    coupon.isGifted = true;
    await coupon.save();

    return res
      .status(201)
      .json({ message: "Coupon gifted", coupon: giftedCoupon });
  } catch (err) {
    console.error("gift error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /coupons/:id/tradable
 * Toggle tradable status on/off
 */
router.post("/:id/tradable", authMiddleware, async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    coupon.isTradable = !coupon.isTradable;
    coupon.tradeNotes = req.body.tradeNotes || coupon.tradeNotes;
    await coupon.save();

    return res.json({ message: "Updated", coupon });
  } catch (err) {
    console.error("tradable error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
