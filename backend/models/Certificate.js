const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
  organisation: { type: String, required: true },
  course: { type: String, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  pdf: { type: String }, // No `unique: true` here; handled with partial index
  certificateLink: { type: String, required: false }, // New field for downloadable link
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  year: [{ type: mongoose.Schema.Types.ObjectId, ref: "Year", required: false }],
}, { timestamps: true });

// Add a partial index for the `pdf` field to enforce uniqueness only when it exists and is not null
certificateSchema.index({ pdf: 1 }, { unique: true, partialFilterExpression: { pdf: { $exists: true, $ne: null } } });

module.exports = mongoose.model("Certificate", certificateSchema);
