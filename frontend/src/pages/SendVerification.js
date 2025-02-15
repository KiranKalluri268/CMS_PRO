import React, { useState } from "react";
import { Link } from 'react-router-dom';
import axios from "axios";
import '../forgot.css'

const SendVerification = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await axios.post("/api/auth/request-verification-link", { email });
      setMessage(response.data.message);
      alert("A new verification link has been sent");
      window.location.href = `/`;
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="forgot-container">
      {/* Header Section */}
      <header className="ForgotHeader">
        <img src="/images/Vaagdevi.png" alt="Logo" className="ForgotHeader-logo" />
      </header>

      <div className="forgot-box">
        <h1 className="forgot-title">Resend Verification Link</h1>
        <form onSubmit={handleSubmit}>
          <div className="forgot-input-group">
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              pattern="^[0-3][0-9]{1}[0-9]{3}a[0-9]{2}[a-z0-9][0-9]@vaagdevi.edu.in$"
              title="Only college mail is allowed (e.g., 22641a05g1@vaagdevi.edu.in)."
            />
          </div>
          <button type="submit">Send Verification Link</button>
                    <br />
                    <Link to="/">Login here</Link>
        </form>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </div>

      {/* Footer Section */}
      <footer className="footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default SendVerification;