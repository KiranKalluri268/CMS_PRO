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
      _id: item.batchId, // Adjust based on your table's attribute names
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
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ message: "Year is required" });
    }

    // Fetch the batch to get the list of student IDs
    const batchParams = {
      TableName: process.env.BATCHES_TABLE, // Replace with your batches table name
      Key: { year },
    };

    const batchResponse = await dynamoDB.send(new GetCommand(batchParams));

    if (!batchResponse.Item) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const studentIds = batchResponse.Item.students || []; // Assume students are stored as an array of IDs
    if (studentIds.length === 0) {
      return res.status(200).json({ message: "No students found in this batch", certificates: [] });
    }

    console.log(`Batch for year ${year} contains students:`, studentIds);
    // Fetch certificates for the students in this batch using the studentId-index
    let certificates = [];

    // Query certificates for each studentId individually
    for (const studentId of studentIds) {
      const certificateParams = {
        TableName: process.env.CERTIFICATES_TABLE,
        IndexName: "studentId-index", // Use the existing GSI for studentId
        KeyConditionExpression: "studentId = :studentId", // Query by a single studentId
        ExpressionAttributeValues: {
          ":studentId": studentId, // Pass the current studentId
        },
      };

      const certificateResponse = await dynamoDB.send(new QueryCommand(certificateParams));
      const studentCertificates = certificateResponse.Items || [];

      // Fetch student details from Users table and add it to the certificate
      for (const certificate of studentCertificates) {
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

        certificates.push(certificate); // Add the populated certificate
      }
    }

    if (certificates.length === 0) {
      return res.status(200).json({ message: "No certificates found for this batch", certificates: [] });
    }

    console.log(`Certificates retrieved for year ${year}:`, certificates);

    res.status(200).json({
      success: true,
      year,
      certificates,
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ message: "Error fetching certificates" });
  }
};

module.exports = {
  getBatches,
  getCertificatesByBatch,
};