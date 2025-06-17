const db = require('../models/db');
const Razorpay = require('razorpay');
const dotenv = require('dotenv');

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createOrder = async (req, res) => {
  try {
    const options = {
      amount: 50000,
      currency: 'INR',
      receipt: 'receipt_' + Date.now()
    };

    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
};

const updatePremiumStatus = async (req, res) => {
  const { email, orderId, paymentId } = req.body;
  
  try {
    const query = 'UPDATE users SET isPremium = 1 WHERE email = ?';
    db.query(query, [email], (err, result) => {
      if (err) {
        console.error('Error updating premium status:', err);
        return res.status(500).json({ message: 'Error updating premium status' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'Premium status updated successfully' });
    });
  } catch (error) {
    console.error('Error updating premium status:', error);
    res.status(500).json({ message: 'Error updating premium status' });
  }
};

const getPremiumStatus = (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const query = 'SELECT isPremium FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Get premium status error:', err.message);
      return res.status(500).json({ message: 'Server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ isPremium: results[0].isPremium });
  });
};

module.exports = {
  createOrder,
  updatePremiumStatus,
  getPremiumStatus
}; 