import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import StudentHome from "./pages/StudentHome";
import AdminHome from "./pages/AdminHome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddCertificate from './pages/AddCertificate';
import EditCertificate from './pages/EditCertificate';
import AdminReport from './pages/AdminReport';
import VerifyEmail from './pages/EmailVerification';
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Set the global baseURL for all Axios requests
axios.defaults.baseURL = process.env.REACT_APP_API_URL;

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the website is online by sending a request
    const checkWebsiteStatus = async () => {
      try {
        await axios.get(process.env.REACT_APP_API_URL); // Use the URL from .env
        setIsLoading(false); // Website is online, stop loading screen
      } catch (error) {
        console.log("Website is offline, retrying...");
        // No action needed here, it will retry automatically
      }
    };

    // Start checking immediately
    checkWebsiteStatus();

    // Retry every 5 seconds until the backend responds
    const intervalId = setInterval(checkWebsiteStatus, 5000);

    // Cleanup the interval when the component is unmounted
    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>; // Customize loading screen as needed
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student-home/:rollNumber" element={<StudentHome />} />
        <Route path="/admin-home" element={<AdminHome />} />
        <Route path="/add-certificate" element={<AddCertificate />} />
        <Route path="/edit-certificate/:id" element={<EditCertificate/>} />
        <Route path="/admin-report/:batchYear" element={<AdminReport/>} />
        <Route path="/verify-email" element={<VerifyEmail/>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;