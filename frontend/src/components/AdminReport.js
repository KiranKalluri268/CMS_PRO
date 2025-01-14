import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx"; // Import XLSX library
import "../adminreport.css";

const AdminReport = () => {
  const { batchYear } = useParams(); // Get batchYear from URL params
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [academicYear, setAcademicYear] = useState(""); // State for filtering by academic year
  const [years, setYears] = useState([]); // State for storing available academic years
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await axios.get(`/api/admin/certificates?year=${batchYear}`, {
          headers: { "x-auth-token": localStorage.getItem("authToken") },
        });

        const certificates = Array.isArray(response.data.certificates) ? response.data.certificates : [];
        const sortedCertificates = certificates.sort((a, b) => {
          const dateA = new Date(a.toDate);
          const dateB = new Date(b.toDate);
          if (isNaN(dateA)) return 1;
          if (isNaN(dateB)) return -1;
          return dateA - dateB;
        });

        setCertificates(sortedCertificates);
        setFilteredCertificates(sortedCertificates);

        const uniqueYears = [...new Set(sortedCertificates.map(c => new Date(c.toDate).getFullYear()))];
        setYears(uniqueYears);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Token expired or authentication error
          alert("Session expired. Please log in again.");
          localStorage.removeItem("authToken"); // Clear the token
          navigate("/"); // Redirect to login page
        } else {
        console.error("Error fetching certificates:", error);
        }
      }
    };

    fetchCertificates();
  }, [batchYear, navigate]);

  const handleFilterChange = (event) => {
    const selectedYear = event.target.value;
    setAcademicYear(selectedYear);

    if (selectedYear) {
      const filtered = certificates.filter(certificate => {
        const toDateYear = new Date(certificate.toDate).getFullYear();
        return toDateYear === parseInt(selectedYear);
      });
      setFilteredCertificates(filtered);
    } else {
      setFilteredCertificates(certificates);
    }
  };

  const handleDownload = async (downloadLink, fileName) => {
    if (!downloadLink) {
      alert("No download link available.");
      return;
    }

    const fileNameWithExtension = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;

    try {
      const response = await fetch(downloadLink);
      if (!response.ok) {
        throw new Error("Failed to fetch the file.");
      }
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameWithExtension;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download the file.');
    }
  };


  const handleDownloadExcel = () => {
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

    XLSX.writeFile(wb, `Batch_${batchYear}_Certificates_Report.xlsx`);
  };

  const handleCertificateLinkClick = (certificateLink) => {
    if (certificateLink) {
      window.open(certificateLink, '_blank');
    } else {
      alert('No link available for this certificate.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/";
  };

  return (
    <div className="admin-report-container">
      <header className="AdminReportHeader">
        <img src="/images/Vaagdevi.png" alt="Logo" className="AdminReportHeader-logo" />
        <img
          src="/images/logout-icon.png"
          alt="Logout"
          className="AdminReportLogoout-logo"
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
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <button className="download-report-btn" onClick={handleDownloadExcel}>
          Download Report as Excel
        </button>

        {filteredCertificates.length > 0 ? (
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Title of the event</th>
                  <th>Organised by</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Academic Year</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.map((certificate, index) => (
                  <tr key={certificate.certificateId}>
                    <td>{index + 1}</td>
                    <td>{certificate.student.rollNumber}</td>
                    <td>{certificate.student.name}</td>
                    <td>
                      <span
                        style={{ color: certificate.certificateLink ? 'blue' : 'black', cursor: certificate.certificateLink ? 'pointer' : 'default' }}
                        onClick={() => handleCertificateLinkClick(certificate.certificateLink)}
                      >
                        {certificate.course}
                      </span>
                    </td>
                    <td>{certificate.organisation}</td>
                    <td>{new Date(certificate.fromDate).toLocaleDateString()}</td>
                    <td>{new Date(certificate.toDate).toLocaleDateString()}</td>
                    <td>{new Date(certificate.toDate).getFullYear()}</td>
                    <td>
                      <button
                        onClick={() => handleDownload(certificate.downloadLink, `${certificate.course}.pdf`)}
                        disabled={!certificate.downloadLink}
                      >
                        {certificate.downloadLink ? "Download" : "No PDF Available"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
