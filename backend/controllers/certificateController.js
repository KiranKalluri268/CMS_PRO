const cloudinary = require('cloudinary').v2;
const {
  uploadFile,
  getResource,
  deleteResource,
} = require("../util/cloudinary");
const {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');
const {QueryCommand, DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });

const USERS_TABLE = process.env.USERS_TABLE || "Users";
const YEARS_TABLE = process.env.YEARS_TABLE || "Years";
const CERTIFICATES_TABLE = process.env.CERTIFICATES_TABLE || "Certificates";

// Update a certificate
exports.updateCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields = req.body; // Get all fields to update from the request body

    // Fetch existing certificate from DynamoDB
    const existingCertificateResponse = await dynamoDB.send(
      new GetCommand({
        TableName: CERTIFICATES_TABLE,
        Key: { certificateId: id },
      })
    );

    if (!existingCertificateResponse.Item) {
      return res.status(404).json({ message: "Certificate not found." });
    }

    const existingCertificate = (existingCertificateResponse.Item);

    let pdfId = existingCertificate.pdfId;
    let downloadLink = existingCertificate.downloadLink;

    // Replace existing PDF in Cloudinary if a new file is uploaded
    if (req.file) {
      console.log("Replacing existing PDF in Cloudinary...");

      const metadata = {
        studentId: existingCertificate.studentId,
        organisation: updatedFields.organisation || existingCertificate.organisation,
        course: updatedFields.course || existingCertificate.course,
        fromDate: updatedFields.fromDate || existingCertificate.fromDate,
        toDate: updatedFields.toDate || existingCertificate.toDate,
      };

      const uploadResponse = await uploadFile(req.file.buffer, metadata, pdfId);
      pdfId = String(uploadResponse.public_id);
      downloadLink = uploadResponse.secure_url;
    }

    // Dynamically build update expression and values based on provided fields
    const updateFields = [];
    const updateValues = {};
    const expressionAttributeNames = {};

    // Loop through each field in the request body and build the update expression
    for (const [key, value] of Object.entries(updatedFields)) {
      if (value) {
        const placeholder = `#${key}`;
        updateFields.push(`${placeholder} = :${key}`);
        updateValues[`:${key}`] = value;
        expressionAttributeNames[placeholder] = key;
      }
    }

    // Always update the pdfId and downloadLink
    if (pdfId) {
      updateFields.push('#pdfId = :pdfId');
      updateValues[':pdfId'] = pdfId;
      expressionAttributeNames['#pdfId'] = 'pdfId';
    }
    if (downloadLink) {
      updateFields.push('#downloadLink = :downloadLink');
      updateValues[':downloadLink'] = downloadLink;
      expressionAttributeNames['#downloadLink'] = 'downloadLink';
    }

    // Ensure there's something to update
    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields provided for update." });
    }

    // Execute the update command
    const updateCommand = new UpdateCommand({
      TableName: CERTIFICATES_TABLE,
      Key: { certificateId: id },
      UpdateExpression: `SET ${updateFields.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: (updateValues),
      ReturnValues: "ALL_NEW", // Return the updated item
    });

    const updatedCertificateResponse = await dynamoDB.send(updateCommand);
    const updatedCertificate = (updatedCertificateResponse.Attributes);

    res.status(200).json({
      message: "Certificate updated successfully.",
      certificate: updatedCertificate,
    });
  } catch (error) {
    console.error("Error updating certificate:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Fetch certificates for a specific student
exports.getCertificatesByStudent = async (req, res) => {
  const studentId = req.studentId;

  try {
    const response = await dynamoDB.send(
      new QueryCommand({
        TableName: CERTIFICATES_TABLE,
        IndexName: "studentId-index",
        KeyConditionExpression: "studentId = :studentId",
        ExpressionAttributeValues: marshall({
          ":studentId": studentId,
        }),
      })
    );

    const certificates = response.Items.map(item => unmarshall(item));

    if (certificates.length === 0) {
      return res.status(404).json({ message: "No certificates found for this student." });
    }

    res.status(200).json(certificates);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to upload a certificate
exports.uploadCertificate = async (req, res) => {
  try {
    const { organisation, course, fromDate, toDate, certificateLink } = req.body;

    // Check if at least one of `req.file` or `certificateLink` is provided
    if (!req.file && !certificateLink) {
      return res.status(400).json({ message: "Please provide either a PDF or a certificate link." });
    }

    const metadata = {
      studentId: req.studentId?.toString() || "",
      organisation: organisation || "",
      course: course || "",
      fromDate: fromDate?.toString() || "",
      toDate: toDate?.toString() || "",
    };

    let pdfId = null;
    let downloadLink = null;

    // Upload the PDF if provided
    if (req.file) {
      const uploadResponse = await uploadFile(req.file.buffer, metadata);
      pdfId = String(uploadResponse.public_id); // Ensure pdfId is a string
      downloadLink = uploadResponse.secure_url;
      console.log("Uploaded PDF with Cloudinary public_id:", pdfId);
    }

    console.log("Item being sent to DynamoDB:", {
      certificateId: pdfId || null, // Use `null` if no PDF is uploaded
      studentId: metadata.studentId,
      organisation,
      course,
      fromDate,
      toDate,
      downloadLink: downloadLink || null, // Use `null` if no PDF is uploaded
      certificateLink: certificateLink || "", // Optional link from frontend
    });

    // Store certificate in the Certificates table
    await dynamoDB.send(new PutCommand({
      TableName: CERTIFICATES_TABLE,
      Item: {
        certificateId : pdfId || `cert-${Date.now()}`,
        studentId: metadata.studentId,
        organisation,
        course,
        fromDate,
        toDate,
        ...(downloadLink ? { downloadLink: downloadLink } : {}), // Include only if downloadLink exists
        ...(certificateLink ? { certificateLink: certificateLink } : {}), // Include only if certificateLink exists
      },
    }));

    const academicYears = getAcademicYears(new Date(fromDate), new Date(toDate));
    for (const year of academicYears) {
      console.log("Processing year:", year);

      // Fetch the year record
      const yearRecord = await dynamoDB.send(new GetCommand({
        TableName: YEARS_TABLE,
        Key: { year: year },
      }));

      if (!yearRecord.Item) {
        // Create a new year if it doesn't exist
        console.log("Year not found, creating new year record:", year);
        await dynamoDB.send(new PutCommand({
          TableName: YEARS_TABLE,
          Item: {
            year: year,
            certificates: [pdfId].filter(Boolean), // Add pdfId only if it exists
          },
        }));
      } else {
        const existingData = yearRecord.Item;
        if (pdfId) {
          const updatedCertificates = existingData.certificates || [];
          if (!updatedCertificates.includes(pdfId)) {
            updatedCertificates.push(pdfId);
        
            await dynamoDB.send(new UpdateCommand({
              TableName: YEARS_TABLE,
              Key: { year: year },
              UpdateExpression: "SET certificates = :certificates",
              ExpressionAttributeValues: {
                ":certificates": updatedCertificates,
              },
            }));
          }
        }
      }
    }

    res.status(201).json({ message: "Certificate uploaded successfully", pdfId });
  } catch (error) {
    console.error("Error uploading certificate:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Controller to get a certificate by ID
exports.getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Fetching certificate details for ID:",id);

    const response = await dynamoDB.send(
      new GetCommand({
        TableName: CERTIFICATES_TABLE,
        Key: ({ certificateId: id }),
      })
    );

    if (!response.Item) {
      return res.status(404).json({ msg: "Certificate not found" });
    }

    const certificate = (response.Item);
    console.log("Fetched Certificate:",certificate);
    res.status(200).json(certificate);
  } catch (error) {
    console.error("Error fetching certificate by ID:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Controller to delete a certificate
exports.deleteCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the existing certificate from the Certificates table
    const certificateResponse = await dynamoDB.send(
      new GetCommand({
        TableName: process.env.CERTIFICATES_TABLE,
        Key: { certificateId: id },
      })
    );

    const certificate = certificateResponse.Item;

    if (!certificate) {
      return res.status(404).json({ msg: "Certificate not found" });
    }
    console.log("deleting certificate:",certificate);

    // Delete the certificate PDF from Cloudinary if it exists
    if (certificate.certificateId) {
      console.log("Deleting certificate PDF from Cloudinary:", certificate.certificateId);
      await deleteResource(certificate.certificateId);
    }

    // Delete the certificate entry from the Certificates table
    await dynamoDB.send(
      new DeleteCommand({
        TableName: process.env.CERTIFICATES_TABLE,
        Key: { certificateId: id },
      })
    );

    // Calculate the academic years using the fromDate and toDate
    const fromDate = new Date(certificate.fromDate);
    const toDate = new Date(certificate.toDate);
    const academicYears = getAcademicYears(fromDate, toDate);

    // Remove the certificate ID from the Years table for all relevant years
    for (const year of academicYears) {
      const yearKey = { year }; // Assuming the key in the Years table is 'year'

      // Fetch the current item from the Years table
      const yearItemResponse = await dynamoDB.send(
        new GetCommand({
          TableName: process.env.YEARS_TABLE,
          Key: yearKey,
        })
      );

      const yearItem = yearItemResponse.Item;

      if (yearItem && yearItem.certificates) {
        // Remove the certificate ID from the list
        const updatedCertificates = yearItem.certificates.filter(
          (certId) => certId !== id
        );

        // Update the Years table with the new list
        await dynamoDB.send(
          new UpdateCommand({
            TableName: process.env.YEARS_TABLE,
            Key: yearKey,
            UpdateExpression: "SET certificates = :certificates",
            ExpressionAttributeValues: {
              ":certificates": updatedCertificates,
            },
          })
        );
      }
    }

    res.status(200).json({ message: "Certificate deleted successfully" });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Utility function to calculate academic years
const getAcademicYears = (start, end) => {
  const years = [];
  let currentYearStart = new Date(start.getFullYear(), 5, 1);
  while (currentYearStart <= end) {
    years.push(`${currentYearStart.getFullYear()}-${currentYearStart.getFullYear() + 1}`);
    currentYearStart = new Date(currentYearStart.getFullYear() + 1, 5, 1);
  }
  return years;
};