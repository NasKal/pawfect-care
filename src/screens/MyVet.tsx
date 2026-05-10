import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ChevronLeft, Phone, Mail, MapPin, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type VetRecord = {
  id: string;
  clinic_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
};

export default function MyVet({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [existing, setExisting] = useState<VetRecord | null>(null);
  const [clinicName, setClinicName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user || !supabase) { setLoading(false); return; }
    (supabase as any)
      .from('my_vets')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle()
      .then(({ data }: { data: VetRecord | null }) => {
        if (data) {
          setExisting(data);
          setClinicName(data.clinic_name);
          setPhone(data.phone);
          setEmail(data.email ?? '');
          setAddress(data.address ?? '');
          setNotes(data.notes ?? '');
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!clinicName.trim()) { setError(t('clinic_name') + ' is required'); return; }
    if (!phone.trim()) { setError(t('phone') + ' is required'); return; }
    if (!supabase || !user) return;

    setSaving(true);
    setError('');

    const payload = {
      owner_id: user.id,
      clinic_name: clinicName.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    let dbError;
    if (existing) {
      ({ error: dbError } = await (supabase as any).from('my_vets').update(payload).eq('id', existing.id));
    } else {
      ({ error: dbError } = await (supabase as any).from('my_vets').insert(payload));
    }

    setSaving(false);
    if (dbError) { setError(dbError.message); return; }
    setSaved(true);
    setTimeout(() => onNavigate('health'), 1200);
  };

  if (loading) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (saved) {
    return (
      <div className="min-h-full bg-white flex flex-col items-center justify-center px-8">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{existing ? t('vet_updated_success') : t('vet_saved_success')}</h2>
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
        <h1 className="text-xl font-bold font-display text-[#827717]">{t('my_vet')}</h1>
      </header>

      <form onSubmit={handleSave} className="flex flex-col gap-5 px-6 py-8 pb-32">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-2xl">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-gray-600 mb-2 block ml-1">{t('clinic_name')} *</label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              <FileText size={18} />
            </span>
            <input
              type="text"
              placeholder="e.g. Sunny Paws Clinic"
              className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 mb-2 block ml-1">{t('phone')} *</label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              <Phone size={18} />
            </span>
            <input
              type="tel"
              placeholder="e.g. +30 210 1234567"
              className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 mb-2 block ml-1">{t('email_optional')}</label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              <Mail size={18} />
            </span>
            <input
              type="email"
              placeholder="vet@clinic.com"
              className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 mb-2 block ml-1">{t('address_optional')}</label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              <MapPin size={18} />
            </span>
            <input
              type="text"
              placeholder="e.g. 15 Kifisias Ave, Athens"
              className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 mb-2 block ml-1">{t('notes_optional')}</label>
          <textarea
            placeholder="e.g. Ask for Dr. Maria, bring vaccination booklet"
            rows={3}
            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium resize-none leading-relaxed"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary hover:bg-[#ffca28] disabled:opacity-50 text-primary-foreground font-bold py-4 rounded-[20px] shadow-lg shadow-yellow-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
        >
          {saving ? <Loader2 size={20} className="animate-spin" /> : t('save_vet')}
        </button>
      </form>
    </div>
  );
}
