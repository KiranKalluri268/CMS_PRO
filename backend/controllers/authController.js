const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Batch = require("../models/Batch"); // Import Batch model

exports.register = async (req, res) => {
  try {
    const { name, rollNumber, email, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Extract batch year from rollNumber (first two digits)
    const year = "20" + rollNumber.substring(0, 2); // E.g., '22' -> '2022'

    // Find or create a batch
    let batch = await Batch.findOne({ year });
    if (!batch) {
      // Create a new batch if not found
      batch = new Batch({ year, students: [] });
      await batch.save();
    }

    // Create the new user
    const user = new User({
      name,
      rollNumber,
      email,
      password: hashedPassword,
      role: "student",
      batch: batch._id, // Associate the batch with the student
    });
    await user.save();

    // Add the student to the batch's student list
    batch.students.push(user._id);
    await batch.save();

    res.status(201).send({ user, batch });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send({ message: "Error during registration", error });
  }
};


exports.login = async (req, res) => {
  const { rollNumber, password } = req.body;
  const user = await User.findOne({ rollNumber });
  if (!user) {
    return res.status(400).send("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).send("Invalid credentials");
  }

  const token = jwt.sign({ userId: user.rollNumber, studentId: user._id,userRole: user.role }, "secret_key_of_cms", { expiresIn: "1h" });
  res.json({ token });
};
