import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, MoreVertical, Loader2, PawPrint, Edit3, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Pet = {
  id: string;
  name: string;
  type: string;
  avatar_url?: string | null;
};

type DiaryEntry = {
  id: string;
  title: string | null;
  body: string | null;
  mood: string | null;
  photo_url: string | null;
  created_at: string;
  pets: { name: string } | null;
};

function formatEntryDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (date >= todayStart) return `Today, ${date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`;
  if (date >= yesterdayStart) return `Yesterday, ${date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`;
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PetProfile({ onNavigate }: { onNavigate: (s: any, data?: Record<string, any>) => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !supabase) { setLoading(false); return; }

    (supabase as any)
      .from('pets')
      .select('id, name, type, avatar_url')
      .eq('owner_id', user.id)
      .order('created_at')
      .then(({ data }: { data: Pet[] | null }) => {
        if (data) setPets(data);
      });
  }, [user]);

  useEffect(() => {
    if (!user || !supabase) return;

    const fetchEntries = async () => {
      setLoading(true);
      let query = (supabase as any)
        .from('diary_entries')
        .select('id, title, body, mood, photo_url, created_at, pets(name)')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (selectedPetId) query = query.eq('pet_id', selectedPetId);

      const { data } = await query;
      if (data) setEntries(data as DiaryEntry[]);
      setLoading(false);
    };

    fetchEntries();
  }, [user, selectedPetId]);

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    setDeletingId(id);
    await (supabase as any).from('diary_entries').delete().eq('id', id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const toggleMenu = (id: string) => {
    if (activeMenuId === id) {
      setActiveMenuId(null);
      setConfirmDeleteId(null);
    } else {
      setActiveMenuId(id);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col bg-[#fafafa] min-h-full">
      <header className="px-6 pt-10 pb-6 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary shadow-sm bg-primary/10 flex items-center justify-center overflow-hidden">
            {pets[0]?.avatar_url
              ? <img src={pets[0].avatar_url} className="w-full h-full rounded-full object-cover" alt="Pet" />
              : <PawPrint size={20} className="text-primary" />
            }
          </div>
          <h1 className="text-xl font-bold font-display text-[#827717]">Pawfect Care</h1>
        </div>
      </header>

      <div className="px-6 py-8">
        <h2 className="text-4xl font-bold font-display text-gray-900 mb-2">{t('pet_diary')}</h2>
        <p className="text-gray-500 mb-8">Log daily moments and milestones.</p>

        {/* Pet filter tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedPetId(null)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              selectedPetId === null ? 'bg-teal-800 text-white shadow-md shadow-teal-900/20' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {t('all_pets')}
          </button>
          {pets.map((pet) => (
            <button
              key={pet.id}
              onClick={() => setSelectedPetId(pet.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                selectedPetId === pet.id ? 'bg-teal-800 text-white shadow-md shadow-teal-900/20' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {pet.name} ({pet.type})
            </button>
          ))}
        </div>

        <button
          onClick={() => onNavigate('diary-entry')}
          className="w-full bg-primary hover:bg-[#ffca28] text-primary-foreground font-bold py-4 rounded-[20px] shadow-lg shadow-yellow-100 transition-all flex items-center justify-center gap-2 mb-10"
        >
          <Plus size={20} strokeWidth={3} />
          <span>{t('add_new_entry')}</span>
        </button>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-gray-300" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-4">📖</p>
            <p className="font-bold text-gray-500">{t('no_entries_yet')}</p>
            <p className="text-sm mt-1">{t('start_logging_moments')}</p>
          </div>
        ) : (
          <div className="space-y-8 pb-10">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-[32px] p-6 shadow-card border border-gray-50 relative"
              >
                {/* Card header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-bold text-gray-400 truncate">{formatEntryDate(entry.created_at)}</span>
                    {entry.pets && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-200 shrink-0"></span>
                        <span className="text-xs font-bold text-[#827717] truncate">{entry.pets.name}</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => toggleMenu(entry.id)}
                    className={`text-gray-300 hover:text-gray-500 transition-colors ml-2 shrink-0 ${activeMenuId === entry.id ? 'text-gray-500' : ''}`}
                  >
                    <MoreVertical size={20} />
                  </button>
                </div>

                {entry.mood && (
                  <div className="mb-4">
                    <Badge type={entry.mood} />
                  </div>
                )}

                {entry.title && (
                  <h3 className="font-bold text-gray-900 mb-2">{entry.title}</h3>
                )}

                <p className="text-gray-700 leading-relaxed font-medium">{entry.body}</p>

                {entry.photo_url && (
                  <div className="mt-6 rounded-2xl overflow-hidden shadow-md">
                    <img src={entry.photo_url} alt="Moment" className="w-full h-48 object-cover" />
                  </div>
                )}

                {/* Inline action menu */}
                <AnimatePresence>
                  {activeMenuId === entry.id && confirmDeleteId !== entry.id && (
                    <motion.div
                      key="actions"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="flex gap-2 mt-5 pt-4 border-t border-gray-50"
                    >
                      <button
                        onClick={() => {
                          setActiveMenuId(null);
                          onNavigate('diary-entry', { entryId: entry.id });
                        }}
                        className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-2.5 rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <Edit3 size={14} />
                        {t('edit_entry')}
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDeleteId(entry.id);
                          setActiveMenuId(entry.id);
                        }}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 font-bold py-2.5 rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <Trash2 size={14} />
                        {t('delete_entry')}
                      </button>
                    </motion.div>
                  )}

                  {confirmDeleteId === entry.id && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-3 mt-5 pt-4 border-t border-red-50"
                    >
                      <p className="flex-1 text-xs font-bold text-red-500">{t('confirm_delete_entry')}</p>
                      <button
                        onClick={() => { setConfirmDeleteId(null); setActiveMenuId(null); }}
                        className="px-4 py-2 bg-gray-100 text-gray-500 font-bold rounded-2xl text-xs"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        className="px-4 py-2 bg-red-500 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 disabled:opacity-60"
                      >
                        {deletingId === entry.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <Trash2 size={12} />
                        }
                        {t('delete_entry')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ type }: { type: string }) {
  const { t } = useTranslation();
  switch (type) {
    case 'milestone':
      return <span className="bg-red-50 text-red-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">{t('milestone')}</span>;
    case 'health_note':
      return <span className="bg-teal-50 text-teal-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">{t('health_note')}</span>;
    default:
      return <span className="bg-yellow-50 text-yellow-500 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">{t('mood')}</span>;
  }
}
