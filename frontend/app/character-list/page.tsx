'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Character, Skill } from '@/lib/api';
import CharacterGrid from '@/components/CharacterGrid';

const ELEMENT_LABEL: Record<string, string> = { fire: '🔥 炎', water: '💧 水', wood: '🌿 木' };
const ROLE_LABEL: Record<string, string> = { warrior: '戦士', mage: '魔法使い', tank: 'タンク' };

function StatRow({ label, value, color }: { label: string; value: number | string; color?: string }) {
    return (
        <div className="flex items-center justify-between py-1 border-b border-gray-800">
            <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
            <span className={`text-sm font-bold ${color ?? 'text-gray-200'}`}>{value}</span>
        </div>
    );
}

export default function CharacterListPage() {
    const router = useRouter();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selected, setSelected] = useState<Character | null>(null);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getCharacters().then(chars => {
            setCharacters(chars);
            if (chars.length > 0) setSelected(chars[0]);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!selected) return;
        api.getCharacterSkills(selected.id).then(setSkills).catch(() => setSkills([]));
    }, [selected]);

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
            <p className="animate-pulse text-gray-400">読み込み中...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            {/* ヘッダー */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-4">
                <button
                    onClick={() => router.push('/')}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                    ← ホームに戻る
                </button>
                <h1 className="text-xl font-bold tracking-wide">📋 キャラクターリスト</h1>
            </div>

            {/* メインコンテンツ */}
            <div className="flex flex-1 overflow-hidden">

                {/* 左半分: キャラクターグリッド */}
                <div className="w-1/2 p-6 border-r border-gray-800 overflow-y-auto">
                    <p className="text-xs text-gray-600 mb-4 uppercase tracking-widest">
                        全キャラクター（{characters.length} / 30）
                    </p>
                    <CharacterGrid
                        characters={characters}
                        selectedId={selected?.id}
                        onSelect={setSelected}
                    />
                </div>

                {/* 右半分: キャラクター詳細 */}
                <div className="w-1/2 p-6 overflow-y-auto">
                    {selected ? (
                        <div className="flex gap-4 h-full">
                            {/* 左側: 情報 */}
                            <div className="flex-1 flex flex-col">
                                {/* キャラクター名 */}
                                <div className="mb-1">
                                    <span className="text-xs text-gray-500 uppercase tracking-widest">
                                        {ELEMENT_LABEL[selected.element]} / {ROLE_LABEL[selected.role] ?? selected.role}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-bold mb-4">{selected.name}</h2>

                                {/* ステータス */}
                                <div className="mb-6">
                                    <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">Stats</p>
                                    <StatRow label="Level" value={selected.level} color="text-yellow-300" />
                                    <StatRow label="HP" value={`${selected.hp} / ${selected.max_hp}`} color="text-green-300" />
                                    <StatRow label="SP" value={`${selected.sp} / ${selected.max_sp}`} color="text-blue-300" />
                                    <StatRow label="Attack" value={selected.attack} color="text-orange-300" />
                                    <StatRow label="Defense" value={selected.defense} color="text-cyan-300" />
                                    <StatRow label="EXP" value={`${selected.exp} / ${selected.next_exp}`} />
                                </div>

                                {/* スキル */}
                                <div>
                                    <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">Skills</p>
                                    <div className="flex flex-col gap-2">
                                        {Array.from({ length: 4 }, (_, i) => {
                                            const skill = skills[i];
                                            return (
                                                <div
                                                    key={i}
                                                    className="rounded-lg bg-gray-800/60 border border-gray-700 px-4 py-3"
                                                >
                                                    {skill ? (
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium text-sm">{skill.name}</span>
                                                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                                                <span>POW {skill.power}</span>
                                                                <span className="text-blue-400">SP {skill.mp_cost}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-700 text-sm">---</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* 右側: 全身イラストプレースホルダー */}
                            <div className="w-32 shrink-0 flex flex-col">
                                <div className={`flex-1 rounded-xl border border-gray-700 flex items-center justify-center
                                    ${selected.element === 'fire'  ? 'bg-gradient-to-b from-red-950 to-gray-900' :
                                      selected.element === 'water' ? 'bg-gradient-to-b from-blue-950 to-gray-900' :
                                                                     'bg-gradient-to-b from-green-950 to-gray-900'}`}
                                >
                                    <div className="flex flex-col items-center gap-2 text-gray-600">
                                        <span className="text-4xl">
                                            {selected.element === 'fire' ? '🔥' :
                                             selected.element === 'water' ? '💧' : '🌿'}
                                        </span>
                                        <span className="text-[10px] text-center leading-tight">illustration<br />coming soon</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-600">
                            <p className="text-sm">キャラクターを選択してください</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
