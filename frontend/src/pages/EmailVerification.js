import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

const VerifyEmail = () => {
  const [message, setMessage] = useState("");
  const location = useLocation();  // Get location directly from the hook

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const query = new URLSearchParams(location.search);  // Move query construction inside useEffect
        const token = query.get("token");
        const response = await axios.get(`/api/auth/verify-email?token=${token}`);
        setMessage(response.data.message);
      } catch (error) {
        setMessage(error.response?.data?.message || "Verification failed.");
      }
    };
    verifyEmail();
  }, [location.search]);  // Add location.search as the dependency to trigger the effect on location change

  return (
    <div>
      <h1>Email Verification</h1>
      <p>{message}</p>
    </div>
  );
};

export default VerifyEmail;
