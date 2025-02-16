import React, { useState, useEffect } from "react";
import { uploadCertificate } from "../api";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import "../addcertificate.css";

const AddCertificate = ({ rollNumber: studentId }) => {
  const [formData, setFormData] = useState({ organisation: '', course: '', fromDate: '', toDate: '', certificateLink: '' });
  const [pdf, setPdf] = useState(null);
  const token = localStorage.getItem('authToken');
  const [loading, setLoading] = useState(false);
  const [organisation, setOrganisation] = useState("");
  const [customOrganisation, setCustomOrganisation] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  let decodedToken;
      try {
        decodedToken = JSON.parse(atob(token.split('.')[1]));
      } catch (error) {
        console.error("Invalid token format:", error);
        navigate('/');
        return null;
      }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setPdf(e.target.files[0]);
  
  const handleDropdownChange = (e) => {
    setOrganisation(e.target.value);
    if (e.target.value !== "Other") {
      setCustomOrganisation("");
    }
  };

  const handleCustomOrganisationChange = (e) => {
    setCustomOrganisation(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    const organisationToSend =
      organisation === "Other" ? customOrganisation : organisation;

    const fromDate = new Date(formData.fromDate);
    const toDate = new Date(formData.toDate);

    if (fromDate >= toDate) {
      alert("Error: 'From Date' must be before 'To Date'.");
      setLoading(false);
      return;
    }
  
    const data = new FormData();
    data.append("rollNumber", studentId);
    data.append("organisation", organisationToSend);
    data.append("course", formData.course);
    data.append("fromDate", formData.fromDate);
    data.append("toDate", formData.toDate);
  
    if (formData.certificateLink) {
      data.append("certificateLink", formData.certificateLink);
    }
    if (pdf) {
      data.append("pdf", pdf);
    }
  
    try {
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
    } finally {
      setLoading(false);
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
  <label htmlFor="organisation-dropdown">Organised by:</label>
  <select
    id="organisation-dropdown"
    name="organisation"
    value={organisation}
    onChange={handleDropdownChange}
    required
  >
    <option value="" disabled>
      Select Organisation
    </option>
    <option value="Cisco">Cisco</option>
    <option value="MongoDB">MongoDB</option>
    <option value="Other">Other</option>
  </select>
</div>

{organisation === "Other" && (
  <div className="input-group">
    <label htmlFor="custom-organisation">Enter Organisation Name:</label>
    <input
      id="custom-organisation"
      type="text"
      name="customOrganisation"
      value={customOrganisation}
      onChange={handleCustomOrganisationChange}
      placeholder="Enter Name of Organisation"
      required
    />
  </div>
)}

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
          <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
          </button>
          <br/>
          <Link to={`/student-home/${decodedToken.userId}`}>Go back to home</Link>
        </form>
      </div>
      <footer className="footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default AddCertificate;
