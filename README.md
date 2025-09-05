Expense Tracker AWS
A full-stack expense tracker application designed to help users manage their finances effectively. It allows users to add, view, edit, and delete their expenses, with additional premium features for enhanced functionality. The application is built with a Node.js backend, uses MySQL for data storage, and is deployed on AWS.
Table of Contents
Features
Tech Stack
File Structure
Getting Started
Prerequisites
Installation
Usage
API Endpoints

Features
User Authentication: Secure user registration and login functionality.
Password Management: Users can reset their forgotten passwords via email.
CRUD Operations for Expenses:
Create: Add new expenses with amount, description, and category.
Read: View a comprehensive list of all personal expenses.
Update: Edit existing expense details through a modal form.
Delete: Remove expenses that are no longer needed.
Expense Summaries: View expenses aggregated on a daily, weekly, monthly, and yearly basis.
Premium Features:
Leaderboard: See a leaderboard of top users based on total expenses.
Expense Reports: Download a file containing all your expense records.
Payment Integration: A secure payment gateway (Razorpay) for upgrading to a premium account.
Responsive Design: A clean, dark-themed, and responsive user interface that works on various devices.

Tech Stack
Backend
Node.js: JavaScript runtime environment.
Express.js: Web application framework for Node.js.
MySQL2: MySQL client for Node.js.
Sequelize: A promise-based Node.js ORM for MySQL.
AWS SDK: For integration with Amazon Web Services (like S3 for file storage).
bcrypt: Library for hashing passwords.
dotenv: Loads environment variables from a .env file.
JSON Web Tokens (JWT): For securing API endpoints.
Morgan: HTTP request logger middleware.
Helmet: Helps secure Express apps by setting various HTTP headers.
CORS: Middleware for enabling Cross-Origin Resource Sharing.
Razorpay: Payment gateway for premium features.
Node-Mailjet: Email service for sending password reset links.
Frontend
HTML5
CSS3: Custom styling with a dark theme and responsive layout.
JavaScript (Vanilla): Client-side logic for dynamic content and API interactions.

File Structure
code
expense_tracker_AWS-main/
├── logs/
│   └── access.log
├── views/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── expense.js
│   │   ├── forgot-password.js
│   │   ├── leaderboard.js
│   │   ├── login.js
│   │   ├── reset-password.js
│   │   └── signup.js
│   ├── expense-tracker.html
│   ├── forgot-password.html
│   ├── leaderboard.html
│   ├── login.html
│   ├── reset-password.html
│   └── signup.html
├── package.json
└── server.js

Getting Started
Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

Prerequisites
Node.js: Ensure you have Node.js version 14.0.0 or higher installed. You can download it from nodejs.org.
MySQL: A running instance of a MySQL server.
AWS Account: For storing downloaded expense reports on S3.
Mailjet & Razorpay Accounts: For email and payment functionalities.

Installation
Clone the repository:
code
git clone https://github.com/your-username/expense-tracker-AWS-main.git
cd expense-tracker-AWS-main
Install NPM packages:
code
npm install
Set up environment variables:
Create a .env file in the root directory and add the following configuration details.
code
Code
DB_HOST='your-db-host'
DB_USER='your-db-user'
DB_PASSWORD='your-db-password'
DB_NAME='your-db-name'

JWT_SECRET='your-jwt-secret'

AWS_ACCESS_KEY_ID='your-aws-access-key'
AWS_SECRET_ACCESS_KEY='your-aws-secret-key'
S3_BUCKET_NAME='your-s3-bucket-name'

MAILJET_API_KEY='your-mailjet-api-key'
MAILJET_SECRET_KEY='your-mailjet-secret-key'

RAZORPAY_KEY_ID='your-razorpay-key-id'
RAZORPAY_KEY_SECRET='your-razorpay-key-secret'
Initialize the database:
Connect to your MySQL instance and create the database specified in your .env file. The application will automatically create the necessary tables when it starts.

Usage
Start the server:
For production mode:
code
npm start
For development mode with automatic restarts:
code
npm run dev
Access the application:
Open your web browser and navigate to http://localhost:5000 (or the port you have configured).

API Endpoints
The access.log file indicates the following key API routes are in use:
POST /api/user/login: User login.
POST /api/user/signup: User registration.
POST /api/password/forgotpassword: Send password reset link.
GET /api/expense/get: Fetch all expenses for the logged-in user.
POST /api/expense/add: Add a new expense.
DELETE /api/expense/delete/:id: Delete a specific expense.
GET /api/expense/download: Download all expenses (Premium feature).
GET /api/leaderboard: Get leaderboard data (Premium feature).
GET /api/expenses/daily: Get daily expense summary.
GET /api/expenses/weekly: Get weekly expense summary.
GET /api/expenses/monthly: Get monthly expense summary.
GET /api/expenses/yearly: Get yearly expense summary.
POST /api/purchase/premium: Initiate payment for premium membership.
POST /api/purchase/updatetransaction: Update transaction status after payment.
