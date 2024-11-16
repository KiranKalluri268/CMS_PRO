const express = require("express");
const { createBatch } = require("../controllers/batchController");
const router = express.Router();

router.post("/", createBatch);

module.exports = router;
