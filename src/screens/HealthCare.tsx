import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { CheckCircle2, Bell, Pill, Syringe, Plus, Loader2, PawPrint, Phone, Mail, MapPin, Edit3, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Reminder = {
  id: string;
  action: string;
  due_at: string;
  is_done: boolean;
  notes: string | null;
  pets: { name: string } | null;
};

type MyVet = {
  id: string;
  clinic_name: string;
  phone: string;
  email: string | null;
  address: string | null;
};

function getIcon(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes('vaccine') || lower.includes('booster') || lower.includes('syringe')) return <Syringe size={24} />;
  if (lower.includes('pill') || lower.includes('tablet') || lower.includes('chewable') || lower.includes('medication')) return <Pill size={24} />;
  return <Bell size={24} />;
}

function formatDueLabel(dateStr: string): { label: string; color: string } {
  const date = new Date(dateStr);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const diff = Math.ceil((date.getTime() - todayStart.getTime()) / 86400000);
  if (diff < 0) return { label: `Overdue by ${Math.abs(diff)}d`, color: 'text-red-600' };
  if (diff === 0) return { label: 'Due Today', color: 'text-red-500' };
  if (diff === 1) return { label: 'Tomorrow', color: 'text-yellow-600' };
  return { label: `In ${diff}d · ${date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`, color: 'text-gray-400' };
}

export default function HealthCare({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');
  const [myVet, setMyVet] = useState<MyVet | null>(null);
  const [overdueReminders, setOverdueReminders] = useState<Reminder[]>([]);
  const [todayReminders, setTodayReminders] = useState<Reminder[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [doneReminders, setDoneReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) { setLoading(false); return; }

    const fetchAll = async () => {
      setLoading(true);
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);

      const [vetRes, overdueRes, todayRes, upcomingRes, doneRes] = await Promise.all([
        (supabase as any).from('my_vets').select('id, clinic_name, phone, email, address').eq('owner_id', user.id).maybeSingle(),
        (supabase as any).from('reminders').select('id, action, due_at, is_done, notes, pets(name)').eq('owner_id', user.id).eq('is_done', false).lt('due_at', todayStart.toISOString()).order('due_at'),
        (supabase as any).from('reminders').select('id, action, due_at, is_done, notes, pets(name)').eq('owner_id', user.id).eq('is_done', false).gte('due_at', todayStart.toISOString()).lt('due_at', todayEnd.toISOString()).order('due_at'),
        (supabase as any).from('reminders').select('id, action, due_at, is_done, notes, pets(name)').eq('owner_id', user.id).eq('is_done', false).gte('due_at', todayEnd.toISOString()).order('due_at').limit(10),
        (supabase as any).from('reminders').select('id, action, due_at, is_done, notes, pets(name)').eq('owner_id', user.id).eq('is_done', true).order('due_at', { ascending: false }).limit(10),
      ]);

      if (vetRes.data) setMyVet(vetRes.data);
      if (overdueRes.data) setOverdueReminders(overdueRes.data);
      if (todayRes.data) setTodayReminders(todayRes.data);
      if (upcomingRes.data) setUpcomingReminders(upcomingRes.data);
      if (doneRes.data) setDoneReminders(doneRes.data);
      setLoading(false);
    };

    fetchAll();
  }, [user]);

  const markDone = async (id: string) => {
    if (!supabase) return;
    await (supabase as any).from('reminders').update({ is_done: true }).eq('id', id);
    setOverdueReminders((prev) => prev.filter((r) => r.id !== id));
    setTodayReminders((prev) => prev.filter((r) => r.id !== id));
    setUpcomingReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const pendingCount = overdueReminders.length + todayReminders.length;

  return (
    <div className="flex flex-col bg-[#fafafa] min-h-full">
      <header className="px-6 pt-10 pb-6 bg-white flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-primary shadow-sm bg-primary/10 flex items-center justify-center">
          <PawPrint size={20} className="text-primary" />
        </div>
        <h1 className="text-xl font-bold font-display text-[#827717]">Pawfect Care</h1>
      </header>

      <div className="px-6 py-4 space-y-6 pb-32">
        {/* Emergency Banner */}
        <section className="bg-red-100 rounded-[32px] p-8 text-center relative overflow-hidden border border-red-200">
          <div className="absolute top-4 right-4 text-red-700/10">
            <Plus size={80} strokeWidth={4} />
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-red-800 text-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-red-900/30">
              <Plus size={24} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-bold text-red-900 mb-1">{t('emergency_call')}</h2>
            <p className="text-red-700 text-sm font-medium mb-6">
              {myVet ? myVet.clinic_name : 'Contact your primary vet immediately'}
            </p>
            {myVet ? (
              <a
                href={`tel:${myVet.phone}`}
                className="w-full bg-red-800 hover:bg-red-900 text-white py-4 rounded-[20px] font-bold shadow-xl shadow-red-900/40 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                {t('call_now')} · {myVet.phone}
              </a>
            ) : (
              <button
                onClick={() => onNavigate('my-vet')}
                className="w-full bg-red-800 hover:bg-red-900 text-white py-4 rounded-[20px] font-bold shadow-xl shadow-red-900/40 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
              >
                <Plus size={20} />
                {t('add_my_vet')}
              </button>
            )}
          </div>
        </section>

        {/* My Vet card */}
        <section className="bg-white rounded-[32px] p-6 shadow-card border border-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-display text-gray-800">{t('my_vet')}</h3>
            <button
              onClick={() => onNavigate('my-vet')}
              className="flex items-center gap-1.5 text-teal-600 text-xs font-bold"
            >
              <Edit3 size={14} />
              {myVet ? t('edit_vet') : t('add_my_vet')}
            </button>
          </div>

          {!myVet ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400 font-medium">{t('no_vet_saved')}</p>
              <p className="text-xs text-gray-300 mt-1">{t('no_vet_desc')}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-teal-600 shrink-0" />
                <a href={`tel:${myVet.phone}`} className="font-bold text-gray-800 hover:text-teal-600">{myVet.phone}</a>
              </div>
              {myVet.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={16} className="text-teal-600 shrink-0" />
                  <a href={`mailto:${myVet.email}`} className="font-medium text-gray-600 hover:text-teal-600">{myVet.email}</a>
                </div>
              )}
              {myVet.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={16} className="text-teal-600 shrink-0" />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(myVet.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-gray-600 hover:text-teal-600"
                  >
                    {myVet.address}
                  </a>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Tab Toggle */}
        <div className="bg-gray-100 p-1.5 rounded-full flex shadow-inner">
          <button
            onClick={() => setTab('upcoming')}
            className={cn('flex-1 py-3 px-4 rounded-full text-sm font-bold transition-all', tab === 'upcoming' ? 'bg-white text-[#827717] shadow-sm' : 'text-gray-400')}
          >
            {t('upcoming')}
          </button>
          <button
            onClick={() => setTab('history')}
            className={cn('flex-1 py-3 px-4 rounded-full text-sm font-bold transition-all', tab === 'history' ? 'bg-white text-[#827717] shadow-sm' : 'text-gray-400')}
          >
            {t('history')}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-gray-300" /></div>
        ) : tab === 'upcoming' ? (
          <>
            {/* Overdue */}
            {overdueReminders.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={14} className="text-red-500" />
                  <h2 className="text-xs font-black text-red-600 uppercase tracking-widest">{t('overdue_care')}</h2>
                  <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">{overdueReminders.length}</span>
                </div>
                <div className="space-y-3">
                  {overdueReminders.map((rem) => (
                    <motion.div key={rem.id} whileTap={{ scale: 0.98 }} className="bg-white rounded-[24px] p-5 shadow-card border-l-4 border-red-500 flex items-center gap-4">
                      <div className="bg-red-50 p-3 rounded-[18px] text-red-500">{getIcon(rem.action)}</div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">{rem.action}</p>
                        {rem.pets && <p className="text-xs text-gray-400 font-semibold mt-0.5">{rem.pets.name}</p>}
                        <p className="text-xs font-bold text-red-500 mt-0.5">{formatDueLabel(rem.due_at).label}</p>
                      </div>
                      <button onClick={() => markDone(rem.id)} className="bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-md">{t('mark_done')}</button>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Today */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-display text-gray-900">{t('todays_schedule')}</h2>
                {pendingCount > 0 && (
                  <div className="bg-teal-50 text-teal-600 px-3 py-1.5 rounded-full text-[11px] font-bold">
                    {pendingCount} {t('pending')}
                  </div>
                )}
              </div>
              {todayReminders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">{t('no_reminders_today')} 🎉</p>
              ) : (
                <div className="space-y-3">
                  {todayReminders.map((rem) => (
                    <motion.div key={rem.id} whileTap={{ scale: 0.98 }} className="bg-white rounded-[24px] p-5 shadow-card border-l-4 border-teal-800 flex items-center gap-4">
                      <div className="bg-teal-100/50 p-3 rounded-[18px] text-teal-600">{getIcon(rem.action)}</div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">{rem.action}</p>
                        {rem.pets && <p className="text-xs text-gray-400 font-semibold mt-0.5">{rem.pets.name}</p>}
                      </div>
                      <button onClick={() => markDone(rem.id)} className="bg-[#827717] text-white px-4 py-2 rounded-full text-xs font-bold shadow-md">{t('mark_done')}</button>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* Add Reminder CTA */}
            <button
              onClick={() => onNavigate('add-reminder')}
              className="w-full border-2 border-dashed border-primary/30 rounded-[24px] py-4 flex items-center justify-center gap-2 text-primary font-bold text-sm hover:bg-primary/5 transition-colors"
            >
              <Plus size={18} strokeWidth={3} />
              {t('add_reminder')}
            </button>

            {/* Upcoming */}
            <section>
              <h2 className="text-xl font-bold font-display text-gray-900 mb-4">{t('upcoming_care')}</h2>
              {upcomingReminders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">{t('no_upcoming_care')}</p>
              ) : (
                <div className="space-y-4">
                  {upcomingReminders.map((rem) => {
                    const { label, color } = formatDueLabel(rem.due_at);
                    return (
                      <div key={rem.id} className="bg-white rounded-[32px] p-6 shadow-card border border-gray-50">
                        <div className="flex items-center gap-5 mb-4">
                          <div className="w-14 h-14 bg-red-50 text-red-400 rounded-full flex items-center justify-center">{getIcon(rem.action)}</div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">{rem.action}</h3>
                            {rem.pets && <p className="text-xs text-gray-400 font-semibold">{rem.pets.name}</p>}
                            <p className={cn('text-xs font-bold mt-0.5', color)}>{label}</p>
                          </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-gray-50">
                          <button onClick={() => markDone(rem.id)} className="bg-gray-100 text-gray-500 px-5 py-2 rounded-2xl text-xs font-bold hover:bg-green-50 hover:text-green-700 transition-colors">{t('mark_done')}</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : (
          <section>
            {doneReminders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">{t('no_completed_reminders')}</p>
            ) : (
              <div className="space-y-3">
                {doneReminders.map((rem) => (
                  <div key={rem.id} className="bg-white rounded-[24px] p-5 shadow-card flex items-center gap-4 opacity-60">
                    <div className="bg-green-50 p-3 rounded-[18px] text-green-500"><CheckCircle2 size={24} /></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800 line-through">{rem.action}</p>
                      {rem.pets && <p className="text-xs text-gray-400 font-semibold mt-0.5">{rem.pets.name}</p>}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">
                      {new Date(rem.due_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
