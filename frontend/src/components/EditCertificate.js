import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import '../editcertificate.css';

const EditCertificate = () => {
  const { id } = useParams();
  const [certificate, setCertificate] = useState({
    organisation: '',
    course: '',
    fromDate: '',
    toDate: '',
    pdf: '',
    certificateLink: '',  // New field for certificate link
  });
  const [file, setFile] = useState(null);

  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('authToken'); // or sessionStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    // Fetch the certificate details by ID
    const fetchCertificate = async () => {
      try {
        const response = await axios.get(`/api/certificates/certificates/${id}`);
        setCertificate(response.data);
      } catch (error) {
        console.error('Error fetching certificate:', error);
      }
    };

    if (id) fetchCertificate();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCertificate((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('organisation', certificate.organisation);
    formData.append('course', certificate.course);
    formData.append('fromDate', certificate.fromDate);
    formData.append('toDate', certificate.toDate);
    formData.append('certificateLink', certificate.certificateLink); // Add certificateLink to form data
    if (file) {
      formData.append('pdf', file);
    }

    try {
      await axios.put(`/api/certificates/certificates/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const token = localStorage.getItem("authToken");
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      const studentId = decodedToken.studentId;
      alert('Certificate updated successfully');
      window.location.href = `/student-home/${studentId}`;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Token expired or authentication error
        alert("Session expired. Please log in again.");
        localStorage.removeItem("authToken"); // Clear the token
        navigate("/"); // Redirect to login page
      } else {
      console.error('Error updating certificate:', error);
      }
    }
  };

  const handleDelete = async () => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this certificate?');
      if (!confirmDelete) return;
  
      await axios.delete(`/api/certificates/certificates/${id}`, {
        headers: { "x-auth-token": localStorage.getItem("authToken") },
      });
      alert('Certificate deleted successfully');
      const token = localStorage.getItem("authToken");
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      const studentId = decodedToken.userId;
  
      window.location.href = `/student-home/${studentId}`;
    } catch (error) {
      console.error('Error deleting certificate:', error);
      alert('Failed to delete the certificate.');
    }
  };
  

  return (
    <div className="edit-form-container">
      {/* Header Section */}
      <header className="EditHeader">
        <img src="/images/Vaagdevi.png" alt="Logo" className="EditHeader-logo" />
      </header>
    <div className="edit-box">
      <h2 className="edit-title">Edit Certificate</h2>
      <form className="edit" onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="course">Title of the event:</label>
          <input
            id="course"
            type="text"
            name="course"
            value={certificate.course}
            onChange={handleChange}
            required
          />
        </div>
        <br />
        <div className="input-group">
          <label htmlFor="organisation">Organised by:</label>
          <input
            id="organisation"
            type="text"
            name="organisation"
            value={certificate.organisation}
            onChange={handleChange}
            required
          />
        </div>
        <br />
        <div className="input-group">
          <label htmlFor="fromDate">From Date:</label>
          <input
            id="fromDate"
            type="date"
            name="fromDate"
            value={certificate.fromDate?.slice(0, 10)}
            onChange={handleChange}
            required
          />
        </div>
        <br />
        <div className="input-group">
          <label htmlFor="toDate">To Date:</label>
          <input
            id="toDate"
            type="date"
            name="toDate"
            value={certificate.toDate?.slice(0, 10)}
            onChange={handleChange}
            required
          />
        </div>
        <br />
        <div className="input-group">
          <label htmlFor="certificateLink">Certificate Link:</label>
          <input
            id="certificateLink"
            type="url"
            name="certificateLink"
            value={certificate.certificateLink}
            onChange={handleChange}
            placeholder="Enter certificate link from Google drive"
          />
        </div>
        <br />
        <div className="input-group">
          <label>Upload PDF:</label>
          <input type="file" name="pdf" accept=".pdf" onChange={handleFileChange} />
          <br />
        </div>
        <div className="buttons">
          <button type="submit">Save Changes</button>
          <button type="button" onClick={handleDelete} style={{ marginLeft: '10px', backgroundColor: 'red' }}>
            Delete Certificate
          </button>
        </div>
      </form>
    </div>

    {/* Footer Section */}
    <footer className="footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default EditCertificate;
