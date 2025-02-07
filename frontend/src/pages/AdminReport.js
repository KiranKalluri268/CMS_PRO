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
  const [loading, setLoading] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  const fetchCertificates = async () => {
    console.log("Fetching certificates...");
    console.log("Current lastEvaluatedKey:", lastEvaluatedKey);
  
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/certificates`, {
        params: {
          year: batchYear,
          lastEvaluatedKey: lastEvaluatedKey ? JSON.stringify(lastEvaluatedKey) : undefined, // Encode correctly
        },
        headers: { "x-auth-token": localStorage.getItem("authToken") },
      });
  
      console.log("API Response:", response.data);
  
      const newCertificates = Array.isArray(response.data.certificates) ? response.data.certificates : [];
  
      if (newCertificates.length === 0 && !response.data.lastEvaluatedKey) {
        console.log("No more certificates to fetch.");
        setLastEvaluatedKey(null); // Ensure no further requests
        return;
      }
  
      // Append new certificates to the existing list
      setCertificates((prevCertificates) => [...prevCertificates, ...newCertificates]);
      setFilteredCertificates((prevFiltered) => [...prevFiltered, ...newCertificates]);
  
      console.log("Total certificates loaded:", newCertificates.length);
  
      // Extract unique academic years
      const uniqueYears = [...new Set([...years, ...newCertificates.map(c => new Date(c.toDate).getFullYear())])];
      setYears(uniqueYears);
  
      // Set lastEvaluatedKey for next request
      setLastEvaluatedKey(response.data.lastEvaluatedKey || null);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem("authToken");
        navigate("/");
      } else {
        console.error("Error fetching certificates:", error);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Run only on page load
  useEffect(() => {
    fetchCertificates();
  }, [batchYear, navigate]);
  
  // Load More Button Handler
  const handleLoadMore = () => {
    if (lastEvaluatedKey) {
      fetchCertificates();
    }
  };
  

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
        <h2 className="batch-title">Certificates for Batch {batchYear}</h2>

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
        </div><br/>

        <button className="download-report-btn" onClick={handleDownloadExcel}>
          Download Report as Excel
        </button>

        {loading ? (
  <p>Loading certificates...</p>
) : filteredCertificates.length > 0 ? (
  <div className="table-wrapper">
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
                style={{
                  color: certificate.certificateLink ? "blue" : "black",
                  cursor: certificate.certificateLink ? "pointer" : "default",
                }}
                onClick={() =>
                  handleCertificateLinkClick(certificate.certificateLink)
                }
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
                onClick={() =>
                  handleDownload(
                    certificate.downloadLink,
                    `${certificate.course}.pdf`
                  )
                }
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

{lastEvaluatedKey && !loading && (
  <button onClick={handleLoadMore}>Load More</button>
)}
      </div>

      <footer className="Adminreport-footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default AdminReport;