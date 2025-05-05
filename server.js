const express = require('express');
const session = require('express-session');
const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const purchaseRoutes = require("./routes/purchaseRoutes");
const path = require('path');
require('dotenv').config();
// const compression = require('compression'); // Removed for local
const helmet = require('helmet');

const app = express();

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Simplified Helmet (optional, can keep basic security)
app.use(helmet()); // Removed strict CSP for simplicity
// If you want to keep CSP but make it less strict, use:
// app.use(helmet({
//     contentSecurityPolicy: {
//         directives: {
//             defaultSrc: ["'self'"],
//             scriptSrc: ["'self'", "https://checkout.razorpay.com"],
//             frameSrc: ["'self'", "https://api.razorpay.com"],
//             styleSrc: ["'self'", "'unsafe-inline'"],
//             imgSrc: ["'self'"],
//             connectSrc: ["'self'", "https://api.razorpay.com"],
//             objectSrc: ["'none'"],
//         }
//     }
// }));

// Removed compression
// app.use(compression());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Changed to false for local development (no HTTPS)
        httpOnly: true
    }
}));

app.use('/user', userRoutes);
app.use('/expense', expenseRoutes);
app.use('/purchase', purchaseRoutes);

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/password/resetpassword/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'resetPassword.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});