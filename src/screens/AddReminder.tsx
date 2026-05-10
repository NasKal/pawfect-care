import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ChevronLeft, Loader2, AlertCircle, CheckCircle2, RefreshCw, PawPrint, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Pet = { id: string; name: string; type: string };

const RECURRENCE_OPTIONS = [
  { value: '', labelKey: 'no_repeat' },
  { value: 'daily', labelKey: 'recur_daily' },
  { value: 'monthly', labelKey: 'recur_monthly' },
  { value: 'yearly', labelKey: 'recur_yearly' },
] as const;

const QUICK_ACTIONS = [
  'Heartworm pill', 'Flea & tick prevention', 'Rabies vaccine',
  'Annual checkup', 'Deworming', 'Dental cleaning',
];

export default function AddReminder({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petId, setPetId] = useState('');
  const [action, setAction] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [recurrence, setRecurrence] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

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

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!action.trim()) { setError('Please enter what to do.'); return; }
    if (!petId) { setError('Please select a pet.'); return; }
    if (!supabase || !user) return;

    setLoading(true);
    setError('');

    const dueAt = new Date(`${date}T${time}`).toISOString();

    const { error: dbError } = await (supabase as any).from('reminders').insert({
      owner_id: user.id,
      pet_id: petId,
      action: action.trim(),
      due_at: dueAt,
      recurrence: recurrence || null,
      is_done: false,
    });

    setLoading(false);
    if (dbError) { setError(dbError.message); return; }
    setSaved(true);
    setTimeout(() => onNavigate('health'), 1200);
  };

  if (saved) {
    return (
      <div className="min-h-full bg-white flex flex-col items-center justify-center px-8">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('reminder_saved')}</h2>
          <p className="text-gray-400">{t('going_back_health')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white min-h-full">
      <header className="px-6 pt-10 pb-4 flex items-center gap-4 border-b border-gray-50">
        <button onClick={() => onNavigate('health')} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold font-display text-[#827717]">{t('add_reminder')}</h1>
      </header>

      {petsLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-300" />
        </div>
      ) : pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 px-8 py-20 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <PawPrint size={36} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('no_pets_for_reminder')}</h2>
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

          {/* Pet selector */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-2 block ml-1">{t('select_pet')}</label>
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

          {/* Quick action suggestions */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-2 block ml-1">{t('reminder_action')}</label>
            <input
              type="text"
              placeholder={t('reminder_placeholder')}
              className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium mb-3"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              required
            />
            <div className="flex gap-2 flex-wrap">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa}
                  type="button"
                  onClick={() => setAction(qa)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                    action === qa ? 'bg-primary text-primary-foreground border-transparent' : 'bg-gray-50 text-gray-500 border-gray-200'
                  )}
                >
                  {qa}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 mb-2 block ml-1">{t('due_date')}</label>
              <input
                type="date"
                className="w-full px-4 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-2 block ml-1">{t('due_time')}</label>
              <input
                type="time"
                className="w-full px-4 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-2 block ml-1">
              <RefreshCw size={12} className="inline mr-1" />
              {t('recurrence')}
            </label>
            <div className="flex gap-2 flex-wrap">
              {RECURRENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecurrence(opt.value)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-bold border transition-all',
                    recurrence === opt.value ? 'bg-teal-800 text-white border-teal-800' : 'bg-gray-50 text-gray-500 border-gray-200'
                  )}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-[#ffca28] disabled:opacity-50 text-primary-foreground font-bold py-4 rounded-[20px] shadow-lg shadow-yellow-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : t('save_reminder')}
          </button>
        </form>
      )}
    </div>
  );
}
