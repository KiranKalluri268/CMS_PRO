import React from 'react';
//import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import StudentHome from "./pages/StudentHome";
import AdminHome from "./pages/AdminHome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddCertificate from './components/AddCertificate';
import EditCertificate from './components/EditCertificate';
import AdminReport from './components/AdminReport';
import VerifyEmail from './components/EmailVerification';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student-home/:rollNumber" element={<StudentHome />} />
        <Route path="/admin-home" element={<AdminHome />} />
        <Route path="/add-certificate" element={<AddCertificate />} />
        <Route path="/edit-certificate/:id" element={<EditCertificate/>} />
        <Route path="/admin-report/:batchId/:batchYear" element={<AdminReport/>} />
        <Route path="/verify-email" element={<VerifyEmail/>} />
      </Routes>
    </Router>
  );
}

export default App;
