'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, BattleState, TurnResult, BattleResult, LevelUp, Character, Skill, BattleAction } from '@/lib/api';

const ELEMENT_LABEL: Record<string, string> = { fire: '🔥', water: '💧', wood: '🌿' };


function BattleScreen() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const battleId = Number(searchParams.get('battleId'));

    const [state, setState] = useState<BattleState | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [result, setResult] = useState<BattleResult | null>(null);
    const [levelUps, setLevelUps] = useState<LevelUp[]>([]);
    const [resultCharacters, setResultCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);

    // スキルマップ: characterId → Skill[]
    const [skillMap, setSkillMap] = useState<Record<number, Skill[]>>({});

    // 今ターンの行動選択: characterId → skillId | null
    const [actions, setActions] = useState<Record<number, number | null>>({});

    useEffect(() => {
        if (!battleId) return;
        api.getBattleState(battleId).then(async s => {
            setState(s);
            // 各メンバーのスキルを取得
            const map: Record<number, Skill[]> = {};
            await Promise.all(s.party.map(async m => {
                const skills = await api.getCharacterSkills(m.id);
                map[m.id] = skills;
            }));
            setSkillMap(map);
            // デフォルト全員通常攻撃
            const defaultActions: Record<number, null> = {};
            s.party.forEach(m => { defaultActions[m.id] = null; });
            setActions(defaultActions);
            setLoading(false);
        });
    }, [battleId]);

    const setAction = (characterId: number, skillId: number | null) => {
        setActions(prev => ({ ...prev, [characterId]: skillId }));
    };

    const executeTurn = async () => {
        if (!state || acting) return;
        setActing(true);
        try {
            const actionList: BattleAction[] = state.party
                .filter(m => m.current_hp > 0)
                .map(m => ({ characterId: m.id, skillId: actions[m.id] ?? null }));

            const turn: TurnResult = await api.action(battleId, actionList);
            setLogs(prev => [...turn.logs, ...prev]);
            setState(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    enemy: { ...prev.enemy, hp: turn.enemyHp },
                    party: prev.party.map(m => {
                        const updated = turn.party.find(p => p.character_id === m.id);
                        return updated ? { ...m, current_hp: updated.current_hp } : m;
                    }),
                };
            });
            // 行動選択をリセット（全員通常攻撃に戻す）
            if (state) {
                const reset: Record<number, null> = {};
                state.party.forEach(m => { reset[m.id] = null; });
                setActions(reset);
            }
            if (turn.isBattleEnd) {
                setLevelUps(turn.levelUps ?? []);
                const [res, allChars] = await Promise.all([
                    api.getBattleResult(battleId),
                    api.getCharacters(),
                ]);
                const partyIds = new Set(state.party.map(m => m.id));
                setResultCharacters(allChars.filter(c => partyIds.has(c.id)));
                setResult(res);
            }
        } catch (e) {
            setLogs(prev => [`エラー: ${(e as Error).message}`, ...prev]);
        }
        setActing(false);
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
            <p className="animate-pulse text-lg text-gray-400">読み込み中...</p>
        </div>
    );
    if (!state) return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
            バトルが見つかりません
        </div>
    );

    const enemyHpRate = state.enemy.maxHp > 0 ? state.enemy.hp / state.enemy.maxHp : 0;

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <div className="mx-auto max-w-xl px-4 py-6">
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-bold tracking-wide">⚔️ バトル</h1>
                    {state.enemyLevel > 1 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-900/50 text-red-300 border border-red-700">
                            敵 Lv.{state.enemyLevel}
                        </span>
                    )}
                </div>

                {/* 敵 */}
                <div className="mb-6 rounded-xl bg-gray-800/80 border border-gray-700 p-5 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-3xl shrink-0">
                            {state.enemy.element === 'fire' ? '🐉' : state.enemy.element === 'water' ? '🐋' : '🐢'}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-lg">{state.enemy.name}</span>
                                <span className="text-sm text-gray-400">
                                    {state.enemy.hp} <span className="text-gray-600">/ {state.enemy.maxHp}</span>
                                </span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-gray-700 overflow-hidden">
                                <div
                                    className="h-3 rounded-full bg-red-500 transition-all duration-500"
                                    style={{ width: `${Math.max(0, enemyHpRate * 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* パーティ + 行動選択 */}
                <div className="mb-5 flex flex-col gap-3">
                    {state.party.map(m => {
                        const hpRate = m.max_hp > 0 ? m.current_hp / m.max_hp : 0;
                        const isDead = m.current_hp <= 0;
                        const memberSkills = skillMap[m.id] ?? [];
                        const selectedSkillId = actions[m.id] ?? null;

                        return (
                            <div
                                key={m.id}
                                className={`rounded-xl border p-4 transition-all ${
                                    isDead
                                        ? 'border-gray-700 bg-gray-800/30 opacity-50'
                                        : 'border-gray-700 bg-gray-800/70'
                                }`}
                            >
                                {/* キャラクター情報 */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl shrink-0">
                                        {ELEMENT_LABEL[m.element] ?? '⚔️'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold">{m.name}</span>
                                            <span className="text-sm text-gray-400">
                                                {m.current_hp} <span className="text-gray-600">/ {m.max_hp}</span>
                                            </span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-gray-700 overflow-hidden">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-500 ${
                                                    hpRate > 0.5 ? 'bg-green-500' : hpRate > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                                style={{ width: `${Math.max(0, hpRate * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 行動選択ボタン（生存時のみ） */}
                                {!isDead && !result && (
                                    <div className="flex flex-wrap gap-2">
                                        {/* 通常攻撃 */}
                                        <button
                                            onClick={() => setAction(m.id, null)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                                                selectedSkillId === null
                                                    ? 'bg-orange-700 border-orange-500 text-white'
                                                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-400'
                                            }`}
                                        >
                                            ⚔️ 通常攻撃
                                        </button>

                                        {/* スキルスロット */}
                                        {memberSkills.length > 0 ? memberSkills.map(skill => (
                                            <button
                                                key={skill.id}
                                                onClick={() => setAction(m.id, skill.id)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                                                    selectedSkillId === skill.id
                                                        ? 'bg-purple-700 border-purple-500 text-white'
                                                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-400'
                                                }`}
                                                title={`威力: ${skill.power}`}
                                            >
                                                ✨ {skill.name}
                                            </button>
                                        )) : (
                                            // スキル未登録時はグレーアウトスロット
                                            <button
                                                disabled
                                                className="px-3 py-1.5 rounded-lg text-sm border border-gray-700 bg-gray-800/50 text-gray-600 cursor-not-allowed"
                                            >
                                                — スキルなし —
                                            </button>
                                        )}
                                    </div>
                                )}
                                {isDead && (
                                    <p className="text-xs text-gray-600 mt-1">戦闘不能</p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* バトルログ */}
                {logs.length > 0 && (
                    <div className="mb-5 rounded-xl bg-gray-800/60 border border-gray-700 p-4 max-h-40 overflow-y-auto">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">バトルログ</p>
                        {logs.map((log, i) => (
                            <p key={i} className={`text-sm py-0.5 ${i === 0 ? 'text-white' : 'text-gray-400'}`}>
                                {log}
                            </p>
                        ))}
                    </div>
                )}

                {/* 行動ボタン */}
                <button
                    onClick={executeTurn}
                    disabled={acting || !!result}
                    className="w-full rounded-xl bg-red-700 py-4 text-xl font-bold hover:bg-red-600 disabled:opacity-50 transition-colors tracking-wider shadow-lg shadow-red-900/30"
                >
                    {acting ? '行動中...' : '▶ ターン実行'}
                </button>
            </div>

            {/* リザルトポップアップ */}
            {result && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 backdrop-blur-sm">
                    <div className="rounded-2xl bg-gray-800 border border-gray-600 p-8 w-[420px] shadow-2xl flex flex-col gap-5">

                        {/* タイトル */}
                        <div className="text-center">
                            <h2 className={`text-5xl font-bold tracking-wider mb-1 ${result.result === 'victory' ? 'text-yellow-400' : 'text-red-400'}`}>
                                {result.result === 'victory' ? 'VICTORY' : 'DEFEAT'}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {result.result === 'victory' ? '勝利！敵を倒した！' : '全滅... またの挑戦を。'}
                            </p>
                        </div>

                        {/* キャラクターEXP一覧（勝利時） */}
                        {result.result === 'victory' && resultCharacters.length > 0 && (
                            <div className="flex flex-col gap-3">
                                {state!.party
                                    .slice()
                                    .sort((a, b) => a.position - b.position)
                                    .map(pm => {
                                        const char = resultCharacters.find(c => c.id === pm.id);
                                        if (!char) return null;
                                        const isAlive = pm.current_hp > 0;
                                        const expRate = char.next_exp > 0 ? Math.min(char.exp / char.next_exp, 1) : 0;
                                        const didLevelUp = levelUps.some(lu => lu.name === char.name);
                                        return (
                                            <div key={char.id} className={`rounded-xl border p-3 ${isAlive ? 'border-gray-600 bg-gray-700/50' : 'border-gray-700 bg-gray-800/30 opacity-50'}`}>
                                                {/* アイコン + 名前 + レベル */}
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-xl shrink-0">
                                                        {ELEMENT_LABEL[char.element]}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-sm">{char.name}</span>
                                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${didLevelUp ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-600' : 'text-gray-400'}`}>
                                                                Lv.{char.level}
                                                            </span>
                                                            {didLevelUp && <span className="text-yellow-400 text-xs">⬆ Level Up!</span>}
                                                        </div>
                                                    </div>
                                                    {/* 取得EXP */}
                                                    {isAlive && (
                                                        <span className="text-green-400 text-xs font-bold shrink-0">
                                                            +{result.expGained} EXP
                                                        </span>
                                                    )}
                                                </div>
                                                {/* EXPバー */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 rounded-full bg-gray-600 overflow-hidden">
                                                        <div
                                                            className="h-2 rounded-full bg-blue-500 transition-all duration-700"
                                                            style={{ width: `${expRate * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">
                                                        {char.exp} / {char.next_exp}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        )}

                        {/* ホームに戻る */}
                        <button
                            onClick={() => router.push('/')}
                            className="w-full rounded-xl bg-blue-600 py-3 text-lg font-semibold hover:bg-blue-500 transition-colors"
                        >
                            ホームに戻る
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BattlePage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
                <p className="animate-pulse text-gray-400">読み込み中...</p>
            </div>
        }>
            <BattleScreen />
        </Suspense>
    );
}
