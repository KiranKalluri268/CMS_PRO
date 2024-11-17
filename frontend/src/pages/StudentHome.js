import React, { useEffect, useState } from 'react';
import { getCertificates } from '../api';
import { useNavigate } from 'react-router-dom';
import '../studenthome.css';

const StudentHome = ({ rollNumber }) => {
  const [certificates, setCertificates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCertificates = async () => {
      const res = await getCertificates(rollNumber);
      setCertificates(res.data);
    };
    fetchCertificates();
  }, [rollNumber]);

  // Function to handle downloading the PDF
  const handleDownload = (pdfUrl, fileName) => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName || 'certificate.pdf';
    link.click();
  };

  return (
    <div className="login-container">
      {/* Header Section */}
      <header className="header">
        <img src="/images/vaagdevi.jpg" alt="Logo" className="header-logo" />
      </header>
    <div>
      <h1>Welcome, {rollNumber}</h1>
      <button onClick={() => navigate('/add-certificate')}>Add New Certificate</button>

      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Organisation</th>
            <th>Course</th>
            <th>From</th>
            <th>To</th>
            <th>Academic Year</th>
            <th>Download</th>
            <th>Edit</th>
          </tr>
        </thead>
        <tbody>
          {certificates.length > 0 ? (
            certificates.map((cert, index) => {
              // Extract and format dates
              const fromDate = new Date(cert.fromDate).toLocaleDateString();
              const toDate = new Date(cert.toDate).toLocaleDateString();
              const academicYear = `${new Date(cert.toDate).getFullYear() - 1}-${new Date(cert.toDate).getFullYear()}`;

              return (
                <tr key={cert._id}>
                  <td>{index + 1}</td>
                  <td>{cert.organisation}</td>
                  <td>{cert.course}</td>
                  <td>{fromDate}</td>
                  <td>{toDate}</td>
                  <td>{academicYear}</td>
                  <td>
                    <button onClick={() => handleDownload(cert.pdfUrl, cert.course)}>Download</button>
                  </td>
                  <td>
                    <button onClick={() => navigate(`/edit-certificate/${cert._id}`)}>Edit</button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="8">No certificates found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

      {/* Footer Section */}
      <footer className="footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default StudentHome;
