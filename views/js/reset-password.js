document.getElementById('reset-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const messageDiv = document.getElementById('message');

  if (password !== confirmPassword) {
    messageDiv.textContent = 'Passwords do not match';
    messageDiv.className = 'error';
    return;
  }


  // console.log('Current URL:', window.location.href);
  // console.log('URL pathname:', window.location.pathname);
  
  const token = window.location.pathname.split('/').pop();
  // console.log('Extracted token:', token);
  
  if (!token) {
    messageDiv.textContent = 'Invalid reset token';
    messageDiv.className = 'error';
    return;
  }

  try {
    console.log('Sending reset request with token:', token);
    const response = await fetch('/api/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });

    const data = await response.json();
    console.log('Reset response:', data);

    messageDiv.textContent = data.message;
    // messageDiv.className = data.success ? 'success' : 'error';

    if (data.success) {
      messageDiv.textContent = 'Password reset successful! Redirecting to login...';
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  } catch (error) {
    console.error('Reset error:', error);
    messageDiv.textContent = 'An error occurred. Please try again.';
    messageDiv.className = 'error';
  }
});