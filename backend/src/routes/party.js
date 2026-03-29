const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

// GET /party — returns all 5 parties with their members
router.get('/', async (req, res) => {
    try {
        const partiesResult = await pool.query(
            `SELECT id, name FROM parties WHERE user_id = 1 ORDER BY id`
        );
        const parties = partiesResult.rows;

        for (const party of parties) {
            const membersResult = await pool.query(
                `SELECT pm.position, c.id AS character_id, c.name, c.level, c.hp, c.max_hp,
                        c.sp, c.max_sp, c.attack, c.defense, c.element, c.role, c.exp, c.next_exp
                 FROM party_members pm
                 JOIN characters c ON pm.character_id = c.id
                 WHERE pm.party_id = $1
                 ORDER BY pm.position`,
                [party.id]
            );
            party.members = membersResult.rows;
        }

        res.json(successResponse({ parties }));
    } catch (err) {
        console.error(err);
        res.status(500).json(errorResponse(err.message));
    }
});

// POST /party — update members and/or name for a party
// Body: { partyId: number, members?: number[], name?: string }
router.post('/', async (req, res) => {
    try {
        const { partyId = 1, members, name } = req.body;

        if (members !== undefined) {
            if (!Array.isArray(members) || members.length > 3) {
                return res.status(400).json(errorResponse('members must be an array of 0 to 3 character IDs'));
            }

            await pool.query('DELETE FROM party_members WHERE party_id = $1', [partyId]);

            for (let i = 0; i < members.length; i++) {
                await pool.query(
                    `INSERT INTO party_members (party_id, character_id, position) VALUES ($1, $2, $3)`,
                    [partyId, members[i], i + 1]
                );
            }
        }

        if (name !== undefined) {
            await pool.query('UPDATE parties SET name = $1 WHERE id = $2 AND user_id = 1', [name, partyId]);
        }

        res.json(successResponse({ message: 'Party updated' }));
    } catch (err) {
        console.error(err);
        res.status(500).json(errorResponse(err.message));
    }
});

module.exports = router;
