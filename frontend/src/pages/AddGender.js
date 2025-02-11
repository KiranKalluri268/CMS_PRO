import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../adminhome.css';

const AddGender = () => {
  const [gender, setGender] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      alert("Unauthorized Access! Login First!");
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/";
  };

  const handleGenderSelection = async (selectedGender) => {
    setGender(selectedGender);
    setLoading(true);

    try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const userId = decodedToken.userId;

      if (!userId) {
        alert("UserId Not Found!");
        return;
      }

      const response = await fetch("http://localhost:5000/api/update-gender", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, gender: selectedGender }),
      });

      const data = await response.json();
    if (response.ok) {
      alert("Gender updated successfully!");
      localStorage.removeItem("authToken");
      window.location.href = `/`;
    } else {
      alert(data.message);
    }

    } catch (error) {
      console.error("Error updating gender:", error);
      alert("Failed to update gender!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-home-container">
      {/* Header Section */}
      <header className="AdminHeader">
        <img src="/images/Vaagdevi.png" alt="Logo" className="AdminHeader-logo" />
        <img
          src="/images/logout-icon.png"
          alt="Logout"
          className="AdminHeader-Logout-Logo"
          onClick={handleLogout}
        />
      </header>

      <div className="batch-list">
        <h2>Select Your Gender</h2>
        <ul>
          <li key="male">
            <button onClick={() => handleGenderSelection("Male")} disabled={loading}>
              Male
            </button>
          </li>
          <li key="female">
            <button onClick={() => handleGenderSelection("Female")} disabled={loading}>
              Female
            </button>
          </li>
        </ul>
      </div>

      {/* Footer Section */}
      <footer className="footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default AddGender;