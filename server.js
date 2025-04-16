const express = require('express');
const session = require('express-session');
const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const purchaseRoutes = require("./routes/purchaseRoutes");
const path = require('path');
require('dotenv').config();
const compression = require('compression');
const helmet = require('helmet');

const app = express();

// Helmet with CSP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://checkout.razorpay.com"],
            frameSrc: ["'self'", "https://api.razorpay.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'"],
            connectSrc: ["'self'", "https://*.herokuapp.com", "https://api.razorpay.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    }
}));

// HTTPS redirect for production
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
        next();
    }
});

app.use(compression());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
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

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});