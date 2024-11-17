// Handle registration logic here
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const rollNumber = document.getElementById('roll-number').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    const response = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, rollNumber, email, password }),
    });
  
    const data = await response.json();
    if (data.user) {
      alert('Registration successful');
      window.location.href = '/login.html';
    } else {
      alert('Registration failed');
    }
  });
  