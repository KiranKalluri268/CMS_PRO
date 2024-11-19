import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import '../editcertificate.css';

const EditCertificate = () => {
  const { id } = useParams(); // Extracts the "id" from the URL
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState({
    organisation: '',
    course: '',
    fromDate: '',
    toDate: '',
    pdf: '',
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    // Fetch the certificate details by ID
    const fetchCertificate = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/certificates/certificates/${id}`);
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
    if (file) {
      formData.append('pdf', file);
    }

    try {
      await axios.put(`http://localhost:5001/api/certificates/certificates/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Certificate updated successfully');
      navigate('/');
    } catch (error) {
      console.error('Error updating certificate:', error);
    }
  };

  if (!certificate) {
    return <div>Loading...</div>;
  }

  return (
    <div className="edit-form-container">
      {/* Header Section */}
      <header className="header">
        <img src="/images/vaagdevi.jpg" alt="Logo" className="header-logo" />
      </header>
    <div className="edit-box">
      <h2 className="edit-title">Edit Certificate</h2>
      <form className="edit" onSubmit={handleSubmit}>
      <div className="input-group">
        <label htmlFor="organisation">Organisation:</label>
        <input
          id="organisation"
          type="text"
          name="organisation"
          value={certificate.organisation}
          onChange={handleChange}
          required
        /></div>
        <br />
        <div className="input-group">
        <label htmlFor="Course">Course:</label>
        <input
          id="Course"
          type="text"
          name="course"
          value={certificate.course}
          onChange={handleChange}
          required
        /></div>
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
        /></div>
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
        /></div>
        <br />
        <div className="input-group">
        <label>Upload PDF:</label>
        <input type="file" name="pdf" accept=".pdf" onChange={handleFileChange} />
        <br /></div>
        <button type="submit">Save Changes</button>
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
