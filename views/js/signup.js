document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error');

    try {
        const response = await fetch('/api/user/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        
        if (data.success) {
            window.location.href = '/login';
        } else {
            errorDiv.textContent = data.message || 'Signup failed';
        }
    } catch (error) {
        errorDiv.textContent = 'An error occurred. Please try again.';
    }
});