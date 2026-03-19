const { bossBehavior } = require('../data/bossBehavior');

exports.selectBossAction = (phase) => {

    const behavior = bossBehavior[phase];
    const actions = behavior.actions;

    const totalWeight =
        actions.reduce((sum, a) => sum + a.weight, 0);

    const rand = Math.random() * totalWeight;

    let cumulative = 0;

    for (const action of actions) {
        cumulative += action.weight;
        if (rand <= cumulative) {
            return action.type;
        }
    }

    return actions[0].type; // fallback
};