import React, { useEffect, useState } from 'react';
import { getCertificates } from '../api';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import '../studenthome.css';

const StudentHome = () => {
  const { rollNumber: studentId } = useParams();
  const [certificates, setCertificates] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  useEffect(() => {
    const token = localStorage.getItem('authToken'); // or sessionStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchCertificates = async () => {
      const res = await getCertificates(studentId, token);
      const sortedCertificates = (res.data || []).sort(
        (a, b) => new Date(a.toDate) - new Date(b.toDate)
      );
      setCertificates(sortedCertificates);
    };
    fetchCertificates();
  }, [studentId, token]);

  const handleDownload = (pdfUrl, fileName) => {
    console.log("Download URL:", pdfUrl);  // Check the URL
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName || 'certificate.pdf';
    link.click();
  };

  const handleCertificateLinkClick = (certificateLink) => {
    if (certificateLink) {
      window.open(certificateLink, '_blank');
    } else {
      alert("No link available for this certificate.");
    }
  };

  const decodedToken = JSON.parse(atob(token.split('.')[1]));
  const userName = decodedToken.userName;
  console.log('Decoded userName:', userName);

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // or sessionStorage
    window.location.href = '/';
  };

  return (
    <div className="login-container">
      {/* Header Section */}
      <header className="header">
        <img src="/images/vaagdevi.jpg" alt="Logo" className="header-logo" />
        <img
        src="/images/logout-icon.jpg"
        alt="Logout"
        style={{ cursor: 'pointer', width: '60px', height: '60px' }}
        onClick={handleLogout}
        />
      </header>
    <div className='list'>
      <div className='nav'>
      <h1>Welcome, {userName}</h1>
      <button onClick={() => navigate('/add-certificate')}>Add New Certificate</button>
      </div>
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
                  <td>
                    <span
                      style={{ color: cert.certificateLink ? 'blue' : 'black', cursor: cert.certificateLink ? 'pointer' : 'default' }}
                      onClick={() => handleCertificateLinkClick(cert.certificateLink)}
                    >
                      {cert.course}
                    </span>
                  </td>
                  <td>{fromDate}</td>
                  <td>{toDate}</td>
                  <td>{academicYear}</td>
                  <td>
                    <button 
                      onClick={() => handleDownload(cert.pdfUrl, cert.course)}
                      disabled={!cert.pdfUrl}
                    >
                      {cert.pdfUrl ? 'Download' : 'No PDF Available'}
                    </button>
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