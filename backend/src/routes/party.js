const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

// GET /party
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT pm.id, pm.position, c.id AS character_id, c.name, c.hp, c.max_hp, c.attack, c.defense, c.element, c.role
             FROM party_members pm
             JOIN characters c ON pm.character_id = c.id
             WHERE pm.party_id = 1
             ORDER BY pm.position`
        );
        res.json(successResponse({ members: result.rows }));
    } catch (err) {
        console.error(err);
        res.status(500).json(errorResponse(err.message));
    }
});

// POST /party
router.post('/', async (req, res) => {
    try {
        const { members } = req.body;

        if (!Array.isArray(members) || members.length === 0 || members.length > 3) {
            return res.status(400).json(errorResponse('members must be an array of 1 to 3 character IDs'));
        }

        await pool.query('DELETE FROM party_members WHERE party_id = 1');

        for (let i = 0; i < members.length; i++) {
            await pool.query(
                `INSERT INTO party_members (party_id, character_id, position) VALUES ($1, $2, $3)`,
                [1, members[i], i + 1]
            );
        }

        res.json(successResponse({ message: 'Party updated' }));
    } catch (err) {
        console.error(err);
        res.status(500).json(errorResponse(err.message));
    }
});

module.exports = router;
