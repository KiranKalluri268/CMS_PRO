const { DynamoDBClient, GetItemCommand, UpdateItemCommand, QueryCommand, ScanCommand  } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const { addItem } = require("../util/dynamodb");
const dynamoDB = require("../util/dynamodb").dynamoDB;

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

exports.register = async (req, res) => {
  try {
    const { name, rollNumber, email, password, gender, passoutYear } = req.body;

    const checkRollNumberParams = {
      TableName: USERS_TABLE,
      IndexName: 'rollNumberIndex',
      KeyConditionExpression: 'rollNumber = :rollNumber',
      ExpressionAttributeValues: {
        ':rollNumber': { S: rollNumber },
      },
    };
    const rollNumberResult = await dynamoDB.send(new QueryCommand(checkRollNumberParams));

    if (rollNumberResult.Items && rollNumberResult.Items.length > 0) {
      return res.status(400).send({ message: 'Roll number already exists.' });
    }

    const checkEmailParams = {
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': { S: email },
      },
    };
    const emailResult = await dynamoDB.send(new QueryCommand(checkEmailParams));

    if (emailResult.Items && emailResult.Items.length > 0) {
      return res.status(400).send({ message: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = uuidv4();
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const newUser = {
      userId,
      name,
      rollNumber,
      gender,
      email,
      password: hashedPassword,
      role: "student",
      passoutYear,
      isVerified: false,
      CreatedTime: timestamp,
    };
    await addItem(USERS_TABLE, newUser);

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const verificationToken = {
      token,
      userId,
      expiresAt: expiresAt.toISOString(),
      isUsed: false,
    };
    await addItem(VERIFICATION_TOKENS_TABLE, verificationToken);

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

    const { userId, expiresAt, isUsed } = unmarshall(tokenData.Item);

    if (isUsed) {
      return res.status(400).send({ message: "This email has already been verified." });
    }

    if (new Date() > new Date(expiresAt)) {
      return res.status(400).send({ message: "Verification link has expired." });
    }

    const userParams = {
      TableName: USERS_TABLE,
      Key: marshall({ userId }),
    };
    const userData = await dynamoDB.send(new GetItemCommand(userParams));

    if (!userData.Item) {
      return res.status(404).send({ message: "User not found" });
    }

    const user = unmarshall(userData.Item);
    const passoutYear = user.passoutYear;

    const updateUserParams = {
      TableName: USERS_TABLE,
      Key: marshall({ userId }),
      UpdateExpression: "SET isVerified = :isVerified",
      ExpressionAttributeValues: marshall({
        ":isVerified": true,
      }),
    };
    await dynamoDB.send(new UpdateItemCommand(updateUserParams));

    const batchParams = {
      TableName: BATCHES_TABLE,
      Key: marshall({ year: passoutYear }),
    };
    const batchData = await dynamoDB.send(new GetItemCommand(batchParams));

    if (!batchData.Item) {
      const newBatch = {
        year: passoutYear,
        students: [userId],
      };
      await addItem(BATCHES_TABLE, newBatch);
    } else {
      const updateBatchParams = {
        TableName: BATCHES_TABLE,
        Key: marshall({ year: passoutYear }),
        UpdateExpression: "SET students = list_append(if_not_exists(students, :emptyList), :newStudent)",
        ExpressionAttributeValues: marshall({
          ":emptyList": [],
          ":newStudent": [userId],
        }),
      };
      await dynamoDB.send(new UpdateItemCommand(updateBatchParams));
    }

    const updateTokenParams = {
      TableName: VERIFICATION_TOKENS_TABLE,
      Key: marshall({ token }),
      UpdateExpression: "SET isUsed = :isUsed",
      ExpressionAttributeValues: marshall({
        ":isUsed": true,
      }),
    };
    await dynamoDB.send(new UpdateItemCommand(updateTokenParams));

    res.send({ message: "Email verified successfully! Batch assigned." });
  } catch (error) {
    console.error("Error during email verification:", error);
    res.status(500).send({ message: "Email verification failed", error });
  }
};

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
      { userId: user.userId,userRollnumber: user.rollNumber, userName: user.name, userRole: user.role, userGender: user.gender, userPassout: user.passoutYear },
      "secret_key_of_cms",
      { expiresIn: "1h" }
    );

    const decodedToken = jwt.decode(token);
    console.log("Decoded token in login:", decodedToken);

    res.status(200).send({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ message: "Login failed due to server error", error });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.studentId;

    const params = {
      TableName: USERS_TABLE,
      Key: marshall({ userId }),
    };

    const result = await dynamoDB.send(new GetItemCommand(params));

    if (!result.Item) {
      return res.status(404).send({ message: "User not found" });
    }

    const user = unmarshall(result.Item);
    delete user.password;

    res.status(200).send(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).send({ message: "Error fetching user details", error });
  }
};

// Update User Details
exports.updateUser = async (req, res) => {
  try {
    const userId = req.studentId;
    const { name, gender, passoutYear, password } = req.body;
    
    let updateExpression = "SET #name = :name, gender = :gender, passoutYear = :passoutYear";
    let expressionValues = {
      ":name": name,
      ":gender": gender,
        ":passoutYear": passoutYear,
    };
    let expressionNames = {
      "#name": "name",
    };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateExpression += ", password = :password";
      expressionValues[":password"] = hashedPassword;
    }

    const params = {
      TableName: USERS_TABLE,
      Key: marshall({ userId }),
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: marshall(expressionValues),
      ExpressionAttributeNames: expressionNames,
    };
    
    await dynamoDB.send(new UpdateItemCommand(params));    

    res.status(200).send({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send({ message: "Profile update failed", error });
  }
};

exports.requestVerificationLink = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const checkEmailParams = {
      TableName: USERS_TABLE,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: marshall({
        ":email": email,
      }),
    };

    const emailResult = await dynamoDB.send(new QueryCommand(checkEmailParams));

    if (!emailResult.Items || emailResult.Items.length === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    const user = unmarshall(emailResult.Items[0]);
    if (user.isVerified) {
      return res.status(400).send({ message: "This email is already verified." });
    }

    const checkTokenParams = {
      TableName: VERIFICATION_TOKENS_TABLE,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: marshall({
        ":userId": user.userId,
      }),
    };
    const tokenResult = await dynamoDB.send(new ScanCommand(checkTokenParams));

    if (tokenResult.Items && tokenResult.Items.length > 0) {
      for (const item of tokenResult.Items) {
        const tokenItem = unmarshall(item);
        if (!tokenItem.isUsed) {
          const updateTokenParams = {
            TableName: VERIFICATION_TOKENS_TABLE,
            Key: marshall({ token: tokenItem.token }),
            UpdateExpression: "SET isUsed = :isUsed",
            ExpressionAttributeValues: marshall({
              ":isUsed": true,
            }),
          };
          await dynamoDB.send(new UpdateItemCommand(updateTokenParams));
        }
      }
    }

    const newToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newVerificationToken = {
      token: newToken,
      userId: user.userId,
      expiresAt: expiresAt.toISOString(),
      isUsed: false,
    };

    await addItem(VERIFICATION_TOKENS_TABLE, newVerificationToken);

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/verify-email?token=${newToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Resend: Verify your email",
      html: `<p>Hello ${user.name},</p>
             <p>You requested a new verification link. Click the link below to verify your email:</p>
             <a href="${verificationUrl}">${verificationUrl}</a>
             <p>If you didn't request this, please ignore this email.</p>`,
    });

    res.status(200).send({ message: "A new verification link has been sent to your email." });

  } catch (error) {
    console.error("Error sending verification link:", error);
    res.status(500).send({ message: "Failed to resend verification link", error });
  }
};