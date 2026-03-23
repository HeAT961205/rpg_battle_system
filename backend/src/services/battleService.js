const pool = require('../config/db');
const { calculateDamage } = require('../utils/damageCalculator');
const { selectBossAction } = require('../utils/selectBossAction');



exports.startBattle = async ({ partyId, enemyId }) => {

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // パーティ取得
        const partyResult = await client.query(
            `SELECT pm.character_id, pm.position, c.max_hp, c.name, c.hp, c.attack, c.defense, c.element
             FROM party_members pm
             JOIN characters c ON pm.character_id = c.id
             WHERE pm.party_id = $1
             ORDER BY pm.position;`,
            [partyId]
        );

        if (partyResult.rows.length === 0) {
            throw new Error('Party has no members');
        }

        if (partyResult.rows.length > 3) {
            throw new Error('Party exceeds 3 members');
        }

        // 敵取得
        const enemyResult = await client.query(
            'SELECT * FROM enemies WHERE id = $1',
            [enemyId]
        );

        if (enemyResult.rows.length === 0) {
            const error = new Error('Enemy not found');
            error.statusCode = 404;
            throw error;
        }

        const enemy = enemyResult.rows[0];

        // battle_session作成
        const sessionResult = await client.query(
            `INSERT INTO battle_sessions
             (party_id, enemy_id, enemy_hp)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [partyId, enemy.id, enemy.max_hp]
        );

        const session = sessionResult.rows[0];

        // battle_party作成
        for (const member of partyResult.rows) {
            await client.query(
                `INSERT INTO battle_party
                 (session_id, character_id, current_hp, position)
                 VALUES ($1, $2, $3, $4)`,
                [session.id, member.character_id, member.max_hp, member.position]
            );
        }

        await client.query('COMMIT');

        return {
            battleId: session.id,
            party: partyResult.rows.map(m => ({
                id: m.character_id,
                name: m.name,
                hp: m.max_hp,
                attack: m.attack,
                defense: m.defense,
                element: m.element,
                position: m.position
            })),
            enemy: {
                id: enemy.id,
                name: enemy.name,
                hp: enemy.max_hp
            }
        };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};


// 1ターンの処理
exports.processTurn = async (battleId, skillId = null) => {

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // セッション取得
        const sessionResult = await client.query(
            `SELECT bs.*,
                    e.attack AS enemy_attack,
                    e.defense AS enemy_defense,
                    e.element AS enemy_element,
                    e.max_hp AS enemy_max_hp,
                    e.exp_reward,
                    e.is_boss
             FROM battle_sessions bs
             JOIN enemies e ON bs.enemy_id = e.id
             WHERE bs.id = $1`,
            [battleId]
        );

        if (sessionResult.rows.length === 0) {
            const error = new Error('Battle not found');
            error.statusCode = 404;
            throw error;
        }

        const session = sessionResult.rows[0];

        let enemyHp = session.enemy_hp;
        let bossPhase = session.boss_phase;

        // パーティ取得
        const partyResult = await client.query(
            `SELECT bp.*, c.attack, c.defense, c.element, c.name
             FROM battle_party bp
             JOIN characters c ON bp.character_id = c.id
             WHERE bp.session_id = $1
             ORDER BY bp.position`,
            [battleId]
        );

        let party = partyResult.rows;
        let logs = [];
        let totalPlayerDamage = 0;
        let enemyDamage = 0;

        // プレイヤーターン
        let skillPower = 0;

        if (skillId) {
            const skillRes = await client.query(
                `SELECT * FROM skills WHERE id = $1`,
                [skillId]
            );
            skillPower = skillRes.rows[0].power;
        }

        for (let member of party) {

            if (member.current_hp <= 0) continue;

            const { damage } = calculateDamage({
                attack: member.attack,
                defense: session.enemy_defense,
                skillPower,
                attackerElement: member.element,
                defenderElement: session.enemy_element
            });

            enemyHp -= damage;
            totalPlayerDamage += damage;
            logs.push(`${member.name} attacks for ${damage} damage`);
        }

        if (enemyHp < 0) enemyHp = 0;

        // フェーズ遷移チェック
        if (session.is_boss && bossPhase === 1) {
            const hpRate = enemyHp / session.enemy_max_hp;
            if (hpRate <= 0.5) {
                bossPhase = 2;
                logs.push('Boss enters Phase 2!');
            }
        }

        // 敵ターン
        let actionType = 'single';

        if (session.is_boss) {
            actionType = selectBossAction(bossPhase);
        }

        if (enemyHp > 0) {

            if (actionType === 'single') {

                const aliveMembers = party.filter(p => p.current_hp > 0);
                const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];

                const { damage } = calculateDamage({
                    attack: session.enemy_attack,
                    defense: target.defense,
                    skillPower: 0,
                    attackerElement: session.enemy_element,
                    defenderElement: target.element
                });

                target.current_hp = Math.max(target.current_hp - damage, 0);
                enemyDamage += damage;
                logs.push(`Enemy attacks ${target.name} for ${damage} damage`);

            } else if (actionType === 'aoe') {

                for (let member of party) {

                    if (member.current_hp <= 0) continue;

                    const { damage } = calculateDamage({
                        attack: session.enemy_attack * 1.5,
                        defense: member.defense,
                        skillPower: 0,
                        attackerElement: session.enemy_element,
                        defenderElement: member.element
                    });

                    member.current_hp = Math.max(member.current_hp - damage, 0);
                    enemyDamage += damage;
                    logs.push(`Enemy AOE hits ${member.name} for ${damage} damage`);
                }
            }
        }

        // 勝敗判定
        let result = 'ongoing';
        const aliveMembers = party.filter(p => p.current_hp > 0);

        if (enemyHp <= 0) {
            result = 'victory';
        } else if (aliveMembers.length === 0) {
            result = 'defeat';
        }

        // DB更新
        await client.query(
            `UPDATE battle_sessions
             SET enemy_hp = $1, boss_phase = $2
             WHERE id = $3`,
            [enemyHp, bossPhase, battleId]
        );

        for (const member of party) {
            await client.query(
                `UPDATE battle_party SET current_hp = $1 WHERE id = $2`,
                [member.current_hp, member.id]
            );
        }

        // battle_history保存
        for (const member of party) {
            await client.query(
                `INSERT INTO battle_history
                 (session_id, character_id, enemy_id, enemy_damage, player_damage, exp_gained, result)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [battleId, member.character_id, session.enemy_id, enemyDamage, totalPlayerDamage, 0, result]
            );
        }

        await client.query('COMMIT');

        return {
            damage: totalPlayerDamage,
            enemyHp,
            playerHp: aliveMembers.length > 0 ? aliveMembers[0].current_hp : 0,
            isEnemyDefeated: enemyHp <= 0,
            isBattleEnd: result !== 'ongoing',
            logs,
            party
        };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};


// バトル状態取得
exports.getBattleState = async (battleId) => {

    const sessionResult = await pool.query(
        `SELECT bs.*, e.name AS enemy_name, e.max_hp AS enemy_max_hp
         FROM battle_sessions bs
         JOIN enemies e ON bs.enemy_id = e.id
         WHERE bs.id = $1`,
        [battleId]
    );

    if (sessionResult.rows.length === 0) {
        const error = new Error('Battle not found');
        error.statusCode = 404;
        throw error;
    }

    const session = sessionResult.rows[0];

    const partyResult = await pool.query(
        `SELECT bp.current_hp, bp.position, c.id, c.name, c.attack, c.defense, c.element
         FROM battle_party bp
         JOIN characters c ON bp.character_id = c.id
         WHERE bp.session_id = $1
         ORDER BY bp.position`,
        [battleId]
    );

    // ターン数をbattle_historyから取得
    const turnResult = await pool.query(
        `SELECT COUNT(DISTINCT created_at) AS turn FROM battle_history WHERE session_id = $1`,
        [battleId]
    );

    return {
        battleId: session.id,
        party: partyResult.rows,
        enemy: {
            id: session.enemy_id,
            name: session.enemy_name,
            hp: session.enemy_hp,
            maxHp: session.enemy_max_hp,
            bossPhase: session.boss_phase
        },
        turn: parseInt(turnResult.rows[0].turn) || 0
    };
};


// リザルト取得
exports.getBattleResult = async (battleId) => {

    const historyResult = await pool.query(
        `SELECT result, exp_gained
         FROM battle_history
         WHERE session_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [battleId]
    );

    if (historyResult.rows.length === 0) {
        const error = new Error('Battle result not found');
        error.statusCode = 404;
        throw error;
    }

    const { result, exp_gained } = historyResult.rows[0];

    return {
        result,
        expGained: exp_gained
    };
};
