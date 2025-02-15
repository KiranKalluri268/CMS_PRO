import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from "axios";
import '../login.css';

const Login = () => {
    const [rollNumber, setRollNumber] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
  
    const handleSubmit = async (event) => {
      event.preventDefault();
      setError("");
      setLoading(true);
    
      try {
        const response = await axios.post('/api/auth/login', {
          rollNumber,
          password,
        });
    
        // Check if `response` and `response.data` exist
        if (response && response.data) {
          // Store the token in localStorage
          const token = response.data.token;
          localStorage.setItem('authToken', token);
        
          // Decode the token to extract userRole
          const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decoding the JWT
          console.log("Decoded in frontend login:",decodedToken);
          const userRole = decodedToken.userRole; // Extract the role from the token
          const userRollNumber = decodedToken.userRollnumber;
          const userGender = decodedToken.userGender;
          const userPassout = decodedToken.userPassout;

          console.log('Decoded rollNumber:', userRollNumber);
          console.log('Decoded user role:', userRole);
          console.log('Decoded user gender:', userGender);
        
          // Redirect based on userRole
          if(!userGender || !userPassout){
            window.location.href = '/update-user';
          }else{
          if (userRole === 'student') {
            window.location.href = `/student-home/${decodedToken.userId}`; // Assuming userId is rollNumber
          } else if (userRole === 'admin') {
            window.location.href = '/admin-home'; // Admin doesn't need rollNumber in URL
          } else {
            console.error('Unknown role. Cannot navigate.');
          }
        }
        } else {
          console.log('Unexpected response structure:', response);
      }
      } catch (error) {
        console.error('Error during login:', error);
        setError(error.response?.data?.message || "Login failed. Please try again.");
      } finally {
        setLoading(false);
    }
    };

  return (
    <div className="login-container">
      <header className="LoginHeader">
        <img src="/images/Vaagdevi.png" alt="Logo" className="LoginHeader-logo" />
      </header>

      <div className="login-box">
        <h1 className="login-title">Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="userID">Roll No :</label>
            <input
              id="userID"
              type="text"
              placeholder="Enter RollNumber"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              required
              title="Only uppercase letters are allowed in the roll number (e.g., 22641A05G1)."
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
          {error && <p style={{ color: 'red', margin: '10px 0' }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          <br />
          <div className="links">
            <Link to="/forgot-password">Forgot Password?</Link>
            <br />
            <Link to="/register">Don't have an account? Register here</Link>
          </div>
        </form>
      </div>

      <footer className="footer">
      <div className="footer-info">
      <p className="footer-left">
  Developed by: <span className="name">Kalluri Saikiran</span><br />
  Under the guidance of: <span className="name">Dr. C Madan Kumar</span>
</p>
<p className="footer-right">
  HoD: <span className="name">Dr. N. Sathyavathi</span>
</p>

      </div>
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default Login;
