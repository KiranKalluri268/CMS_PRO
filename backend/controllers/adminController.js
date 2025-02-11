const { dynamoDB } = require("../util/dynamodb"); // Import DynamoDB utility
const { GetCommand, QueryCommand, ScanCommand, BatchGetCommand } = require("@aws-sdk/lib-dynamodb"); // Import DynamoDB commands

// Fetch all batches
const getBatches = async (req, res) => {
  try {
    const params = {
      TableName: process.env.BATCHES_TABLE, // Replace with your batches table name
    };

    // Use ScanCommand to fetch all batches from the table
    const response = await dynamoDB.send(new ScanCommand(params));

    if (!response.Items || response.Items.length === 0) {
      return res.status(404).json({ message: "No batches found" });
    }

    const batches = response.Items.map(item => ({
      _id: item.batchId,
      year: item.year,
    }));

    res.status(200).json({ batches });
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({ error: "Server error while fetching batches" });
  }
};

// Function to get certificates by batch ID
const getCertificatesByBatch = async (req, res) => {
  try {
    const { year, limit = 20 } = req.query;
    let { lastEvaluatedKey } = req.query;
    console.log("lastEvaluatedKey in back:", lastEvaluatedKey);

    if (!year) {
      return res.status(400).json({ message: "Year is required" });
    }

    // Fetch batch details
    const batchParams = {
      TableName: process.env.BATCHES_TABLE,
      Key: { year },
    };
    const batchResponse = await dynamoDB.send(new GetCommand(batchParams));

    if (!batchResponse.Item) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const studentIds = batchResponse.Item.students || [];
    if (studentIds.length === 0) {
      return res.status(200).json({ message: "No students found in this batch", certificates: [] });
    }

    console.log(`Batch for year ${year} contains students:`, studentIds);

    // Validate lastEvaluatedKey
    try {
      lastEvaluatedKey = lastEvaluatedKey ? JSON.parse(lastEvaluatedKey) : undefined;
    } catch (err) {
      console.warn("Invalid lastEvaluatedKey received, resetting it:", lastEvaluatedKey);
      console.log("Invalid lastEvaluatedKey received, resetting it:", lastEvaluatedKey);

      lastEvaluatedKey = undefined;
    }

    // Fetch certificates
    const certificateParams = {
      TableName: process.env.CERTIFICATES_TABLE,
      IndexName: "batchYear-toDate-index",
      KeyConditionExpression: "batchYear = :batchYear",
      ExpressionAttributeValues: {
        ":batchYear": year,
      },
      Limit: Number(limit),
      ScanIndexForward: false,
      ExclusiveStartKey: lastEvaluatedKey,
    };

    console.log("Fetching certificates with params:", certificateParams);
    const certificateResponse = await dynamoDB.send(new QueryCommand(certificateParams));
    
    let certificates = certificateResponse.Items || [];
    console.log(`Certificates found:`, certificates.length);

    if (certificates.length === 0) {
      return res.status(200).json({ 
        success: true, 
        year, 
        certificates: [], 
        lastEvaluatedKey: null 
      });
    }

    // Fetch student details in batch (Optimized)
    const studentFetchPromises = certificates.map((cert) => {
      const studentParams = {
        TableName: process.env.USERS_TABLE,
        Key: { userId: cert.studentId },
      };
      return dynamoDB.send(new GetCommand(studentParams));
    });

    const studentResponses = await Promise.all(studentFetchPromises);

    certificates = certificates.map((certificate, index) => {
      const studentData = studentResponses[index]?.Item;
      if (studentData) {
        certificate.student = {
          name: studentData.name,
          rollNumber: studentData.rollNumber,
          gender: studentData.gender,
        };
      }
      return certificate;
    });

    console.log(`Returning ${certificates.length} certificates`);
    console.log("certificates",certificates);

    res.status(200).json({
      success: true,
      year,
      certificates,
      lastEvaluatedKey: certificateResponse.LastEvaluatedKey ?? null, // Ensure null instead of undefined
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ message: "Error fetching certificates" });
  }
};

// Fetch all certificates
const getAllCertificates = async (req, res) => {
  try {
    const params = {
      TableName: process.env.CERTIFICATES_TABLE, // Replace with your certificates table name
    };

    // Use ScanCommand to fetch all certificates from the table
    const response = await dynamoDB.send(new ScanCommand(params));

    if (!response.Items || response.Items.length === 0) {
      return res.status(404).json({ message: "No certificates found" });
    }

    const certificates = [];

    for (const certificate of response.Items) {
      const studentId = certificate.studentId;

      // Fetch student details from the Users table
      const studentParams = {
        TableName: process.env.USERS_TABLE, // Replace with your users table name
        Key: {
          userId: studentId, // Assuming the studentId is the same as userId
        },
      };

      const studentResponse = await dynamoDB.send(new GetCommand(studentParams));

      if (studentResponse.Item) {
        const student = studentResponse.Item;
        // Add student details (name and rollNumber) to the certificate
        certificate.student = {
          name: student.name,
          rollNumber: student.rollNumber,
        };
      }

      certificates.push(certificate);
    }

    if (certificates.length === 0) {
      return res.status(404).json({ message: "No certificates found" });
    }

    console.log("fetched certs:",certificates)

    res.status(200).json({
      success: true,
      certificates,
    });
  } catch (error) {
    console.error("Error fetching all certificates:", error);
    res.status(500).json({ message: "Error fetching all certificates" });
  }
};

module.exports = {
  getBatches,
  getCertificatesByBatch,
  getAllCertificates, // Export the new function
};