const db = require('../models/db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const Mailjet = require('node-mailjet');
const dotenv = require('dotenv');

dotenv.config();

const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY,
  apiSecret: process.env.MAILJET_API_SECRET
});

const saltRounds = 10;

const login = (req, res) => {
  const { email, password } = req.body;
  // console.log('Login attempt for email:', email);
  // console.log('Provided password:', password);
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Login error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    if (results.length === 0) {
      console.log('No user found with email:', email);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // console.log('User found, stored hash:', results[0].password);
    // console.log('Attempting to compare with provided password');
    
    
    bcrypt.compare(password, results[0].password, (err, match) => {
      if (err) {
        console.error('Bcrypt error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      if (match) {
        console.log('Password match successful');
        res.status(200).json({ 
          success: true,
          message: 'Login successful',
          email: email,
          isPremium: results[0].isPremium 
        });
      } else {
        console.log('Password match failed');
        res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    });
  });
};

const signup = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const query = `INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, NOW())`;
    
    db.query(query, [name, email, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        // console.error('Signup error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      res.status(201).json({ success: true, message: 'Signup successful' });
    });
  } catch (error) {
    // console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required' });
  }

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      // console.error('DB error:', err.message);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(200).json({ success: true, message: 'If email exists, reset link sent' });
    }

    const token = uuidv4();
    const expires = new Date(Date.now() + 3600000);
    const resetQuery = 'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)';
    
    db.query(resetQuery, [email, token, expires], (err) => {
      if (err) {
        // console.error('Insert error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      const resetLink = `http://localhost:${process.env.PORT || 5000}/reset-password/${token}`;
      // console.log('Attempting to send email with reset link:', resetLink);
      
      const request = mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [{
          From: { 
            Email: process.env.MAILJET_FROM_EMAIL,
            Name: process.env.MAILJET_FROM_NAME
          },
          To: [{ Email: email }],
          Subject: 'Password Reset',
          TextPart: `Reset your password: ${resetLink}`
        }]
      });

      request
        .then((result) => {
          // console.log('Email sent successfully:', result.body);
          res.status(200).json({ success: true, message: 'Reset link has been sent to your email' });
        })
        .catch((err) => {
          console.error('Mailjet error details:', {
            code: err.code,
            message: err.message,
            config: {
              url: err.config?.url,
              method: err.config?.method,
              auth: err.config?.auth ? 'Credentials present' : 'No credentials'
            }
          });
          
          res.status(200).json({ 
            success: true, 
            message: 'Reset link has been generated. Please check your email.' 
          });
          
          // console.log('Development mode - Reset link:', resetLink);
        });
    });
  });
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  // console.log('Reset password attempt with token:', token);
  // console.log('Reset password attempt with password:', password);
  
  if (!token || !password) {
    // console.log('Missing token or password');
    return res.status(400).json({ success: false, message: 'Token and password required' });
  }

  try {
    const tokenQuery = 'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()';
    // console.log('Executing token query:', tokenQuery);
    // console.log('Token value being queried:', token);
    
    db.query(tokenQuery, [token], (err, tokenResults) => {
      if (err) {
        // console.error('Token query error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      if (tokenResults.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or expired token' });
      }

      const email = tokenResults[0].email;
      // console.log('Found valid token for email:', email);

      const userQuery = 'SELECT * FROM users WHERE email = ?';
      // console.log('Executing user query:', userQuery);
      db.query(userQuery, [email], (err, userResults) => {
        if (err) {
          // console.error('User query error:', err);
          return res.status(500).json({ success: false, message: 'Server error' });
        }

        // console.log('User query results:', userResults);
        if (userResults.length === 0) {
          // console.error('User not found for email:', email);
          return res.status(400).json({ success: false, message: 'User not found' });
        }

        const hashedPassword = bcrypt.hashSync(password, saltRounds);
        // console.log('Generated new hash:', hashedPassword);

        const updateQuery = 'UPDATE users SET password = ? WHERE email = ?';
        // console.log('Executing update query:', updateQuery);
        db.query(updateQuery, [hashedPassword, email], (err, updateResult) => {
          if (err) {
            // console.error('Update error:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          // console.log('Update result:', updateResult);
          if (updateResult.affectedRows === 0) {
            // console.error('No rows updated');
            return res.status(500).json({ success: false, message: 'Failed to update password' });
          }

          console.log('Password updated successfully');

          const verifyQuery = 'SELECT password FROM users WHERE email = ?';
          // console.log('Executing verify query:', verifyQuery);
          db.query(verifyQuery, [email], (err, verifyResults) => {
            if (err) {
              // console.error('Verify error:', err);
              return res.status(500).json({ success: false, message: 'Server error' });
            }

            // console.log('Verify results:', verifyResults);
            const storedHash = verifyResults[0].password;
            // console.log('Stored hash after update:', storedHash);

            const testMatch = bcrypt.compareSync(password, storedHash);
            // console.log('Hash test result:', testMatch);

            if (!testMatch) {
              // console.error('Hash verification failed');
              return res.status(500).json({ success: false, message: 'Password update failed' });
            }

            const deleteQuery = 'DELETE FROM password_resets WHERE token = ?';
            // console.log('Executing delete query:', deleteQuery);
            db.query(deleteQuery, [token], (err) => {
              if (err) {
                // console.error('Delete error:', err);
                return res.status(500).json({ success: false, message: 'Server error' });
              }

              // console.log('Reset token deleted');
              return res.status(200).json({ success: true, message: 'Password reset successful' });
            });
          });
        });
      });
    });
  } catch (error) {
    // console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { signup, login, forgotPassword, resetPassword };