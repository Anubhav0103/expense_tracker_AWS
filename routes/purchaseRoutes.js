const express = require("express");
const Razorpay = require("razorpay");
const db = require("../config/db");
const crypto = require("crypto");
require('dotenv').config();  // ✅ Load environment variables

const router = express.Router();
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ✅ Create Razorpay Order & Store in DB
router.post("/membership", async (req, res) => {
    console.log("✅ Received request at /purchase/membership");

    const userId = req.session.userId;
    if (!userId) {
        console.error("❌ User ID not found!");
        return res.status(400).json({ message: "User ID not found. Please log in again." });
    }

    console.log("✅ User ID:", userId);

    const options = {
        amount: 3000,
        currency: "INR",
        receipt: `receipt_${Date.now()}`
    };

    try {
        const order = await razorpay.orders.create(options);
        console.log("✅ Razorpay order created:", order);

        await db.query("INSERT INTO orders (orderId, userId, status) VALUES (?, ?, ?)", 
            [order.id, userId, "PENDING"]);

        console.log("✅ Order stored in database!");
        res.json({ orderId: order.id, key_id: process.env.RAZORPAY_KEY_ID });

    } catch (error) {
        console.error("❌ Error creating order:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.toString() });
    }
});

// ✅ Verify Payment & Update Status
router.post("/verify", async (req, res) => {
    console.log("✅ Received request at /purchase/verify");

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(400).json({ message: "User ID not found. Please log in again." });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generated_signature = crypto.createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (generated_signature === razorpay_signature) {
        try {
            await Promise.all([
                db.query("UPDATE orders SET status = 'SUCCESSFUL' WHERE orderId = ?", [razorpay_order_id]),
                db.query("UPDATE users SET isPremium = 1 WHERE id = ?", [userId]) // ✅ Fix: isPremium should be 1/0 (not true/false)
            ]);
            return res.json({ success: true, message: "Transaction Successful!" });
        } catch (error) {
            console.error("❌ Error updating database:", error);
            return res.status(500).json({ success: false, message: "Database update failed." });
        }
    } else {
        await db.query("UPDATE orders SET status = 'FAILED' WHERE orderId = ?", [razorpay_order_id]);
        return res.status(400).json({ success: false, message: "Transaction Failed" });
    }
});

module.exports = router;