import React, { useState } from 'react';
import { uploadCertificate } from '../api';
import '../addcertificate.css';

const AddCertificate = ({ rollNumber }) => {
  const [formData, setFormData] = useState({ organisation: '', course: '', fromDate: '', toDate: '' });
  const [pdf, setPdf] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setPdf(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('rollNumber', rollNumber);
    data.append('organisation', formData.organisation);
    data.append('course', formData.course);
    data.append('fromDate', formData.fromDate);
    data.append('toDate', formData.toDate);
    data.append('pdf', pdf);

    try {
      await uploadCertificate(data);
      alert('Certificate uploaded successfully');
    } catch (error) {
        if (error.response && error.response.status === 401) {
        console.error('Unauthorized! Redirecting to login...');
        // Redirect to login page if token is invalid or expired
        window.location.href = "/";
      } else
      console.error('Failed to upload certificate:', error);
    }
  };

  return (
    <div className="upload-form-container">
      {/* Header Section */}
      <header className="header">
        <img src="/images/vaagdevi.jpg" alt="Logo" className="header-logo" />
      </header>

      <div className="upload-box">
        <h1 class="upload-title">Upload Certificates</h1>
    <form class="upload" onSubmit={handleSubmit} encType="multipart/form-data">
    <div className="input-group">
      <label htmlFor="organisation">Organisation:</label>
      <input id="organisation" type="text" name="organisation" onChange={handleChange} placeholder="Organisation" required /><br/>
      </div>
      <div className="input-group">
      <label htmlFor="Course">Course/Topic:</label>
      <input id="Course" type="text" name="course" onChange={handleChange} placeholder="Course/Topic" required /><br/>
      </div>
      <div className="input-group">
      <label htmlFor="fromDate">From:</label>
      <input id="fromDate" type="date" name="fromDate" onChange={handleChange} required /><br/>
      </div>
      <div className="input-group">
      <label htmlFor="toDate">To:</label>
      <input id="toDate" type="date" name="toDate" onChange={handleChange} required /><br/>
      </div>
      <div className="input-group">
      <input type="file" accept="application/pdf" onChange={handleFileChange} required /><br/>
      </div>
      <button type="submit">Upload Certificate</button>
    </form>
    </div>

    {/* Footer Section */}
    <footer className="footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default AddCertificate;
