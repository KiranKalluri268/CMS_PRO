import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../adminhome.css';

const AdminHome = () => {
  const [batches, setBatches] = useState([]);
  const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      alert("Unauthorized Access!, Login First!");
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      try {
        console.log("Token being sent:", localStorage.getItem("authToken"));
        const response = await axios.get("/api/admin/batches", {
            headers: { "x-auth-token": localStorage.getItem("authToken") },
          });
          console.log("Batches fetched:", response.data);
          
          const sortedBatches = response.data.batches.sort(
            (a, b) => parseInt(a.year) - parseInt(b.year)
          );
        console.log("Batches sorted:", sortedBatches);
        setBatches(sortedBatches);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("authToken");
          navigate("/");
        } else {
        console.error("Error fetching batches:", error);
        }
      } finally {
        setLoading(false);
    }
    };
    fetchBatches();
  }, [navigate]);

  const handleBatchSelect = ( batchYear) => {
    navigate(`/admin-report/${batchYear}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/';
  };
  

  return (
    <div className="admin-home-container">
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
        <h2>Select a Batch</h2>
        <div className="batchlist">
        {console.log("Batches being rendered:", batches)}
        {loading ? (
        <p>Loading batches...</p>
          ) : batches.length > 0 ? (
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
      </div>
  
      <footer className="footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
  
};

export default AdminHome;
