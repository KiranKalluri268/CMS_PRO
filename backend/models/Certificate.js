const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
  organisation: { type: String, required: true },
  course: { type: String, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  pdf: { type: String, required: true, unique: true  },
  student: { type: String, required: true },
  year: { type: mongoose.Schema.Types.ObjectId, ref: "Year", required: false}
}, { timestamps: true });

module.exports = mongoose.model("Certificate", certificateSchema);
