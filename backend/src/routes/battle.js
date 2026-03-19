const express = require('express');
const router = express.Router();
const { startBattle, processTurn } = require('../services/battleService');


router.post('/start', async (req, res) => {

    try {
        const { partyId, enemyId } = req.body;

        const result =
            await startBattle({partyId, enemyId});

        res.json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/attack', async (req, res) => {

    try {
        const { sessionId, skillId } = req.body;

        const result =
            await processTurn(sessionId, skillId);

        res.json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;