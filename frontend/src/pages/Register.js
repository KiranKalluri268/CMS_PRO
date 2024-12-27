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

      if (response && response.data) {
        alert('Registration successful! Please verify your email before logging in.');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="register-container">
      <header className="header">
        <img src="/images/Vaagdevi.png" alt="Logo" className="RegisterHeader-logo" />
      </header>

      <div className="register-box">
        <h1 className="register-title">Register</h1>
        <form onSubmit={handleSubmit}>
        <div className="input-group">
        <label htmlFor="rollNo">Roll No:</label>
        <input
          id="rollNo"
          type="text"
          placeholder="Enter your roll number"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value)}
          required
          pattern="^[0-3][0-9]{1}[0-9]{3}A[0-9]{2}[A-Z0-9][0-9]$"
          title="Only uppercase letters are allowed in the roll number (e.g., 22641A05G1)."
        />
      </div>

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

      <footer className="footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default Register;
