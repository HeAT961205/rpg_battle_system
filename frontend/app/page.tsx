'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api, Character } from '@/lib/api';

function OptionsMenu({ onClose }: { onClose: () => void }) {
    const [characters, setCharacters] = useState<Character[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState<number | null>(null);
    const [message, setMessage] = useState('');

    // メニューが開いた時にキャラクター一覧を取得
    useEffect(() => {
        api.getCharacters().then(chars => {
            setCharacters(chars);
            setLoading(false);
        });
    }, []);

    const handleReset = async (char: Character) => {
        setResetting(char.id);
        setMessage('');
        try {
            await api.resetCharacterLevel(char.id);
            const updated = await api.getCharacters();
            setCharacters(updated);
            setMessage(`${char.name} をリセットしました`);
        } catch {
            setMessage('リセットに失敗しました');
        }
        setResetting(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
            {/* 背景オーバーレイ */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* メニューパネル */}
            <div className="relative mt-16 mr-4 w-72 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
                {/* ヘッダー */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-300">⚙ オプション</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
                    >
                        ✕
                    </button>
                </div>

                {/* キャラクターリセットセクション */}
                <div className="px-5 py-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">キャラクターリセット</p>

                    {loading ? (
                        <p className="text-gray-600 text-sm text-center py-2 animate-pulse">読み込み中...</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {characters?.map(char => (
                                <div key={char.id} className="flex items-center justify-between bg-gray-800/60 rounded-xl px-4 py-3 border border-gray-700">
                                    <div>
                                        <span className="text-sm font-semibold">{char.name}</span>
                                        <span className="ml-2 text-xs text-gray-500">Lv.{char.level}</span>
                                    </div>
                                    <button
                                        onClick={() => handleReset(char)}
                                        disabled={resetting === char.id}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-red-900/50 border border-red-700 text-red-300
                                                   hover:bg-red-800/60 disabled:opacity-40 transition-colors font-semibold"
                                    >
                                        {resetting === char.id ? '...' : 'リセット'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {message && (
                        <p className={`mt-3 text-xs text-center ${message.includes('失敗') ? 'text-red-400' : 'text-green-400'}`}>
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Home() {
    const [optionsOpen, setOptionsOpen] = useState(false);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center text-white relative overflow-hidden">
            {/* 背景画像 */}
            <Image
                src="/images/home-bg.png"
                alt="background"
                fill
                className="object-cover object-center"
                priority
            />
            {/* 暗めのオーバーレイ */}
            <div className="absolute inset-0 bg-black/40" />
            {/* 下部グラデーション（テキスト可読性向上） */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/70 to-transparent" />

            {/* 右上: ログイン + オプション */}
            <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
                <button className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-all">
                    ログイン
                </button>
                <button
                    onClick={() => setOptionsOpen(true)}
                    className="w-9 h-9 flex items-center justify-center bg-gray-800 border border-gray-700 rounded-xl text-gray-400 hover:bg-gray-700 hover:text-white transition-all text-base"
                    aria-label="オプション"
                >
                    ⚙
                </button>
            </div>

            <div className="relative z-10 flex flex-col items-center">
                {/* タイトル */}
                <p className="mb-2 text-sm tracking-[0.5em] text-gray-200 uppercase">Turn-based RPG</p>
                <h1 className="mb-1 text-6xl font-bold tracking-widest text-white drop-shadow-lg">TOWER</h1>
                <h1 className="mb-12 text-6xl font-bold tracking-widest text-red-500 drop-shadow-lg">OF DOOM</h1>

                {/* ナビゲーション */}
                <div className="flex flex-col gap-4 w-72">
                    <Link
                        href="/character-list"
                        className="rounded-xl bg-gray-800 border border-gray-700 px-6 py-4 text-center text-lg font-semibold hover:bg-gray-700 hover:border-gray-500 transition-all shadow-lg"
                    >
                        📋 キャラクターリスト
                    </Link>
                    <Link
                        href="/party"
                        className="rounded-xl bg-gray-800 border border-gray-700 px-6 py-4 text-center text-lg font-semibold hover:bg-gray-700 hover:border-gray-500 transition-all shadow-lg"
                    >
                        👥 パーティ編成
                    </Link>
                    <Link
                        href="/battle-prep"
                        className="rounded-xl bg-red-800 border border-red-700 px-6 py-4 text-center text-lg font-semibold hover:bg-red-700 hover:border-red-500 transition-all shadow-lg shadow-red-900/30"
                    >
                        ⚔️ 戦闘準備
                    </Link>
                </div>

                <p className="mt-16 text-xs text-gray-700 tracking-widest">v0.1.0 — simulator mode</p>
            </div>

            {/* オプションメニュー */}
            {optionsOpen && <OptionsMenu onClose={() => setOptionsOpen(false)} />}
        </div>
    );
}
