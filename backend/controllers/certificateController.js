const Certificate = require("../models/Certificate");
const Year = require("../models/Year");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const User = require("../models/User"); // To find the student by roll number

exports.updateCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { organisation, course, fromDate, toDate } = req.body;

    // Find the existing certificate
    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return res.status(404).json({ msg: 'Certificate not found' });
    }

    // Update fields
    certificate.organisation = organisation;
    certificate.course = course;
    certificate.fromDate = fromDate;
    certificate.toDate = toDate;

    // Handle file upload if provided
    if (req.file) {
      console.log("New file uploaded:", req.file.filename);

      // Delete the old file if it exists
      if (certificate.pdf) {
        const oldFilePath = path.join(__dirname, '..', 'uploads' , certificate.pdf);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log("Old file deleted successfully");
        }
      }
      certificate.pdf = `uploads/${req.file.filename}`;
      console.log("Updated PDF field in database:", certificate.pdf);
    }

    await certificate.save();

    res.status(200).json({ message: 'Certificate updated successfully', certificate });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Fetch certificates for a specific student
exports.getCertificatesByStudent = async (req, res) => {
  try {
    // Find student by roll number
    const student = await User.findOne({ rollNumber: req.params.rollNumber });

    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }else{console.log('student fount:',student);}

    // Fetch certificates for the student
    const certificates = await Certificate.find({ student: student.rollNumber });

    // Add pdfUrl to each certificate to make it accessible
    const certificatesWithUrls = certificates.map(cert => ({
      ...cert.toObject(),
      pdfUrl: `${req.protocol}://${req.get('host')}/${cert.pdf.replace('\\', '/')}` // Adjust path to forward slashes
    }));

    // Respond with certificates including pdfUrl
    console.log('certificates found:',certificatesWithUrls);
    res.status(200).json(certificatesWithUrls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.uploadCertificate = async (req, res) => {
  try {
    const { organisation, course, fromDate, toDate } = req.body;

    // Check if the file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const parsedFromDate = new Date(fromDate);
    const parsedToDate = new Date(toDate);

    // Helper function to calculate academic years
    const getAcademicYears = (start, end) => {
      const years = [];
      let currentYearStart = new Date(start.getFullYear(), 5, 1); // June 1 of the start year
      while (currentYearStart <= end) {
        const nextYearEnd = new Date(currentYearStart.getFullYear() + 1, 4, 31); // May 31 of the next year
        years.push(`${currentYearStart.getFullYear()}-${currentYearStart.getFullYear() + 1}`);
        currentYearStart = new Date(currentYearStart.getFullYear() + 1, 5, 1); // Move to next academic year start
      }
      return years;
    };

    const academicYears = getAcademicYears(parsedFromDate, parsedToDate);

    // Create a new certificate entry
    const certificate = new Certificate({
      organisation,
      course,
      fromDate,
      toDate,
      pdf: req.file.path,
      student: req.userId,
    });

    // Process academic years
    const yearIds = [];
    for (const year of academicYears) {
      let academicYear = await Year.findOne({ year });
      if (!academicYear) {
        academicYear = new Year({ year, certificates: [] });
        await academicYear.save();
      }

      // Add the certificate to the academic year's certificates list
      if (!academicYear.certificates.includes(certificate._id)) {
        academicYear.certificates.push(certificate._id);
        await academicYear.save();
      }

      yearIds.push(academicYear._id); // Keep track of academic year IDs
    }

    // Update certificate with academic years
    certificate.year = yearIds;
    await certificate.save();

    res.status(201).json({ certificate });
  } catch (error) {
    console.error("Error uploading certificate:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCertificateById = async (req, res) => {
  try {
    // Log the entire params object to debug
    console.log('Request parameters:', req.params);
    const { id } = req.params;
    console.log('ID in controller:', id);

    if (!id) {
      return res.status(400).json({ msg: 'No ID provided' });
    }

    const certificate = await Certificate.findById(id);

    if (!certificate) {
      return res.status(404).json({ msg: 'Certificate not found' });
    }

    res.status(200).json(certificate);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};
