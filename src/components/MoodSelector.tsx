import { Plus } from 'lucide-react';
import { MoodOption } from './MoodOption';
import type { Mood } from '../types/mood';

interface MoodSelectorProps {
  moods: Mood[];
  selectedMoodName: string | null;
  onSelect: (mood: Mood) => void;
  onAddCustom?: () => void;
  onDeleteCustom?: (id: number) => void;
  className?: string;
}

export function MoodSelector({
  moods,
  selectedMoodName,
  onSelect,
  onAddCustom,
  onDeleteCustom,
  className = '',
}: MoodSelectorProps) {
  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:max-h-none md:overflow-visible max-h-[500px] overflow-y-auto pr-4 custom-scrollbar ${className}`}
    >
      {moods.map((mood) => (
        <MoodOption
          key={mood.id ?? mood.name}
          mood={mood}
          isSelected={selectedMoodName === mood.name}
          onSelect={() => onSelect(mood)}
          onDelete={mood.id != null ? onDeleteCustom : undefined}
        />
      ))}
      {onAddCustom && (
        <button
          type="button"
          onClick={onAddCustom}
          className="p-6 rounded-3xl border-2 border-dashed border-stone-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left flex flex-col items-center justify-center gap-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:text-indigo-500 transition-all group-hover:scale-110">
            <Plus size={24} />
          </div>
          <p className="text-xs font-bold text-stone-400 group-hover:text-indigo-500 uppercase tracking-widest">
            Add your own
          </p>
        </button>
      )}
    </div>
  );
}
