import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, Loader2, AlertCircle, CheckCircle2,
  Scale, Cake, Edit3, TrendingUp, Camera, ImageIcon, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const PET_TYPES = ['Dog', 'Cat', 'Bird', 'Other'] as const;

const PET_BG: Record<string, string> = {
  Dog: 'bg-yellow-100',
  Cat: 'bg-teal-100',
  Bird: 'bg-blue-100',
  Other: 'bg-gray-100',
};

const PET_EMOJI: Record<string, string> = {
  Dog: '🐕',
  Cat: '🐈',
  Bird: '🐦',
  Other: '🐾',
};

const MAX_RAW_MB = 10;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function calcAge(dateStr: string, t: (k: string) => string): string {
  if (!dateStr) return t('not_set');
  const birth = new Date(dateStr);
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (totalMonths < 1) return '< 1mo';
  if (totalMonths < 12) return `${totalMonths}mo`;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

function compressImage(file: File): Promise<{ blob: Blob; compressedBytes: number }> {
  return new Promise((resolve) => {
    const MAX_DIM = 800;
    const QUALITY = 0.82;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob((blob) => {
        resolve({ blob: blob!, compressedBytes: blob!.size });
      }, 'image/jpeg', QUALITY);
    };

    img.src = objectUrl;
  });
}

type LatestWeight = { weight_kg: number; logged_at: string } | null;
type PhotoInfo = { originalBytes: number; compressedBytes: number; fromCamera: boolean } | null;

export default function PetDetail({
  onNavigate,
  petId,
}: {
  onNavigate: (s: any, data?: Record<string, any>) => void;
  petId: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [petType, setPetType] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [latestWeight, setLatestWeight] = useState<LatestWeight>(null);

  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [photoInfo, setPhotoInfo] = useState<PhotoInfo>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Set capture attribute on camera input (bypasses TypeScript limitation)
  useEffect(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.setAttribute('capture', 'environment');
    }
  }, []);

  useEffect(() => {
    if (!petId || !supabase) { setLoading(false); return; }

    const fetchAll = async () => {
      const [petRes, weightRes] = await Promise.all([
        (supabase as any).from('pets').select('name, type, breed, birth_date, avatar_url').eq('id', petId).single(),
        (supabase as any).from('weight_logs').select('weight_kg, logged_at').eq('pet_id', petId).order('logged_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (petRes.data) {
        setName(petRes.data.name ?? '');
        setPetType(petRes.data.type ?? '');
        setBreed(petRes.data.breed ?? '');
        setBirthDate(petRes.data.birth_date ?? '');
        setAvatarUrl(petRes.data.avatar_url ?? null);
      }
      if (weightRes.data) setLatestWeight(weightRes.data);
      setLoading(false);
    };

    fetchAll();
  }, [petId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, fromCamera: boolean) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !user) return;

    setShowUploadPanel(false);
    setError('');
    setPhotoInfo(null);

    if (file.size > MAX_RAW_MB * 1024 * 1024) {
      setError(`Photo is too large (${formatBytes(file.size)}). Max ${MAX_RAW_MB}MB.`);
      e.target.value = '';
      return;
    }

    setUploadingAvatar(true);

    const { blob, compressedBytes } = await compressImage(file);

    setPhotoInfo({ originalBytes: file.size, compressedBytes, fromCamera });

    const path = `${user.id}/${petId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('pet-avatars')
      .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });

    if (uploadError) {
      setError(uploadError.message);
      setUploadingAvatar(false);
      e.target.value = '';
      return;
    }

    const { data: urlData } = supabase.storage.from('pet-avatars').getPublicUrl(path);
    // Bust the cache so the new image loads immediately
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await (supabase as any).from('pets').update({ avatar_url: publicUrl }).eq('id', petId);

    setAvatarUrl(publicUrl);
    setUploadingAvatar(false);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!name.trim()) { setError(t('pet_name') + ' is required.'); return; }
    if (!supabase || !user) return;

    setSaving(true);
    setError('');

    const { error: dbError } = await (supabase as any)
      .from('pets')
      .update({
        name: name.trim(),
        type: petType,
        breed: breed.trim() || null,
        birth_date: birthDate || null,
      })
      .eq('id', petId);

    setSaving(false);
    if (dbError) { setError(dbError.message); return; }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gray-300" />
      </div>
    );
  }

  const age = calcAge(birthDate, t);

  return (
    <div className="flex flex-col bg-[#fafafa] min-h-full">
      {/* Hidden file inputs */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, false)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, true)}
      />

      {/* Header */}
      <header className="px-6 pt-10 pb-4 bg-white flex items-center gap-4 border-b border-gray-50">
        <button onClick={() => onNavigate('dashboard')} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={28} />
        </button>
        <h1 className="flex-1 text-xl font-bold font-display text-[#827717]">{t('pet_info')}</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full shadow-md disabled:opacity-50 transition-all active:scale-95"
        >
          {saving
            ? <Loader2 size={14} className="animate-spin" />
            : saveSuccess
              ? <CheckCircle2 size={14} />
              : <Edit3 size={14} />
          }
          {saveSuccess ? t('saved') : t('save_changes')}
        </button>
      </header>

      <div className="px-6 py-6 space-y-6 pb-32">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-2xl">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Avatar + upload + quick stats */}
        <div className="bg-white rounded-[32px] p-6 shadow-card border border-gray-50">
          <div className="flex items-center gap-5">
            {/* Avatar circle with edit overlay */}
            <div className="relative shrink-0">
              <div
                className={cn(
                  'w-24 h-24 rounded-full flex items-center justify-center text-5xl overflow-hidden cursor-pointer',
                  !avatarUrl && (PET_BG[petType] ?? 'bg-gray-100')
                )}
                onClick={() => !uploadingAvatar && setShowUploadPanel((v) => !v)}
              >
                {uploadingAvatar ? (
                  <div className="w-full h-full bg-black/30 flex items-center justify-center">
                    <Loader2 size={28} className="animate-spin text-white" />
                  </div>
                ) : avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{PET_EMOJI[petType] ?? '🐾'}</span>
                )}
              </div>
              {/* Camera badge */}
              <button
                onClick={() => !uploadingAvatar && setShowUploadPanel((v) => !v)}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md border-2 border-white active:scale-95 transition-transform"
              >
                <Camera size={14} className="text-primary-foreground" />
              </button>
            </div>

            {/* Name + stats */}
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-black text-gray-900 truncate">{name || '—'}</p>
              <p className="text-sm text-gray-400 font-semibold">{petType}{breed ? ` · ${breed}` : ''}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
                  <Cake size={12} className="text-[#827717]" />
                  <span className="text-xs font-bold text-[#827717]">{age}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-teal-50 px-3 py-1.5 rounded-full">
                  <Scale size={12} className="text-teal-600" />
                  <span className="text-xs font-bold text-teal-600">
                    {latestWeight ? `${latestWeight.weight_kg} kg` : t('not_set')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Upload panel */}
          <AnimatePresence>
            {showUploadPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-gray-50 pt-4 space-y-3">
                  {/* Guideline text */}
                  <p className="text-[11px] text-gray-400 font-medium text-center leading-relaxed px-2">
                    Max {MAX_RAW_MB}MB · Auto-compressed to ~50–200KB for fast loading.
                    Square photos work best.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { setShowUploadPanel(false); cameraInputRef.current?.click(); }}
                      className="flex flex-col items-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold py-4 px-3 rounded-[20px] transition-colors active:scale-95"
                    >
                      <Camera size={22} />
                      <span className="text-xs">Take Photo Now</span>
                      <span className="text-[10px] font-normal text-teal-500 text-center">Opens your camera</span>
                    </button>
                    <button
                      onClick={() => { setShowUploadPanel(false); galleryInputRef.current?.click(); }}
                      className="flex flex-col items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-4 px-3 rounded-[20px] transition-colors active:scale-95"
                    >
                      <ImageIcon size={22} />
                      <span className="text-xs">Choose from Gallery</span>
                      <span className="text-[10px] font-normal text-gray-400 text-center">Pick an existing photo</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowUploadPanel(false)}
                    className="w-full text-xs text-gray-400 font-semibold flex items-center justify-center gap-1 py-1"
                  >
                    <X size={12} /> Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Photo size info — shown after upload */}
          <AnimatePresence>
            {photoInfo && !uploadingAvatar && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 flex items-center gap-3"
              >
                <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
                <div className="text-xs text-teal-700 font-medium">
                  {photoInfo.fromCamera && (
                    <p className="font-bold">
                      📷 Photo taken · Original size: <span className="text-teal-900">{formatBytes(photoInfo.originalBytes)}</span>
                    </p>
                  )}
                  <p>
                    Saved as <span className="font-bold text-teal-900">{formatBytes(photoInfo.compressedBytes)}</span>
                    {' '}({Math.round((1 - photoInfo.compressedBytes / photoInfo.originalBytes) * 100)}% smaller)
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Edit form */}
        <section className="bg-white rounded-[32px] p-6 shadow-card border border-gray-50 space-y-5">
          <h3 className="text-xs font-black text-[#827717] uppercase tracking-widest opacity-80">{t('basic_info')}</h3>

          {/* Name */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block ml-1">{t('pet_name')} *</label>
            <input
              type="text"
              className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block ml-1">{t('pet_type')}</label>
            <div className="grid grid-cols-4 gap-2">
              {PET_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPetType(type)}
                  className={cn(
                    'py-3 rounded-[16px] text-xs font-bold flex flex-col items-center gap-1 border transition-all',
                    petType === type
                      ? 'bg-primary/10 border-primary/40 text-[#827717]'
                      : 'bg-gray-50 border-transparent text-gray-500'
                  )}
                >
                  <span className="text-lg">{PET_EMOJI[type]}</span>
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Breed */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block ml-1">{t('breed_optional')}</label>
            <input
              type="text"
              placeholder="e.g. Golden Retriever"
              className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
            />
          </div>

          {/* Birth date */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block ml-1">{t('birth_date_optional')}</label>
            <input
              type="date"
              className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-[20px] focus:bg-white focus:border-primary transition-all outline-none font-medium"
              value={birthDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setBirthDate(e.target.value)}
            />
            {birthDate && (
              <p className="text-xs text-gray-400 font-semibold mt-1.5 ml-1">
                {t('age')}: <span className="text-[#827717] font-bold">{age}</span>
              </p>
            )}
          </div>
        </section>

        {/* Weight section */}
        <section className="bg-white rounded-[32px] p-6 shadow-card border border-gray-50">
          <h3 className="text-xs font-black text-[#827717] uppercase tracking-widest opacity-80 mb-4">{t('current_weight')}</h3>

          {latestWeight ? (
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-black text-gray-900">{latestWeight.weight_kg}</span>
              <span className="text-xl font-bold text-gray-400 mb-1">kg</span>
              <span className="text-xs text-gray-400 font-medium mb-1.5 ml-1">
                · {new Date(latestWeight.logged_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-400 font-medium mb-4">{t('no_weight_recorded')}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => onNavigate('weight-tracker', { petId })}
              className="flex-1 bg-teal-800 text-white font-bold py-3 rounded-[18px] text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-900/20"
            >
              <Scale size={16} />
              {t('log_new_weight')}
            </button>
            {latestWeight && (
              <button
                onClick={() => onNavigate('weight-tracker', { petId })}
                className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-[18px] text-sm flex items-center justify-center gap-2"
              >
                <TrendingUp size={16} />
                {t('view_weight_history')}
              </button>
            )}
          </div>
        </section>

        {/* Save button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary hover:bg-[#ffca28] disabled:opacity-50 text-primary-foreground font-bold py-4 rounded-[20px] shadow-lg shadow-yellow-100 transition-all flex items-center justify-center gap-2"
        >
          {saving
            ? <Loader2 size={20} className="animate-spin" />
            : saveSuccess
              ? <><CheckCircle2 size={20} /> {t('saved')}</>
              : t('save_changes')
          }
        </motion.button>
      </div>
    </div>
  );
}
