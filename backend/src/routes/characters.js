const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { successResponse, errorResponse } = require("../utils/response");

// GET /characters
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM characters ORDER BY id");
    res.json(successResponse(result.rows));
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse(err.message));
  }
});

// POST /characters/:id/reset - レベルリセット
router.post("/:id/reset", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE characters
       SET level = 1, hp = base_hp, max_hp = base_hp,
           attack = base_attack, defense = base_defense,
           exp = 0, next_exp = 100
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse("Character not found"));
    }
    res.json(successResponse(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse(err.message));
  }
});

module.exports = router;
