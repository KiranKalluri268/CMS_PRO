const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const certificateRoutes = require("./routes/certificates");
const batchRoutes = require("./routes/batches");
const adminRoutes = require("./routes/admin");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const path = require("path");

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, "/uploads")));
//app.use('/uploads', express.static(path.join(__dirname, "/uploads")));
app.use(cors({
  origin: process.env.BASE_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Enable cookies if needed
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(error => console.log('Error connecting to MongoDB:', error));

// Root Route - To Fix "Cannot GET /" Error
app.get('/', (req, res) => {
  res.send('Welcome to the Certificate Management System API');
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/admin", adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Server is ready to send messages:", success);
  }
});







