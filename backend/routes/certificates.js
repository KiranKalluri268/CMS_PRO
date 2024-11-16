const express = require("express");
const { uploadCertificate } = require("../controllers/certificateController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.post("/upload", authMiddleware, upload.single("pdf"), uploadCertificate);

module.exports = router;
