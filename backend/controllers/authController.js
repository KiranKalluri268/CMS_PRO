const { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const { addItem } = require("../util/dynamodb");  // Import the addItem function
const dynamoDB = require("../util/dynamodb").dynamoDB;

//console.log("access key",process.env.AWS_ACCESS_KEY_ID);
//console.log("secret key",process.env.AWS_SECRET_ACCESS_KEY);

const USERS_TABLE = process.env.USERS_TABLE || "Users";
const BATCHES_TABLE = process.env.BATCHES_TABLE || "Batches";
const VERIFICATION_TOKENS_TABLE = process.env.VERIFICATION_TOKENS_TABLE || "VerificationTokens";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: 'certificatesmanagement.verify@gmail.com',
    pass: 'ztyz ojtk wfvm asgj',
  },
});

// Register Function
exports.register = async (req, res) => {
  try {
    const { name, rollNumber, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const year = "20" + rollNumber.substring(0, 2);

    // Check if batch exists
    console.log(marshall)
    const batchParams = {
      TableName: BATCHES_TABLE,
      Key: marshall({ year }),
    };
    const batchData = await dynamoDB.send(new GetItemCommand(batchParams));

    if (!batchData.Item) {
      // Create new batch if it doesn't exist
      const newBatch = {
        year,
        students: [],
      };
      await addItem(BATCHES_TABLE, newBatch);  // Use addItem function
    }

    // Create the new user
    const userId = uuidv4();
    const newUser = {
      userId,
      name,
      rollNumber,
      email,
      password: hashedPassword,
      role: "student",
      batchYear: year,
      isVerified: false,
    };
    await addItem(USERS_TABLE, newUser);  // Use addItem function

    // Add user to batch
    const updateBatchParams = {
      TableName: BATCHES_TABLE,
      Key: marshall({ year }),
      UpdateExpression: "SET students = list_append(if_not_exists(students, :emptyList), :newStudent)",
      ExpressionAttributeValues: marshall({
        ":emptyList": [],
        ":newStudent": [userId],
      }),
    };
    await dynamoDB.send(new UpdateItemCommand(updateBatchParams));

    // Create email verification token
    const token = crypto.randomBytes(32).toString("hex");
    const verificationToken = {
      token,
      userId,
    };
    await addItem(VERIFICATION_TOKENS_TABLE, verificationToken);  // Use addItem function

    // Send verification email
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
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

    const tokenParams = {
      TableName: VERIFICATION_TOKENS_TABLE,
      Key: marshall({ token }),
    };
    const tokenData = await dynamoDB.send(new GetItemCommand(tokenParams));
    if (!tokenData.Item) {
      return res.status(400).send({ message: "Invalid or expired token" });
    }

    const userParams = {
      TableName: USERS_TABLE,
      Key: marshall({ userId: unmarshall(tokenData.Item).userId }),
    };
    const userData = await dynamoDB.send(new GetItemCommand(userParams));
    if (!userData.Item) {
      return res.status(404).send({ message: "User not found" });
    }

    const updateUserParams = {
      TableName: USERS_TABLE,
      Key: marshall({ userId: unmarshall(tokenData.Item).userId }),
      UpdateExpression: "SET isVerified = :true",
      ExpressionAttributeValues: marshall({
        ":true": true,
      }),
    };
    await dynamoDB.send(new UpdateItemCommand(updateUserParams));

    // Remove used token
    const deleteTokenParams = {
      TableName: VERIFICATION_TOKENS_TABLE,
      Key: marshall({ token }),
    };
    await dynamoDB.send(new DeleteItemCommand(deleteTokenParams));

    res.send({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("Error during email verification:", error);
    res.status(500).send({ message: "Email verification failed", error });
  }
};

// Login Function
exports.login = async (req, res) => {
  try {
    const { rollNumber, password } = req.body;

    if (!rollNumber || !password) {
      return res.status(400).send({ message: "Roll number and password are required" });
    }

    const userParams = {
      TableName: USERS_TABLE,
      IndexName: "rollNumberIndex",
      KeyConditionExpression: "rollNumber = :rollNumber",
      ExpressionAttributeValues: marshall({
        ":rollNumber": rollNumber,
      }),
      //ProjectionExpression: "userId, name, role, isVerified",
    };
    const userData = await dynamoDB.send(new QueryCommand(userParams));

    if (userData.Items.length === 0) {
      return res.status(401).send({ message: "Invalid credentials" });
    }

    const user = unmarshall(userData.Items[0]);
    console.log("User object retrieved from DynamoDB:", user);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).send({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).send({ message: "Please verify your email before logging in." });
    }

    const token = jwt.sign(
      { userId: user.userId,userRollnumber: user.rollNumber, userName: user.name, userRole: user.role },
      "secret_key_of_cms",
      { expiresIn: "1h" }
    );

    const decodedToken = jwt.decode(token); // Debugging to check token payload
    console.log("Decoded token in login:", decodedToken);

    res.status(200).send({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ message: "Login failed due to server error", error });
  }
};
