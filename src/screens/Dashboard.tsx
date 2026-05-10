import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Plus, Calendar, Heart, Weight, Activity, CheckCircle2, AlertCircle, Bell, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Pet = {
  id: string;
  name: string;
  type: string;
  avatar_url: string | null;
};

type Reminder = {
  id: string;
  action: string;
  due_at: string;
  pets: { name: string } | null;
};

const PET_IMAGES: Record<string, string> = {
  Dog: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=200',
  Cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200',
  Bird: 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&q=80&w=200',
  Other: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&q=80&w=200',
};

const PET_COLORS: Record<string, string> = {
  Dog: 'bg-yellow-100',
  Cat: 'bg-teal-100',
  Bird: 'bg-blue-100',
  Other: 'bg-gray-100',
};

function formatDue(dateStr: string): { label: string; urgent: boolean } {
  const date = new Date(dateStr);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const dayAfter = new Date(tomorrowStart);
  dayAfter.setDate(dayAfter.getDate() + 1);

  if (date < dayAfter && date >= todayStart) {
    if (date < tomorrowStart) return { label: 'Due Today', urgent: true };
    return { label: `Tomorrow, ${date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`, urgent: false };
  }
  return { label: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }), urgent: false };
}

export default function Dashboard({ onNavigate }: { onNavigate: (s: any, data?: Record<string, any>) => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const [petsRes, remindersRes] = await Promise.all([
        (supabase as any).from('pets').select('id, name, type, avatar_url').eq('owner_id', user.id).order('created_at'),
        (supabase as any).from('reminders')
          .select('id, action, due_at, pets(name)')
          .eq('owner_id', user.id)
          .eq('is_done', false)
          .order('due_at', { ascending: true })
          .limit(5),
      ]);

      if (petsRes.data) setPets(petsRes.data as Pet[]);
      if (remindersRes.data) setReminders(remindersRes.data as Reminder[]);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('greeting_morning') : t('greeting_afternoon');
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  return (
    <div className="flex flex-col bg-[#fafafa] min-h-full">
      {/* Header */}
      <header className="px-6 pt-10 pb-6 bg-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold font-display text-[#827717]">{greeting}{firstName ? `, ${firstName}!` : '!'}</h1>
            <p className="text-gray-500 font-medium">{t('ready_for_day')}</p>
          </div>
          <button onClick={() => onNavigate('settings')} className="bg-gray-50 p-2.5 rounded-2xl shadow-sm hover:scale-105 transition-transform">
            <Activity size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="mt-8 flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold font-display text-gray-800">{t('your_pets')}</h2>
          <button onClick={() => onNavigate('pets')} className="text-teal-600 font-bold text-sm">{t('view_all')}</button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center w-full py-8">
              <Loader2 size={24} className="animate-spin text-gray-300" />
            </div>
          ) : pets.length === 0 ? (
            <p className="text-sm text-gray-400 font-medium py-6">{t('no_pets_yet')}</p>
          ) : (
            pets.map((pet) => (
              <motion.div
                key={pet.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('pet-detail', { petId: pet.id })}
                className="min-w-[160px] bg-white rounded-[32px] p-5 shadow-card border border-gray-100 flex flex-col items-center cursor-pointer"
              >
                <div className={cn("w-20 h-20 rounded-full p-1 mb-4", PET_COLORS[pet.type] ?? 'bg-gray-100')}>
                  <img
                    src={pet.avatar_url ?? PET_IMAGES[pet.type] ?? PET_IMAGES.Other}
                    className="w-full h-full object-cover rounded-full border-2 border-white"
                    alt={pet.name}
                  />
                </div>
                <h3 className="text-lg font-bold text-gray-800">{pet.name}</h3>
                <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full mt-1 font-semibold">{pet.type}</span>
              </motion.div>
            ))
          )}
          <button
            onClick={() => onNavigate('onboarding')}
            className="min-w-[120px] border-2 border-dashed border-gray-200 rounded-[32px] flex flex-col items-center justify-center gap-3 text-gray-300 hover:text-primary hover:border-primary transition-all"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center">
              <Plus size={24} />
            </div>
            <span className="font-bold text-xs">{t('add_new')}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-8 space-y-8 pb-36">

        {/* Urgent Reminders */}
        <section className="bg-red-50/50 rounded-[32px] p-6 border border-red-100 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-5">
            <AlertCircle size={160} />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <Bell className="text-red-600" size={24} />
            <h2 className="text-xl font-bold font-display text-red-900">{t('urgent_reminders')}</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-red-300" /></div>
          ) : reminders.length === 0 ? (
            <p className="text-sm text-red-300 font-medium text-center py-4">{t('no_upcoming_reminders')}</p>
          ) : (
            <div className="space-y-4">
              {reminders.map((rem) => {
                const { label, urgent } = formatDue(rem.due_at);
                return (
                  <div key={rem.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 border border-red-50">
                    <div className={cn("p-2 rounded-lg", urgent ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500")}>
                      <Activity size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">{rem.pets?.name}: {rem.action}</p>
                      <p className={cn("text-[10px] font-bold uppercase tracking-wider", urgent ? 'text-red-500' : 'text-gray-400')}>{label}</p>
                    </div>
                    {urgent && (
                      <button className="w-8 h-8 rounded-full border-2 border-red-100 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors">
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-bold font-display text-gray-800 mb-6">{t('quick_actions')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <QuickActionCard icon={<Plus size={24} />} title={t('add_pet')} color="bg-yellow-400" onClick={() => onNavigate('onboarding')} />
            <QuickActionCard icon={<Calendar size={24} />} title={t('find_vet')} color="bg-teal-300" onClick={() => onNavigate('vets')} />
            <QuickActionCard icon={<Heart size={24} />} title={t('log_habit')} color="bg-red-200" onClick={() => onNavigate('pets')} />
            <QuickActionCard icon={<Weight size={24} />} title={t('track_weight')} color="bg-gray-100" onClick={() => onNavigate('weight-tracker')} />
          </div>
        </section>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => onNavigate('diary-entry')}
        className="fixed bottom-24 right-6 w-16 h-16 bg-primary rounded-full shadow-2xl flex items-center justify-center text-primary-foreground transform hover:scale-110 active:scale-95 transition-all z-40"
      >
        <div className="flex flex-col items-center">
          <Plus size={24} strokeWidth={3} />
          <span className="text-[8px] font-black uppercase mt-0.5 tracking-tight">{t('quick_log')}</span>
        </div>
      </button>
    </div>
  );
}

function QuickActionCard({ icon, title, color, onClick }: { icon: React.ReactNode; title: string; color: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center text-center gap-4 transition-all hover:border-primary/20"
    >
      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-white", color)}>
        {icon}
      </div>
      <span className="text-sm font-bold text-gray-700">{title}</span>
    </motion.button>
  );
}
