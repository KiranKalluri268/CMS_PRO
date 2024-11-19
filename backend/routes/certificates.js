const express = require("express");
const { uploadCertificate } = require("../controllers/certificateController");
const { getCertificatesByStudent } = require("../controllers/certificateController");
const { getCertificateById } = require('../controllers/certificateController');
const { updateCertificate } = require('../controllers/certificateController');
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });
const router = express.Router();

// Route to upload a certificate PDF
router.post("/upload", authMiddleware, upload.single("pdf"), uploadCertificate);
router.get("/student/:rollNumber", authMiddleware, getCertificatesByStudent);
router.get('/certificates/:id', getCertificateById);
router.put('/certificates/:id', upload.single('pdf'), updateCertificate);

module.exports = router;
