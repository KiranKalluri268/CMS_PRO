import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from "axios";
import '../register.css';

const UpdateForm = () => {
  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [passoutYear, setPassoutYear] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [passwordRules, setPasswordRules] = useState({
    hasLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const decodedToken = JSON.parse(atob(token.split('.')[1]));

  useEffect(() => {
      if (!token) {
        navigate('/');
      }
    }, [navigate, token]);

  useEffect(() => {
    // Fetch user details and pre-fill the form
    const fetchUserData = async () => {
      try {
        const response = await axios.get('/api/auth/user-details', {
            headers: { "x-auth-token": token },
          });
        const userData = response.data;

        setRollNumber(userData.rollNumber);
        setName(userData.name);
        setEmail(userData.email);
        setGender(userData.gender);
        setPassoutYear(userData.passoutYear.toString());
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    if (token) fetchUserData();
}, [token]);

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

  const handlePassoutYearChange = (e) => {
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
        alert("You are not a lateral student.");
        setPassoutYear(regularPassoutYear.toString());
      }
    } else {
      setPassoutYear(selectedYear.toString());
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
        const updateData = { name, gender, passoutYear };
        if (password) updateData.password = password;

      const response = await axios.put('/api/auth/update', updateData, {
        headers: { "x-auth-token": token },
      });

      if (response && response.data) {
        alert('Profile updated successfully!');
        localStorage.removeItem("authToken");
        window.location.href = `/`;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <header className="header">
        <img src="/images/Vaagdevi.png" alt="Logo" className="RegisterHeader-logo" />
      </header>

      <div className="register-box">
        <h1 className="register-title">Update Profile</h1>
        <form onSubmit={handleUpdate}>
          <div className="register-input-group">
            <label htmlFor="rollNo">Roll No:</label>
            <input
              id="rollNo"
              type="text"
              value={rollNumber}
              disabled
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

          <div className="register-input-group">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
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

          {/* Password Section */}
          <div className="input-group-password">
            <div className='password-label'>
              <label htmlFor="password">New Password (Optional):</label>
            </div>
            <div className="password-input-rules">
              <div className='password-input'>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={handlePasswordChange}
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
            {loading ? "Updating..." : "Update"}
          </button>
          <br />
          {/* <Link to={`/student-home/${decodedToken.userId}`}>Back to Home</Link> */}
        </form>
      </div>

      <footer className="footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default UpdateForm;