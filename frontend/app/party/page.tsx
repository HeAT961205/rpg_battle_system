'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Character, PartyMember } from '@/lib/api';

const ELEMENT_LABEL: Record<string, string> = { fire: '🔥 炎', water: '💧 水', wood: '🌿 木' };
const ROLE_LABEL: Record<string, string> = { warrior: '戦士', mage: '魔法使い', tank: 'タンク' };

export default function PartyPage() {
    const router = useRouter();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState<number | null>(null);

    const load = async () => {
        const [chars, party] = await Promise.all([
            api.getCharacters(),
            api.getParty(),
        ]);
        setCharacters(chars);
        setSelected(
            party.members
                .sort((a, b) => a.position - b.position)
                .map((m: PartyMember) => m.id)
        );
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const toggle = (id: number) => {
        setSelected(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            if (prev.length >= 3) return prev;
            return [...prev, id];
        });
        setMessage('');
    };

    const save = async () => {
        if (selected.length === 0) { setMessage('1人以上選択してください'); return; }
        await api.updateParty(selected);
        setMessage('パーティを保存しました');
    };

    const resetLevel = async (characterId: number) => {
        setResetting(characterId);
        try {
            await api.resetCharacterLevel(characterId);
            await load();
            setMessage('レベルをリセットしました');
        } catch (e) {
            setMessage((e as Error).message);
        }
        setResetting(null);
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
            <p className="animate-pulse text-gray-400">読み込み中...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <div className="mx-auto max-w-xl px-4 py-8">
                <button
                    onClick={() => router.push('/')}
                    className="mb-6 flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
                >
                    ← ホームに戻る
                </button>
                <h1 className="mb-2 text-3xl font-bold tracking-wide">👥 パーティ編成</h1>
                <p className="mb-6 text-gray-500 text-sm">キャラクターを選択（最大3人）</p>

                <div className="flex flex-col gap-3 mb-8">
                    {characters.map(c => {
                        const isSelected = selected.includes(c.id);
                        const position = selected.indexOf(c.id) + 1;
                        return (
                            <div
                                key={c.id}
                                className={`rounded-xl border-2 transition-all ${
                                    isSelected
                                        ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-900/20'
                                        : 'border-gray-700 bg-gray-800/60'
                                }`}
                            >
                                <button
                                    onClick={() => toggle(c.id)}
                                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* アイコンプレースホルダー */}
                                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl shrink-0">
                                            {c.element === 'fire' ? '🔥' : c.element === 'water' ? '💧' : '🌿'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-lg">{c.name}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                                                    Lv.{c.level}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    EXP {c.exp} / {c.next_exp}
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
                                        <span className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                                            {position}
                                        </span>
                                    )}
                                </button>

                                {/* レベルリセットボタン */}
                                {c.level > 1 && (
                                    <div className="px-5 pb-3 flex justify-end">
                                        <button
                                            onClick={() => resetLevel(c.id)}
                                            disabled={resetting === c.id}
                                            className="text-xs px-3 py-1 rounded-lg bg-gray-700 text-gray-400 hover:bg-red-900/50 hover:text-red-300 border border-gray-600 hover:border-red-700 transition-all disabled:opacity-50"
                                        >
                                            {resetting === c.id ? 'リセット中...' : '↺ Lv.1にリセット'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={save}
                    className="w-full rounded-xl bg-blue-700 border border-blue-600 py-4 text-lg font-semibold hover:bg-blue-600 transition-colors shadow-lg"
                >
                    保存する
                </button>
                {message && (
                    <p className={`mt-4 text-center text-sm ${message.includes('エラー') || message.includes('選択') ? 'text-red-400' : 'text-green-400'}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
