'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Enemy } from '@/lib/api';

const ELEMENT_LABEL: Record<string, string> = { fire: '🔥 炎', water: '💧 水', wood: '🌿 木' };
const ENEMY_EMOJI: Record<string, string> = { fire: '🐉', water: '🐋', wood: '🐢' };
const ELEMENT_GLOW: Record<string, string> = {
    fire:  'from-red-950/60 via-gray-950 to-gray-950',
    water: 'from-blue-950/60 via-gray-950 to-gray-950',
    wood:  'from-green-950/60 via-gray-950 to-gray-950',
};

const MAX_FLOOR = 30;

export default function BattlePrepPage() {
    const router = useRouter();
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [index, setIndex] = useState(0);
    const [floor, setFloor] = useState(1);
    const [floorOpen, setFloorOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getEnemies().then(list => {
            setEnemies(list);
            setLoading(false);
        });
    }, []);

    const prev = () => setIndex(i => (i - 1 + enemies.length) % enemies.length);
    const next = () => setIndex(i => (i + 1) % enemies.length);

    const goToParty = () => {
        const enemy = enemies[index];
        router.push(`/battle-prep/party?enemyId=${enemy.id}&floor=${floor}`);
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
            <p className="animate-pulse text-gray-400">読み込み中...</p>
        </div>
    );

    if (enemies.length === 0) return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
            <p className="text-gray-500">敵データがありません</p>
        </div>
    );

    const enemy = enemies[index];
    const prevEnemy = enemies[(index - 1 + enemies.length) % enemies.length];
    const nextEnemy = enemies[(index + 1) % enemies.length];
    const flavorLines = (enemy.flavor_text ?? '').split('\\n');

    return (
        <div className={`min-h-screen bg-gradient-to-b ${ELEMENT_GLOW[enemy.element]} text-white relative flex flex-col overflow-hidden`}>

            {/* 背景グロー */}
            <div className={`absolute inset-0 pointer-events-none transition-all duration-700
                ${enemy.element === 'fire'  ? 'bg-red-900/5' :
                  enemy.element === 'water' ? 'bg-blue-900/5' : 'bg-green-900/5'}`}
            />

            {/* 左上: ホームに戻る */}
            <button
                onClick={() => router.push('/')}
                className="absolute top-5 left-5 z-20 text-gray-500 hover:text-white transition-colors text-sm"
            >
                ← ホームに戻る
            </button>

            {/* 右上: 階層（難易度）表示 */}
            <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
                {/* 増減ボタン */}
                <div className="flex flex-col gap-1">
                    <button
                        onClick={() => setFloor(f => Math.min(MAX_FLOOR, f + 1))}
                        disabled={floor >= MAX_FLOOR}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 border border-gray-600 hover:bg-gray-600 disabled:opacity-30 transition-colors text-xs"
                    >
                        ▲
                    </button>
                    <button
                        onClick={() => setFloor(f => Math.max(1, f - 1))}
                        disabled={floor <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 border border-gray-600 hover:bg-gray-600 disabled:opacity-30 transition-colors text-xs"
                    >
                        ▼
                    </button>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setFloorOpen(o => !o)}
                        className="flex items-center gap-2 bg-gray-800 border border-gray-600 rounded-xl px-5 py-3 hover:bg-gray-700 transition-colors"
                    >
                        <span className="text-xs text-gray-400 uppercase tracking-widest">Floor</span>
                        <span className="text-3xl font-bold text-white tabular-nums w-10 text-center">{floor}</span>
                    </button>

                    {/* 階層選択ドロップダウン */}
                    {floorOpen && (
                        <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-30 overflow-hidden">
                            <div className="grid grid-cols-5 gap-0.5 p-2 max-h-64 overflow-y-auto w-48">
                                {Array.from({ length: MAX_FLOOR }, (_, i) => i + 1).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => { setFloor(f); setFloorOpen(false); }}
                                        className={`py-2 text-sm font-bold rounded-lg transition-colors
                                            ${f === floor
                                                ? 'bg-white text-gray-900'
                                                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* メイン: 敵表示エリア */}
            <div className="flex-1 flex items-center justify-center relative py-8">

                {/* 前の敵（左、中央寄り）*/}
                {enemies.length > 1 && (
                    <div className="absolute left-[12%] flex flex-col items-center gap-1 opacity-25 scale-75 pointer-events-none select-none transition-all duration-500">
                        <span className="text-6xl">{ENEMY_EMOJI[prevEnemy.element] ?? '👾'}</span>
                        <span className="text-xs text-gray-400">{prevEnemy.name}</span>
                    </div>
                )}

                {/* 次の敵（右、中央寄り）*/}
                {enemies.length > 1 && (
                    <div className="absolute right-[12%] flex flex-col items-center gap-1 opacity-25 scale-75 pointer-events-none select-none transition-all duration-500">
                        <span className="text-6xl">{ENEMY_EMOJI[nextEnemy.element] ?? '👾'}</span>
                        <span className="text-xs text-gray-400">{nextEnemy.name}</span>
                    </div>
                )}

                {/* 中央: 現在の敵 */}
                <div className="flex flex-col items-center text-center z-10 transition-all duration-500">
                    {/* 大きな敵画像プレースホルダー */}
                    <div className="relative mb-8">
                        <div className={`absolute inset-0 rounded-full blur-3xl opacity-20
                            ${enemy.element === 'fire'  ? 'bg-red-500' :
                              enemy.element === 'water' ? 'bg-blue-500' : 'bg-green-500'}`}
                        />
                        <span className="relative text-[10rem] leading-none select-none drop-shadow-2xl">
                            {ENEMY_EMOJI[enemy.element] ?? '👾'}
                        </span>
                    </div>

                    {/* 属性 + 名前 */}
                    <div className="flex items-center gap-4 mb-5">
                        <span className={`text-sm font-bold px-3 py-1 rounded-full border ${
                            enemy.element === 'fire'  ? 'border-red-700 bg-red-900/40 text-red-300' :
                            enemy.element === 'water' ? 'border-blue-700 bg-blue-900/40 text-blue-300' :
                                                        'border-green-700 bg-green-900/40 text-green-300'
                        }`}>
                            {ELEMENT_LABEL[enemy.element]}
                        </span>
                        <h1 className="text-3xl font-bold tracking-widest">{enemy.name}</h1>
                    </div>

                    {/* フレーバーテキスト */}
                    <div className="max-w-sm">
                        {flavorLines.map((line, i) => (
                            <p key={i} className="text-gray-400 text-sm leading-[2.2] tracking-wide">
                                {line}
                            </p>
                        ))}
                    </div>
                </div>
            </div>

            {/* 左右スクロール矢印（中央寄り）*/}
            <button
                onClick={prev}
                className="absolute left-[5%] top-1/2 -translate-y-1/2 z-20 w-11 h-11
                           flex items-center justify-center rounded-full bg-gray-800/80 border border-gray-700
                           hover:bg-gray-700 transition-all text-lg"
            >
                ◀
            </button>
            <button
                onClick={next}
                className="absolute right-[5%] top-1/2 -translate-y-1/2 z-20 w-11 h-11
                           flex items-center justify-center rounded-full bg-gray-800/80 border border-gray-700
                           hover:bg-gray-700 transition-all text-lg"
            >
                ▶
            </button>

            {/* ドット（敵インジケーター）*/}
            <div className="flex justify-center gap-2 pb-6">
                {enemies.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`w-2 h-2 rounded-full border transition-all
                            ${i === index ? 'bg-white border-white scale-125' : 'bg-transparent border-gray-600 hover:border-gray-400'}`}
                    />
                ))}
            </div>

            {/* 右下: 決定ボタン */}
            <div className="absolute bottom-8 right-8 z-20">
                <button
                    onClick={goToParty}
                    className="bg-red-700 border border-red-600 rounded-2xl px-12 py-5
                               text-2xl font-bold hover:bg-red-600 transition-colors shadow-xl shadow-red-900/40 tracking-widest"
                >
                    決定
                </button>
            </div>
        </div>
    );
}
