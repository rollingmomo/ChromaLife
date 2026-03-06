import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Heart, 
  Cloud, 
  Zap, 
  Moon, 
  Sun, 
  Flame, 
  Wind,
  HandHeart,
  User,
  ShieldCheck,
  Coffee,
  Sparkles,
  Activity,
  Smile,
  Sunrise,
  Anchor,
  Award,
  Bell,
  Book,
  Camera,
  Gift,
  Music,
  Star,
  Target
} from 'lucide-react';
import { MoodSelector } from './components/MoodSelector';

interface JournalEntry {
  date: string;
  color: string;
  emotion: string;
  note: string;
}

interface CustomEmotion {
  id?: number;
  name: string;
  color: string;
  icon: string;
  description: string;
}

const ICON_MAP: Record<string, any> = {
  Heart, Cloud, Zap, Moon, Sun, Flame, Wind, HandHeart, User, ShieldCheck, Coffee, Sparkles, Activity, Smile, Sunrise,
  Anchor, Award, Bell, Book, Camera, Gift, Music, Star, Target
};

const FIXED_YEAR = 2026;
type ViewTab = 'today' | 'year';

const DEFAULT_EMOTIONS = [
  { name: 'Joyful', color: '#FFD700', icon: Sun, description: 'Radiant and full of light', insightLine: 'There was light in your world.' },
  { name: 'Peaceful', color: '#A8E6CF', icon: Wind, description: 'Calm and centered', insightLine: 'You were right where you needed to be.' },
  { name: 'Loved', color: '#FF8B94', icon: Heart, description: 'Connected and warm', insightLine: 'Connected and warm.' },
  { name: 'Angry', color: '#FF6B6B', icon: Flame, description: 'Intense and burning', insightLine: 'Something mattered enough to move you.' },
  { name: 'Anxious', color: '#D4A5FF', icon: Zap, description: 'Restless and buzzing', insightLine: 'Your mind was working to protect you.' },
  { name: 'Tired', color: '#B2B2B2', icon: Moon, description: 'Drained and slow', insightLine: 'Your body was asking for rest.' },
  { name: 'Inspired', color: '#FF9248', icon: Zap, description: 'Creative and driven', insightLine: 'Something was calling you forward.' },
  { name: 'Grateful', color: '#96CEB4', icon: HandHeart, description: 'Appreciative and full', insightLine: 'Something in your life felt worth holding onto.' },
  { name: 'Lonely', color: '#778899', icon: User, description: 'Solitary and longing', insightLine: 'You were missing connection.' },
  { name: 'Confident', color: '#5D6DBE', icon: ShieldCheck, description: 'Strong and capable', insightLine: 'You trusted yourself that day.' },
  { name: 'Bored', color: '#D3D3D3', icon: Coffee, description: 'Uninterested and idle', insightLine: 'You were waiting for something to land.' },
  { name: 'Excited', color: '#FF4E91', icon: Sparkles, description: 'Energetic and eager', insightLine: 'Something was pulling you toward the future.' },
  { name: 'Stressed', color: '#8D6E63', icon: Activity, description: 'Overwhelmed and tense', insightLine: 'A lot was asking for your attention.' },
  { name: 'Content', color: '#9CCC65', icon: Smile, description: 'Satisfied and at ease', insightLine: 'Enough felt like enough.' },
  { name: 'Hopeful', color: '#4DD0E1', icon: Sunrise, description: 'Optimistic and expectant', insightLine: 'You were leaning toward what\'s possible.' },
  { name: 'Recovering', color: '#81C784', icon: Anchor, description: 'In need of rest and restoration', insightLine: 'You were giving yourself permission to slow down.' },
];

export default function App() {
  const today = new Date().toISOString().split('T')[0];
  const [entries, setEntries] = useState<Record<string, JournalEntry>>({});
  const [customEmotions, setCustomEmotions] = useState<CustomEmotion[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(today);
   const [noteDraft, setNoteDraft] = useState<string>('');
  const [isNoteActive, setIsNoteActive] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>('today');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [currentYear] = useState(FIXED_YEAR);
  const [loading, setLoading] = useState(true);

  const isSelectedDateEditable = selectedDate === today;

  const HIDDEN_CUSTOM_EMOTION_NAMES = ['Sunshine', 'Melancholy', 'Melancoley'];

  const allEmotions = useMemo(() => {
    const customMapped = customEmotions
      .filter(ce => !HIDDEN_CUSTOM_EMOTION_NAMES.includes(ce.name))
      .map(ce => ({
        ...ce,
        icon: ICON_MAP[ce.icon] || Star
      }));
    return [...DEFAULT_EMOTIONS, ...customMapped];
  }, [customEmotions]);

  const emotionInsightLine = useMemo(() => {
    const map: Record<string, string> = {};
    allEmotions.forEach((e: { name: string; insightLine?: string; description?: string }) => {
      map[e.name] = e.insightLine ?? e.description ?? '';
    });
    return map;
  }, [allEmotions]);

  useEffect(() => {
    Promise.all([fetchEntries(), fetchCustomEmotions()]).finally(() => setLoading(false));
  }, []);

  // Sync noteDraft when selected day or entries change
  useEffect(() => {
    setNoteDraft(entries[selectedDate]?.note ?? '');
  }, [selectedDate, entries]);

  const fetchCustomEmotions = async () => {
    try {
      const response = await fetch('/api/emotions');
      const data = await response.json();
      setCustomEmotions(data);
    } catch (error) {
      console.error('Failed to fetch custom emotions:', error);
    }
  };

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/journal');
      const data: JournalEntry[] = await response.json();
      const entryMap = data.reduce((acc, entry) => {
        acc[entry.date] = entry;
        return acc;
      }, {} as Record<string, JournalEntry>);
      setEntries(entryMap);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    }
  };

  const saveEntry = async (emotion: any, date?: string) => {
    const targetDate = date ?? selectedDate;
    const newEntry = {
      date: targetDate,
      color: emotion.color,
      emotion: emotion.name,
      note: entries[targetDate]?.note || ''
    };

    // Optimistic: switch to Year tab and show new entry immediately
    setEntries(prev => ({ ...prev, [targetDate]: newEntry }));
    if (targetDate === today) {
      setSelectedDate(today);
      setActiveTab('year');
    }

    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });
      if (!response.ok) {
        // Revert on failure
        setEntries(prev => {
          const next = { ...prev };
          delete next[targetDate];
          return next;
        });
        if (targetDate === today) setActiveTab('today');
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
      setEntries(prev => {
        const next = { ...prev };
        delete next[targetDate];
        return next;
      });
      if (targetDate === today) setActiveTab('today');
    }
  };

  const saveNote = async () => {
    const current = entries[selectedDate];
    if (!current) return;

    const updatedEntry: JournalEntry = {
      ...current,
      note: noteDraft.trim(),
    };

    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEntry),
      });

      if (response.ok) {
        setEntries(prev => ({ ...prev, [selectedDate]: updatedEntry }));
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const deleteCustomEmotion = async (id: number) => {
    try {
      const response = await fetch(`/api/emotions/${id}`, { method: 'DELETE' });
      if (response.ok) await fetchCustomEmotions();
      else {
        const err = await response.json();
        alert(err.error ?? 'Could not remove emotion');
      }
    } catch (error) {
      console.error('Failed to delete custom emotion:', error);
    }
  };

  const daysOfYear = useMemo(() => {
    const days = [];
    const start = new Date(currentYear, 0, 1);
    const end = new Date(currentYear, 11, 31);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d).toISOString().split('T')[0]);
    }
    return days;
  }, [currentYear]);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const getDayColor = (date: string) => {
    return entries[date]?.color || '#f0f0f0';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfcf9]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 rounded-full bg-indigo-500"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div>
          <h1 className="text-5xl md:text-7xl font-serif font-light tracking-tight">
            Chroma <span className="italic text-indigo-600">Life</span>
          </h1>
          <p className="text-stone-500 font-serif italic text-lg mt-1">
            A visual record of your emotional landscape
          </p>
        </div>
      </header>

      <main>
        <AnimatePresence mode="wait">
          {activeTab === 'today' ? (
            <motion.div
              key="tab-today"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full"
            >
              <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl border border-indigo-50">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 md:mb-8">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-3xl md:text-4xl font-serif font-medium">
                      How are you feeling today?
                    </h3>
                    <p className="text-stone-400 text-lg mt-2 italic font-serif">
                      {new Date(today).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-2xl bg-stone-100/80 w-fit shrink-0">
                    <button
                      type="button"
                      onClick={() => { setActiveTab('today'); setSelectedDate(today); }}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-white text-indigo-600 shadow-sm ring-1 ring-stone-200/50"
                    >
                      Today's mood
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('year')}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-stone-500 hover:text-stone-700"
                    >
                      Year at a glance
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <MoodSelector
                    moods={allEmotions}
                    selectedMoodName={entries[today]?.emotion ?? null}
                    onSelect={(emotion) => saveEntry(emotion, today)}
                    onDeleteCustom={deleteCustomEmotion}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="tab-year"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              {/* Left: The Grid */}
              <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
                <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-xl border border-stone-100">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-10">
                    <h2 className="text-2xl font-serif font-medium flex items-center gap-3">
                      <Calendar size={24} className="text-indigo-500" />
                      Yearly Spectrum
                    </h2>
                    <div className="hidden md:flex gap-2 text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                      {months.map((m, idx) => (
                        <span 
                          key={m} 
                          className={`w-6 text-center cursor-default transition-colors duration-300 ${hoveredMonth === idx ? 'text-indigo-500 scale-110' : ''}`}
                          onMouseEnter={() => setHoveredMonth(idx)}
                          onMouseLeave={() => setHoveredMonth(null)}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-7 sm:grid-cols-14 md:grid-cols-[repeat(31,1fr)] gap-2 sm:gap-1.5 md:gap-1.5">
                    {daysOfYear.map((date) => {
                      const isSelected = selectedDate === date;
                      const isToday = today === date;
                      const entry = entries[date];
                      const dateObj = new Date(date);
                      const isHoveredMonth = hoveredMonth !== null && dateObj.getMonth() === hoveredMonth;
                      
                      return (
                        <motion.button
                          key={date}
                          whileHover={{ scale: 1.2, zIndex: 20 }}
                          whileTap={{ scale: 0.9 }}
                          animate={{ 
                            scale: isHoveredMonth ? 1.15 : 1,
                            opacity: hoveredMonth !== null && !isHoveredMonth ? 0.2 : 1
                          }}
                          onClick={() => setSelectedDate(date)}
                          className={`
                            aspect-square rounded-full relative transition-all duration-500 min-w-0
                            ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 z-10' : ''}
                            ${isToday ? 'border-2 border-stone-300' : ''}
                            ${isHoveredMonth ? 'z-10' : ''}
                          `}
                          style={{ 
                            backgroundColor: getDayColor(date),
                            boxShadow: entry ? `0 0 12px ${entry.color}30` : 'none'
                          }}
                          title={date}
                        />
                      );
                    })}
                  </div>
                  
                  <div className="mt-10 pt-8 border-t border-stone-50 flex flex-wrap gap-5 justify-center">
                    {allEmotions.map(e => (
                      <div key={e.name} className="flex items-center gap-2 group cursor-default">
                        <div className="w-3 h-3 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: e.color }} />
                        <span className="text-[10px] uppercase tracking-[0.15em] text-stone-400 font-bold group-hover:text-stone-600 transition-colors">{e.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Day Insight */}
              <div className="space-y-8 order-1 lg:order-2">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden min-h-[300px] flex flex-col justify-between"
                >
                  {/* Decorative background circle */}
                  <div 
                    className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[100px] opacity-30 transition-colors duration-1000"
                    style={{ backgroundColor: entries[selectedDate]?.color || '#6366f1' }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-sm"
                      >
                        <Calendar size={28} className="text-white/90" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-serif">Day Insight</h3>
                        <p className="text-stone-400 text-sm italic font-serif">
                          {new Date(selectedDate).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {entries[selectedDate] ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-5 h-5 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                            style={{ backgroundColor: entries[selectedDate].color }}
                          />
                          <span className="text-4xl font-serif italic tracking-tight">
                            {entries[selectedDate].emotion}
                          </span>
                        </div>
                        <p className="text-stone-300 text-lg leading-relaxed font-serif italic space-y-1">
                          <span className="block">I feel {entries[selectedDate].emotion.toLowerCase()}.</span>
                          {isSelectedDateEditable ? (
                            <span className="block">
                              <input
                                type="text"
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                                onFocus={() => setIsNoteActive(true)}
                                onBlur={() => setIsNoteActive(false)}
                                placeholder="Add a short note here"
                                className="bg-transparent border-none outline-none text-stone-300 font-serif italic text-lg placeholder:text-stone-500/80 block w-full min-w-0"
                                style={{ caretColor: 'rgba(255,255,255,0.9)' }}
                                maxLength={120}
                              />
                            </span>
                          ) : entries[selectedDate].note ? (
                            <span className="block">{entries[selectedDate].note}</span>
                          ) : null}
                        </p>
                        {isSelectedDateEditable ? (
                          isNoteActive || noteDraft.trim() !== (entries[selectedDate].note ?? '') ? (
                            <button
                              type="button"
                              onClick={saveNote}
                              disabled={noteDraft.trim() === (entries[selectedDate].note ?? '')}
                              className="w-full py-4 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl text-sm font-medium transition-all mt-6 border border-white/5"
                            >
                              Save note
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveTab('today')}
                              className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-medium transition-all mt-6 border border-white/5"
                            >
                              Update
                            </button>
                          )
                        ) : (
                          <p className="text-stone-500 text-sm italic mt-6">
                            Past days can&apos;t be edited.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {isSelectedDateEditable ? (
                          <>
                            <p className="text-stone-400 text-lg leading-relaxed font-serif italic">
                              This day has no entry yet. Add one whenever you're ready.
                            </p>
                            <button 
                              type="button"
                              onClick={() => setActiveTab('today')}
                              className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 rounded-2xl font-semibold transition-all shadow-xl shadow-indigo-500/30"
                            >
                              Log entry
                            </button>
                          </>
                        ) : (
                          <p className="text-stone-500 text-lg leading-relaxed font-serif italic">
                            Past days can't be logged.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-24 py-12 border-t border-stone-100 text-center">
        <p className="text-stone-400 text-xs uppercase tracking-[0.4em] font-bold">
          ChromaLife &bull; The Art of Feeling
        </p>
      </footer>
    </div>
  );
}
