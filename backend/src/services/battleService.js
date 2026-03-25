const pool = require('../config/db');
const { calculateDamage } = require('../utils/damageCalculator');
const { selectBossAction } = require('../utils/selectBossAction');

// レベルに応じてステータスをスケーリング (×1.1^(level-1))
function scaleByLevel(baseStat, level) {
    return Math.round(baseStat * Math.pow(1.1, level - 1));
}


exports.startBattle = async ({ partyId, enemyId, enemyLevel = 1 }) => {

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
        const level = Math.max(1, Math.min(50, parseInt(enemyLevel) || 1));

        // レベルスケーリング
        const scaledMaxHp = scaleByLevel(enemy.max_hp, level);
        const scaledAttack = scaleByLevel(enemy.attack, level);
        const scaledDefense = scaleByLevel(enemy.defense, level);

        // battle_session作成（スケール済みステータスを保存）
        const sessionResult = await client.query(
            `INSERT INTO battle_sessions
             (party_id, enemy_id, enemy_hp, enemy_level, enemy_max_hp, enemy_attack, enemy_defense)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [partyId, enemy.id, scaledMaxHp, level, scaledMaxHp, scaledAttack, scaledDefense]
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
            enemyLevel: level,
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
                hp: scaledMaxHp,
                maxHp: scaledMaxHp,
                attack: scaledAttack,
                defense: scaledDefense,
                element: enemy.element
            }
        };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};


// actions: [{ characterId, skillId }] - メンバー別行動
// skillId が null の場合は通常攻撃
exports.processTurn = async (battleId, actions = []) => {

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // セッション取得（スケール済みステータスを使用）
        const sessionResult = await client.query(
            `SELECT bs.*,
                    e.element AS enemy_element,
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

        // セッションに保存されたスケール済みステータスを使用
        const enemyAttack = session.enemy_attack;
        const enemyDefense = session.enemy_defense;
        const enemyMaxHp = session.enemy_max_hp;
        const enemyElement = session.enemy_element;

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

        // スキル情報をまとめて取得
        const skillIds = actions.map(a => a.skillId).filter(id => id != null);
        const skillMap = {};
        if (skillIds.length > 0) {
            const skillRes = await client.query(
                `SELECT * FROM skills WHERE id = ANY($1::int[])`,
                [skillIds]
            );
            for (const skill of skillRes.rows) {
                skillMap[skill.id] = skill;
            }
        }

        // actions を characterId → skillId のマップに変換
        const actionMap = {};
        for (const action of actions) {
            actionMap[action.characterId] = action.skillId || null;
        }

        // プレイヤーターン
        for (let member of party) {

            if (member.current_hp <= 0) continue;

            const chosenSkillId = actionMap[member.character_id] ?? null;
            const skillPower = chosenSkillId && skillMap[chosenSkillId]
                ? skillMap[chosenSkillId].power
                : 0;
            const skillName = chosenSkillId && skillMap[chosenSkillId]
                ? skillMap[chosenSkillId].name
                : null;

            const { damage } = calculateDamage({
                attack: member.attack,
                defense: enemyDefense,
                skillPower,
                attackerElement: member.element,
                defenderElement: enemyElement
            });

            enemyHp -= damage;
            totalPlayerDamage += damage;

            if (skillName) {
                logs.push(`${member.name} が ${skillName} を使い ${damage} のダメージ！`);
            } else {
                logs.push(`${member.name} の攻撃！ ${damage} のダメージ！`);
            }
        }

        if (enemyHp < 0) enemyHp = 0;

        // フェーズ遷移チェック
        if (session.is_boss && bossPhase === 1) {
            const hpRate = enemyHp / enemyMaxHp;
            if (hpRate <= 0.5) {
                bossPhase = 2;
                logs.push('ボスがフェーズ2に突入！');
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
                    attack: enemyAttack,
                    defense: target.defense,
                    skillPower: 0,
                    attackerElement: enemyElement,
                    defenderElement: target.element
                });

                target.current_hp = Math.max(target.current_hp - damage, 0);
                enemyDamage += damage;
                logs.push(`敵の攻撃！ ${target.name} に ${damage} のダメージ！`);

            } else if (actionType === 'aoe') {

                for (let member of party) {

                    if (member.current_hp <= 0) continue;

                    const { damage } = calculateDamage({
                        attack: enemyAttack * 1.5,
                        defense: member.defense,
                        skillPower: 0,
                        attackerElement: enemyElement,
                        defenderElement: member.element
                    });

                    member.current_hp = Math.max(member.current_hp - damage, 0);
                    enemyDamage += damage;
                    logs.push(`敵の全体攻撃！ ${member.name} に ${damage} のダメージ！`);
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
        `SELECT bs.*, e.name AS enemy_name, e.element AS enemy_element
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
        `SELECT bp.current_hp, bp.position, c.id, c.name, c.attack, c.defense, c.element, c.max_hp
         FROM battle_party bp
         JOIN characters c ON bp.character_id = c.id
         WHERE bp.session_id = $1
         ORDER BY bp.position`,
        [battleId]
    );

    const turnResult = await pool.query(
        `SELECT COUNT(DISTINCT created_at) AS turn FROM battle_history WHERE session_id = $1`,
        [battleId]
    );

    return {
        battleId: session.id,
        enemyLevel: session.enemy_level || 1,
        party: partyResult.rows,
        enemy: {
            id: session.enemy_id,
            name: session.enemy_name,
            element: session.enemy_element,
            hp: session.enemy_hp,
            maxHp: session.enemy_max_hp || session.enemy_hp,
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
