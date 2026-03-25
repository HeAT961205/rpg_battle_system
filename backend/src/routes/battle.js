const express = require('express');
const router = express.Router();
const { startBattle, processTurn, getBattleState, getBattleResult } = require('../services/battleService');
const { successResponse, errorResponse } = require('../utils/response');

// POST /battle/start
router.post('/start', async (req, res) => {
    try {
        const { partyId, enemyId, enemyLevel } = req.body;
        const result = await startBattle({ partyId, enemyId, enemyLevel });
        res.json(successResponse(result));
    } catch (err) {
        console.error(err);
        const status = err.statusCode || 500;
        res.status(status).json(errorResponse(err.message));
    }
});

// POST /battle/action
// body: { battleId, actions: [{ characterId, skillId }] }
router.post('/action', async (req, res) => {
    try {
        const { battleId, actions } = req.body;
        const result = await processTurn(battleId, actions || []);
        res.json(successResponse(result));
    } catch (err) {
        console.error(err);
        res.status(500).json(errorResponse(err.message));
    }
});

// GET /battle/:battleId
router.get('/:battleId', async (req, res) => {
    try {
        const { battleId } = req.params;
        const result = await getBattleState(battleId);
        res.json(successResponse(result));
    } catch (err) {
        console.error(err);
        const status = err.statusCode || 500;
        res.status(status).json(errorResponse(err.message));
    }
});

// GET /battle/:battleId/result
router.get('/:battleId/result', async (req, res) => {
    try {
        const { battleId } = req.params;
        const result = await getBattleResult(battleId);
        res.json(successResponse(result));
    } catch (err) {
        console.error(err);
        const status = err.statusCode || 500;
        res.status(status).json(errorResponse(err.message));
    }
});

module.exports = router;
