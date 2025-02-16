import React, { useState } from 'react';
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import axios from "axios";
import '../login.css';

const Login = () => {
    const [rollNumber, setRollNumber] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem('authToken');

    useEffect(() => {
      if (token) {

      try {
          const decodedToken = JSON.parse(atob(token.split(".")[1]));
          const userRole = decodedToken.userRole;
          const userId = decodedToken.userId;

          if (userRole === "student") {
              navigate(`/student-home/${userId}`);
          } else if (userRole === "admin") {
              navigate("/admin-home");
          } else {
              console.error("Unknown role.");
          }
      } catch (error) {
          console.error("Invalid token format", error);
      }
    }
  }, [navigate, token]);
  
    const handleSubmit = async (event) => {
      event.preventDefault();
      setError("");
      setLoading(true);
    
      try {
        const response = await axios.post('/api/auth/login', {
          rollNumber,
          password,
        });

        if (response && response.data) {
          const token = response.data.token;
          localStorage.setItem('authToken', token);

          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          console.log("Decoded in frontend login:",decodedToken);
          const userRole = decodedToken.userRole;
          const userGender = decodedToken.userGender;
          const userPassout = decodedToken.userPassout;

          if(!userGender || !userPassout){
            window.location.href = '/update-user';
          }else{
          if (userRole === 'student') {
            window.location.href = `/student-home/${decodedToken.userId}`;
          } else if (userRole === 'admin') {
            window.location.href = '/admin-home';
          } else {
            console.error('Unknown role.');
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
          {error === "Please verify your email before logging in." ? (
          <Link to="/send-verification">Resend verification link</Link>
          ) : (
            <>
          <Link to="/forgot-password">Forgot Password?</Link>
          <br />
          <Link to="/register">Don't have an account? Register here</Link>
          </>
          )}
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
