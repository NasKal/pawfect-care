import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Bell, CheckCircle2, Loader2, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Reminder = {
  id: string;
  action: string;
  due_at: string;
  is_done: boolean;
  pets: { name: string } | null;
};

type Group = 'overdue' | 'today' | 'upcoming';

function getGroup(dateStr: string): Group {
  const date = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  if (date < todayStart) return 'overdue';
  if (date < tomorrowStart) return 'today';
  return 'upcoming';
}

function formatDue(dateStr: string): string {
  const date = new Date(dateStr);
  const group = getGroup(dateStr);
  if (group === 'today') return `Today · ${date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`;
  if (group === 'overdue') {
    const days = Math.ceil((new Date().setHours(0,0,0,0) - new Date(dateStr).setHours(0,0,0,0)) / 86400000);
    return `${days}d overdue`;
  }
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

const GROUP_CONFIG = {
  overdue: { label: 'Overdue', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <AlertTriangle size={14} className="text-red-500" /> },
  today: { label: 'Today', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: <Clock size={14} className="text-yellow-600" /> },
  upcoming: { label: 'Upcoming', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200', icon: <Calendar size={14} className="text-teal-600" /> },
};

export default function Alerts({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await (supabase as any)
        .from('reminders')
        .select('id, action, due_at, is_done, pets(name)')
        .eq('owner_id', user.id)
        .eq('is_done', false)
        .order('due_at', { ascending: true });
      if (data) setReminders(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const markDone = async (id: string) => {
    if (!supabase) return;
    await (supabase as any).from('reminders').update({ is_done: true }).eq('id', id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const grouped = {
    overdue: reminders.filter((r) => getGroup(r.due_at) === 'overdue'),
    today: reminders.filter((r) => getGroup(r.due_at) === 'today'),
    upcoming: reminders.filter((r) => getGroup(r.due_at) === 'upcoming'),
  };

  return (
    <div className="flex flex-col bg-[#fafafa] min-h-full">
      <header className="px-6 pt-10 pb-6 bg-white sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-[#827717]">{t('alerts')}</h1>
            {reminders.length > 0 && (
              <p className="text-xs text-gray-400 font-medium">{reminders.length} {t('pending').toLowerCase()}</p>
            )}
          </div>
        </div>
      </header>

      <div className="px-6 py-6 space-y-8 pb-32">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-gray-300" />
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎉</p>
            <p className="font-bold text-gray-700 text-lg">{t('all_caught_up')}</p>
            <p className="text-sm text-gray-400 mt-2">{t('no_pending_reminders')}</p>
            <button
              onClick={() => onNavigate('add-reminder')}
              className="mt-8 bg-primary text-primary-foreground font-bold px-8 py-3 rounded-2xl shadow-lg shadow-yellow-100 text-sm"
            >
              {t('add_a_reminder')}
            </button>
          </div>
        ) : (
          (['overdue', 'today', 'upcoming'] as Group[]).map((group) => {
            const items = grouped[group];
            if (items.length === 0) return null;
            const cfg = GROUP_CONFIG[group];
            return (
              <section key={group}>
                <div className={cn('flex items-center gap-2 mb-4 px-1')}>
                  {cfg.icon}
                  <span className={cn('text-xs font-black uppercase tracking-widest', cfg.color)}>{cfg.label}</span>
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', cfg.bg, `border ${cfg.border}`, cfg.color)}>{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.map((rem) => (
                    <motion.div
                      key={rem.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn('bg-white rounded-[24px] p-5 shadow-card border flex items-center gap-4', cfg.border)}
                    >
                      <div className={cn('w-2 h-2 rounded-full shrink-0', group === 'overdue' ? 'bg-red-500' : group === 'today' ? 'bg-yellow-400' : 'bg-teal-400')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{rem.action}</p>
                        <p className="text-xs text-gray-400 font-semibold mt-0.5">
                          {rem.pets?.name && <span className="text-[#827717]">{rem.pets.name} · </span>}
                          {formatDue(rem.due_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => markDone(rem.id)}
                        className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-300 hover:border-teal-500 hover:text-teal-500 transition-colors shrink-0"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
