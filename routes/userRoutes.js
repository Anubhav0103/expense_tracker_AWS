const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Get premium status
router.get('/api/user/premium-status', (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const query = 'SELECT isPremium FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error checking premium status:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }


    const isPremium = Boolean(results[0].isPremium);
    console.log('Premium status for', email, ':', isPremium); // Debug log

    res.json({ 
      success: true, 
      isPremium: isPremium 
    });
  });
});

module.exports = router; 