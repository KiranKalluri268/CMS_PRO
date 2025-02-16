import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;
const API = axios.create({
  baseURL: API_URL,
});

export const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common["x-auth-token"] = token;
  } else {
    delete API.defaults.headers.common["x-auth-token"];
  }
};

export const registerUser = (userData) => {
  return API.post("/api/auth/register", userData);
};

export const loginUser = (userData) => {
  return API.post("/api/auth/login", userData);
};

export const uploadCertificate = (data, token) => {
  return API.post("/api/certificates/upload", data, {
    headers: {
      "x-auth-token": token,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getCertificates = (studentId, token, lastEvaluatedKey) => {
  return API.get(`/api/certificates/student/${studentId}`, {
    params: {
      lastEvaluatedKey,
    },
    headers: {
      "x-auth-token": token,
    },
  });
};

export const fetchAllCertificates = (token) => {
  return API.get('/api/certificates', {
    headers: {
      "x-auth-token": token,
    },
  });
};

export const fetchBatches = () => {
  return API.get('/api/batches');
};

export const fetchStudentsByBatch = (batchId, token) => {
  return API.get(`/api/students/batch/${batchId}`, {
    headers: {
      "x-auth-token": token,
    },
  });
};

export const fetchCertificatesByYear = (year, token) => {
  return API.get(`/api/certificates/year/${year}`, {
    headers: {
      "x-auth-token": token,
    },
  });
};