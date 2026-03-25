const BASE_URL = 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'API error');
    return json.data as T;
}

export type Character = {
    id: number;
    name: string;
    element: string;
    role: string;
    level: number;
    hp: number;
    max_hp: number;
    attack: number;
    defense: number;
    exp: number;
    next_exp: number;
};

export type Enemy = {
    id: number;
    name: string;
    element: string;
    hp: number;
    max_hp: number;
    attack: number;
    defense: number;
    exp_reward: number;
    is_boss: boolean;
};

export type Skill = {
    id: number;
    name: string;
    power: number;
    target_type: string;
    mp_cost: number;
};

export type PartyMember = Character & { position: number };

export type BattleState = {
    battleId: number;
    enemyLevel: number;
    party: { id: number; name: string; current_hp: number; max_hp: number; position: number; element: string }[];
    enemy: { id: number; name: string; hp: number; maxHp: number; element: string };
};

export type BattleAction = {
    characterId: number;
    skillId: number | null;
};

export type TurnResult = {
    damage: number;
    enemyHp: number;
    playerHp: number;
    isEnemyDefeated: boolean;
    isBattleEnd: boolean;
    logs: string[];
    party: { character_id: number; name: string; current_hp: number }[];
};

export type BattleResult = {
    result: string;
    expGained: number;
};

export const api = {
    getCharacters: () => request<Character[]>('/characters'),
    getEnemies: () => request<Enemy[]>('/enemies'),
    getParty: () => request<{ members: PartyMember[] }>('/party'),
    getSkills: () => request<Skill[]>('/skills'),
    getCharacterSkills: (characterId: number) =>
        request<Skill[]>(`/skills/character/${characterId}`),
    resetCharacterLevel: (characterId: number) =>
        request<Character>(`/characters/${characterId}/reset`, { method: 'POST' }),
    updateParty: (members: number[]) =>
        request<{ message: string }>('/party', {
            method: 'POST',
            body: JSON.stringify({ members }),
        }),
    startBattle: (partyId: number, enemyId: number, enemyLevel: number = 1) =>
        request<{ battleId: number; enemyLevel: number; party: PartyMember[]; enemy: Enemy }>('/battle/start', {
            method: 'POST',
            body: JSON.stringify({ partyId, enemyId, enemyLevel }),
        }),
    action: (battleId: number, actions: BattleAction[]) =>
        request<TurnResult>('/battle/action', {
            method: 'POST',
            body: JSON.stringify({ battleId, actions }),
        }),
    getBattleState: (battleId: number) =>
        request<BattleState>(`/battle/${battleId}`),
    getBattleResult: (battleId: number) =>
        request<BattleResult>(`/battle/${battleId}/result`),
};
