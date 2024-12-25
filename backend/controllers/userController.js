const { addItem } = require("../utils/dynamodb");
const { v4: uuidv4 } = require("uuid");

exports.createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userId = uuidv4();

    const user = {
      userId,
      name,
      email,
      password, // Hash in production!
    };

    await addItem(process.env.DYNAMODB_TABLE_USERS, user);

    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
