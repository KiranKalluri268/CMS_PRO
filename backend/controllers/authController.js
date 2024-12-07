const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Batch = require("../models/Batch"); // Import Batch model
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const VerificationToken = require("../models/VerificationToken"); // New model for storing tokens

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // 'smtp.gmail.com'
  port: 587, // 587
  secure: false, // Use TLS (false for 587, true for 465)
  auth: {
    user: 'certificatesmanagement.verify@gmail.com', // Your Gmail email
    pass: 'ztyz ojtk wfvm asgj', // Your Gmail App Password
  },
});


// Register Function (Updated)
exports.register = async (req, res) => {
  try {
    const { name, rollNumber, email, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Extract batch year from rollNumber
    const year = "20" + rollNumber.substring(0, 2);

    // Find or create a batch
    let batch = await Batch.findOne({ year });
    if (!batch) {
      batch = new Batch({ year, students: [] });
      await batch.save();
    }

    // Create the new user
    const user = new User({
      name,
      rollNumber,
      email,
      password: hashedPassword,
      role: "student",
      batch: batch._id,
      isVerified: false, // Add verification flag
    });
    await user.save();

    // Add the student to the batch
    batch.students.push(user._id);
    await batch.save();

    // Create email verification token
    const token = crypto.randomBytes(32).toString("hex");
    const verificationToken = new VerificationToken({
      userId: user._id,
      token,
    });
    await verificationToken.save();

    // Dynamic URL based on environment
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';  // Default to localhost if BASE_URL is not defined
    // Send verification email
const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

await transporter.sendMail({
  from: process.env.EMAIL_FROM,
  to: user.email,
  subject: "Verify your email",
  html: `<p>Hello ${name},</p>
         <p>Please verify your email by clicking the link below:</p>
         <a href="${verificationUrl}">${verificationUrl}</a>`,
});


    res.status(201).send({ message: "Registration successful! Please verify your email." });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send({ message: "Error during registration", error });
  }
};

// Verify Email Function
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    console.log("verification token in controller:",token);
    const verificationToken = await VerificationToken.findOne({ token });
    if (!verificationToken) {
      return res.status(400).send({ message: "Invalid or expired token" });
    }

    // Mark user as verified
    const user = await User.findById(verificationToken.userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    user.isVerified = true;
    await user.save();

    // Remove used token
   // await verificationToken.deleteOne();

    res.send({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("Error during email verification:", error);
    res.status(500).send({ message: "Email verification failed", error });
  }
};



exports.login = async (req, res) => {
  try {
    const { rollNumber, password } = req.body;

    // Check if both fields are provided
    if (!rollNumber || !password) {
      return res.status(400).send({ message: "Roll number and password are required" });
    }

    // Find user by roll number
    const user = await User.findOne({ rollNumber });
    if (!user) {
      return res.status(401).send({ message: "Invalid credentials" }); // Roll number not found
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({ message: "Invalid credentials" }); // Incorrect password
    }

    // Check if the user's email is verified
    if (!user.isVerified) {
      return res.status(403).send({ message: "Please verify your email before logging in." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userRollNumber: user.rollNumber, userName: user.name, studentId: user._id, userRole: user.role },
      "secret_key_of_cms",
      { expiresIn: "1h" }
    );

    // Return success response
    res.status(200).send({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ message: "Login failed due to server error", error });
  }
};

