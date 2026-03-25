const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { successResponse, errorResponse } = require("../utils/response");

// GET /skills - 全スキル一覧
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM skills ORDER BY id");
    res.json(successResponse(result.rows));
  } catch (err) {
    res.status(500).json(errorResponse(err.message));
  }
});

// GET /skills/character/:characterId - キャラクターのスキル一覧
router.get("/character/:characterId", async (req, res) => {
  try {
    const { characterId } = req.params;
    const result = await pool.query(
      `SELECT s.* FROM skills s
       JOIN character_skills cs ON s.id = cs.skill_id
       WHERE cs.character_id = $1
       ORDER BY s.id`,
      [characterId]
    );
    res.json(successResponse(result.rows));
  } catch (err) {
    res.status(500).json(errorResponse(err.message));
  }
});

module.exports = router;
