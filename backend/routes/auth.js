const express = require('express');
const router = express.Router();
const { register, login, verifyEmail } = require('../controllers/authController');
const { requestPasswordReset, resetPassword } = require("../controllers/passwordController");

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

module.exports = router;
