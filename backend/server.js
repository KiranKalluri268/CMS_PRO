const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const certificateRoutes = require("./routes/certificates");
const adminRoutes = require("./routes/admin");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const path = require("path");
const { DynamoDBDocumentClient, GetCommand, PutCommand,UpdateCommand } = require("@aws-sdk/lib-dynamodb"); // AWS SDK v3 Document Client
const { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const Cloudinary = require('cloudinary').v2;
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');//temp

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
const USERS_TABLE = process.env.USERS_TABLE || "Users";//temp


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
app.use("/api/admin", adminRoutes);  // For admin functionalities
//temporary
app.post("/api/update-gender", async (req, res) => {
  try {
    const { userId, gender } = req.body; // Ensure you're sending `userId`

    if (!userId || !gender) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const params = {
      TableName: USERS_TABLE,
      Key: { userId: { S: userId } },  // Use correct primary key
      UpdateExpression: "SET gender = :gender",
      ExpressionAttributeValues: { ":gender": { S: gender } }, // Ensure correct format
    };

    await dynamoDB.send(new UpdateItemCommand(params));

    res.status(200).json({ message: "Gender updated successfully!" });
  } catch (error) {
    console.error("Error updating gender:", error);
    res.status(500).json({ message: "Failed to update gender", error });
  }
});
//
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