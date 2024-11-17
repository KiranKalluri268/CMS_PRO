// Handle login logic here
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const rollNumber = document.getElementById('roll-number').value;
    const password = document.getElementById('password').value;
  
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rollNumber, password }),
    });
  
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('auth-token', data.token);
      window.location.href = '/homepage.html';
    } else {
      alert('Invalid credentials');
    }
  });
  