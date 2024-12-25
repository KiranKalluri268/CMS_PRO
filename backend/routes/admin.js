const express = require("express");
const router = express.Router();
const { getBatches, getCertificatesByBatch } = require("../controllers/adminController");
const { authenticate, adminOnly } = require("../middleware/authMiddleware");

// Route to fetch all batches (Admin only)
router.get("/batches", authenticate, adminOnly, getBatches);

// Route to fetch certificates for a specific batch (Admin only)
router.get("/certificates", authenticate, adminOnly, getCertificatesByBatch);

module.exports = router;
