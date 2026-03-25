'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Character, Enemy, PartyMember } from '@/lib/api';

const ELEMENT_LABEL: Record<string, string> = { fire: '🔥 炎', water: '💧 水', wood: '🌿 木' };
const ROLE_LABEL: Record<string, string> = { warrior: '戦士', mage: '魔法使い', tank: 'タンク' };

function scaleByLevel(base: number, level: number) {
    return Math.round(base * Math.pow(1.1, level - 1));
}

export default function BattlePrepPage() {
    const router = useRouter();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [selectedEnemy, setSelectedEnemy] = useState<number | null>(null);
    const [enemyLevel, setEnemyLevel] = useState(1);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            const [chars, party, enms] = await Promise.all([
                api.getCharacters(),
                api.getParty(),
                api.getEnemies(),
            ]);
            setCharacters(chars);
            setSelected(
                party.members
                    .sort((a, b) => a.position - b.position)
                    .map((m: PartyMember) => m.id)
            );
            setEnemies(enms);
            setLoading(false);
        };
        load();
    }, []);

    const toggle = (id: number) => {
        setSelected(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            if (prev.length >= 3) return prev;
            return [...prev, id];
        });
        setError('');
    };

    const startBattle = async () => {
        if (selected.length === 0) { setError('キャラクターを1人以上選択してください'); return; }
        if (!selectedEnemy) { setError('敵を選択してください'); return; }
        setStarting(true);
        try {
            await api.updateParty(selected);
            const res = await api.startBattle(1, selectedEnemy, enemyLevel);
            router.push(`/battle?battleId=${res.battleId}`);
        } catch (e) {
            setError((e as Error).message);
            setStarting(false);
        }
    };

    const selectedEnemyData = enemies.find(e => e.id === selectedEnemy);

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
            <p className="animate-pulse text-lg text-gray-400">読み込み中...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <div className="mx-auto max-w-xl px-4 py-8">
                {/* ヘッダー */}
                <button
                    onClick={() => router.push('/')}
                    className="mb-6 flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
                >
                    ← ホームに戻る
                </button>
                <h1 className="mb-8 text-3xl font-bold tracking-wide">⚔️ 戦闘準備</h1>

                {/* パーティ選択 */}
                <section className="mb-8">
                    <h2 className="mb-3 text-lg font-semibold text-yellow-400 uppercase tracking-widest">
                        パーティ編成 <span className="text-gray-400 text-sm normal-case">（最大3人）</span>
                    </h2>
                    <div className="flex flex-col gap-3">
                        {characters.map(c => {
                            const isSelected = selected.includes(c.id);
                            const position = selected.indexOf(c.id) + 1;
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => toggle(c.id)}
                                    className={`flex items-center justify-between rounded-xl px-5 py-4 border-2 transition-all text-left ${
                                        isSelected
                                            ? 'border-yellow-500 bg-yellow-900/20 shadow-lg shadow-yellow-900/20'
                                            : 'border-gray-700 bg-gray-800/60 hover:border-gray-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* アイコンプレースホルダー */}
                                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl shrink-0">
                                            {c.element === 'fire' ? '🔥' : c.element === 'water' ? '💧' : '🌿'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg">{c.name}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                                                    Lv.{c.level}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5">
                                                {ELEMENT_LABEL[c.element]} / {ROLE_LABEL[c.role] ?? c.role}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                HP {c.max_hp} / ATK {c.attack} / DEF {c.defense}
                                            </div>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <span className="w-8 h-8 rounded-full bg-yellow-500 text-black font-bold text-sm flex items-center justify-center shrink-0">
                                            {position}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* 敵選択 */}
                <section className="mb-6">
                    <h2 className="mb-3 text-lg font-semibold text-red-400 uppercase tracking-widest">
                        対戦相手
                    </h2>
                    <div className="flex flex-col gap-3 mb-5">
                        {enemies.map(e => (
                            <button
                                key={e.id}
                                onClick={() => { setSelectedEnemy(e.id); setError(''); }}
                                className={`flex items-center justify-between rounded-xl px-5 py-4 border-2 transition-all text-left ${
                                    selectedEnemy === e.id
                                        ? 'border-red-500 bg-red-900/20 shadow-lg shadow-red-900/20'
                                        : 'border-gray-700 bg-gray-800/60 hover:border-gray-500'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl shrink-0">
                                        {e.is_boss ? '👑' : e.element === 'fire' ? '🐉' : e.element === 'water' ? '🐋' : '🐢'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">{e.name}</span>
                                            {e.is_boss && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-700 text-yellow-200 font-bold">BOSS</span>}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-0.5">{ELEMENT_LABEL[e.element]}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            HP {e.max_hp} / ATK {e.attack} / DEF {e.defense}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* 敵レベル設定 */}
                    {selectedEnemyData && (
                        <div className="rounded-xl bg-gray-800/80 border border-gray-700 p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-gray-200">敵レベル設定</span>
                                <span className="text-2xl font-bold text-red-400">Lv.{enemyLevel}</span>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={30}
                                value={enemyLevel}
                                onChange={e => setEnemyLevel(Number(e.target.value))}
                                className="w-full accent-red-500 mb-4"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mb-4">
                                <span>Lv.1</span>
                                <span>Lv.15</span>
                                <span>Lv.30</span>
                            </div>
                            {/* スケール済みステータスプレビュー */}
                            <div className="rounded-lg bg-gray-900/60 p-3 text-sm">
                                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">スケール後ステータス</p>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <p className="text-gray-500 text-xs">HP</p>
                                        <p className="font-bold text-red-300">{scaleByLevel(selectedEnemyData.max_hp, enemyLevel)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">ATK</p>
                                        <p className="font-bold text-orange-300">{scaleByLevel(selectedEnemyData.attack, enemyLevel)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">DEF</p>
                                        <p className="font-bold text-blue-300">{scaleByLevel(selectedEnemyData.defense, enemyLevel)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {error && <p className="mb-4 text-red-400 text-sm">{error}</p>}

                <button
                    onClick={startBattle}
                    disabled={starting}
                    className="w-full rounded-xl bg-red-700 py-4 text-xl font-bold hover:bg-red-600 disabled:opacity-50 transition-colors tracking-wider shadow-lg shadow-red-900/30"
                >
                    {starting ? '開始中...' : '⚔️ 戦闘開始'}
                </button>
            </div>
        </div>
    );
}
