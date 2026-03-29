'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, Character, Party, PartyMember, Skill } from '@/lib/api';
import CharacterGrid from '@/components/CharacterGrid';

const ELEMENT_LABEL: Record<string, string> = { fire: '炎', water: '水', wood: '木' };
const ELEMENT_COLOR: Record<string, string> = {
    fire:  'bg-red-900/30 border-red-700/60 text-red-300',
    water: 'bg-blue-900/30 border-blue-700/60 text-blue-300',
    wood:  'bg-green-900/30 border-green-700/60 text-green-300',
};
const ELEMENT_ICON: Record<string, string> = { fire: '🔥', water: '💧', wood: '🌿' };

const MAX_PARTIES = 5;

// --- キャラクター選択モーダル ---
function CharacterSelectModal({
    characters,
    currentId,
    onSelect,
    onClose,
}: {
    characters: Character[];
    currentId: number | null;
    onSelect: (char: Character) => void;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-[480px] shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">キャラクターを選択</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
                    >
                        ✕
                    </button>
                </div>
                <CharacterGrid
                    characters={characters}
                    selectedId={currentId}
                    onSelect={(char) => { onSelect(char); onClose(); }}
                />
            </div>
        </div>
    );
}

// --- パーティメンバー1枠 ---
function MemberSlot({
    member,
    skills,
    onClickIcon,
    onRemove,
}: {
    member: PartyMember | null;
    skills: Skill[];
    onClickIcon: () => void;
    onRemove: () => void;
}) {
    return (
        <div className="flex rounded-xl border border-gray-700 bg-gray-800/50 overflow-hidden min-h-[120px]">
            {/* 属性セクション */}
            <div className={`w-14 flex-shrink-0 flex flex-col items-center justify-center border-r border-gray-700
                ${member ? ELEMENT_COLOR[member.element] : 'bg-gray-800/30'}`}>
                {member ? (
                    <>
                        <span className="text-2xl">{ELEMENT_ICON[member.element]}</span>
                        <span className="text-[10px] mt-1 font-bold">{ELEMENT_LABEL[member.element]}</span>
                    </>
                ) : (
                    <span className="text-gray-700 text-xs">—</span>
                )}
            </div>

            {/* キャラクターアイコンセクション */}
            <div className="w-20 flex-shrink-0 flex flex-col items-center justify-center border-r border-gray-700 p-2 gap-1">
                <button
                    onClick={onClickIcon}
                    className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center transition-all
                        ${member
                            ? `${ELEMENT_COLOR[member.element]} hover:brightness-125`
                            : 'border-dashed border-gray-600 bg-gray-800/40 hover:border-gray-400'
                        }`}
                >
                    {member
                        ? <span className="text-2xl">{ELEMENT_ICON[member.element]}</span>
                        : <span className="text-gray-600 text-xl">+</span>
                    }
                </button>
                {member ? (
                    <>
                        <span className="text-[10px] text-gray-300 font-medium truncate w-full text-center">{member.name}</span>
                        <span className="text-[9px] text-gray-500">Lv.{member.level}</span>
                    </>
                ) : (
                    <span className="text-[9px] text-gray-600">空きスロット</span>
                )}
            </div>

            {/* スキル一覧セクション */}
            <div className="flex-1 border-r border-gray-700 p-3 flex flex-col justify-center gap-1">
                <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Skills</p>
                {Array.from({ length: 4 }, (_, i) => {
                    const skill = skills[i];
                    return (
                        <div key={i} className="text-xs text-gray-500">
                            {skill
                                ? <span className="text-gray-300">{skill.name}</span>
                                : <span className="text-gray-700">---</span>
                            }
                        </div>
                    );
                })}
            </div>

            {/* ステータスセクション */}
            <div className="w-28 flex-shrink-0 p-3 flex flex-col justify-center gap-0.5">
                {member ? (
                    <>
                        <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Stats</p>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">HP</span>
                            <span className="text-green-400 font-bold">{member.max_hp}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">SP</span>
                            <span className="text-blue-400 font-bold">{member.max_sp}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">ATK</span>
                            <span className="text-orange-400 font-bold">{member.attack}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">DEF</span>
                            <span className="text-cyan-400 font-bold">{member.defense}</span>
                        </div>
                        <button
                            onClick={onRemove}
                            className="mt-2 text-[9px] text-gray-600 hover:text-red-400 transition-colors"
                        >
                            ✕ 外す
                        </button>
                    </>
                ) : (
                    <p className="text-[10px] text-gray-700 text-center">未編成</p>
                )}
            </div>
        </div>
    );
}

// --- メインページ ---
function PartyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get('from');
    const backUrl = from === 'battle-prep'
        ? `/battle-prep/party?enemyId=${searchParams.get('enemyId') ?? ''}&floor=${searchParams.get('floor') ?? '1'}`
        : '/';
    const [parties, setParties] = useState<Party[]>([]);
    const [allCharacters, setAllCharacters] = useState<Character[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [localMembers, setLocalMembers] = useState<(PartyMember | null)[]>([null, null, null]);
    const [localName, setLocalName] = useState('');
    const [skillsMap, setSkillsMap] = useState<Record<number, Skill[]>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    // モーダル: どのスロット(0,1,2)を編集中か
    const [modalSlot, setModalSlot] = useState<number | null>(null);

    // 全データ読み込み
    useEffect(() => {
        Promise.all([api.getParties(), api.getCharacters()]).then(([partyData, chars]) => {
            const list = partyData.parties;
            setParties(list);
            setAllCharacters(chars);
            loadPartyIntoLocal(list[0]);
            setLoading(false);
        });
    }, []);

    // パーティ切り替え時にローカル状態を更新
    const loadPartyIntoLocal = (party: Party) => {
        const slots: (PartyMember | null)[] = [null, null, null];
        party.members.forEach(m => {
            const pos = m.position - 1;
            if (pos >= 0 && pos < 3) slots[pos] = m;
        });
        setLocalMembers(slots);
        setLocalName(party.name);
    };

    // スキル取得（キャラクターIDをキーにキャッシュ）
    const fetchSkillsForChar = async (characterId: number) => {
        if (skillsMap[characterId]) return;
        try {
            const skills = await api.getCharacterSkills(characterId);
            setSkillsMap(prev => ({ ...prev, [characterId]: skills }));
        } catch {
            setSkillsMap(prev => ({ ...prev, [characterId]: [] }));
        }
    };

    useEffect(() => {
        localMembers.forEach(m => {
            if (m) fetchSkillsForChar(m.character_id ?? m.id);
        });
    }, [localMembers]);

    const switchParty = (newIndex: number) => {
        setCurrentIndex(newIndex);
        loadPartyIntoLocal(parties[newIndex]);
        setMessage('');
    };

    const handleSelectCharacter = (slot: number, char: Character) => {
        setLocalMembers(prev => {
            const next = [...prev] as (PartyMember | null)[];
            // 同じキャラが他のスロットにいれば外す
            const existingSlot = next.findIndex(m => m && (m.character_id ?? m.id) === char.id);
            if (existingSlot !== -1 && existingSlot !== slot) next[existingSlot] = null;
            next[slot] = { ...char, character_id: char.id, position: slot + 1 };
            return next;
        });
    };

    const handleRemoveMember = (slot: number) => {
        setLocalMembers(prev => {
            const next = [...prev] as (PartyMember | null)[];
            next[slot] = null;
            return next;
        });
    };

    const save = async () => {
        setSaving(true);
        setMessage('');
        try {
            const memberIds = localMembers.filter(Boolean).map(m => m!.character_id ?? m!.id);
            const partyId = parties[currentIndex].id;
            await api.updateParty(partyId, memberIds, localName);
            // ローカルのparties状態も更新
            setParties(prev => prev.map((p, i) =>
                i === currentIndex ? { ...p, name: localName } : p
            ));
            setMessage('保存しました');
        } catch (e) {
            setMessage((e as Error).message);
        }
        setSaving(false);
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
            <p className="animate-pulse text-gray-400">読み込み中...</p>
        </div>
    );

    // モーダルで選択中の現在のキャラID
    const currentModalCharId = modalSlot !== null && localMembers[modalSlot]
        ? (localMembers[modalSlot]!.character_id ?? localMembers[modalSlot]!.id)
        : null;

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            {/* ヘッダー */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-4">
                <button
                    onClick={() => router.push(backUrl)}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                    {from === 'battle-prep' ? '← 戻る' : '← ホームに戻る'}
                </button>
                <h1 className="text-xl font-bold tracking-wide">👥 パーティ編成</h1>
            </div>

            {/* メインエリア */}
            <div className="flex flex-1 relative">
                {/* 左矢印 */}
                <button
                    onClick={() => currentIndex > 0 && switchParty(currentIndex - 1)}
                    disabled={currentIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10
                               flex items-center justify-center rounded-full bg-gray-800 border border-gray-700
                               hover:bg-gray-700 disabled:opacity-20 transition-all text-xl"
                >
                    ◀
                </button>

                {/* 右矢印 */}
                <button
                    onClick={() => currentIndex < MAX_PARTIES - 1 && switchParty(currentIndex + 1)}
                    disabled={currentIndex === MAX_PARTIES - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10
                               flex items-center justify-center rounded-full bg-gray-800 border border-gray-700
                               hover:bg-gray-700 disabled:opacity-20 transition-all text-xl"
                >
                    ▶
                </button>

                {/* コンテンツ */}
                <div className="flex-1 mx-14 px-4 py-6 flex flex-col">
                    {/* パーティ名 */}
                    <div className="flex items-center gap-3 mb-6">
                        <input
                            type="text"
                            value={localName}
                            onChange={e => setLocalName(e.target.value)}
                            maxLength={20}
                            className="text-xl font-bold bg-transparent border-b border-gray-700
                                       focus:border-blue-500 outline-none text-white
                                       placeholder-gray-600 transition-colors"
                            placeholder="パーティ名を入力"
                        />
                        <span className="text-xs text-gray-600">Party {currentIndex + 1} / {MAX_PARTIES}</span>
                    </div>

                    {/* メンバースロット × 3 */}
                    <div className="flex flex-col gap-3 mb-6">
                        {[0, 1, 2].map(slot => (
                            <MemberSlot
                                key={slot}
                                member={localMembers[slot]}
                                skills={skillsMap[localMembers[slot]?.character_id ?? localMembers[slot]?.id ?? -1] ?? []}
                                onClickIcon={() => setModalSlot(slot)}
                                onRemove={() => handleRemoveMember(slot)}
                            />
                        ))}
                    </div>

                    {/* 保存ボタン */}
                    <button
                        onClick={save}
                        disabled={saving}
                        className="w-full rounded-xl bg-blue-700 border border-blue-600 py-3 font-semibold
                                   hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {saving ? '保存中...' : '💾 保存する'}
                    </button>
                    {message && (
                        <p className={`mt-3 text-center text-sm ${message.includes('エラー') || message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                            {message}
                        </p>
                    )}
                </div>
            </div>

            {/* ナビゲーションドット */}
            <div className="flex items-center justify-center gap-3 py-5 border-t border-gray-800">
                {parties.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => switchParty(i)}
                        className={`w-3 h-3 rounded-full border-2 transition-all
                            ${i === currentIndex
                                ? 'bg-white border-white scale-110'
                                : 'bg-transparent border-gray-600 hover:border-gray-400'
                            }`}
                    />
                ))}
            </div>

            {/* キャラクター選択モーダル */}
            {modalSlot !== null && (
                <CharacterSelectModal
                    characters={allCharacters}
                    currentId={currentModalCharId}
                    onSelect={(char) => handleSelectCharacter(modalSlot, char)}
                    onClose={() => setModalSlot(null)}
                />
            )}
        </div>
    );
}

export default function PartyPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
                <p className="animate-pulse text-gray-400">読み込み中...</p>
            </div>
        }>
            <PartyContent />
        </Suspense>
    );
}
