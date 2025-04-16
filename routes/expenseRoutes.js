const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

// ✅ Middleware to check session and ensure user is logged in
const authenticate = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = { id: req.session.userId }; // ✅ Attach userId to req.user
    next();
};

// ✅ Get all expenses of the logged-in user
router.get('/getAll', authenticate, expenseController.getExpenses);

// ✅ Add an expense
router.post('/add', authenticate, expenseController.addExpense);

// ✅ Fetch leaderboard (Premium users only)
router.get('/leaderboard', authenticate, expenseController.getLeaderboard);

// ✅ Delete an expense (NEWLY ADDED ROUTE)
router.delete('/delete/:id', authenticate, expenseController.deleteExpense);

// ✅ Get daily expenses
router.get('/daily', authenticate, expenseController.getDailyExpenses);

// ✅ Get weekly expenses
router.get('/weekly', authenticate, expenseController.getWeeklyExpenses);

// ✅ Get monthly expenses
router.get('/monthly', authenticate, expenseController.getMonthlyExpenses);

module.exports = router;