const express = require("express");
const router = express.Router();
const { getBatches, getCertificatesByBatch, getAllCertificates } = require("../controllers/adminController");
const { authenticate, adminOnly } = require("../middleware/authMiddleware");

// Route to fetch all batches (Admin only)
router.get("/batches", authenticate, adminOnly, getBatches);

// Route to fetch certificates for a specific batch (Admin only)
router.get("/certificates", authenticate, adminOnly, getCertificatesByBatch);

router.get("/allcertificates", authenticate, adminOnly, getAllCertificates);

module.exports = router;
