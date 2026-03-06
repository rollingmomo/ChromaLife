import type { ComponentType } from 'react';
import { Check, Trash2 } from 'lucide-react';
import type { Mood } from '../types/mood';

export interface MoodOptionProps {
  mood: Mood;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: (id: number) => void;
}

export const MoodOption: ComponentType<MoodOptionProps> = ({ mood, isSelected, onSelect, onDelete }) => {
  const Icon = mood.icon;
  const isCustom = mood.id != null;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mood.id == null) return;
    if (!window.confirm(`Remove "${mood.name}" from your list?`)) return;
    onDelete?.(mood.id);
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        p-6 rounded-3xl border-2 transition-all text-left flex flex-col gap-3 group relative
        ${isSelected
          ? 'border-indigo-500 bg-indigo-50/30 shadow-inner'
          : 'border-stone-50 hover:border-indigo-200 hover:bg-stone-50/50'
        }
      `}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
        style={{ backgroundColor: `${mood.color}20`, color: mood.color }}
      >
        <Icon size={24} />
      </div>
      <div>
        <p className="font-semibold text-stone-800">{mood.name}</p>
        <p className="text-[10px] text-stone-400 leading-tight mt-1">
          {mood.description ?? 'Custom emotion'}
        </p>
      </div>
      {isSelected && (
        <div className="absolute top-4 right-4 bg-indigo-500 rounded-full p-1 text-white">
          <Check size={12} />
        </div>
      )}
      {isCustom && onDelete && (
        <button
          type="button"
          onClick={handleDelete}
          className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-full p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"
          title="Remove this emotion"
          aria-label={`Remove ${mood.name}`}
        >
          <Trash2 size={14} />
        </button>
      )}
    </button>
  );
};
