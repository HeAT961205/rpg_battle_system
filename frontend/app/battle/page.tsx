'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, BattleState, TurnResult, BattleResult } from '@/lib/api';

function BattleScreen() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const battleId = Number(searchParams.get('battleId'));

    const [state, setState] = useState<BattleState | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [result, setResult] = useState<BattleResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);

    useEffect(() => {
        if (!battleId) return;
        api.getBattleState(battleId).then(s => {
            setState(s);
            setLoading(false);
        });
    }, [battleId]);

    const attack = async () => {
        if (!state || acting) return;
        setActing(true);
        try {
            const turn: TurnResult = await api.action(battleId);
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
            if (turn.isBattleEnd) {
                const res = await api.getBattleResult(battleId);
                setResult(res);
            }
        } catch (e) {
            setLogs(prev => [`エラー: ${(e as Error).message}`, ...prev]);
        }
        setActing(false);
    };

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;
    if (!state) return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">バトルが見つかりません</div>;

    const enemyHpRate = state.enemy.hp / state.enemy.maxHp;

    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-900 text-white p-8">
            <div className="w-full max-w-xl">
                <h1 className="mb-8 text-2xl font-bold text-center">バトル</h1>

                {/* 敵 */}
                <div className="mb-8 rounded-lg bg-gray-800 p-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xl font-bold">{state.enemy.name}</span>
                        <span className="text-gray-400 text-sm">HP {state.enemy.hp} / {state.enemy.maxHp}</span>
                    </div>
                    <div className="h-4 w-full rounded-full bg-gray-600">
                        <div
                            className="h-4 rounded-full bg-red-500 transition-all duration-300"
                            style={{ width: `${Math.max(0, enemyHpRate * 100)}%` }}
                        />
                    </div>
                </div>

                {/* パーティ */}
                <div className="mb-8 flex flex-col gap-3">
                    {state.party.map(m => {
                        const hpRate = m.current_hp / (state.party[0]?.current_hp || 1);
                        return (
                            <div key={m.id} className="rounded-lg bg-gray-800 p-4">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold">{m.name}</span>
                                    <span className="text-gray-400 text-sm">HP {m.current_hp}</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-gray-600">
                                    <div
                                        className="h-2 rounded-full bg-green-500 transition-all duration-300"
                                        style={{ width: `${Math.max(0, hpRate * 100)}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ログ */}
                {logs.length > 0 && (
                    <div className="mb-6 rounded-lg bg-gray-800 p-4 max-h-36 overflow-y-auto">
                        {logs.map((log, i) => (
                            <p key={i} className="text-sm text-gray-300">{log}</p>
                        ))}
                    </div>
                )}

                {/* 攻撃ボタン */}
                <button
                    onClick={attack}
                    disabled={acting || !!result}
                    className="w-full rounded-lg bg-red-700 py-4 text-xl font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                    {acting ? '攻撃中...' : '攻撃'}
                </button>
            </div>

            {/* リザルトポップアップ */}
            {result && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
                    <div className="rounded-2xl bg-gray-800 p-10 text-center w-80 shadow-2xl">
                        <h2 className={`mb-4 text-4xl font-bold ${result.result === 'victory' ? 'text-yellow-400' : 'text-red-400'}`}>
                            {result.result === 'victory' ? 'VICTORY' : 'DEFEAT'}
                        </h2>
                        <p className="mb-8 text-gray-300">
                            獲得EXP: <span className="text-white font-bold">{result.expGained}</span>
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full rounded-lg bg-blue-600 py-3 text-lg font-semibold hover:bg-blue-500 transition-colors"
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
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>}>
            <BattleScreen />
        </Suspense>
    );
}
