import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../adminhome.css';

const AdminHome = () => {
  const [batches, setBatches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const authToken = localStorage.getItem('authToken'); // or sessionStorage.getItem('token');
    if (!authToken) {
      alert("Unauthorized Access!, Login First!");
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        console.log("Token being sent:", localStorage.getItem("authToken"));
        const response = await axios.get("/api/admin/batches", {
            headers: { "x-auth-token": localStorage.getItem("authToken") },
          });
          console.log("Batches fetched:", response.data); 
        setBatches(response.data.batches);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Token expired or authentication error
          alert("Session expired. Please log in again.");
          localStorage.removeItem("authToken"); // Clear the token
          navigate("/"); // Redirect to login page
        } else {
        console.error("Error fetching batches:", error);
        }
      }
    };
    fetchBatches();
  }, [navigate]);

  const handleBatchSelect = ( batchYear) => {
    navigate(`/admin-report/${batchYear}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // or sessionStorage
    window.location.href = '/';
  };
  

  return (
    <div className="admin-home-container">
      {/* Header Section */}
      <header className="AdminHeader">
        <img src="/images/Vaagdevi.png" alt="Logo" className="AdminHeader-logo" />
        <img
        src="/images/logout-icon.png"
        alt="Logout"
        style={{ cursor: 'pointer', width: '60px', height: '60px' }}
        onClick={handleLogout}
        />
      </header>
  
      <div className="batch-list">
        <h2>Select a Batch</h2>
        {console.log("Batches being rendered:", batches)} {/* Log batches here */}
        {batches.length > 0 ? (
          <ul>
            {batches.map((batch) => (
              <li key={batch.year}>
              <button onClick={() => handleBatchSelect(batch.year)}>
              {batch.year}
              </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No batches available at the moment.</p>
        )}
      </div>
  
      {/* Footer Section */}
      <footer className="footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
  
};

export default AdminHome;
