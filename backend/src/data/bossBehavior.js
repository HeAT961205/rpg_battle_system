exports.bossBehavior = {
    1: {  // Phase1
        actions: [
            { type: 'single', weight: 100 }
        ]
    },
    2: {  // Phase2
        actions: [
            { type: 'single', weight: 70 },
            { type: 'aoe', weight: 30 }
        ]
    }
};