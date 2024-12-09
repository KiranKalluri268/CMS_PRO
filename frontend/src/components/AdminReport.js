import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx"; // Import XLSX library
import "../adminreport.css";

const AdminReport = () => {
  const { batchId, batchYear } = useParams(); // Get batchId from URL params
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [academicYear, setAcademicYear] = useState(""); // State for filtering by academic year
  const [years, setYears] = useState([]); // State for storing available academic years

  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('authToken'); // or sessionStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await axios.get(`/api/admin/batches/${batchId}/certificates`, {
          headers: { "x-auth-token": localStorage.getItem("authToken") },
        });
        const sortedCertificates = (response.data || []).sort(
          (a, b) => new Date(a.toDate) - new Date(b.toDate)
        );
        setCertificates(sortedCertificates);
        setFilteredCertificates(sortedCertificates);

        // Dynamically populate academic years
        const uniqueYears = [...new Set(response.data.map(certificate => new Date(certificate.toDate).getFullYear()))];
        setYears(uniqueYears);
      } catch (error) {
        console.error("Error fetching certificates:", error);
      }
    };

    fetchCertificates();
  }, [batchId]);

  const handleFilterChange = (event) => {
    const selectedYear = event.target.value;
    setAcademicYear(selectedYear);

    if (selectedYear) {
      const filtered = certificates.filter((certificate) => {
        const toDateYear = new Date(certificate.toDate).getFullYear();
        return toDateYear === parseInt(selectedYear);
      });
      setFilteredCertificates(filtered);
    } else {
      setFilteredCertificates(certificates);
    }
  };

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

  const handleDownloadExcel = () => {
    // Create a workbook and add the filtered certificates as a worksheet
    const ws = XLSX.utils.json_to_sheet(
      filteredCertificates.map((certificate, index) => ({
        SNo: index + 1,
        RollNo: certificate.student.rollNumber,
        Name: certificate.student.name,
        Organisation: certificate.organisation,
        Course: certificate.course,
        FromDate: new Date(certificate.fromDate).toLocaleDateString(),
        ToDate: new Date(certificate.toDate).toLocaleDateString(),
        AcademicYear: new Date(certificate.toDate).getFullYear(),
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Certificates");

    // Write the workbook to a file
    XLSX.writeFile(wb, `Batch_${batchYear}_Certificates_Report.xlsx`);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // or sessionStorage
    window.location.href = '/';
  };

  return (
    <div className="admin-report-container">
      <header className="header">
        <img src="/images/vaagdevi.jpg" alt="Logo" className="header-logo" />
        <img
        src="/images/logout-icon.jpg"
        alt="Logout"
        style={{ cursor: 'pointer', width: '60px', height: '60px' }}
        onClick={handleLogout}
        />
      </header>

      <div className="report-list">
        <h2>Certificates for Batch {batchYear}</h2>

        <div className="filter-container">
          <label htmlFor="academic-year-filter">Filter by Academic Year:</label>
          <select
            id="academic-year-filter"
            value={academicYear}
            onChange={handleFilterChange}
          >
            <option value="">All Years</option>
            {years.length > 0 && years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <button className="download-report-btn" onClick={handleDownloadExcel}>
          Download Report as Excel
        </button>

        {filteredCertificates.length > 0 ? (
          <table className="certificate-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Roll No</th>
                <th>Name</th>
                <th>Organisation</th>
                <th>Course</th>
                <th>From</th>
                <th>To</th>
                <th>Academic Year</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {filteredCertificates.map((certificate, index) => (
                <tr key={certificate._id}>
                  <td>{index + 1}</td>
                  <td>{certificate.student.rollNumber}</td>
                  <td>{certificate.student.name}</td>
                  <td>{certificate.organisation}</td>
                  <td>
                    <span
                      style={{ color: certificate.certificateLink ? 'blue' : 'black', cursor: certificate.certificateLink ? 'pointer' : 'default' }}
                      onClick={() => handleCertificateLinkClick(certificate.certificateLink)}
                    >
                      {certificate.course}
                    </span>
                  </td>
                  <td>{new Date(certificate.fromDate).toLocaleDateString()}</td>
                  <td>{new Date(certificate.toDate).toLocaleDateString()}</td>
                  <td>{new Date(certificate.toDate).getFullYear()}</td>
                  <td>
                    <button
                      onClick={() => handleDownload(certificate.pdfUrl, certificate.course)}
                      disabled={!certificate.pdfUrl}
                    >
                      {certificate.pdfUrl ? "Download" : "No PDF Available"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No certificates found for this batch.</p>
        )}
      </div>

      <footer className="footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default AdminReport;
