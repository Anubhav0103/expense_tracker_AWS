const express = require('express');
const router = express.Router();
const path = require('path');
const authController = require('../controllers/authController');


router.post('/api/user/login', authController.login);
router.post('/api/user/signup', authController.signup);
router.post('/api/password/forgot', authController.forgotPassword);
router.post('/api/password/reset', authController.resetPassword);


router.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'signup.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
});

router.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'forgot-password.html'));
});

router.get('/reset-password/:token', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'reset-password.html'));
});

module.exports = router;