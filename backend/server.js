const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const certificateRoutes = require("./routes/certificates");
const batchRoutes = require("./routes/batches");
const adminRoutes = require("./routes/admin");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const path = require("path");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");  // AWS SDK v3 client
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb"); // AWS SDK v3 Document Client
const Cloudinary = require('cloudinary').v2;

dotenv.config();

// Cloudinary Configuration (if applicable)
Cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// AWS SDK v3 Configuration for DynamoDB
const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient); // Use DynamoDBDocumentClient for working with JavaScript objects


// To verify email functionality
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
app.use('/uploads', express.static(path.join(__dirname, "/uploads"))); // If you're uploading locally
app.use(cors({
  origin: process.env.BASE_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Enable cookies if needed
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
}));

// Root Route - To Fix "Cannot GET /" Error
app.get('/', (req, res) => {
  res.send('Welcome to the Certificate Management System API');
});

// API Routes
app.use("/api/auth", authRoutes);  // For authentication (register/login)
app.use("/api/certificates", certificateRoutes);  // For certificates
app.use("/api/batches", batchRoutes);  // For batches
app.use("/api/admin", adminRoutes);  // For admin functionalities

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Verify email transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Server is ready to send messages:", success);
  }
});
