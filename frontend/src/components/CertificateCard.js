import React from 'react';

const CertificateCard = ({ cert }) => {
  return (
    <div className="certificate-card">
      <p>{cert.organisation} - {cert.course}</p>
      <button>View</button>
    </div>
  );
};

export default CertificateCard;
