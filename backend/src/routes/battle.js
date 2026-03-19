const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const battleService = require("../services/battleService");
const { successResponse, errorResponse } = require('../utils/response');


router.post('/', async (req, res) => {
    try {
      const { characterId, enemyId } = req.body;
  
      if (!characterId || !enemyId) {
        return errorResponse(res, 400, 'Missing required fields');
      }
  
      const result = await battleService.executeBattle({
        characterId,
        enemyId
      });
  
      return successResponse(res, result);
  
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return errorResponse(res, statusCode, error.message);
    }
  });

module.exports = router;