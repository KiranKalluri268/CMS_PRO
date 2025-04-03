import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import "../adminreport.css";

const AdminReport = () => {
  const { batchYear } = useParams();
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedAcademicYears, setSelectedAcademicYears] = useState([]);
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    let isFetching = false;

  const fetchCertificates = async () => {
    console.log("Fetching certificates...");
    console.log("Current lastEvaluatedKey:", lastEvaluatedKey);
  
    if (isFetching) return;
      isFetching = true;
      setLoading(true);
      let nextKey = lastEvaluatedKey;

      try {
        do {
      const response = await axios.get(`/api/admin/certificates`, {
        params: {
          year: batchYear,
          lastEvaluatedKey: nextKey ? JSON.stringify(nextKey) : undefined,
        },
        headers: { "x-auth-token": localStorage.getItem("authToken") },
      });
  
      console.log("API Response:", response.data);
  

      const newCertificates = response.data.certificates || [];  
      if (newCertificates.length === 0 && !response.data.lastEvaluatedKey) {
        console.log("No more certificates to fetch.");
        setLastEvaluatedKey(null);
        break;
      }

      setCertificates((prevCertificates) => [...prevCertificates, ...newCertificates]);
      setFilteredCertificates((prevFiltered) => [...prevFiltered, ...newCertificates]);
  
      console.log("Total certificates loaded:", newCertificates.length);

      const uniqueYears = [...new Set([...years, ...newCertificates.map(c => getAcademicYear(c.toDate))])];
      setYears(uniqueYears);

      nextKey = response.data.lastEvaluatedKey || null;
      setLastEvaluatedKey(nextKey);
    } while (nextKey);
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
      isFetching = false;
    }
  };

  fetchCertificates();
  }, [batchYear, navigate]);
  

  // Function to toggle filter selection
  const toggleFilter = (filter, setFilterState) => {
    setFilterState((prevFilters) =>
      prevFilters.includes(filter)
        ? prevFilters.filter((f) => f !== filter) // Unselect if already selected
        : [...prevFilters, filter] // Select if not already selected
    );
  };

  // Apply filters dynamically
  useEffect(() => {
    let filtered = certificates;

    if (selectedTypes.length > 0) {
      filtered = filtered.filter((c) => selectedTypes.includes(c.type || "N/A"));
    }
    if (selectedAcademicYears.length > 0) {
      filtered = filtered.filter((c) => selectedAcademicYears.includes(getAcademicYear(c.toDate)));
    }
    if (selectedGenders.length > 0) {
      filtered = filtered.filter((c) => selectedGenders.includes(c.student.gender || "N/A"));
    }

    setFilteredCertificates(filtered);
  }, [selectedTypes, selectedAcademicYears, selectedGenders, certificates]);
  

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

  const getAcademicYear = (date) => {
    const toDate = new Date(date);
    const year = toDate.getFullYear();
    const month = toDate.getMonth() + 1;
  
    return month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  const calculateDuration = (fromDate, toDate) => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
  
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      let prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    let weeks = Math.floor(days / 7);
    days = days % 7;

    let durationStr = [];
    if (years > 0) durationStr.push(`${years} year${years > 1 ? "s" : ""}`);
    if (months > 0) durationStr.push(`${months} month${months > 1 ? "s" : ""}`);
    if (weeks > 0) durationStr.push(`${weeks} week${weeks > 1 ? "s" : ""}`);
    if (days > 0) durationStr.push(`${days} day${days > 1 ? "s" : ""}`);
  
    return durationStr.length > 0 ? durationStr.join("-") : "0 days";
  };

  const handleDownloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredCertificates.map((certificate, index) => ({
        SNo: index + 1,
        RollNo: certificate.student.rollNumber,
        Name: certificate.student.name,
        Gender: certificate.student.gender,
        Organisation: certificate.organisation,
        Course: certificate.course,
        FromDate: new Date(certificate.fromDate).toLocaleDateString(),
        ToDate: new Date(certificate.toDate).toLocaleDateString(),
        AcademicYear: getAcademicYear(certificate.toDate),
        Duration: calculateDuration(certificate.fromDate, certificate.toDate),
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
  <h3>Filters:</h3>

  {/* Certificate Types */}
  <div className="filter-group">
            <strong>Certificate Types:</strong>
            {Array.from(new Set(certificates.map(c => c.type || "N/A"))).map((type) => (
              <span
                key={type}
                className={`filter-option ${selectedTypes.includes(type) ? "active-filter" : ""}`}
                onClick={() => toggleFilter(type, setSelectedTypes)}
              >
                {type}
              </span>
            ))}
          </div>

  {/* Academic Years */}
  <div className="filter-group">
            <strong>Academic Years:</strong>
            {years.map((year) => (
              <span
                key={year}
                className={`filter-option ${selectedAcademicYears.includes(year) ? "active-filter" : ""}`}
                onClick={() => toggleFilter(year, setSelectedAcademicYears)}
              >
                {year}
              </span>
            ))}
          </div>

          {/* Genders */}
          <div className="filter-group">
            <strong>Genders:</strong>
            {Array.from(new Set(certificates.map(c => c.student.gender || "N/A"))).map((gender) => (
              <span
                key={gender}
                className={`filter-option ${selectedGenders.includes(gender) ? "active-filter" : ""}`}
                onClick={() => toggleFilter(gender, setSelectedGenders)}
              >
                {gender}
              </span>
            ))}
          </div>
        </div>
<br/>

<button className="download-report-btn" onClick={handleDownloadExcel}>
          Download Report as Excel
        </button>

        {filteredCertificates.length > 0 ? (
  <div className="table-wrapper">
    <table className="report-table">
      <thead>
        <tr>
          <th>S.No</th>
          <th>Roll No</th>
          <th>Name</th>
          <th>Gender</th>
          <th>Title of the event</th>
          <th>Organised by</th>
          <th>From</th>
          <th>To</th>
          <th>Academic Year</th>
          <th>Duration</th>
          <th>Download</th>
        </tr>
      </thead>
      <tbody>
        {filteredCertificates.map((certificate, index) => (
          <tr key={certificate.certificateId}>
            <td>{index + 1}</td>
            <td>{certificate.student.rollNumber}</td>
            <td>{certificate.student.name}</td>
            <td>{certificate.student.gender}</td>
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
            <td>{getAcademicYear(certificate.toDate)}</td>
            <td>{calculateDuration(certificate.fromDate, certificate.toDate)}</td>
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
) : !loading && <p>No certificates found for this batch.</p>}

{loading && <p>Loading certificates...</p>}
      </div>
      <footer className="Adminreport-footer">
        <p>&copy; 2024 Vaagdevi Colleges. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default AdminReport;