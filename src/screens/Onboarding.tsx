import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Camera, Search, Loader2, AlertCircle, Cake, Scale } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const PET_TYPES = ['Dog', 'Cat', 'Bird', 'Other'] as const;

const PET_EMOJI: Record<string, string> = {
  Dog: '🐕',
  Cat: '🐈',
  Bird: '🐦',
  Other: '🐾',
};

export default function Onboarding({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [initialWeight, setInitialWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddPet = async () => {
    if (!petName || !petType) {
      setError('Please enter your pet\'s name and type.');
      return;
    }
    if (!supabase || !user) {
      setStep(2);
      return;
    }

    setLoading(true);
    setError('');

    const { data: petData, error: dbError } = await (supabase as any)
      .from('pets')
      .insert({
        owner_id: user.id,
        name: petName,
        type: petType,
        breed: breed || null,
        birth_date: birthDate || null,
      })
      .select('id')
      .single();

    if (dbError) {
      setLoading(false);
      setError(dbError.message);
      return;
    }

    // If initial weight provided, create a weight_log entry
    const w = parseFloat(initialWeight);
    if (petData && !isNaN(w) && w > 0) {
      await (supabase as any).from('weight_logs').insert({
        owner_id: user.id,
        pet_id: petData.id,
        weight_kg: w,
        notes: 'Initial weight',
      });
    }

    setLoading(false);
    setStep(2);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-10 relative">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Camera className="text-white" size={28} />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-sm">
                <div className="bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-[10px]">+</span>
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold font-display text-gray-900 mb-4 tracking-tight">{t('add_first_pet_title')}</h1>
            <p className="text-gray-500 mb-10 px-4 leading-relaxed">{t('add_first_pet_desc')}</p>

            {error && (
              <div className="w-full flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-2xl mb-6">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="w-full space-y-6 text-left">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 block ml-1">{t('pet_name')} *</label>
                <input
                  type="text"
                  placeholder="e.g. Bella"
                  className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 block ml-1">{t('pet_type')} *</label>
                <div className="grid grid-cols-4 gap-2">
                  {PET_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPetType(type)}
                      className={`py-3 rounded-[16px] text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                        petType === type
                          ? 'bg-primary/10 border-primary/40 text-[#827717]'
                          : 'bg-gray-50 border-transparent text-gray-500'
                      }`}
                    >
                      <span className="text-lg">{PET_EMOJI[type]}</span>
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Breed */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 block ml-1">{t('breed_optional')}</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Golden Retriever"
                    className="w-full pl-6 pr-12 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                  />
                  <Search size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Birth date */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 block ml-1 flex items-center gap-1.5">
                  <Cake size={12} />
                  {t('birth_date_optional')}
                </label>
                <input
                  type="date"
                  className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium"
                  value={birthDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              {/* Initial weight */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 block ml-1 flex items-center gap-1.5">
                  <Scale size={12} />
                  {t('initial_weight_optional')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 12.5"
                    className="w-full pl-6 pr-16 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium"
                    value={initialWeight}
                    onChange={(e) => setInitialWeight(e.target.value)}
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">kg</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddPet}
              disabled={loading}
              className="w-full bg-primary hover:bg-[#ffca28] disabled:opacity-60 text-primary-foreground font-bold py-4 rounded-[20px] shadow-lg shadow-yellow-100 transition-all mt-10 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <span>{t('add_pet')}</span>}
            </button>

            <button onClick={() => setStep(2)} className="mt-6 text-gray-400 text-sm font-semibold hover:text-gray-600">
              {t('ill_do_later')}
            </button>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col items-center text-center py-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-48 h-48 rounded-full border-8 border-white shadow-2xl overflow-hidden mb-12 relative"
            >
              <img
                src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400"
                alt="Puppy"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-[#80cbc4] p-1.5 rounded-full border-4 border-white">
                <div className="text-white">🎉</div>
              </div>
            </motion.div>

            <h1 className="text-3xl font-bold font-display text-[#827717] mb-4">{t('welcome_pack')}</h1>
            <p className="text-gray-500 mb-12 px-6 leading-relaxed">{t('welcome_pack_desc')}</p>

            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full bg-primary hover:bg-[#ffca28] text-primary-foreground font-bold py-5 rounded-[24px] shadow-xl shadow-yellow-100 transition-all flex items-center justify-center gap-3 text-lg"
            >
              <span>{t('get_started')}</span>
              <span className="text-xl">→</span>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-full bg-white px-8 pt-12 pb-20">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => step > 1 ? setStep(step - 1) : onNavigate('login')} className="text-gray-400 hover:text-gray-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex gap-1.5">
          <div className={`h-1.5 w-10 rounded-full transition-colors ${step >= 1 ? 'bg-teal-600' : 'bg-gray-100'}`}></div>
          <div className={`h-1.5 w-10 rounded-full transition-colors ${step >= 2 ? 'bg-teal-600' : 'bg-gray-100'}`}></div>
        </div>
        <button onClick={() => onNavigate('dashboard')} className="text-primary font-bold text-sm tracking-wide">{t('skip')}</button>
      </div>
      {renderStep()}
    </div>
  );
}
