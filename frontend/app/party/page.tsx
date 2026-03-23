'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Character, PartyMember } from '@/lib/api';

export default function PartyPage() {
    const router = useRouter();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        load();
    }, []);

    const toggle = (id: number) => {
        setSelected(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            if (prev.length >= 3) return prev;
            return [...prev, id];
        });
        setMessage('');
    };

    const save = async () => {
        if (selected.length === 0) {
            setMessage('1人以上選択してください');
            return;
        }
        await api.updateParty(selected);
        setMessage('パーティを保存しました');
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
                <h1 className="mb-8 text-3xl font-bold">パーティ編成</h1>
                <p className="mb-4 text-gray-400">キャラクターを選択（最大3人）</p>

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

                <button
                    onClick={save}
                    className="w-full rounded-lg bg-blue-600 py-3 text-lg font-semibold hover:bg-blue-500 transition-colors"
                >
                    保存する
                </button>
                {message && (
                    <p className="mt-4 text-center text-sm text-green-400">{message}</p>
                )}
            </div>
        </div>
    );
}
