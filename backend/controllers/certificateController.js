const cloudinary = require('cloudinary').v2;
const {
  uploadFile,
  deleteResource,
} = require("../util/cloudinary");
const {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');
const { QueryCommand, DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });

const USERS_TABLE = process.env.USERS_TABLE || "Users";
const CERTIFICATES_TABLE = process.env.CERTIFICATES_TABLE || "Certificates";

exports.updateCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields = req.body;

    const existingCertificateResponse = await dynamoDB.send(
      new GetCommand({
        TableName: CERTIFICATES_TABLE,
        Key: { certificateId: id },
      })
    );

    if (!existingCertificateResponse.Item) {
      return res.status(404).json({ message: "Certificate not found." });
    }

    const existingCertificate = existingCertificateResponse.Item;
    let pdfId = existingCertificate.pdfId;
    let downloadLink = existingCertificate.downloadLink;

    if (req.file) {
      console.log("Replacing existing PDF in Cloudinary...");
      const metadata = {
        studentId: existingCertificate.studentId,
        organisation: updatedFields.organisation || existingCertificate.organisation,
        course: updatedFields.course || existingCertificate.course,
        fromDate: updatedFields.fromDate || existingCertificate.fromDate,
        toDate: updatedFields.toDate || existingCertificate.toDate,
        type: updatedFields.type || existingCertificate.type,
      };

      const uploadResponse = await uploadFile(req.file.buffer, metadata, pdfId);
      pdfId = String(uploadResponse.public_id);
      downloadLink = uploadResponse.secure_url;
    }

    const updateFields = [];
    const updateValues = {};
    const expressionAttributeNames = {};

    for (const [key, value] of Object.entries(updatedFields)) {
      if (value) {
        const placeholder = `#${key}`;
        updateFields.push(`${placeholder} = :${key}`);
        updateValues[`:${key}`] = value;
        expressionAttributeNames[placeholder] = key;
      }
    }

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

    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    updateFields.push('#LastUpdatedTime = :LastUpdatedTime');
    updateValues[':LastUpdatedTime'] = timestamp;
    expressionAttributeNames['#LastUpdatedTime'] = 'LastUpdatedTime';

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields provided for update." });
    }

    const updateCommand = new UpdateCommand({
      TableName: CERTIFICATES_TABLE,
      Key: { certificateId: id },
      UpdateExpression: `SET ${updateFields.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: updateValues,
      ReturnValues: "ALL_NEW",
    });

    const updatedCertificateResponse = await dynamoDB.send(updateCommand);
    const updatedCertificate = updatedCertificateResponse.Attributes;

    res.status(200).json({
      message: "Certificate updated successfully.",
      certificate: updatedCertificate,
    });
  } catch (error) {
    console.error("Error updating certificate:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getCertificatesByStudent = async (req, res) => {
  const studentId = req.studentId;
  const { lastEvaluatedKey } = req.query;

  try {
    const params = {
      TableName: CERTIFICATES_TABLE,
      IndexName: "studentId-index",
      KeyConditionExpression: "studentId = :studentId",
      ExpressionAttributeValues: marshall({
        ":studentId": studentId,
      }),
      Limit: 10,
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(lastEvaluatedKey);
    }

    const response = await dynamoDB.send(new QueryCommand(params));

    const certificates = response.Items.map(item => unmarshall(item));

    res.status(200).json({
      certificates,
      lastEvaluatedKey: response.LastEvaluatedKey ? JSON.stringify(response.LastEvaluatedKey) : null,
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.uploadCertificate = async (req, res) => {
  try {
    const { organisation, course, fromDate, toDate, certificateLink, type } = req.body;
    console.log("received in backend:",req.body)

    if (!req.studentId) {
      return res.status(400).json({ message: "Student ID not Found. Please Login again." });
    }

    if (!type) {
      return res.status(400).json({ message: "Certificate type is required." });
    }

    if (!req.file && !certificateLink) {
      return res.status(400).json({ message: "Please provide either a PDF or a certificate link." });
    }

    const metadata = {
      studentId: req.studentId.toString(),
      organisation: organisation || "",
      course: course || "",
      fromDate: fromDate?.toString() || "",
      toDate: toDate?.toString() || "",
      type: type || "",
    };

    let pdfId = null;
    let downloadLink = null;

    if (req.file) {
      const uploadResponse = await uploadFile(req.file.buffer, metadata);
      pdfId = String(uploadResponse.public_id);
      downloadLink = uploadResponse.secure_url;
    }

    const studentDetails = await dynamoDB.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId: metadata.studentId },
    }));

    if (!studentDetails.Item) {
      return res.status(404).json({ message: "Student not found" });
    }

    const batchYear = studentDetails.Item.passoutYear;
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    await dynamoDB.send(new PutCommand({
      TableName: CERTIFICATES_TABLE,
      Item: {
        certificateId: pdfId || `cert-${Date.now()}`,
        studentId: metadata.studentId,
        organisation,
        course,
        fromDate,
        toDate,
        type,
        batchYear,
        CreatedTime: timestamp,
        LastUpdatedTime: timestamp,
        ...(downloadLink ? { downloadLink } : {}),
        ...(certificateLink ? { certificateLink } : {}),
      },
    }));

    res.status(201).json({ message: "Certificate uploaded successfully", pdfId });
  } catch (error) {
    console.error("Error uploading certificate:", error);
    res.status(500).json({ message: "Server error" });
  }
};

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

exports.deleteCertificate = async (req, res) => {
  try {
    const { id } = req.params;

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

    if (certificate.certificateId) {
      console.log("Deleting certificate PDF from Cloudinary:", certificate.certificateId);
      await deleteResource(certificate.certificateId);
    }

    await dynamoDB.send(
      new DeleteCommand({
        TableName: process.env.CERTIFICATES_TABLE,
        Key: { certificateId: id },
      })
    );

    const fromDate = new Date(certificate.fromDate);
    const toDate = new Date(certificate.toDate);
    const academicYears = getAcademicYears(fromDate, toDate);

    for (const year of academicYears) {
      const yearKey = { year };

      const yearItemResponse = await dynamoDB.send(
        new GetCommand({
          TableName: process.env.YEARS_TABLE,
          Key: yearKey,
        })
      );

      const yearItem = yearItemResponse.Item;

      if (yearItem && yearItem.certificates) {
        const updatedCertificates = yearItem.certificates.filter(
          (certId) => certId !== id
        );

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
