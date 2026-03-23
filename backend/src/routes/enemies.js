const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { successResponse, errorResponse } = require("../utils/response");

// 全敵取得
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM enemies");
    res.json(successResponse(result.rows));
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse(err.message));
  }
});

module.exports = router;