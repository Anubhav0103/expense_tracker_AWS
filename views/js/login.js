document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('error');

  try {
    const response = await fetch('/api/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password }) //javascript object to JSON string
    });

    const data = await response.json();
    
    if (data.success) {
      sessionStorage.setItem('email', email);
      window.location.href = '/expense';
    } else {
      errorDiv.textContent = data.message || 'Login failed';
    }
  } catch (error) {
    errorDiv.textContent = 'An error occurred. Please try again.';
  }
});