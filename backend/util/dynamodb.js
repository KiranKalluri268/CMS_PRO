const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");  // AWS SDK v3 Client
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");  // AWS SDK v3 Document Client
const dotenv = require("dotenv");

dotenv.config();

// Initialize DynamoDB Client with credentials and region from environment variables
const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Create the DynamoDB Document Client from the base DynamoDB client
const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);

// Add Item Function to insert data into DynamoDB Table
const addItem = async (tableName, item) => {
  const params = {
    TableName: tableName,
    Item: item,
  };

  try {
    // Create a PutCommand to add the item to the table
    const command = new PutCommand(params);
    await dynamoDB.send(command);  // Send the command to DynamoDB
    console.log(`Item added to ${tableName}:`, item);
  } catch (error) {
    console.error("DynamoDB addItem error:", error);
    throw new Error(`Failed to add item to ${tableName}: ${error.message}`);
  }
};

const getStudentById = async (id) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME, // Replace with your actual table name
      Key: { id }, // Assumes primary key is "id"
    };
    const result = await dynamoDB.get(params).promise();
    return result.Item || null;
  } catch (error) {
    console.error("DynamoDB getStudentById error:", error);
    throw error;
  }
};

// Export the addItem function to be used in other parts of the application
module.exports = {
  addItem,
  dynamoDB,
  getStudentById,
};
