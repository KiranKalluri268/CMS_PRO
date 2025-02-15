const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, getUserDetails, updateUser, requestVerificationLink } = require('../controllers/authController');
const { requestPasswordReset, resetPassword } = require("../controllers/passwordController");
const { authenticate } = require("../middleware/authMiddleware");

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.get("/user-details", authenticate, getUserDetails);
router.put("/update", authenticate, updateUser);
router.post("/request-verification-link", requestVerificationLink);

module.exports = router;