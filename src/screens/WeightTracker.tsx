import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Plus, Loader2, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Pet = { id: string; name: string; type: string };
type WeightLog = { id: string; weight_kg: number; notes: string | null; logged_at: string };

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WeightTracker({ onNavigate, initialPetId }: { onNavigate: (s: any, data?: Record<string, any>) => void; initialPetId?: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !supabase) { setLoading(false); return; }
    (supabase as any)
      .from('pets')
      .select('id, name, type')
      .eq('owner_id', user.id)
      .order('created_at')
      .then(({ data }: { data: Pet[] | null }) => {
        if (data && data.length > 0) {
          setPets(data);
          const preselect = initialPetId && data.find((p) => p.id === initialPetId);
          setSelectedPetId(preselect ? preselect.id : data[0].id);
        } else {
          setLoading(false);
        }
      });
  }, [user]);

  useEffect(() => {
    if (!selectedPetId || !supabase) return;
    setLoading(true);
    (supabase as any)
      .from('weight_logs')
      .select('id, weight_kg, notes, logged_at')
      .eq('pet_id', selectedPetId)
      .order('logged_at', { ascending: false })
      .then(({ data }: { data: WeightLog[] | null }) => {
        setLogs(data ?? []);
        setLoading(false);
      });
  }, [selectedPetId]);

  const handleAddLog = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const w = parseFloat(weightInput);
    if (isNaN(w) || w <= 0) return;
    if (!supabase || !user) return;

    setSaving(true);
    const { data, error } = await (supabase as any).from('weight_logs').insert({
      owner_id: user.id,
      pet_id: selectedPetId,
      weight_kg: w,
      notes: notesInput.trim() || null,
    }).select('id, weight_kg, notes, logged_at').single();

    setSaving(false);
    if (!error && data) {
      setLogs((prev) => [data as WeightLog, ...prev]);
      setWeightInput('');
      setNotesInput('');
      setShowForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    await (supabase as any).from('weight_logs').delete().eq('id', id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const trend = logs.length >= 2
    ? logs[0].weight_kg - logs[1].weight_kg
    : null;

  return (
    <div className="flex flex-col bg-[#fafafa] min-h-full">
      <header className="px-6 pt-10 pb-4 bg-white flex items-center gap-4 border-b border-gray-50">
        <button onClick={() => initialPetId ? onNavigate('pet-detail', { petId: initialPetId }) : onNavigate('dashboard')} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold font-display text-[#827717]">{t('weight_log')}</h1>
      </header>

      <div className="px-6 py-6 pb-32">
        {/* Pet tabs */}
        {pets.length > 1 && (
          <div className="flex gap-3 mb-6 overflow-x-auto no-scrollbar pb-1">
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => setSelectedPetId(pet.id)}
                className={cn(
                  'px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all',
                  selectedPetId === pet.id ? 'bg-teal-800 text-white' : 'bg-white text-gray-400 border border-gray-100'
                )}
              >
                {pet.name}
              </button>
            ))}
          </div>
        )}

        {/* Latest weight card */}
        {logs.length > 0 && (
          <div className="bg-white rounded-[32px] p-6 shadow-card border border-gray-50 mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('latest_weight')}</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black text-gray-900">{logs[0].weight_kg}</span>
              <span className="text-xl font-bold text-gray-400 mb-1">kg</span>
              {trend !== null && (
                <div className={cn(
                  'flex items-center gap-1 mb-1 px-3 py-1 rounded-full text-xs font-bold',
                  trend > 0 ? 'bg-red-50 text-red-500' : trend < 0 ? 'bg-teal-50 text-teal-600' : 'bg-gray-50 text-gray-400'
                )}>
                  {trend > 0 ? <TrendingUp size={14} /> : trend < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                  {trend > 0 ? '+' : ''}{trend.toFixed(2)} kg
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 font-medium mt-1">{formatDate(logs[0].logged_at)}</p>
          </div>
        )}

        {/* Add weight button / form */}
        <AnimatePresence>
          {showForm ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleAddLog}
              className="bg-white rounded-[32px] p-6 shadow-card border border-gray-50 mb-6 space-y-4"
            >
              <h3 className="font-bold text-gray-800 text-lg">{t('add_weight')}</h3>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block ml-1">{t('weight_kg')} *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 12.5"
                  className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium text-lg"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block ml-1">{t('weight_notes_optional')}</label>
                <input
                  type="text"
                  placeholder="e.g. After meal"
                  className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-100 text-gray-500 font-bold py-3.5 rounded-[20px] transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary text-primary-foreground font-bold py-3.5 rounded-[20px] shadow-lg shadow-yellow-100 flex items-center justify-center gap-2 transition-all"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : t('log_weight')}
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.button
              key="add-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowForm(true)}
              className="w-full bg-primary hover:bg-[#ffca28] text-primary-foreground font-bold py-4 rounded-[20px] shadow-lg shadow-yellow-100 transition-all flex items-center justify-center gap-2 mb-6"
            >
              <Plus size={20} strokeWidth={3} />
              {t('add_weight')}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Log list */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-gray-300" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-4">⚖️</p>
            <p className="font-bold text-gray-500">{t('no_weight_logs')}</p>
            <p className="text-sm mt-1">{t('no_weight_desc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-[#827717] tracking-widest pl-2 opacity-80 uppercase">{t('history_label')}</h3>
            {logs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-[20px] p-5 shadow-card border border-gray-50 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-[#827717]">{log.weight_kg}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800">{log.weight_kg} kg</p>
                  <p className="text-xs text-gray-400 font-medium">{formatDate(log.logged_at)}</p>
                  {log.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{log.notes}</p>}
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="text-gray-200 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
