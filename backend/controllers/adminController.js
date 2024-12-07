const Batch = require("../models/Batch");
const Student = require("../models/User");
const Certificate = require("../models/Certificate");

// Fetch all batches
const getBatches = async (req, res) => {
  try {
    const batches = await Batch.find().select("_id year");
    res.status(200).json({ batches });
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({ error: "Server error while fetching batches" });
  }
};

// Function to get certificates by batch ID
const getCertificatesByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    // Fetch the batch to get the list of students
    const batch = await Batch.findById(batchId).populate("students", "name rollNumber");
    console.log('batch details:',batch);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }
    
    // Now fetch the certificates for each student in this batch
    const studentIds = batch.students.map(student => student._id); // Extract student IDs

    // Fetch certificates where student ID matches any of the batch students
    const certificates = await Certificate.find({ student: { $in: studentIds } }).populate("student", "name rollNumber");
    console.log("Certificates fetched:",certificates);

    res.json({ certificates });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ message: "Error fetching certificates" });
  }
};

module.exports = {
  getBatches,
  getCertificatesByBatch,
};