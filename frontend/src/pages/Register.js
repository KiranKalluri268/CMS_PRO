import React, { useState } from 'react';
import axios from "axios";
import '../register.css';

const Register = () => {
  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

const handleSubmit = async (event) => {
  event.preventDefault();
  try {
    const response = await axios.post('/api/auth/register', {
      rollNumber,
      email,
      name,
      password,
    });

    // Check if response.data exists
    if (response && response.data) {
      alert('Registration successful');
      // You might want to redirect the user to the login page
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Error during registration:', error);
    alert(error.response?.data?.message || 'Registration failed');
  }
};

  return (
    <div className="register-container">
      {/* Header Section */}
      <header className="header">
        <img src="/images/vaagdevi.jpg" alt="Logo" className="header-logo" />
      </header>

      <div className="register-box">
        <h1 class="register-title">Register</h1>
        <form onSubmit={handleSubmit}>

          {/* Roll No Input */}
          <div className="input-group">
            <label htmlFor="rollNo">Roll No:</label>
            <input
              id="rollNo"
              type="text"
              placeholder="Enter your roll number"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              required
            />
          </div>

          {/* Name Input */}
          <div className="input-group">
            <label htmlFor="name">Name:</label>
            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email Input */}
          <div className="input-group">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="input-group">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit">Register</button>
          <br />
          <a href="./">Already have an account? Login here</a>
        </form>
      </div>

      {/* Footer Section */}
      <footer className="footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default Register;
