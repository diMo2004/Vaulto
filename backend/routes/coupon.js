router.post("/add", async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/all", async (req, res) => {
  const coupons = await Coupon.find({});
  res.json(coupons);
});

export default router;