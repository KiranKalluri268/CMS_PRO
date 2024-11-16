const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { name, rollNumber, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, rollNumber, email, password: hashedPassword, role: "student" });
  await user.save();
  res.status(201).send({ user });
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

  const token = jwt.sign({ userId: user._id }, "your_jwt_secret", { expiresIn: "1h" });
  res.json({ token });
};
