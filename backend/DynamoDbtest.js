require('dotenv').config();

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");


const dynamoDB = new DynamoDBClient({ region: "ap-south-1",
    credentials: {
        accessKeyId: "AKIAZI2LGGRWNYGT7P6A" ,
        secretAccessKey: "izhx+WPLim0NN1DpaZCq0Ih2Oc6QzkjNfD1KEO3J" ,
      },
 });

const TABLE_NAME = "Certificates"; // Replace with your table name
const BATCH_YEAR = "2022"; // Replace with the batch year you want to add


const updateAllCertificates = async () => {
  let lastEvaluatedKey = null;

  try {
    do {
      // Scan the table to get all items
      const scanParams = {
        TableName: "Certificates",
        ProjectionExpression: "certificateId", // Retrieve only certificateId
        ExclusiveStartKey: lastEvaluatedKey,
      };

      console.log("scanParams:",scanParams)

      let certificates = [];
try {
  const scanResult = await dynamoDB.send(new ScanCommand(scanParams));
  certificates = scanResult.Items || [];
  console.log("Scanned certificates:", certificates);
} catch (error) {
  console.error("Error scanning certificates:", error);
  return; // Exit the function if scanning fails
}

      // Update each certificate with batchYear
      for (const certificate of certificates) {
        const { certificateId } = certificate;

        if (!certificateId) {
            console.error("Missing certificateId for an item:", certificate);
            continue; // Skip invalid items
          }

        const updateParams = {
          TableName: TABLE_NAME,
          Key: { certificateId },
          UpdateExpression: "SET batchYear = :batchYear",
          ExpressionAttributeValues: {
            ":batchYear": BATCH_YEAR,
          },
        };

        try {
            await dynamoDB.send(new UpdateCommand(updateParams));
            console.log(`Successfully updated certificate ${certificateId} with batchYear ${BATCH_YEAR}`);
          } catch (updateError) {
            console.error(`Error updating certificate ${certificateId}:`, updateError);
          }
      }

      // Handle pagination
      lastEvaluatedKey = scanResult.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log("All certificates updated with batchYear!");
  } catch (error) {
    console.error("Error updating certificates:", error);
  }
};

// Run the script
updateAllCertificates();