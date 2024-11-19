const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  const token = req.header("x-auth-token");
  console.log("token in middleware",token);
  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.studentId = decoded.studentId;
    console.log('decoded in middleware:',req.userId,req.studentId);
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    res.status(400).json({ message: "Invalid token" });
  }
};
