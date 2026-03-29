import Link from 'next/link';

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white relative overflow-hidden">
            {/* 背景装飾 */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col items-center">
                {/* タイトル */}
                <p className="mb-2 text-sm tracking-[0.5em] text-gray-500 uppercase">Turn-based RPG</p>
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
        </div>
    );
}
