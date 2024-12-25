const express = require("express");
const {
  uploadCertificate,
  getCertificatesByStudent,
  getCertificateById,
  updateCertificate,
  deleteCertificate,
} = require("../controllers/certificateController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({ storage });
const router = express.Router();

// Route to upload a certificate PDF
router.post("/upload", authMiddleware.authenticate, upload.single("pdf"), uploadCertificate);

// Route to get certificates by student ID
router.get("/student/:id", authMiddleware.authenticate, getCertificatesByStudent);

// Route to get a certificate by ID
router.get("/certificates/:id", getCertificateById);

// Route to update a certificate
router.put("/certificates/:id", upload.single("pdf"), updateCertificate);

// Route to delete a certificate by ID
router.delete("/certificates/:id", authMiddleware.authenticate, deleteCertificate);

module.exports = router,upload;
