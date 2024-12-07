import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../adminreport.css"; // Add your CSS for this page

const AdminReport = () => {
  const { batchId, batchYear } = useParams(); // Get batchId from URL params
  console.log("batchid from url:",batchId);
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [academicYear, setAcademicYear] = useState(""); // State for filtering by academic year

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        console.log("Fetching certificates for batchId:", batchId);
        const response = await axios.get(`/api/admin/batches/${batchId}/certificates`, {
            headers: { "x-auth-token": localStorage.getItem("authToken") },
          });
        console.log("Certificates fetched:", response.data);
        setCertificates(response.data.certificates || []);
        setFilteredCertificates(response.data.certificates || []); // Initialize filtered list
      } catch (error) {
        console.error("Error fetching certificates:", error);
      }
    };

    fetchCertificates();
  }, [batchId]);

   // Handle academic year filter
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
      setFilteredCertificates(certificates); // Show all if no filter selected
    }
  };

  return (
    <div className="admin-report-container">
      <header className="header">
        <img src="/images/vaagdevi.jpg" alt="Logo" className="header-logo" />
      </header>

      <div className="report-list">
      <h2>Certificates for Batch {batchYear}</h2>
        {/* Academic Year Filter */}
        <div className="filter-container">
          <label htmlFor="academic-year-filter">Filter by Academic Year:</label>
          <select
            id="academic-year-filter"
            value={academicYear}
            onChange={handleFilterChange}
          >
            <option value="">All Years</option>
            <option value="2022">2022</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
          </select>
        </div>

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
                  <td>{certificate.course}</td>
                  <td>{new Date(certificate.fromDate).toLocaleDateString()}</td>
                  <td>{new Date(certificate.toDate).toLocaleDateString()}</td>
                  <td>{new Date(certificate.toDate).getFullYear()}</td>
                  <td>
                    <a
                      href={`/certificates/${certificate._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download PDF
                    </a>
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
