document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const messageDiv = document.getElementById('message');

  try {
    const response = await fetch('/api/password/forgot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    messageDiv.textContent = data.message;
  } catch (error) {
    messageDiv.textContent = 'An error occurred. Please try again.';
    messageDiv.className = 'error';
  }
});