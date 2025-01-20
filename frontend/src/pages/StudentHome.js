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
  console.log("token in studenthome:", token);

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [navigate, token]);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await getCertificates(studentId, token);
        // Assuming the response contains metadata and downloadLink from Cloudinary
        const sortedCertificates = (res.data || []).sort(
          (a, b) => new Date(a.toDate) - new Date(b.toDate)
        );
        setCertificates(sortedCertificates);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Token expired or authentication error
          alert("Session expired. Please log in again.");
          localStorage.removeItem("authToken"); // Clear the token
          navigate("/"); // Redirect to login page
        } else {
        console.error('Error fetching certificates:', error);
        }
      }
    };
    fetchCertificates();
  }, [studentId, token, navigate]);

  const handleDownload = async (downloadLink, fileName) => {
    if (!downloadLink) {
      alert("No download link available.");
      return;
    }
  
    // Ensure the filename ends with .pdf
    const fileNameWithExtension = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  
    try {
      // Fetch the file as a blob
      const response = await fetch(downloadLink);
      if (!response.ok) {
        throw new Error('Failed to fetch the file.');
      }
      const blob = await response.blob();
  
      // Create a download link with the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileNameWithExtension;
  
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      // Revoke the object URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download the file.');
    }
  };  
  

  const handleCertificateLinkClick = (certificateLink) => {
    if (certificateLink) {
      window.open(certificateLink, '_blank');
    } else {
      alert('No link available for this certificate.');
    }
  };

  const decodedToken = JSON.parse(atob(token.split('.')[1]));
  const userName = decodedToken.userName;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/';
  };

  return (
    <div className="Student-container">
      {/* Header Section */}
      <header className="StudentHeader">
        <img src="/images/Vaagdevi.png" alt="Logo" className="StudentHeader-logo" />
        <img
          src="/images/logout-icon.png"
          alt="Logout"
          className='StudentLogout-logo'
          onClick={handleLogout}
        />
      </header>

      <div className="list">
        <div className="nav">
          <h1 className='Name'>Welcome, {userName}</h1>
          <button onClick={() => navigate('/add-certificate')}>Add New Certificate</button>
        </div>
        <div className='report-table-wrapper'>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Title of the Event</th>
              <th>Organised by</th>
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
                const fromDate = new Date(cert.fromDate).toLocaleDateString();
                const toDate = new Date(cert.toDate).toLocaleDateString();
                const academicYear = `${new Date(cert.toDate).getFullYear() - 1}-${new Date(cert.toDate).getFullYear()}`;

                return (
                  <tr key={cert.certificateId}>
                    <td>{index + 1}</td>
                    <td>
                      <span
                        style={{ color: cert.certificateLink ? 'blue' : 'black', cursor: cert.certificateLink ? 'pointer' : 'default' }}
                        onClick={() => handleCertificateLinkClick(cert.certificateLink)}
                      >
                        {cert.course}
                      </span>
                    </td>
                    <td>{cert.organisation}</td>
                    <td>{fromDate}</td>
                    <td>{toDate}</td>
                    <td>{academicYear}</td>
                    <td>
                      <button
                        onClick={() => handleDownload(cert.downloadLink, `${cert.course}.pdf`)}
                        disabled={!cert.downloadLink}
                      >
                        {cert.downloadLink ? 'Download' : 'No PDF Available'}
                      </button>
                    </td>
                    <td>
                      <button onClick={() => navigate(`/edit-certificate/${cert.certificateId}`)}>Edit</button>
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
      </div>

      {/* Footer Section */}
      <footer className="footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default StudentHome;
