exports.checkPhaseTransition = (session, enemyHp, enemyMaxHp) => {

    if (!session.boss_phase) return 1;

    // 既にPhase2なら固定
    if (session.boss_phase >= 2) {
        return session.boss_phase;
    }

    const hpRate = enemyHp / enemyMaxHp;

    if (hpRate <= 0.5) {
        return 2;
    }

    return 1;
};