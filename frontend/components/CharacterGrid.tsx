'use client';

import { Character } from '@/lib/api';

const ELEMENT_COLOR: Record<string, string> = {
    fire:  'bg-red-900/40 border-red-700/50',
    water: 'bg-blue-900/40 border-blue-700/50',
    wood:  'bg-green-900/40 border-green-700/50',
};
const ELEMENT_ICON: Record<string, string> = {
    fire: '🔥', water: '💧', wood: '🌿',
};

const TOTAL_SLOTS = 30; // 6 cols × 5 rows

type Props = {
    characters: Character[];
    selectedId?: number | null;
    onSelect: (character: Character) => void;
};

export default function CharacterGrid({ characters, selectedId, onSelect }: Props) {
    const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => characters[i] ?? null);

    return (
        <div className="grid grid-cols-6 gap-2">
            {slots.map((char, i) => {
                if (!char) {
                    return (
                        <div
                            key={`empty-${i}`}
                            className="aspect-square rounded-lg bg-gray-800/40 border border-gray-700/30"
                        />
                    );
                }
                const isSelected = selectedId === char.id;
                return (
                    <button
                        key={char.id}
                        onClick={() => onSelect(char)}
                        className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all
                            ${ELEMENT_COLOR[char.element] ?? 'bg-gray-800 border-gray-600'}
                            ${isSelected ? 'ring-2 ring-white scale-105' : 'hover:scale-105 hover:brightness-110'}
                        `}
                    >
                        <span className="text-xl leading-none">{ELEMENT_ICON[char.element]}</span>
                        <span className="text-[10px] text-gray-300 font-medium leading-none truncate w-full text-center px-0.5">
                            {char.name}
                        </span>
                        <span className="text-[9px] text-gray-500 leading-none">Lv.{char.level}</span>
                    </button>
                );
            })}
        </div>
    );
}
