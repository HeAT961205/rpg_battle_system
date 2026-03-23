'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Character, Enemy, PartyMember } from '@/lib/api';

export default function BattlePrepPage() {
    const router = useRouter();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [selectedEnemy, setSelectedEnemy] = useState<number | null>(null);
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
            const res = await api.startBattle(1, selectedEnemy);
            router.push(`/battle?battleId=${res.battleId}`);
        } catch (e) {
            setError((e as Error).message);
            setStarting(false);
        }
    };

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;

    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-900 text-white p-8">
            <div className="w-full max-w-xl">
                <button
                    onClick={() => router.push('/')}
                    className="mb-6 text-gray-400 hover:text-white transition-colors"
                >
                    ← ホームに戻る
                </button>
                <h1 className="mb-8 text-3xl font-bold">戦闘準備</h1>

                {/* パーティ選択 */}
                <h2 className="mb-3 text-xl font-semibold text-gray-200">パーティ（最大3人）</h2>
                <div className="flex flex-col gap-3 mb-8">
                    {characters.map(c => {
                        const isSelected = selected.includes(c.id);
                        const position = selected.indexOf(c.id) + 1;
                        return (
                            <button
                                key={c.id}
                                onClick={() => toggle(c.id)}
                                className={`flex items-center justify-between rounded-lg px-5 py-4 border-2 transition-colors text-left ${
                                    isSelected
                                        ? 'border-blue-500 bg-blue-900/40'
                                        : 'border-gray-600 bg-gray-800 hover:border-gray-400'
                                }`}
                            >
                                <div>
                                    <span className="font-semibold text-lg">{c.name}</span>
                                    <span className="ml-3 text-sm text-gray-400">{c.element} / {c.role}</span>
                                    <div className="text-sm text-gray-400 mt-1">
                                        HP {c.max_hp} / ATK {c.attack} / DEF {c.defense}
                                    </div>
                                </div>
                                {isSelected && (
                                    <span className="text-blue-400 font-bold text-lg">{position}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* 敵選択 */}
                <h2 className="mb-3 text-xl font-semibold text-gray-200">対戦相手</h2>
                <div className="flex flex-col gap-3 mb-8">
                    {enemies.map(e => (
                        <button
                            key={e.id}
                            onClick={() => { setSelectedEnemy(e.id); setError(''); }}
                            className={`flex items-center justify-between rounded-lg px-5 py-4 border-2 transition-colors text-left ${
                                selectedEnemy === e.id
                                    ? 'border-red-500 bg-red-900/40'
                                    : 'border-gray-600 bg-gray-800 hover:border-gray-400'
                            }`}
                        >
                            <div>
                                <span className="font-semibold text-lg">{e.name}</span>
                                <span className="ml-3 text-sm text-gray-400">{e.element}</span>
                                {e.is_boss && <span className="ml-2 text-xs text-yellow-400 font-bold">BOSS</span>}
                                <div className="text-sm text-gray-400 mt-1">
                                    HP {e.max_hp} / ATK {e.attack} / DEF {e.defense}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {error && <p className="mb-4 text-red-400 text-sm">{error}</p>}

                <button
                    onClick={startBattle}
                    disabled={starting}
                    className="w-full rounded-lg bg-red-700 py-4 text-xl font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                    {starting ? '開始中...' : '戦闘開始'}
                </button>
            </div>
        </div>
    );
}
