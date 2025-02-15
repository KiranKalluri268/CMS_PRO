import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";
import "../emailverification.css";

const VerifyEmail = () => {
  const [message, setMessage] = useState("");
  const [gifUrl, setGifUrl] = useState(""); // State to store the GIF URL
  const [isVerified, setIsVerified] = useState(false); // Track successful verification
  const location = useLocation();
  const navigate = useNavigate(); // Hook to navigate to login page

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const query = new URLSearchParams(location.search);
        const token = query.get("token");
        const response = await axios.get(`/api/auth/verify-email?token=${token}`);

        setMessage(response.data.message);
        setGifUrl("/images/verifed.gif"); // Set success GIF URL
        setIsVerified(true); // Mark verification as successful
      } catch (error) {
        const errorMessage = error.response?.data?.message || "Verification failed.";
        setMessage(errorMessage);

        // Check the error message to display the appropriate GIF
        if (errorMessage === "This email has already been verified.") {
          setGifUrl("/images/verifed.gif");
          setIsVerified(true); // Already verified, allow login
        } else {
          setGifUrl("/images/expired.gif"); // Failure GIF URL
        }
      }
    };
    verifyEmail();
  }, [location.search]);

  return (
    <div className="main-email">
      <div className="gif-container zoom-animation">
        {gifUrl && (
          <img src={gifUrl} alt="Email Verification" className="verification-gif" />
        )}
      </div>
      <p className="zoom-animation">{message}</p>

      {/* Show login button only if verification is successful */}
      {isVerified && (
        <button className="zoom-animation" onClick={() => navigate("/")}>
          Go to Login
        </button>
      )}
    </div>
  );
};

export default VerifyEmail;
