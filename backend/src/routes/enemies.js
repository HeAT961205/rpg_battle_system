const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// 全敵取得
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM enemies");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;