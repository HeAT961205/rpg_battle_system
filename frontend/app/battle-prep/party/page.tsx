'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, Enemy, Party } from '@/lib/api';

const ELEMENT_LABEL: Record<string, string> = { fire: '🔥 炎', water: '💧 水', wood: '🌿 木' };
const ELEMENT_ICON: Record<string, string> = { fire: '🔥', water: '💧', wood: '🌿' };
const ENEMY_EMOJI: Record<string, string> = { fire: '🐉', water: '🐋', wood: '🐢' };
const ELEMENT_BORDER: Record<string, string> = {
    fire:  'border-red-700/60',
    water: 'border-blue-700/60',
    wood:  'border-green-700/60',
};

function PartySelectScreen() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const enemyId = Number(searchParams.get('enemyId'));
    const floor = Number(searchParams.get('floor') ?? '1');

    const [enemy, setEnemy] = useState<Enemy | null>(null);
    const [parties, setParties] = useState<Party[]>([]);
    const [selectedPartyIndex, setSelectedPartyIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([api.getEnemies(), api.getParties()]).then(([enemies, partyData]) => {
            const found = enemies.find(e => e.id === enemyId) ?? enemies[0];
            setEnemy(found);
            setParties(partyData.parties);
            setLoading(false);
        });
    }, [enemyId]);

    const selectedParty = parties[selectedPartyIndex];

    const prevParty = () => setSelectedPartyIndex(i => (i - 1 + parties.length) % parties.length);
    const nextParty = () => setSelectedPartyIndex(i => (i + 1) % parties.length);

    const startBattle = async () => {
        if (!selectedParty || selectedParty.members.length === 0) {
            setError('パーティにメンバーがいません');
            return;
        }
        if (!enemy) return;
        setStarting(true);
        setError('');
        try {
            const memberIds = selectedParty.members
                .sort((a, b) => a.position - b.position)
                .map(m => m.character_id);
            await api.updateParty(selectedParty.id, memberIds);
            const res = await api.startBattle(selectedParty.id, enemy.id, floor);
            router.push(`/battle?battleId=${res.battleId}`);
        } catch (e) {
            setError((e as Error).message);
            setStarting(false);
        }
    };

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
                    onClick={() => router.back()}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                    ← 戻る
                </button>
                <h1 className="text-lg font-bold tracking-wide">⚔️ 戦闘準備</h1>
                <span className="ml-auto text-xs text-gray-600 border border-gray-700 rounded-full px-3 py-1">
                    Floor {floor}
                </span>
            </div>

            {/* メインコンテンツ */}
            <div className="flex flex-1 overflow-hidden">

                {/* 左: パーティ選択（1パーティ表示） */}
                <div className="w-1/2 border-r border-gray-800 flex flex-col p-6">
                    {/* タイトル行 */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm uppercase tracking-widest text-gray-500">パーティ選択</h2>
                        <button
                            onClick={() => router.push(`/party?from=battle-prep&enemyId=${enemyId}&floor=${floor}`)}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors border border-blue-800 rounded-lg px-3 py-1"
                        >
                            ✏️ パーティ編成
                        </button>
                    </div>

                    {/* パーティ表示 + 左右ナビ */}
                    <div className="flex items-center gap-3 flex-1">
                        {/* 左矢印 */}
                        <button
                            onClick={prevParty}
                            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full
                                       bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-all text-sm"
                        >
                            ◀
                        </button>

                        {/* パーティボックス */}
                        {selectedParty ? (
                            <div className="flex-1 rounded-xl border-2 border-blue-500 bg-blue-900/10 p-5 shadow-lg shadow-blue-900/20 min-h-[260px] flex flex-col">
                                {/* パーティ名 */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="font-bold text-lg">{selectedParty.name}</span>
                                    <span className="text-xs text-gray-500">{selectedParty.members.length} / 3人</span>
                                </div>

                                {/* メンバー一覧 */}
                                <div className="flex flex-col gap-4 flex-1 justify-center">
                                    {selectedParty.members.length > 0 ? (
                                        selectedParty.members
                                            .sort((a, b) => a.position - b.position)
                                            .map(m => (
                                                <div key={m.character_id} className="flex items-center gap-3">
                                                    {/* 属性 */}
                                                    <span className="text-xl w-7 text-center shrink-0">
                                                        {ELEMENT_ICON[m.element]}
                                                    </span>
                                                    {/* アイコン */}
                                                    <div className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-xl shrink-0
                                                        ${ELEMENT_BORDER[m.element]} bg-gray-800`}>
                                                        {ELEMENT_ICON[m.element]}
                                                    </div>
                                                    {/* レベル・名前 */}
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-gray-500 leading-none mb-0.5">Lv.{m.level}</span>
                                                        <span className="text-base font-semibold">{m.name}</span>
                                                    </div>
                                                </div>
                                            ))
                                    ) : (
                                        <p className="text-gray-600 text-sm text-center">メンバー未編成</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 rounded-xl border border-dashed border-gray-700 flex items-center justify-center min-h-[260px]">
                                <p className="text-gray-600 text-sm">パーティなし</p>
                            </div>
                        )}

                        {/* 右矢印 */}
                        <button
                            onClick={nextParty}
                            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full
                                       bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-all text-sm"
                        >
                            ▶
                        </button>
                    </div>

                    {/* ナビゲーションドット */}
                    <div className="flex justify-center gap-3 mt-5">
                        {parties.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedPartyIndex(i)}
                                className={`w-3 h-3 rounded-full border-2 transition-all
                                    ${i === selectedPartyIndex
                                        ? 'bg-white border-white scale-110'
                                        : 'bg-transparent border-gray-600 hover:border-gray-400'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* 右: 敵情報 */}
                {enemy && (
                    <div className="w-1/2 flex flex-col items-center justify-center p-8 gap-6">
                        {/* 敵画像 */}
                        <div className="relative">
                            <div className={`absolute inset-0 rounded-full blur-3xl opacity-15
                                ${enemy.element === 'fire'  ? 'bg-red-500' :
                                  enemy.element === 'water' ? 'bg-blue-500' : 'bg-green-500'}`}
                            />
                            <span className="relative text-[8rem] leading-none select-none drop-shadow-2xl">
                                {ENEMY_EMOJI[enemy.element] ?? '👾'}
                            </span>
                        </div>

                        {/* 属性 + 名前 */}
                        <div className="flex items-center gap-3 text-center">
                            <span className={`text-sm font-bold px-3 py-1 rounded-full border ${
                                enemy.element === 'fire'  ? 'border-red-700 bg-red-900/40 text-red-300' :
                                enemy.element === 'water' ? 'border-blue-700 bg-blue-900/40 text-blue-300' :
                                                            'border-green-700 bg-green-900/40 text-green-300'
                            }`}>
                                {ELEMENT_LABEL[enemy.element]}
                            </span>
                            <h2 className="text-2xl font-bold tracking-wider">{enemy.name}</h2>
                        </div>

                        {/* Floor スケール情報 */}
                        <div className="text-xs text-gray-600 border border-gray-800 rounded-xl px-4 py-2 text-center">
                            <span>Floor {floor} — HP {Math.round(enemy.max_hp * Math.pow(1.1, floor - 1))} / ATK {Math.round(enemy.attack * Math.pow(1.1, floor - 1))}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* エラー */}
            {error && (
                <p className="text-center text-red-400 text-sm pb-2">{error}</p>
            )}

            {/* 右下: 戦闘開始ボタン */}
            <div className="flex justify-end px-6 py-5 border-t border-gray-800">
                <button
                    onClick={startBattle}
                    disabled={starting || !selectedParty || selectedParty.members.length === 0}
                    className="flex items-center gap-3 bg-red-700 border border-red-600 rounded-xl px-8 py-4
                               text-xl font-bold hover:bg-red-600 disabled:opacity-40 transition-colors
                               shadow-xl shadow-red-900/40 tracking-widest"
                >
                    {starting ? '開始中...' : '⚔️ 戦闘開始'}
                </button>
            </div>
        </div>
    );
}

export default function BattlePrepPartyPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
                <p className="animate-pulse text-gray-400">読み込み中...</p>
            </div>
        }>
            <PartySelectScreen />
        </Suspense>
    );
}
