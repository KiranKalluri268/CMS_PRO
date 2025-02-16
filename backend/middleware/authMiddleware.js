const jwt = require("jsonwebtoken");

module.exports = {
  authenticate: async (req, res, next) => {
    const token = req.header("x-auth-token");
    console.log("token in middleware:", token);
    if (!token) {
      return res.status(401).json({ message: "Access denied" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userRollNumber = decoded.userRollnumber;
      req.studentId = decoded.userId;
      req.role = decoded.userRole;
      console.log("decoded in middleware:", req.userRollNumber, req.studentId, req.role);
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }
      console.error("Authentication error:", err);
      res.status(400).json({ message: "Invalid token" });
    }
  },

  adminOnly: (req, res, next) => {
    if (req.role !== "admin") {
      return res.status(403).json({ message: "Access denied, admin only" });
    }
    next();
  },
};
