const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
  year: { type: String, required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Batch", batchSchema);
