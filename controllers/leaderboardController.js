const db = require('../models/db');

const getLeaderboard = (req, res) => {
  const query = `
    SELECT u.name, COALESCE(SUM(ue.amount), 0) as total_expenses
    FROM users u
    LEFT JOIN user_expense ue ON u.email = ue.email
    GROUP BY u.email, u.name
    ORDER BY total_expenses DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching leaderboard:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.json(results);
  });
};

module.exports = { getLeaderboard }; 