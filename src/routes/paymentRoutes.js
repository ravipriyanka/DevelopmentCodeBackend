const express = require("express");
const router = express.Router();
const razorpay = require("../config/razorpay");

router.post("/create-order", async (req, res) => {
  try {
    const amount = req.body.amount;

    const options = {
      amount: amount * 100, // Razorpay needs paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Order Error:", error);
    res.json({
      success: false,
      message: "Order creation failed",
    });
  }
});

const crypto = require("crypto");

router.post("/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    res.json({ success: true, message: "Payment Verified" });
  } else {
    res.json({ success: false, message: "Invalid Signature" });
  }
});



module.exports = router;
