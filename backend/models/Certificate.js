const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
  organisation: String,
  course: String,
  fromDate: Date,
  toDate: Date,
  pdf: { type: String },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Certificate", certificateSchema);
