import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../emailverification.css";

const VerifyEmail = () => {
  const [message, setMessage] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const query = new URLSearchParams(location.search);
        const token = query.get("token");
        const response = await axios.get(`/api/auth/verify-email?token=${token}`);

        setMessage(response.data.message);
        setGifUrl("/images/verifed.gif");
        setIsVerified(true);
      } catch (error) {
        const errorMessage = error.response?.data?.message || "Verification failed.";
        setMessage(errorMessage);

        if (errorMessage === "This email has already been verified.") {
          setGifUrl("/images/verifed.gif");
          setIsVerified(true);
        } else {
          setGifUrl("/images/expired.gif");
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

      {isVerified && (
        <button className="zoom-animation" onClick={() => navigate("/")}>
          Go to Login
        </button>
      )}
    </div>
  );
};

export default VerifyEmail;
