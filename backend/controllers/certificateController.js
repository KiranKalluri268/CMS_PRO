const Certificate = require("../models/Certificate");
const Year = require("../models/Year");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

// Helper function to delete a file if it exists
const deleteFileIfExists = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log("File deleted successfully:", filePath);
  }
};

// Controller to update a certificate
exports.updateCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { organisation, course, fromDate, toDate } = req.body;

    // Find the existing certificate
    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return res.status(404).json({ msg: "Certificate not found" });
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
        const oldFilePath = path.join(__dirname, "..", certificate.pdf);
        deleteFileIfExists(oldFilePath);
      }
      certificate.pdf = `uploads/${req.file.filename}`;
    }

    await certificate.save();

    res.status(200).json({ message: "Certificate updated successfully", certificate });
  } catch (error) {
    console.error("Error updating certificate:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Controller to fetch certificates for a specific student
exports.getCertificatesByStudent = async (req, res) => {
  try {
    // Find student by ID
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    // Fetch certificates for the student
    const certificates = await Certificate.find({ student: student._id });

    // Add pdfUrl to each certificate if the PDF exists
    /*const certificatesWithUrls = certificates.map((cert) => ({
      ...cert.toObject(),
      pdfUrl: cert.pdf ? `${req.protocol}://${req.get("host")}/${cert.pdf.replace(/\\/g, "/")}` : null,
    }));*/

    const certificatesWithUrls = certificates.map((cert) => ({
      ...cert.toObject(),
      pdfUrl: cert.pdf ? `${req.protocol}://${req.get("host")}/uploads/${cert.pdf.replace(/\\/g, "/")}` : null,
    }));
    

    // Respond with certificates including pdfUrl
    console.log('certificates found:',certificatesWithUrls);
    res.status(200).json(certificatesWithUrls);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Controller to upload a certificate
exports.uploadCertificate = async (req, res) => {
  try {
    const { organisation, course, fromDate, toDate, certificateLink } = req.body;

    // Validate that at least one of PDF or certificate link is provided
    if (!req.file && !certificateLink) {
      return res.status(400).json({ message: "Please provide either a PDF or a certificate link." });
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
      ...(req.file && { pdf: req.file.path }),
      certificateLink,
      student: req.studentId,
    });

    // Process academic years
    const yearIds = [];
    for (const year of academicYears) {
      let academicYear = await Year.findOne({ year });
      if (!academicYear) {
        academicYear = new Year({ year, certificates: [] });
        await academicYear.save();
      }

      if (!academicYear.certificates.includes(certificate._id)) {
        academicYear.certificates.push(certificate._id);
        await academicYear.save();
      }

      yearIds.push(academicYear._id);
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

// Controller to get a certificate by ID
exports.getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ msg: "No ID provided" });
    }

    const certificate = await Certificate.findById(id);

    if (!certificate) {
      return res.status(404).json({ msg: "Certificate not found" });
    }

    res.status(200).json(certificate);
  } catch (error) {
    console.error("Error fetching certificate:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Controller to delete a certificate
exports.deleteCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await Certificate.findByIdAndDelete(id);
    if (!certificate) {
      return res.status(404).json({ msg: "Certificate not found" });
    }

    // Delete the associated PDF file if it exists
    if (certificate.pdf) {
      const filePath = path.join(__dirname, "..", certificate.pdf);
      deleteFileIfExists(filePath);
    }

    res.status(200).json({ message: "Certificate deleted successfully" });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    res.status(500).json({ msg: "Server error" });
  }
};
