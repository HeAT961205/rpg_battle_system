const pool = require('../config/db');
const { calculateDamage } = require('../utils/damageCalculator');
const { checkPhaseTransition } = require('../utils/bossPhaseManager');
const { selectBossAction } = require('../utils/selectBossAction');



exports.startBattle = async ({ partyId, enemyId}) => {

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // パーティ取得
        const partyResult = await client.query(
                `SELECT pm.character_id, pm.position,
                        c.max_hp
                FROM party_members pm
                JOIN characters c ON pm.character_id = c.id
                WHERE pm.party_id = $1
                ORDER BY pm.position`,
                [partyId]
            );

            if (partyResult.rows.length === 0) {
                throw new Error('Party has no members');
            }

            if (partyResult.rows.length > 3) {
                throw new Error('Party exceeds 3 members');
            }

        //  敵取得
        const enemyResult = await pool.query(
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
            const sessionResult = await pool.query(
                `INSERT INTO battle_sessions
                (party_id, enemy_id, enemy_hp)
                VALUES ($1, $2, $3)
                RETURNING *`,
                [
                    partyId,
                    enemyData.id,
                    enemyData.max_hp
                ]
            );

            const session = sessionResult.rows[0];

            // battle_party 作成
            for (const member of partyResult.rows) {
                await client.query(
                    `INSERT INTO battle_party
                    (session_id, character_id, current_hp, position)
                    VALUES ($1, $2, $3, $4)`,
                    [
                        session.id,
                        member.character_id,
                        member.max_hp,
                        member.position
                    ]
                );
            }

            await client.query('COMMIT');

            return session;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }

};


//1ターンの処理
exports.processTurn = async (sessionId, skillId = null) => {

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
            [sessionId]
        );

        const session = sessionResult.rows[0];

        let enemyHp = session.enemy_hp;
        let bossPhase = session.boss_phase;

        // パーティ取得
        const partyResult = await client.query(
            `SELECT bp.*, c.attack, c.defense, c.element
             FROM battle_party bp
             JOIN characters c ON bp.character_id = c.id
             WHERE bp.session_id = $1
             ORDER BY bp.position`,
            [sessionId]
        );

        let party = partyResult.rows;

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

            const { damage } =
                calculateDamage({
                    attack: member.attack,
                    defense: session.enemy_defense,
                    skillPower,
                    attackerElement: member.element,
                    defenderElement: session.enemy_element
                });

            enemyHp -= damage;
            totalPlayerDamage += damage;
        }

        if (enemyHp < 0) enemyHp = 0;

    //フェーズ遷移チェック
    if (session.is_boss && bossPhase === 1) {
        const hpRate = enemyHp / session.enemy_max_hp;
        if (hpRate <= 0.5) bossPhase = 2;
    }


    // 敵ターン
    let actionType = 'single';

    if (session.is_boss) {
        actionType = selectBossAction(bossPhase);
    }

    if (enemyHp > 0) {

        if (actionType === 'single') {

            const aliveMembers =
                party.filter(p => p.current_hp > 0);

            const target =
                aliveMembers[Math.floor(Math.random() * aliveMembers.length)];

            const { damage } =
                calculateDamage({
                    attack: session.enemy_attack,
                    defense: target.defense,
                    skillPower: 0,
                    attackerElement: session.enemy_element,
                    defenderElement: target.element
                });

            target.current_hp =
                Math.max(target.current_hp - damage, 0);

            enemyDamage += damage;

        } else if (actionType === 'aoe') {

            for (let member of party) {

                if (member.current_hp <= 0) continue;

                const { damage } =
                    calculateDamage({
                        attack: session.enemy_attack * 1.5,
                        defense: member.defense,
                        skillPower: 0,
                        attackerElement: session.enemy_element,
                        defenderElement: member.element
                    });

                member.current_hp =
                    Math.max(member.current_hp - damage, 0);

                enemyDamage += damage;
            }
        }
    }

    // =====================
    // 勝敗判定
    // =====================

    let result = 'ongoing';

    const aliveMembers =
        party.filter(p => p.current_hp > 0);

    if (enemyHp <= 0) {
        result = 'victory';
    } else if (aliveMembers.length === 0) {
        result = 'defeat';
    }

    // =====================
    // DB更新
    // =====================

    await client.query(
        `UPDATE battle_sessions
         SET enemy_hp = $1,
             boss_phase = $2
         WHERE id = $3`,
        [enemyHp, bossPhase, sessionId]
    );

    for (const member of party) {
        await client.query(
            `UPDATE battle_party
             SET current_hp = $1
             WHERE id = $2`,
            [member.current_hp, member.id]
        );
    }

    // =====================
    // EXP処理
    // =====================

    let expGained = 0;

    if (result === 'victory') {

        expGained = session.exp_reward;

        for (const member of party) {

            if (member.current_hp > 0) {

                await applyExpWithClient(
                    client,
                    member.character_id,
                    expGained
                );
            }
        }
    }

    // =====================
    // battle_history保存
    // =====================

    await client.query(
        `INSERT INTO battle_history
         (session_id,
          enemy_damage,
          player_damage,
          exp_gained,
          result)
         VALUES ($1,$2,$3,$4,$5)`,
        [
            sessionId,
            enemyDamage,
            totalPlayerDamage,
            expGained,
            result
        ]
    );

    await client.query('COMMIT');

    return {
        result,
        enemyHp,
        bossPhase,
        actionType,
        playerDamage: totalPlayerDamage,
        enemyDamage,
        expGained,
        party
    };

} catch (err) {

    await client.query('ROLLBACK');
    throw err;

} finally {

    client.release();
}
};
