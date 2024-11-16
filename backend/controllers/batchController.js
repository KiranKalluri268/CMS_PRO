const Batch = require("../models/Batch");

exports.createBatch = async (req, res) => {
  const { year } = req.body;
  const batch = new Batch({ year });
  await batch.save();
  res.status(201).send({ batch });
};
