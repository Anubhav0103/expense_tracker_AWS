const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const path = require('path');

router.get('/api/leaderboard', leaderboardController.getLeaderboard);

router.get('/leaderboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'leaderboard.html'));
});

module.exports = router;