document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      window.location.href = '/login.html';
    }
  
    const response = await fetch('http://localhost:5001/api/certificates', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
    });
  
    const data = await response.json();
    const certificatesContainer = document.getElementById('certificates-list');
  
    data.forEach(cert => {
      const certificateCard = document.createElement('div');
      certificateCard.classList.add('certificate-card');
      certificateCard.innerHTML = `
        <p>${cert.organisation} - ${cert.course}</p>
        <button onclick="viewCertificate('${cert._id}')">View</button>
      `;
      certificatesContainer.appendChild(certificateCard);
    });
  });
  
  function viewCertificate(certId) {
    window.location.href = `/certificate/${certId}`;
  }
  