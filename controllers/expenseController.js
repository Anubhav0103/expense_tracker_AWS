const db = require('../config/db');

exports.getExpenses = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [totalExpenses] = await db.query(
            'SELECT COUNT(*) AS total FROM expenses WHERE user_id = ?',
            [userId]
        );
        const total = totalExpenses[0].total;
        const totalPages = Math.ceil(total / limit);

        const [expenses] = await db.query(
            `SELECT id, amount, description, category, 
                    DATE_FORMAT(created_at, "%Y-%m-%d") AS date, 
                    DATE_FORMAT(created_at, "%H:%i:%s") AS time 
             FROM expenses 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        res.status(200).json({
            expenses,
            page,
            totalPages,
            total,
            limit
        });
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.addExpense = async (req, res) => {
    try {
        const { amount, description, category } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        await db.query(
            'INSERT INTO expenses (user_id, amount, description, category) VALUES (?, ?, ?, ?)',
            [userId, amount, description, category]
        );

        await db.query(
            'UPDATE users SET total_expense = total_expense + ? WHERE id = ?',
            [amount, userId]
        );

        res.status(201).json({ message: "Expense added successfully" });
    } catch (error) {
        console.error("Error adding expense:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized: No user found" });
        }

        const expenseId = req.params.id;
        const userId = req.user.id;

        const [expense] = await db.query("SELECT amount FROM expenses WHERE id = ? AND user_id = ?", [expenseId, userId]);
        if (!expense.length) {
            return res.status(404).json({ message: "Expense not found" });
        }

        const amountToSubtract = expense[0].amount;

        await db.query("DELETE FROM expenses WHERE id = ? AND user_id = ?", [expenseId, userId]);

        await db.query("UPDATE users SET total_expense = total_expense - ? WHERE id = ?", [amountToSubtract, userId]);

        res.json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).json({ message: "Server error while deleting expense", error });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const [leaderboard] = await db.query(
            `SELECT name, total_expense 
             FROM users 
             ORDER BY total_expense DESC, id ASC`
        );

        res.status(200).json(leaderboard);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

async function getAggregatedExpenses(req, res, aggregationType) {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        let orderByClause;
        let selectDateFormat;
        let whereClause = '';

        switch (aggregationType) {
            case 'daily':
                orderByClause = 'created_at DESC';
                selectDateFormat = 'DATE_FORMAT(created_at, "%Y-%m-%d") AS date';
                whereClause = 'AND DATE(created_at) = CURDATE()';
                break;
            case 'weekly':
                orderByClause = 'created_at DESC';
                selectDateFormat = 'DATE_FORMAT(created_at, "%Y-%m-%d") AS date';
                whereClause = 'AND created_at >= DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) - 2 DAY) AND created_at < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) - 2 DAY), INTERVAL 7 DAY)';
                break;
            case 'monthly':
                orderByClause = 'created_at DESC';
                selectDateFormat = 'DATE_FORMAT(created_at, "%Y-%m-%d") AS date';
                whereClause = 'AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
                break;
            default:
                return res.status(400).json({ message: "Invalid aggregation type" });
        }

        const [totalAggregated] = await db.query(
            `SELECT COUNT(*) AS total FROM expenses WHERE user_id = ? ${whereClause}`,
            [userId]
        );

        const total = totalAggregated[0].total;
        const totalPages = Math.ceil(total / limit);

        const [aggregatedExpenses] = await db.query(
            `SELECT id, amount, description, category, 
                    ${selectDateFormat}, 
                    DATE_FORMAT(created_at, "%H:%i:%s") AS time
             FROM expenses 
             WHERE user_id = ? ${whereClause}
             ORDER BY ${orderByClause}
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        res.status(200).json({
            expenses: aggregatedExpenses,
            page,
            totalPages,
            total,
            limit
        });
    } catch (error) {
        console.error(`Error fetching ${aggregationType} expenses:`, error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

exports.getDailyExpenses = async (req, res) => {
    await getAggregatedExpenses(req, res, 'daily');
};

exports.getWeeklyExpenses = async (req, res) => {
    await getAggregatedExpenses(req, res, 'weekly');
};

exports.getMonthlyExpenses = async (req, res) => {
    await getAggregatedExpenses(req, res, 'monthly');
};