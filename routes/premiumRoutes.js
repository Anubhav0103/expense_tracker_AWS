const express = require('express');
const router = express.Router();
const premiumController = require('../controllers/premiumController');

router.post('/api/premium/create-order', premiumController.createOrder);
router.post('/api/premium/update-status', premiumController.updatePremiumStatus);
router.get('/api/premium/status', premiumController.getPremiumStatus);

module.exports = router; 