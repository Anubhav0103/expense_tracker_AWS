const pool = require('../config/db');
const bcrypt = require('bcrypt');

exports.signupUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // ✅ Check if user already exists
        const [existingUser] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

        if (existingUser.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // ✅ Hash password before storing it
        const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10

        // ✅ Insert new user with hashed password
        await pool.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPassword]);

        return res.status(201).json({ message: "User signed up successfully" });

    } catch (error) {
        console.error("❌ Error in signup:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message }); // Include error message
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [user] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

        if (user.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const passwordMatch = await bcrypt.compare(password, user[0].password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Unauthorized: Incorrect password" });
        }

        // ✅ Store user ID in session
        req.session.userId = user[0].id;

        return res.status(200).json({ message: "Login successful", redirect: "/expense.html" });

    } catch (error) {
        console.error("❌ Error in login:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message }); // Include error message
    }
};