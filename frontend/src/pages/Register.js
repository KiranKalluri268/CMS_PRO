import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from "axios";
import '../register.css';

const Register = () => {
  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [passoutYear, setPassoutYear] = useState("");
  const [loading, setLoading] = useState(false);

  const [passwordRules, setPasswordRules] = useState({
    hasLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const validatePassword = (password) => {
    setPasswordRules({
      hasLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  const handleRollNumberChange = (e) => {
    const roll = e.target.value;
    setRollNumber(roll);

    if (/^\d{2}/.test(roll)) {
      const startYear = 2000 + parseInt(roll.substring(0, 2), 10);
      const regularPassoutYear = startYear + 4;
      const lateralPassoutYear = startYear + 3;

      setPassoutYear(regularPassoutYear.toString());

      if (passoutYear && ![regularPassoutYear, lateralPassoutYear].includes(parseInt(passoutYear))) {
        alert("Invalid passout year! Choose a valid year based on your batch.");
        setPassoutYear("");
      }
    }
  };

  const handlePassoutYearChange = async (e) => {
    const selectedYear = parseInt(e.target.value, 10);
    const startYear = 2000 + parseInt(rollNumber.substring(0, 2), 10);
    const regularPassoutYear = startYear + 4;
    const lateralPassoutYear = startYear + 3;
    const isLateral = rollNumber.includes("645");

    if (selectedYear !== regularPassoutYear && selectedYear !== lateralPassoutYear) {
      alert("Invalid selection! Choose correct passout year.");
      setPassoutYear(regularPassoutYear.toString());
    } else if (selectedYear === lateralPassoutYear) {
      setPassoutYear(selectedYear.toString());
      alert("Only select this if you are a lateral entry student.");
      if (!isLateral) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        alert("You are not a lateral student.");
        setPassoutYear(regularPassoutYear.toString());
      }
    } else {
      setPassoutYear(selectedYear.toString());
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (email.slice(0, 10).toLowerCase() !== rollNumber.toLowerCase()) {
      alert('Incorrect email or rollnumber');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/register', {
        rollNumber,
        email,
        name,
        password,
        gender,
        passoutYear,
      });

      if (response && response.data) {
        alert('Registration successful! Please verify your email before logging in.');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <header className="RegisterHeader">
        <img src="/images/Vaagdevi.png" alt="Logo" className="RegisterHeader-logo" />
      </header>

      <div className="register-box">
        <h1 className="register-title">Register</h1>
        <form onSubmit={handleSubmit}>
          <div className="register-input-group">
            <label htmlFor="rollNo">Roll No:</label>
            <input
              id="rollNo"
              type="text"
              placeholder="Enter your roll number"
              value={rollNumber}
              onChange={handleRollNumberChange}
              required
              pattern="^[0-3][0-9]{1}[0-9]{3}A[0-9]{2}[A-Z0-9][0-9]$"
              title="Only uppercase letters are allowed in the roll number (e.g., 22641A05G1)."
            />
          </div>

          <div className="register-input-group">
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
            <label htmlFor="gender-dropdown">Gender:</label>
            <select
              id="gender-dropdown"
              name="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="" disabled>Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="passout-year">Passout Year:</label>
            <select
              id="passout-year"
              name="passoutYear"
              value={passoutYear}
              onChange={handlePassoutYearChange}
              required
            >
              <option value="" disabled>Select passout year</option>
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="register-input-group">
            <label htmlFor="email">Email:</label>
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

          <div className="input-group-password">
            <div className='password-label'>
            <label htmlFor="password">Password:</label>
            </div>
            <div className="password-input-rules">
            <div className='password-input'>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              required
            />
            </div>
            <div className="password-rules">
            <ul>
              <li className={passwordRules.hasLength ? "valid" : "invalid"}>At least 8 characters</li>
              <li className={passwordRules.hasUppercase ? "valid" : "invalid"}>At least one uppercase letter</li>
              <li className={passwordRules.hasLowercase ? "valid" : "invalid"}>At least one lowercase letter</li>
              <li className={passwordRules.hasNumber ? "valid" : "invalid"}>At least one number</li>
              <li className={passwordRules.hasSpecialChar ? "valid" : "invalid"}>At least one special character (!@#$%^&*)</li>
            </ul>
            </div>
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
          <br />
          <Link to="/">Already have an account? Login here</Link>
        </form>
      </div>

      <footer className="footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default Register;