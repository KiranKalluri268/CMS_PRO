document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const organisation = document.getElementById('organisation').value;
    const course = document.getElementById('course').value;
    const fromDate = document.getElementById('from-date').value;
    const toDate = document.getElementById('to-date').value;
    const pdf = document.getElementById('pdf').files[0];
  
    const formData = new FormData();
    formData.append('organisation', organisation);
    formData.append('course', course);
    formData.append('fromDate', fromDate);
    formData.append('toDate', toDate);
    formData.append('pdf', pdf);
  
    const response = await fetch('http://localhost:5001/api/certificates/upload', {
      method: 'POST',
      headers: {
        'x-auth-token': localStorage.getItem('auth-token'),
      },
      body: formData,
    });
  
    const data = await response.json();
    if (data.certificate) {
      alert('Certificate uploaded successfully');
      window.location.href = '/homepage.html';
    } else {
      alert('Upload failed');
    }
  });
  