const express = require('express');
const router = express.Router();
const path = require('path');
const expenseController = require('../controllers/expenseController');

router.post('/api/expense/add', expenseController.addExpense);
router.get('/api/expense/get', expenseController.getExpenses);
router.put('/api/expense/update/:id', expenseController.updateExpense);
router.delete('/api/expense/delete/:id', expenseController.deleteExpense);


router.get('/api/expenses/daily', expenseController.getDailyExpenses);
router.get('/api/expenses/weekly', expenseController.getWeeklyExpenses);
router.get('/api/expenses/monthly', expenseController.getMonthlyExpenses);
router.get('/api/expenses/yearly', expenseController.getYearlyExpenses);

// S3 download and clear endpoints
router.get('/api/expense/download', expenseController.downloadExpensesFromS3);
router.delete('/api/expense/clear', expenseController.clearExpensesInS3);

router.get('/expense', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'expense-tracker.html'));
  });

module.exports = router;