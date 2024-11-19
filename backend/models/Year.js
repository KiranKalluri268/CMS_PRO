const mongoose = require("mongoose");

const yearSchema = new mongoose.Schema({
  year: { type: String, required: true },
  certificates: [{ type: mongoose.Schema.Types.ObjectId, ref: "Certificate" }],
});

module.exports = mongoose.model("Year", yearSchema);
