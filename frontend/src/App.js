import React, { useEffect } from 'react';
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
axios.defaults.baseURL = process.env.REACT_APP_API_URL; // or use an environment variable for flexibility

function App() {
  useEffect(() => {
    // You can add other global configurations or logic here if needed
  }, []);
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