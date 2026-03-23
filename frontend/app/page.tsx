import Link from 'next/link';

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
            <h1 className="mb-2 text-5xl font-bold tracking-widest">TOWER OF DOOM</h1>
            <p className="mb-16 text-gray-400">Turn-based RPG Battle System</p>
            <div className="flex flex-col gap-4 w-64">
                <Link
                    href="/party"
                    className="rounded-lg bg-blue-600 px-6 py-4 text-center text-lg font-semibold hover:bg-blue-500 transition-colors"
                >
                    パーティ編成
                </Link>
                <Link
                    href="/battle-prep"
                    className="rounded-lg bg-red-700 px-6 py-4 text-center text-lg font-semibold hover:bg-red-600 transition-colors"
                >
                    戦闘準備
                </Link>
            </div>
        </div>
    );
}
