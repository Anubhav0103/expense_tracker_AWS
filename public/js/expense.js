document.addEventListener("DOMContentLoaded", async () => {
    const expenseForm = document.getElementById("expenseForm");
    const expenseList = document.getElementById("expense-list");
    const dailyExpenseList = document.getElementById("daily-expense-list");
    const weeklyExpenseList = document.getElementById("weekly-expense-list");
    const monthlyExpenseList = document.getElementById("monthly-expense-list");
    const buyMembershipBtn = document.getElementById("buyMembershipBtn");
    const premiumText = document.getElementById("premiumText");
    const leaderboardBtn = document.getElementById("leaderboardBtn");
    const paginationContainer = document.getElementById('pagination');
    const dailyPaginationContainer = document.getElementById('daily-pagination');
    const weeklyPaginationContainer = document.getElementById('weekly-pagination');
    const monthlyPaginationContainer = document.getElementById('monthly-pagination');

    let currentPage = 1;
    let currentDailyPage = 1;
    let currentWeeklyPage = 1;
    let currentMonthlyPage = 1;
    let limit = getExpensesPerPage();

    function getExpensesPerPage() {
        const screenWidth = window.innerWidth;
        return screenWidth <= 768 ? 5 : screenWidth <= 1200 ? 10 : 16;
    }

    window.addEventListener('resize', () => {
        limit = getExpensesPerPage();
        currentPage = 1;
        currentDailyPage = 1;
        currentWeeklyPage = 1;
        currentMonthlyPage = 1;
        fetchAllExpenses();
    });

    async function fetchExpenses(page) {
        try {
            limit = getExpensesPerPage();
            console.log(`Fetching total expenses: page=${page}, limit=${limit}`);
            const response = await fetch(`/expense/getAll?page=${page}&limit=${limit}`);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const data = await response.json();
            console.log(`Total expenses response: totalPages=${data.totalPages}, expenses=${data.expenses.length}`);
            expenseList.innerHTML = "";
            data.expenses.forEach(exp => addExpenseToList(exp, 'expense-list'));
            if (!data.expenses.length) expenseList.innerHTML = "<tr><td colspan='6'>No expenses found.</td></tr>";
            displayPagination(page, data.totalPages, 'fetchExpenses', paginationContainer);
            currentPage = page;
        } catch (error) {
            console.error("Error fetching expenses:", error);
            expenseList.innerHTML = "<tr><td colspan='6'>Error loading expenses.</td></tr>";
        }
    }

    async function fetchDailyExpenses(page) {
        try {
            limit = getExpensesPerPage();
            console.log(`Fetching daily expenses: page=${page}, limit=${limit}`);
            const response = await fetch(`/expense/daily?page=${page}&limit=${limit}`);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const data = await response.json();
            console.log(`Daily expenses response: totalPages=${data.totalPages}, expenses=${data.expenses.length}`);
            dailyExpenseList.innerHTML = "";
            data.expenses.forEach(exp => addExpenseToList(exp, 'daily-expense-list'));
            if (!data.expenses.length) dailyExpenseList.innerHTML = "<tr><td colspan='6'>No expenses found.</td></tr>";
            displayPagination(page, data.totalPages, 'fetchDailyExpenses', dailyPaginationContainer);
            currentDailyPage = page;
        } catch (error) {
            console.error("Error fetching daily expenses:", error);
            dailyExpenseList.innerHTML = "<tr><td colspan='6'>Error loading expenses.</td></tr>";
        }
    }

    async function fetchWeeklyExpenses(page) {
        try {
            limit = getExpensesPerPage();
            console.log(`Fetching weekly expenses: page=${page}, limit=${limit}`);
            const response = await fetch(`/expense/weekly?page=${page}&limit=${limit}`);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const data = await response.json();
            console.log(`Weekly expenses response: totalPages=${data.totalPages}, expenses=${data.expenses.length}`);
            weeklyExpenseList.innerHTML = "";
            data.expenses.forEach(exp => addExpenseToList(exp, 'weekly-expense-list'));
            if (!data.expenses.length) weeklyExpenseList.innerHTML = "<tr><td colspan='6'>No expenses found.</td></tr>";
            displayPagination(page, data.totalPages, 'fetchWeeklyExpenses', weeklyPaginationContainer);
            currentWeeklyPage = page;
        } catch (error) {
            console.error("Error fetching weekly expenses:", error);
            weeklyExpenseList.innerHTML = "<tr><td colspan='6'>Error loading expenses.</td></tr>";
        }
    }

    async function fetchMonthlyExpenses(page) {
        try {
            limit = getExpensesPerPage();
            console.log(`Fetching monthly expenses: page=${page}, limit=${limit}`);
            const response = await fetch(`/expense/monthly?page=${page}&limit=${limit}`);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const data = await response.json();
            console.log(`Monthly expenses response: totalPages=${data.totalPages}, expenses=${data.expenses.length}`);
            monthlyExpenseList.innerHTML = "";
            data.expenses.forEach(exp => addExpenseToList(exp, 'monthly-expense-list'));
            if (!data.expenses.length) monthlyExpenseList.innerHTML = "<tr><td colspan='6'>No expenses found.</td></tr>";
            displayPagination(page, data.totalPages, 'fetchMonthlyExpenses', monthlyPaginationContainer);
            currentMonthlyPage = page;
        } catch (error) {
            console.error("Error fetching monthly expenses:", error);
            monthlyExpenseList.innerHTML = "<tr><td colspan='6'>Error loading expenses.</td></tr>";
        }
    }

    async function fetchAllExpenses() {
        await Promise.all([
            fetchExpenses(currentPage),
            fetchDailyExpenses(currentDailyPage),
            fetchWeeklyExpenses(currentWeeklyPage),
            fetchMonthlyExpenses(currentMonthlyPage)
        ]);
    }

    function displayPagination(page, totalPages, fetchFunction, paginationContainer) {
        console.log(`Rendering pagination: fetchFunction=${fetchFunction}, page=${page}, totalPages=${totalPages}`);
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) {
            console.log(`No pagination needed for ${fetchFunction}: totalPages=${totalPages}`);
            return;
        }

        if (page > 1) {
            const prev = document.createElement('button');
            prev.textContent = 'Previous';
            prev.addEventListener('click', () => {
                console.log(`Previous clicked: ${fetchFunction}, page=${page - 1}`);
                updatePage(fetchFunction, page - 1);
            });
            paginationContainer.appendChild(prev);
        }

        const first = document.createElement('button');
        first.textContent = '1';
        first.addEventListener('click', () => {
            console.log(`Page 1 clicked: ${fetchFunction}`);
            updatePage(fetchFunction, 1);
        });
        if (page === 1) first.disabled = true;
        paginationContainer.appendChild(first);

        if (page > 3) paginationContainer.appendChild(document.createTextNode(" ... "));

        if (page - 1 > 1) {
            const prevPage = document.createElement('button');
            prevPage.textContent = page - 1;
            prevPage.addEventListener('click', () => {
                console.log(`Page ${page - 1} clicked: ${fetchFunction}`);
                updatePage(fetchFunction, page - 1);
            });
            paginationContainer.appendChild(prevPage);
        }

        if (page !== 1 && page !== totalPages) {
            const current = document.createElement('button');
            current.textContent = page;
            current.disabled = true;
            paginationContainer.appendChild(current);
        }

        if (page + 1 < totalPages) {
            const nextPage = document.createElement('button');
            nextPage.textContent = page + 1;
            nextPage.addEventListener('click', () => {
                console.log(`Page ${page + 1} clicked: ${fetchFunction}`);
                updatePage(fetchFunction, page + 1);
            });
            paginationContainer.appendChild(nextPage);
        }

        if (page < totalPages - 2) paginationContainer.appendChild(document.createTextNode(" ... "));

        if (totalPages > 1) {
            const last = document.createElement('button');
            last.textContent = totalPages;
            last.addEventListener('click', () => {
                console.log(`Last page clicked: ${fetchFunction}, page=${totalPages}`);
                updatePage(fetchFunction, totalPages);
            });
            if (page === totalPages) last.disabled = true;
            paginationContainer.appendChild(last);
        }

        if (page < totalPages) {
            const next = document.createElement('button');
            next.textContent = 'Next';
            next.addEventListener('click', () => {
                console.log(`Next clicked: ${fetchFunction}, page=${page + 1}`);
                updatePage(fetchFunction, page + 1);
            });
            paginationContainer.appendChild(next);
        }
    }

    function updatePage(fetchFunction, newPage) {
        console.log(`Updating page: fetchFunction=${fetchFunction}, newPage=${newPage}`);
        switch (fetchFunction) {
            case 'fetchExpenses':
                currentPage = newPage;
                fetchExpenses(newPage);
                break;
            case 'fetchDailyExpenses':
                currentDailyPage = newPage;
                fetchDailyExpenses(newPage);
                break;
            case 'fetchWeeklyExpenses':
                currentWeeklyPage = newPage;
                fetchWeeklyExpenses(newPage);
                break;
            case 'fetchMonthlyExpenses':
                currentMonthlyPage = newPage;
                fetchMonthlyExpenses(newPage);
                break;
            default:
                console.error(`Unknown fetchFunction: ${fetchFunction}`);
        }
    }

    async function handleDeleteClick(event) {
        if (event.target.classList.contains("delete-btn")) {
            const expenseId = event.target.dataset.id;
            try {
                const response = await fetch(`/expense/delete/${expenseId}`, { method: "DELETE" });
                if (response.ok) {
                    alert("Expense deleted successfully!");
                    fetchAllExpenses();
                } else {
                    const data = await response.json();
                    alert("Error deleting expense: " + data.message);
                }
            } catch (error) {
                console.error("Error deleting expense:", error);
                alert("Error deleting expense: " + error.message);
            }
        }
    }

    expenseList.addEventListener("click", handleDeleteClick);
    dailyExpenseList.addEventListener("click", handleDeleteClick);
    weeklyExpenseList.addEventListener("click", handleDeleteClick);
    monthlyExpenseList.addEventListener("click", handleDeleteClick);

    expenseForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const amount = document.getElementById("amount").value;
        const description = document.getElementById("description").value;
        const category = document.getElementById("category").value;

        try {
            const response = await fetch("/expense/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, description, category })
            });

            if (response.status === 201) {
                alert("Expense added successfully!");
                fetchAllExpenses();
                document.getElementById("amount").value = "";
                document.getElementById("description").value = "";
                document.getElementById("category").value = "food";
            } else {
                const data = await response.json();
                alert("Error adding expense: " + data.message);
            }
        } catch (error) {
            console.error("Error adding expense:", error);
            alert("Error adding expense: " + error.message);
        }
    });

    function addExpenseToList(exp, tableId) {
        const tableBody = document.getElementById(tableId);
        const date = exp.date ? exp.date : "N/A";
        const time = exp.time ? exp.time : "N/A";
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${date}</td>
            <td>${time}</td>
            <td>${exp.description}</td>
            <td>${exp.category}</td>
            <td>₹${exp.amount}</td>
            <td><button class="delete-btn" data-id="${exp.id}" data-table="${tableId}">Delete</button></td>
        `;
        tableBody.appendChild(row);
    }

    try {
        const res = await fetch("/user/session");
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();
        const userId = data.userId;

        if (!userId) {
            alert("User ID not found. Please log in again.");
            window.location.href = "signup.html";
            return;
        }

        const userRes = await fetch("/user/details");
        if (!userRes.ok) throw new Error(`HTTP error: ${userRes.status}`);
        const userData = await userRes.json();

        buyMembershipBtn.style.display = userData.isPremium ? "none" : "block";
        premiumText.style.display = userData.isPremium ? "block" : "none";
        leaderboardBtn.style.display = userData.isPremium ? "block" : "none";
    } catch (error) {
        console.error("Error fetching user data:", error);
        alert("Failed to check user status. Please try again.");
    }

    async function loadRazorpaySDK() {
        if (typeof Razorpay !== 'undefined') {
            console.log("Razorpay SDK already loaded");
            return true;
        }

        return new Promise((resolve) => {
            console.log("Dynamically loading Razorpay SDK...");
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => {
                console.log("Razorpay SDK loaded successfully");
                resolve(true);
            };
            script.onerror = () => {
                console.error("Failed to load Razorpay SDK");
                resolve(false);
            };
            document.body.appendChild(script);
        });
    }

    async function waitForRazorpay(maxAttempts = 10, delayMs = 500) {
        for (let i = 0; i < maxAttempts; i++) {
            if (typeof Razorpay !== 'undefined') {
                console.log("Razorpay SDK confirmed loaded");
                return true;
            }
            console.log(`Waiting for Razorpay SDK... Attempt ${i + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        console.error("Razorpay SDK failed to load after max attempts");
        return false;
    }

    buyMembershipBtn.addEventListener("click", async () => {
        try {
            console.log("Initiating membership purchase...");
            const response = await fetch("/purchase/membership", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error: ${response.status}, ${errorData.message || 'Unknown error'}`);
            }
            const data = await response.json();
            console.log("Purchase response:", data);

            if (!data.orderId || !data.key_id) {
                console.error("Missing orderId or key_id:", data);
                alert("Error: Unable to initiate payment.");
                return;
            }

            const options = {
                key: data.key_id,
                amount: 3000,
                currency: "INR",
                name: "Expense Tracker Premium",
                order_id: data.orderId,
                handler: async function (response) {
                    console.log("Razorpay payment response:", response);
                    await verifyPayment(response, data.orderId);
                },
                prefill: { email: localStorage.getItem("userEmail") || "" },
                theme: { color: "#3399cc" }
            };

            console.log("Preparing to open Razorpay checkout with options:", options);

            let razorpayLoaded = await loadRazorpaySDK();
            if (!razorpayLoaded) {
                razorpayLoaded = await waitForRazorpay();
            }

            if (!razorpayLoaded) {
                console.error("Payment service unavailable after all attempts");
                alert("Payment service unavailable. Please try again later.");
                return;
            }

            const razorpay = new Razorpay(options);
            razorpay.on('payment.failed', function (response) {
                console.error("Razorpay payment failed:", response.error);
                alert("Payment failed: " + response.error.description);
            });
            console.log("Opening Razorpay checkout");
            razorpay.open();
        } catch (error) {
            console.error("Error in buy membership:", error);
            alert("Something went wrong while initiating payment: " + error.message);
        }
    });

    async function verifyPayment(response, orderId) {
        try {
            console.log("Verifying payment:", { orderId, paymentId: response.razorpay_payment_id });
            const res = await fetch("/purchase/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    razorpay_order_id: orderId,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                })
            });
            const result = await res.json();
            console.log("Verification result:", result);
            if (result.success) {
                alert("Transaction Successful! You are now a premium member.");
                window.location.reload();
            } else {
                console.error("Verification failed:", result.message);
                alert("Transaction Failed: " + (result.message || "Unknown error"));
            }
        } catch (error) {
            console.error("Error verifying payment:", error);
            alert("Something went wrong while verifying payment: " + error.message);
        }
    }

    // Leaderboard toggle function
    async function toggleLeaderboard() {
        const leaderboardContainer = document.getElementById("leaderboardContainer");
        const leaderboardTable = document.getElementById("leaderboard");

        if (leaderboardContainer.style.display === "none" || leaderboardContainer.style.display === "") {
            leaderboardContainer.style.display = "block";
            try {
                console.log("Fetching leaderboard data...");
                const response = await fetch("/expense/leaderboard", {
                    headers: { "Content-Type": "application/json" }
                });
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                const leaderboardData = await response.json();
                console.log("Leaderboard data:", leaderboardData);
                leaderboardTable.innerHTML = "";
                if (leaderboardData.length === 0) {
                    leaderboardTable.innerHTML = "<tr><td colspan='3'>No data available.</td></tr>";
                } else {
                    leaderboardData.forEach((user, index) => {
                        const row = leaderboardTable.insertRow();
                        row.innerHTML = `<td>${index + 1}</td><td>${user.name}</td><td>₹${user.total_expense || 0}</td>`;
                    });
                }
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
                alert("Failed to fetch leaderboard data: " + error.message);
                leaderboardContainer.style.display = "none";
            }
        } else {
            leaderboardContainer.style.display = "none";
        }
    }

    // Attach event listener to leaderboard button
    leaderboardBtn.addEventListener('click', toggleLeaderboard);

    function scheduleWeeklyRefresh() {
        const now = new Date();
        const nextMonday = new Date();
        nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7));
        nextMonday.setHours(0, 0, 0, 0);
        if (nextMonday <= now) nextMonday.setDate(nextMonday.getDate() + 7);
        const timeUntilMonday = nextMonday - now;

        setTimeout(() => {
            fetchWeeklyExpenses(1);
            currentWeeklyPage = 1;
            setInterval(() => fetchWeeklyExpenses(1), 7 * 24 * 60 * 60 * 1000);
        }, timeUntilMonday);
    }

    scheduleWeeklyRefresh();
    fetchAllExpenses();
});