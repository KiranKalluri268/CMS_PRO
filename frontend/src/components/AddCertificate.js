import React, { useState, useEffect } from "react";
import { uploadCertificate } from "../api";
import { useNavigate } from 'react-router-dom';
import "../addcertificate.css";

const AddCertificate = ({ rollNumber: studentId }) => {
  const [formData, setFormData] = useState({ organisation: '', course: '', fromDate: '', toDate: '', certificateLink: '' });
  const [pdf, setPdf] = useState(null);

  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('authToken'); // or sessionStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setPdf(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("rollNumber", studentId);
    data.append("organisation", formData.organisation);
    data.append("course", formData.course);
    data.append("fromDate", formData.fromDate);
    data.append("toDate", formData.toDate);
    if (formData.certificateLink) {
      data.append("certificateLink", formData.certificateLink);
      data.append("pdf", pdf);
    } else {
      data.append("pdf", pdf);
    }

    try {
      const token = localStorage.getItem("authToken");
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      const studentId = decodedToken.userId;

      await uploadCertificate(data, token);
      alert("Certificate uploaded successfully");
      window.location.href = `/student-home/${studentId}`;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem("authToken");
        window.location.href = "/";
      } else {
        console.error("Failed to upload certificate:", error);
      }
    }
  };

  return (
    <div className="upload-form-container">
      <header className="AddCertificateHeader">
        <img src="/images/Vaagdevi.png" alt="Logo" className="AddCertificateHeader-logo" />
      </header>
      <div className="upload-box">
        <h1 className="upload-title">Upload Certificate</h1>
        <form className="upload" onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="input-group">
            <label htmlFor="Course">Title of the event:</label>
            <input id="Course" type="text" name="course" onChange={handleChange} placeholder="Enter Title of Event" required />
          </div>
          <div className="input-group">
            <label htmlFor="organisation">Organised by:</label>
            <input id="organisation" type="text" name="organisation" onChange={handleChange} placeholder="Enter Name of Organisation" required />
          </div>
          <div className="input-group">
            <label htmlFor="fromDate">From:</label>
            <input id="fromDate" type="date" name="fromDate" onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="toDate">To:</label>
            <input id="toDate" type="date" name="toDate" onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="certificateLink">Certificate Link:</label>
            <input id="certificateLink" type="url" name="certificateLink" onChange={handleChange} placeholder="Certificate link from Google drive" />
          </div>
          <div className="input-group">
            <label htmlFor="pdf">Upload PDF:</label>
            <input id="pdf" type="file" accept="application/pdf" onChange={handleFileChange} />
          </div>
          <button type="submit">Submit</button>
        </form>
      </div>
      <footer className="footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default AddCertificate;
