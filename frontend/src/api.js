import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

// Axios instance to set default headers
const API = axios.create({
  baseURL: API_URL,
});

// Function to set Authorization header
export const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common["x-auth-token"] = token;
  } else {
    delete API.defaults.headers.common["x-auth-token"];
  }
};

// Register a new user (student)
export const registerUser = (userData) => {
  return API.post("/api/auth/register", userData);
};

// Login user (student)
export const loginUser = (userData) => {
  return API.post("/api/auth/login", userData);
};

// Upload a certificate with authentication
export const uploadCertificate = (data, token) => {
  return API.post("/api/certificates/upload", data, {
    headers: {
      "x-auth-token": token,
      "Content-Type": "multipart/form-data",
    },
  });
};

// Fetch certificates for a specific student using their roll number (Authenticated)
export const getCertificates = (studentId, token) => {
  return API.get(`/api/certificates/student/${studentId}`, {
    headers: {
      "x-auth-token": token,
    },
  });
};

// Fetch all certificates (Admin only)
export const fetchAllCertificates = (token) => {
  return API.get('/api/certificates', {
    headers: {
      "x-auth-token": token,
    },
  });
};

// Fetch list of batches
export const fetchBatches = () => {
  return API.get('/api/batches');
};

// Fetch students by batch (Admin)
export const fetchStudentsByBatch = (batchId, token) => {
  return API.get(`/api/students/batch/${batchId}`, {
    headers: {
      "x-auth-token": token,
    },
  });
};

// Fetch certificates by academic year for filtering (Admin)
export const fetchCertificatesByYear = (year, token) => {
  return API.get(`/api/certificates/year/${year}`, {
    headers: {
      "x-auth-token": token,
    },
  });
};
