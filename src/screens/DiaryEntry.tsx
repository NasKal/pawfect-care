import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ChevronLeft, Loader2, AlertCircle, CheckCircle2, PawPrint, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Pet = { id: string; name: string; type: string };

const MOODS = [
  { value: 'milestone', label: '🏆 Milestone', bg: 'bg-red-50', active: 'bg-red-500 text-white border-red-500' },
  { value: 'health_note', label: '💊 Health Note', bg: 'bg-teal-50', active: 'bg-teal-600 text-white border-teal-600' },
  { value: 'mood', label: '😊 Mood', bg: 'bg-yellow-50', active: 'bg-primary text-primary-foreground border-primary' },
];

export default function DiaryEntry({
  onNavigate,
  entryId,
}: {
  onNavigate: (s: any, data?: Record<string, any>) => void;
  entryId?: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isEditMode = Boolean(entryId);

  const [pets, setPets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [entryLoading, setEntryLoading] = useState(isEditMode);
  const [petId, setPetId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState('mood');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Load pets
  useEffect(() => {
    if (!user || !supabase) { setPetsLoading(false); return; }
    (supabase as any)
      .from('pets')
      .select('id, name, type')
      .eq('owner_id', user.id)
      .order('created_at')
      .then(({ data }: { data: Pet[] | null }) => {
        if (data && data.length > 0) {
          setPets(data);
          setPetId(data[0].id);
        }
        setPetsLoading(false);
      });
  }, [user]);

  // If editing, load existing entry data
  useEffect(() => {
    if (!entryId || !supabase) { setEntryLoading(false); return; }
    (supabase as any)
      .from('diary_entries')
      .select('pet_id, title, body, mood')
      .eq('id', entryId)
      .single()
      .then(({ data }: { data: { pet_id: string; title: string | null; body: string; mood: string } | null }) => {
        if (data) {
          setPetId(data.pet_id);
          setTitle(data.title ?? '');
          setBody(data.body ?? '');
          setMood(data.mood ?? 'mood');
        }
        setEntryLoading(false);
      });
  }, [entryId]);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!body.trim()) { setError('Please write something in your entry.'); return; }
    if (!petId) { setError('Please select a pet.'); return; }
    if (!supabase || !user) return;

    setLoading(true);
    setError('');

    if (isEditMode) {
      const { error: dbError } = await (supabase as any)
        .from('diary_entries')
        .update({ pet_id: petId, title: title.trim() || null, body: body.trim(), mood })
        .eq('id', entryId);
      setLoading(false);
      if (dbError) { setError(dbError.message); return; }
    } else {
      const { error: dbError } = await (supabase as any)
        .from('diary_entries')
        .insert({ owner_id: user.id, pet_id: petId, title: title.trim() || null, body: body.trim(), mood });
      setLoading(false);
      if (dbError) { setError(dbError.message); return; }
    }

    setSaved(true);
    setTimeout(() => onNavigate('pets'), 1200);
  };

  if (saved) {
    return (
      <div className="min-h-full bg-white flex flex-col items-center justify-center px-8">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isEditMode ? t('entry_updated') : t('entry_saved')}
          </h2>
          <p className="text-gray-400">{t('back_to_diary')}</p>
        </motion.div>
      </div>
    );
  }

  const isLoading = petsLoading || entryLoading;

  return (
    <div className="flex flex-col bg-white min-h-full">
      <header className="px-6 pt-10 pb-4 flex items-center gap-4 border-b border-gray-50">
        <button onClick={() => onNavigate('pets')} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold font-display text-[#827717]">
          {isEditMode ? t('edit_entry') : t('add_new_entry')}
        </h1>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-300" />
        </div>
      ) : pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 px-8 py-20 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <PawPrint size={36} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('no_pets_for_entry')}</h2>
          <button
            onClick={() => onNavigate('onboarding')}
            className="mt-6 bg-primary text-primary-foreground font-bold px-8 py-3 rounded-[20px] shadow-lg shadow-yellow-100 flex items-center gap-2"
          >
            <Plus size={18} strokeWidth={3} />
            {t('go_add_pet')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-6 py-8 pb-32">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-2xl">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Pet selector — only when multiple pets */}
          {pets.length > 1 && (
            <div>
              <label className="text-xs font-bold text-gray-600 mb-2 block ml-1">{t('select_pet_label')}</label>
              <div className="flex gap-3 flex-wrap">
                {pets.map((pet) => (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => setPetId(pet.id)}
                    className={cn(
                      'px-5 py-2.5 rounded-full text-sm font-bold border transition-all',
                      petId === pet.id ? 'bg-teal-800 text-white border-teal-800' : 'bg-gray-100 text-gray-500 border-transparent'
                    )}
                  >
                    {pet.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Entry type */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-2 block ml-1">{t('entry_type')}</label>
            <div className="flex gap-3 flex-wrap">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-bold border transition-all',
                    mood === m.value ? m.active : `${m.bg} text-gray-500 border-transparent`
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-2 block ml-1">{t('title_optional')}</label>
            <input
              type="text"
              placeholder="e.g. First time at the park!"
              className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-2 block ml-1">{t('what_happened')}</label>
            <textarea
              placeholder="Write about your pet's day, a special moment, a health update…"
              rows={6}
              className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium resize-none leading-relaxed"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !body.trim()}
            className="w-full bg-primary hover:bg-[#ffca28] disabled:opacity-50 text-primary-foreground font-bold py-4 rounded-[20px] shadow-lg shadow-yellow-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading
              ? <Loader2 size={20} className="animate-spin" />
              : isEditMode ? t('save_changes') : t('save_entry')
            }
          </button>
        </form>
      )}
    </div>
  );
}
