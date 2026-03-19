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
            `SELECT bs.*, e.attack AS enemy_attack,
                    e.defense AS enemy_defense,
                    e.max_hp AS enemy_max_hp,
                    e.is_boss
             FROM battle_sessions bs
             JOIN enemies e ON bs.enemy_id = e.id
             WHERE bs.id = $1`,
            [sessionId]
        );

        const session = sessionResult.rows[0];

        // パーティ取得
        const partyResult = await client.query(
            `SELECT bp.*, c.attack, c.defense
             FROM battle_party bp
             JOIN characters c ON bp.character_id = c.id
             WHERE bp.session_id = $1
             ORDER BY bp.position`,
            [sessionId]
        );

        let party = partyResult.rows;
        let enemyHp = session.enemy_hp;

        // プレイヤーターン
        let skillPower = 0;

        if (skillId) {
            const skillRes = await client.query(
                `SELECT * FROM skills WHERE id = $1`,
                [skillId]
            );
            const skill = skillRes.rows[0];
            skillPower = skill.power;


            for (let member of party) {

                if (member.current_hp <= 0) continue;

                const { damage, multiplier } =
                    calculateDamage({
                        attck: member.attack,
                        defense: session.enemy_defense,
                        skillPower: skillPower,
                        attackerElement: member.element,
                        defenderElement: session.enemy_element
                    });

            /*  const power =
                    skill.power * skillWeight +
                    member.attack * statWeight;

                const damage =
                    Math.max(
                        Math.floor(power - session.enemy_defense / 3),
                        1
                    );
            */

                enemyHp -= damage;

                totalPlayerDamage += damage;
        }
    } else {
        //通常攻撃(ランダム補正込み)
        const variability = 0.05;
        const randomFactor = 1 + (Math.random() * 2 - 1) * variability; // 0.95〜1.05
        for (let member of party) {
            if (member.current_hp <= 0) continue;

            const rawDamage = member.attack - session.enemy_defense / 3

            const damage =
                Math.max(
                    Math.floor(rawDamage * randomFactor), 1
                );

            enemyHp -= damage;
        }
    }

    if (enemyHp < 0) enemyHp = 0;

    //フェーズ遷移チェック
    const newPhase =
        checkPhaseTransition(session, enemyHp, enemy.max_hp);

    let phaseChanged = false;

    if (newPhase !== bossPhase) {
        bossPhase = newPhase;
        phaseChanged = true;
    }

    // フェーズ更新
    let bossPhase = session.boss_phase;

        if (session.is_boss && bossPhase === 1) {
            const hpRate = enemyHp / session.enemy_max_hp;
            if (hpRate <= 0.5) bossPhase = 2;
        }

        // 敵ターン
        let actionType = 'single';

        if (session.is_boss) {
            actionType = selectBossAction(bossPhase);
        }
        
        let attackMultiplier = 1;
    
        if (bossPhase === 2) {
            attackMultiplier = 1.5;

            if (actionType === 'aoe') {
                attackMultiplier = 1.6
            }
        }
    
    


        if (enemyHp > 0) {

            if (actionType === 'single') {

                const alive =
                    party.filter(p => p.current_hp > 0);

                const target =
                    alive[Math.floor(Math.random() * alive.length)];

                const damage =
                    Math.max(
                        Math.floor(
                            session.enemy_attack * attackMultiplier -
                            target.defense / 3
                        ),
                        1
                    );

                target.current_hp =
                    Math.max(target.current_hp - damage, 0);

            } else if (actionType === 'aoe') {

                for (let member of party) {

                    if (member.current_hp <= 0) continue;

                    const damage =
                        Math.max(
                            Math.floor(
                                session.enemy_attack * attackMultiplier -
                                member.defense / 3
                            ),
                            1
                        );

                    member.current_hp =
                        Math.max(member.current_hp - damage, 0);
                }
            }

    }



    
  
    /*
     敵反撃処理(共通)
    let enemyDamage = 0;
    if (enemyCurrentHp > 0) {

        const baseDamage = enemy.attack * attackMultiplier - character.defense / 3;

        enemyDamage = Math.max(
            Math.floor(baseDamage), 1);

        characterCurrentHp -= enemyDamage;
        if (characterCurrentHp < 0) characterCurrentHp = 0;
    }
    */

    // 勝敗判定
    let outcome = 'ongoing';
    if (enemyCurrentHp <= 0) outcome = 'win';
    if (characterCurrentHp <= 0) outcome = 'lose';

    return {
        characterCurrentHp,
        enemyCurrentHp,
        finalDamage,
        enemyDamage,
        bossPhase,
        phaseChanged,
        actionType,
        multiplier,
        outcome
    };
}



    //　 経験値処理
async function applyExpWithClient(client, character, enemy) {

    let expGained = enemy.exp_reward || 0;
    let newExp = character.exp + expGained;
    let newLevel = character.level;
    let nextExp = character.next_exp;

    let newMaxHP = character.max_hp;
    let newAttack = character.attack;
    let newDefense = character.defense;

    let leveledUp = false;
    let levelUpCount = 0;

    while (newExp >= nextExp) {
        newExp -= nextExp;
        newLevel++;
        levelUpCount++;
        nextExp = newLevel * 100;

        character.max_hp += 5;
        character.attack += 3;
        character.defense += 3;

        leveledUp = true;
    }

    await client.query(
        `UPDATE characters
         SET exp = $1,
             level = $2,
             next_exp = $3,
             attack = $4,
             defense = $5,
             max_hp = $6
         WHERE id = $7`,
        [
            newExp,
            newLevel,
            nextExp,
            newAttack,
            newDefense,
            newMaxHP,
            character.id
        ]
    );

    return {
        expGained,
        leveledUp,
        levelUpCount,
        newLevel,
        currentExp: newExp,
        nextExp,
        updatedStats: {
            max_hp: newMaxHP,
            attack: newAttack,
            defense: newDefense
        }
    };

}


   //  battle_historyに保存
   async function saveHistory(
    session,
    finalDamage,
    enemyDamage,
    outcome,
    expGained
) {
    await client.query(
        `INSERT INTO battle_history
         (character_id, enemy_id, damage, enemy_damage, outcome, exp_gained, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
            session.character_id,
            session.enemy_id,
            finalDamage,
            enemyDamage,
            outcome,
            expGained
        ]
    );
}


// attack API
exports.attack = async ({ sessionId }) => {
        
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // セッション取得
        const sessionResult = await client.query(
            'SELECT * FROM battle_sessions WHERE id = $1 FOR UPDATE',
            [sessionId]
        );

        const session = sessionResult.rows[0];
        if(!session || session.status !== 'ongoing')
            throw new Error('Battle not available');

        const character = await client.query(
            'SELECT * FROM characters WHERE id = $1',
            [session.character_id]
        );

    const enemy = await client.query(
            'SELECT * FROM enemies WHERE id = $1',
            [session.enemy_id]
        );

        const charData = character.rows[0];
        const enemyData = enemy.rows[0];

        // 1ターン実行
        const turnResult = await processTurn(session, charData, enemyData);

        //セッション更新
        await client.query(
            `UPDATE battle_sessions
             SET character_hp = $1,
                 enemy_hp = $2,
                 status = $3
                 boss_phase = $4,
             WHERE id = $5`,
            [
                turnResult.characterHp,
                turnResult.enemyHp,
                turnResult.outcome,

                sessionId
            ]
        );

        let expResult = null;

        //経験値獲得
        if (turnResult.outcome === 'win') {
            expResult = await applyExpWithClient(client, charData, enemyData);
        }

        //履歴保存
        await client.query(
            `INSERT INTO battle_history
             (character_id, enemy_id, damage, enemy_damage, outcome, exp_gained, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
                session.character_id,
                session.enemy_id,
                turnResult.finalDamage,
                turnResult.enemyDamage,
                turnResult.outcome,
                expResult ? expResult.expGained : 0
            ]
        );

        await client.query('COMMIT');
    
        return {
            success: true,
            data: {
                ...turnResult,
                exp: expResult
            }
    };
} catch (err) {

    await client.query('ROLLBACK');
    throw err;

} finally {

    client.release();
}


};

}
