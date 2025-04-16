const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const pool = require('../config/db'); // ✅ Import the database connection pool
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();  // ✅ Load environment variables
const mailjet = require('node-mailjet')
    .apiConnect(
        process.env.MAILJET_PUBLIC_KEY,
        process.env.MAILJET_PRIVATE_KEY
    );;

// ✅ Add this route to get the user's session
router.get('/session', (req, res) => {
    if (req.session.userId) {
        res.json({ userId: req.session.userId });
    } else {
        res.status(401).json({ userId: null, message: "Not logged in" });
    }
});

router.get('/details', (req, res) => {
    // Assuming you have the user's ID in the session
    const userId = req.session.userId;

    if (!userId) {
        console.log("❌ No user ID found in session.");  // Added log
        return res.status(401).json({ message: "Unauthorized: No user ID found in session" });
    }

    // Fetch the user's details from the database
    pool.query('SELECT isPremium FROM users WHERE id = ?', [userId])
        .then(([rows]) => {
            if (rows.length === 0) {
                console.log(`❌ User with ID ${userId} not found in database.`);  // Added log
                return res.status(404).json({ message: "User not found" });
            }
        // Send the user's details (including isPremium) in the response
        console.log(`✅ User details fetched successfully for user ID ${userId}.`);  // Added log
        res.json(rows[0]); // { isPremium: 0 or 1 }
    })
    .catch(err => {
        console.error("❌ Error fetching user details:", err);  // Improved error log
        res.status(500).json({ message: "Failed to fetch user details", error: error.message }); // Include error message
    });
});

// ✅ Add this route for handling forgot password requests
router.post('/forgotpassword', async (req, res) => {
    const { email } = req.body;
    const resetPasswordId = uuidv4(); // Generate a unique ID
    const resetPasswordURL = `http://localhost:5000/password/resetpassword/${resetPasswordId}`; // Create a URL

    try {
        // Check if user exists
        const [users] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const userId = users[0].id; // extract userID

        // Create email request
        const request = mailjet
            .post("send", { 'version': 'v3.1' })
            .request({
                "Messages": [
                    {
                        "From": {
                            "Email": "anubhav06cd@gmail.com", // Replace with your verified sender email
                            "Name": "Expense Tracker App"
                        },
                        "To": [{ "Email": email }],
                        "Subject": "Password Reset Request",
                        "HTMLPart": `<p>You requested a password reset. Click the following link to reset your password:</p><a href="${resetPasswordURL}">${resetPasswordURL}</a>`
                    }
                ]
            })
        // Send the email
        const result = await request;

        await pool.query("INSERT INTO resetpasswordrequests (id, userId, isActive) VALUES (?, ?, ?)",
            [resetPasswordId, userId, true]);

        console.log("✅ Email sent successfully using Mailjet.");
        res.status(200).json({ message: "Password reset link sent to your email." });

    } catch (error) {
        console.error("❌ Error sending password reset email using Mailjet:", error);
        res.status(500).json({ message: "Error sending password reset email", error: error.message });
    }
});
//This route is a GET Request
router.get('/password/resetpassword/:id', async (req, res) => {
    const resetPasswordId = req.params.id;

    try {
        // Check if the request exists and is active
        const [requests] = await pool.query("SELECT * FROM resetpasswordrequests WHERE id = ? AND isActive = ?", [resetPasswordId, true]);

        if (requests.length === 0) {
            return res.status(404).send('Invalid or expired reset password link.');
        }

        // If it exists and is active, send the reset password form
        res.send(`
            <form id="resetPasswordForm" action="/user/password/updatepassword/${resetPasswordId}" method="POST">
                <label for="newPassword">New Password:</label>
                <input type="password" id="newPassword" name="newPassword" required>
                <button type="submit">Reset Password</button>
            </form>
        `);
    } catch (error) {
        console.error("❌ Error validating reset password link:", error);
        res.status(500).send('Internal Server Error');
    }
});
//This route is a POST request, so we must declare that here as well.
router.post('/password/updatepassword/:id', async (req, res) => {
    const resetPasswordId = req.params.id;
    const { newPassword } = req.body;

    try {
        // Start a transaction to ensure atomicity
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Check if the request exists and is active
            const [requests] = await connection.query("SELECT userId FROM resetpasswordrequests WHERE id = ? AND isActive = ?", [resetPasswordId, true]);

            if (requests.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ message: 'Invalid or expired reset password link.' });
            }

            const userId = requests[0].userId;

            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update the password in the users table
            await connection.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

            // Deactivate the reset password request
            await connection.query("UPDATE resetpasswordrequests SET isActive = ? WHERE id = ?", [false, resetPasswordId]);

            // Commit the transaction
            await connection.commit();
            connection.release();

            console.log("✅ Password updated successfully.");
            res.status(200).json({ message: 'Password updated successfully!' });

        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error("❌ Error updating password:", error);
            return res.status(500).json({ message: 'Error updating password.', error: error.message });
        }
    } catch (error) {
        console.error("❌ Error starting transaction:", error);
        return res.status(500).json({ message: 'Error starting transaction.', error: error.message });
    }
});

router.post("/signup", userController.signupUser);
router.post("/login", userController.loginUser);

module.exports = router;