const Certificate = require("../models/Certificate");

exports.uploadCertificate = async (req, res) => {
  const { organisation, course, fromDate, toDate } = req.body;
  const certificate = new Certificate({
    organisation,
    course,
    fromDate,
    toDate,
    pdf: req.file.path,
    student: req.userId,
  });

  await certificate.save();
  res.status(201).send({ certificate });
};
