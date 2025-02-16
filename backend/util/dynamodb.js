const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const dotenv = require("dotenv");

dotenv.config();

const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);

const addItem = async (tableName, item) => {
  const params = {
    TableName: tableName,
    Item: item,
  };
  try {
    const command = new PutCommand(params);
    await dynamoDB.send(command);
    console.log(`Item added to ${tableName}:`, item);
  } catch (error) {
    console.error("DynamoDB addItem error:", error);
    throw new Error(`Failed to add item to ${tableName}: ${error.message}`);
  }
};

const deleteItem = async (tableName, key) => {
  try {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: key,
    });
    await dynamoDB.send(command);
    console.log(`Item deleted from ${tableName} with key:`, key);
  } catch (error) {
    console.error("DynamoDB deleteItem error:", error);
    throw error;
  }
};

const updateItem = async (params) => {
  try {
    const command = new UpdateCommand(params);
    const response = await dynamoDB.send(command);
    return response;
  } catch (error) {
    console.error("DynamoDB updateItem error:", error);
    throw error;
  }
};

module.exports = {
  addItem,
  deleteItem,
  updateItem,
  dynamoDB,
};
