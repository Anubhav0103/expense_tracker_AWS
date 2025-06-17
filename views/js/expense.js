let allExpenses = [];
let currentPage = 1;
const itemsPerPage = 5;
let timeBasedExpenses = {
  daily: { expenses: [], currentPage: 1 },
  weekly: { expenses: [], currentPage: 1 },
  monthly: { expenses: [], currentPage: 1 },
  yearly: { expenses: [], currentPage: 1 }
};

document.addEventListener('DOMContentLoaded', () => {
  const email = sessionStorage.getItem('email');
  if (!email) {
    window.location.href = '/login.html';
    return;
  }

  loadExpenses();
  checkPremiumStatus();
  loadTimeBasedExpenses();
  
  document.getElementById('premium-btn').addEventListener('click', buyPremium);
  document.getElementById('leaderboard-btn').addEventListener('click', showLeaderboard);
  document.getElementById('expense-form').addEventListener('submit', addExpense);
  document.getElementById('edit-form').addEventListener('submit', updateExpense);
  
  ['daily', 'weekly', 'monthly', 'yearly'].forEach(type => {
    document.getElementById(`${type}-prev-page`).addEventListener('click', () => 
      changeTimeBasedPage(type, timeBasedExpenses[type].currentPage - 1)
    );
    document.getElementById(`${type}-next-page`).addEventListener('click', () => 
      changeTimeBasedPage(type, timeBasedExpenses[type].currentPage + 1)
    );
  });
  
  document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('edit-modal').style.display = 'none';
  });
});

async function loadExpenses() {
  try {
    const email = sessionStorage.getItem('email');
    if (!email) {
      console.error('No email found in session storage');
      return;
    }
    const response = await fetch(`/api/expense/get?email=${email}`);
    const data = await response.json();
    allExpenses = data;
    paginateExpenses(allExpenses);
  } catch (error) {
    console.error('Error loading expenses:', error);
  }
}

async function loadTimeBasedExpenses() {
  try {
    const email = sessionStorage.getItem('email');
    const types = ['daily', 'weekly', 'monthly', 'yearly'];
    for (const type of types) {
      const response = await fetch(`/api/expenses/${type}?email=${email}`);
      const data = await response.json();
      timeBasedExpenses[type].expenses = data;
      updateTimeBasedTable(type);
      updateTimeBasedTotal(type);
    }
  } catch (error) {
    console.error('Error loading time-based expenses:', error);
  }
}

function paginateExpenses(expenses) {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedExpenses = expenses.slice(start, end);
  
  const tbody = document.querySelector('#expense-table tbody');
  tbody.innerHTML = '';
  
  paginatedExpenses.forEach(expense => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>₹${Number(expense.amount).toFixed(2)}</td>
      <td>${expense.description}</td>
      <td>${expense.category}</td>
      <td>
        <button onclick="editExpense(${expense.id})">Edit</button>
        <button onclick="deleteExpense(${expense.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Update total for all expenses
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  document.getElementById('total-expenses').textContent = total.toFixed(2);
}

function updateTimeBasedTable(type) {
  const expenses = timeBasedExpenses[type].expenses;
  const currentPage = timeBasedExpenses[type].currentPage;
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedExpenses = expenses.slice(start, end);
  
  const tbody = document.querySelector(`#${type}-table tbody`);
  tbody.innerHTML = '';
  
  paginatedExpenses.forEach(expense => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>₹${Number(expense.amount).toFixed(2)}</td>
      <td>${expense.description}</td>
      <td>${expense.category}</td>
      <td>
        <button onclick="editExpense(${expense.id})">Edit</button>
        <button onclick="deleteExpense(${expense.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateTimeBasedTotal(type) {
  const total = timeBasedExpenses[type].expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  document.getElementById(`${type}-total`).textContent = total.toFixed(2);
}

function changeTimeBasedPage(type, newPage) {
  const expenses = timeBasedExpenses[type].expenses;
  const maxPage = Math.ceil(expenses.length / itemsPerPage);
  
  if (newPage >= 1 && newPage <= maxPage) {
    timeBasedExpenses[type].currentPage = newPage;
    updateTimeBasedTable(type);
    
    // Update pagination buttons
    document.getElementById(`${type}-prev-page`).disabled = newPage === 1;
    document.getElementById(`${type}-next-page`).disabled = newPage === maxPage;
  }
}

async function addExpense(e) {
  e.preventDefault();
  const amount = document.getElementById('amount').value;
  const description = document.getElementById('description').value;
  const category = document.getElementById('category').value;
  const email = sessionStorage.getItem('email');
  
  if (!email) {
    alert('Please log in to add expenses');
    window.location.href = '/login.html';
    return;
  }
  
  try {
    const response = await fetch('/api/expense/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, description, category, email })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      e.target.reset();
      await loadExpenses();
      await loadTimeBasedExpenses();
      alert('Expense added successfully!');
    } else {
      alert(data.message || 'Error adding expense');
    }
  } catch (error) {
    console.error('Error adding expense:', error);
    alert('Error adding expense. Please try again.');
  }
}

async function editExpense(id) {
  const expense = allExpenses.find(e => e.id === id);
  if (expense) {
    document.getElementById('edit-amount').value = expense.amount;
    document.getElementById('edit-description').value = expense.description;
    document.getElementById('edit-category').value = expense.category;
    document.getElementById('edit-form').dataset.id = id;
    document.getElementById('edit-modal').style.display = 'block';
  }
}

async function updateExpense(e) {
  e.preventDefault();
  const id = e.target.dataset.id;
  const amount = document.getElementById('edit-amount').value;
  const description = document.getElementById('edit-description').value;
  const category = document.getElementById('edit-category').value;
  
  try {
    const response = await fetch(`/api/expense/update/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, description, category })
    });
    
    if (response.ok) {
      document.getElementById('edit-modal').style.display = 'none';
      loadExpenses();
      loadTimeBasedExpenses();
    }
  } catch (error) {
    console.error('Error updating expense:', error);
  }
}

async function deleteExpense(id) {
  if (confirm('Are you sure you want to delete this expense?')) {
    try {
      const response = await fetch(`/api/expense/delete/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadExpenses();
        loadTimeBasedExpenses();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  }
}

async function checkPremiumStatus() {
  try {
    const email = sessionStorage.getItem('email');
    if (!email) {
      console.error('No email found in session storage');
      return;
    }
    const response = await fetch(`/api/user/premium-status?email=${email}`);
    const data = await response.json();
    
    if (data.success && data.isPremium) {
      document.getElementById('premium-status').textContent = 'Premium';
      document.getElementById('premium-btn').style.display = 'none';
      document.getElementById('leaderboard-btn').style.display = 'block';
    } else {
      document.getElementById('premium-status').textContent = 'Not Premium';
      document.getElementById('premium-btn').style.display = 'block';
      document.getElementById('leaderboard-btn').style.display = 'none';
    }
  } catch (error) {
    console.error('Error checking premium status:', error);
  }
}

async function buyPremium() {
  try {
    const response = await fetch('/api/premium/create-order', {
      method: 'POST'
    });
    const data = await response.json();
    
    const options = {
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      name: 'Expense Tracker Premium',
      description: 'Premium Membership',
      order_id: data.orderId,
      handler: async function (response) {
        try {
          const result = await fetch('/api/premium/update-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: sessionStorage.getItem('email'),
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id
            })
          });

          if (result.ok) {
            alert('You are now a premium user!');
            await checkPremiumStatus();
            window.location.reload();
          } else {
            alert('Failed to update premium status. Please contact support.');
          }
        } catch (error) {
          console.error('Error updating premium status:', error);
          alert('Error updating premium status. Please contact support.');
        }
      },
      prefill: {
        email: sessionStorage.getItem('email')
      },
      theme: {
        color: '#4a9eff'
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error('Error creating order:', error);
    alert('Error creating order. Please try again.');
  }
}

function showLeaderboard() {
  window.location.href = '/leaderboard';
}