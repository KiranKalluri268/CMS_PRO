const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { dynamoDB } = require("../util/dynamodb");
const { GetCommand, QueryCommand, PutCommand, ScanCommand, BatchGetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb"); // Import DynamoDB commands

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  // Check if user exists
  const userParams = {
    TableName: process.env.USERS_TABLE,
    IndexName: "email-index",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: { ":email": email },
  };

  const userResponse = await dynamoDB.send(new QueryCommand(userParams));
  const user = userResponse.Items?.[0];

  if (!user) return res.status(404).json({ message: "User not found" });

  // Generate reset token
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  // Save token to database
  const tokenParams = {
    TableName: process.env.PASSWORD_RESET_TABLE,
    Item: {
      userId: user.userId,
      resetToken: token,
      expiresAt: expiresAt.toISOString(),
      isUsed: false,
    },
  };
  await dynamoDB.send(new PutCommand(tokenParams));

  // Send reset link via email
  const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}`;
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    to: email,
    subject: "Password Reset Request",
    text: `Click the link to reset your password: ${resetLink}`,
  });

  return res.status(200).json({ message: "Reset link sent to your email." });
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
  
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }
  
    // Validate token
    const tokenParams = {
      TableName: process.env.PASSWORD_RESET_TABLE,
      IndexName: "resetToken-index",  // Use the GSI with resetToken as partition key
      KeyConditionExpression: "#resetToken = :token", // Query by resetToken
      ExpressionAttributeNames: {
        "#resetToken": "resetToken",  // Alias for resetToken
      },
      ExpressionAttributeValues: {
        ":token": token, // The token value
      },
    };
  
    const tokenResponse = await dynamoDB.send(new QueryCommand(tokenParams));
    const tokenRecord = tokenResponse.Items?.[0];
  
    if (!tokenRecord) return res.status(400).json({ message: "Invalid or expired token" });
  
    const { userId, expiresAt, isUsed } = tokenRecord;
  
    if (isUsed || new Date() > new Date(expiresAt)) {
      return res.status(400).json({ message: "Token is no longer valid" });
    }
  
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
  
    // Update user's password
    const updateUserParams = {
      TableName: process.env.USERS_TABLE,
      Key: { userId },
      UpdateExpression: "SET password = :password",
      ExpressionAttributeValues: { ":password": hashedPassword },
    };
  
    await dynamoDB.send(new UpdateCommand(updateUserParams));
  
    // Mark token as used
    const updateTokenParams = {
      TableName: process.env.PASSWORD_RESET_TABLE,
      Key: { resetToken: token },
      UpdateExpression: "SET isUsed = :isUsed",
      ExpressionAttributeValues: { ":isUsed": true },
    };
  
    await dynamoDB.send(new UpdateCommand(updateTokenParams));
  
    return res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "An error occurred. Please try again later." });
  }
};