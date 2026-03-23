const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { successResponse, errorResponse } = require("../utils/response");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM characters");
    res.json(successResponse(result.rows));
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse(err.message));
  }
});

module.exports = router;