const db = require('../models/db');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');


const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});
const BUCKET = process.env.AWS_S3_BUCKET;


async function uploadExpensesToS3(email) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM user_expense WHERE email = ?', [email], (err, results) => {
      if (err) return reject(err);
      let lines = ['created_at | description | category | amount | email'];
      results.forEach(exp => {
        lines.push(`${exp.created_at} | ${exp.description} | ${exp.category} | ${Number(exp.amount).toFixed(2)} | ${exp.email}`);
      });
      const data = lines.join('\n');
      const S3_KEY = `expenses-${email}.txt`;
      s3.putObject({
        Bucket: BUCKET,
        Key: S3_KEY,
        Body: data,
        ContentType: 'text/plain'
      }, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });
  });
}


function downloadExpensesFromS3(req, res) {
  const email = req.query.email;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });
  const S3_KEY = `expenses-${email}.txt`;
  s3.getObject({ Bucket: BUCKET, Key: S3_KEY }, (err, data) => {
    if (err) return res.status(404).json({ success: false, message: 'No file found in S3' });
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="expenses-${email}.txt"`);
    res.send(data.Body);
  });
}


function clearExpensesInS3(req, res) {
  const email = req.query.email;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });
  const S3_KEY = `expenses-${email}.txt`;
  s3.deleteObject({ Bucket: BUCKET, Key: S3_KEY }, (err, data) => {
    if (err) return res.status(500).json({ success: false, message: 'Failed to clear S3 file' });
    res.json({ success: true, message: 'S3 file cleared' });
  });
}

const addExpense = (req, res) => {
  const { amount, description, category, email } = req.body;
  const created_at = new Date().toISOString().split('T')[0];

 
  db.beginTransaction(err => {
    if (err) {
      // console.error('Error starting transaction:', err);
      return res.status(500).json({ message: 'Error adding expense' });
    }

    
    const insertExpenseQuery = 'INSERT INTO user_expense (amount, description, category, created_at, email) VALUES (?, ?, ?, ?, ?)';
    db.query(insertExpenseQuery, [amount, description, category, created_at, email], (err, insertResult) => {
      if (err) {
        return db.rollback(() => {
          // console.error('Error adding expense:', err);
          res.status(500).json({ message: 'Error adding expense' });
        });
      }

      
      const updateUserQuery = 'UPDATE users u SET u.total_expense = (SELECT IFNULL(SUM(amount), 0) FROM user_expense WHERE email = u.email) WHERE u.email = ?';
      db.query(updateUserQuery, [email], (err, updateResult) => {
        if (err) {
          return db.rollback(() => {
            // console.error('Error updating user total expense:', err);
            res.status(500).json({ message: 'Error updating total expense' });
          });
        }

       
        db.commit(async err => {
          if (err) {
            return db.rollback(() => {
              // console.error('Error committing transaction:', err);
              res.status(500).json({ message: 'Error completing transaction' });
            });
          }
          
          try {
            await uploadExpensesToS3(email);
          } catch (e) {
            
            // console.error('S3 upload error:', e);
          }
          res.status(201).json({ message: 'Expense added successfully', id: insertResult.insertId });
        });
      });
    });
  });
};


const getExpenses = (req, res) => {
  const { email } = req.query;
  const query = 'SELECT * FROM user_expense WHERE email = ? ORDER BY created_at DESC';
  
  db.query(query, [email], (err, results) => {
    if (err) {
      // console.error('Error getting expenses:', err);
      return res.status(500).json({ message: 'Error getting expenses' });
    }
    res.json(results);
  });
};


const getDailyExpenses = (req, res) => {
  const { email } = req.query;
  const today = new Date().toISOString().split('T')[0];
  const query = 'SELECT * FROM user_expense WHERE email = ? AND DATE(created_at) = ? ORDER BY created_at DESC';
  
  db.query(query, [email, today], (err, results) => {
    if (err) {
      // console.error('Error getting daily expenses:', err);
      return res.status(500).json({ message: 'Error getting daily expenses' });
    }
    res.json(results);
  });
};


const getWeeklyExpenses = (req, res) => {
  const { email } = req.query;
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(today.setDate(today.getDate() + 6));
  
  const query = 'SELECT * FROM user_expense WHERE email = ? AND DATE(created_at) BETWEEN ? AND ? ORDER BY created_at DESC';
  
  db.query(query, [email, startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0]], (err, results) => {
    if (err) {
      // console.error('Error getting weekly expenses:', err);
      return res.status(500).json({ message: 'Error getting weekly expenses' });
    }
    res.json(results);
  });
};


const getMonthlyExpenses = (req, res) => {
  const { email } = req.query;
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const query = 'SELECT * FROM user_expense WHERE email = ? AND DATE(created_at) BETWEEN ? AND ? ORDER BY created_at DESC';
  
  db.query(query, [email, startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0]], (err, results) => {
    if (err) {
      // console.error('Error getting monthly expenses:', err);
      return res.status(500).json({ message: 'Error getting monthly expenses' });
    }
    res.json(results);
  });
};


const getYearlyExpenses = (req, res) => {
  const { email } = req.query;
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const endOfYear = new Date(today.getFullYear(), 11, 31);
  
  const query = 'SELECT * FROM user_expense WHERE email = ? AND DATE(created_at) BETWEEN ? AND ? ORDER BY created_at DESC';
  
  db.query(query, [email, startOfYear.toISOString().split('T')[0], endOfYear.toISOString().split('T')[0]], (err, results) => {
    if (err) {
      // console.error('Error getting yearly expenses:', err);
      return res.status(500).json({ message: 'Error getting yearly expenses' });
    }
    res.json(results);
  });
};


const updateExpense = (req, res) => {
  const { id, amount, description, category } = req.body;
  
  db.beginTransaction(err => {
    if (err) {
      // console.error('Error starting transaction:', err);
      return res.status(500).json({ message: 'Error updating expense' });
    }

    const getOldExpenseQuery = 'SELECT email FROM user_expense WHERE id = ?';
    db.query(getOldExpenseQuery, [id], (err, results) => {
      if (err) {
        return db.rollback(() => {
          //console.error('Error getting old expense:', err);
          res.status(500).json({ message: 'Error updating expense' });
        });
      }

      if (results.length === 0) {
        return db.rollback(() => {
          res.status(404).json({ message: 'Expense not found' });
        });
      }

      const email = results[0].email;


      const updateExpenseQuery = 'UPDATE user_expense SET amount = ?, description = ?, category = ?, modified_at = CURRENT_TIMESTAMP WHERE id = ?';
      db.query(updateExpenseQuery, [amount, description, category, id], (err, updateResult) => {
        if (err) {
          return db.rollback(() => {
            // console.error('Error updating expense:', err);
            res.status(500).json({ message: 'Error updating expense' });
          });
        }

        
        const updateUserQuery = 'UPDATE users u SET u.total_expense = (SELECT IFNULL(SUM(amount), 0) FROM user_expense WHERE email = u.email) WHERE u.email = ?';
        db.query(updateUserQuery, [email], (err, updateUserResult) => {
          if (err) {
            return db.rollback(() => {
              // console.error('Error updating user total expense:', err);
              res.status(500).json({ message: 'Error updating total expense' });
            });
          }

          
          db.commit(async err => {
            if (err) {
              return db.rollback(() => {
                // console.error('Error committing transaction:', err);
                res.status(500).json({ message: 'Error updating expense' });
              });
            }
            
            try {
              await uploadExpensesToS3(email);
            } catch (e) {
              
              // console.error('S3 upload error:', e);
            }
            res.json({ message: 'Expense updated successfully' });
          });
        });
      });
    });
  });
};


const deleteExpense = (req, res) => {
  const { id } = req.params;

  
  db.beginTransaction(err => {
    if (err) {
      // console.error('Error starting transaction:', err);
      return res.status(500).json({ message: 'Error deleting expense' });
    }

   
    const getExpenseQuery = 'SELECT email FROM user_expense WHERE id = ?';
    db.query(getExpenseQuery, [id], (err, results) => {
      if (err) {
        return db.rollback(() => {
          // console.error('Error getting expense:', err);
          res.status(500).json({ message: 'Error deleting expense' });
        });
      }

      if (results.length === 0) {
        return db.rollback(() => {
          res.status(404).json({ message: 'Expense not found' });
        });
      }

      const email = results[0].email;

     
      const deleteQuery = 'DELETE FROM user_expense WHERE id = ?';
      db.query(deleteQuery, [id], (err, deleteResult) => {
        if (err) {
          return db.rollback(() => {
            // console.error('Error deleting expense:', err);
            res.status(500).json({ message: 'Error deleting expense' });
          });
        }

        
        const updateUserQuery = 'UPDATE users u SET u.total_expense = (SELECT IFNULL(SUM(amount), 0) FROM user_expense WHERE email = u.email) WHERE u.email = ?';
        db.query(updateUserQuery, [email], (err, updateUserResult) => {
          if (err) {
            return db.rollback(() => {
              // console.error('Error updating user total expense:', err);
              res.status(500).json({ message: 'Error updating total expense' });
            });
          }

          
          db.commit(async err => {
            if (err) {
              return db.rollback(() => {
                // console.error('Error committing transaction:', err);
                res.status(500).json({ message: 'Error completing transaction' });
              });
            }
            
            try {
              await uploadExpensesToS3(email);
            } catch (e) {

              // console.error('S3 upload error:', e);
            }
            res.json({ message: 'Expense deleted successfully' });
          });
        });
      });
    });
  });
};


// module.exports.downloadExpensesFromS3 = downloadExpensesFromS3;
// module.exports.clearExpensesInS3 = clearExpensesInS3;

module.exports = {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getDailyExpenses,
  getWeeklyExpenses,
  getMonthlyExpenses,
  getYearlyExpenses,
  downloadExpensesFromS3,
  clearExpensesInS3
};