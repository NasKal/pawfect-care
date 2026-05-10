import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Signup({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed || !supabase) return;
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Email confirmation required — session is null until user confirms
    if (data.user && !data.session) {
      setAwaitingConfirmation(true);
      setLoading(false);
      return;
    }

    // Email confirmation disabled — user is immediately logged in
    onNavigate('onboarding');
  };

  if (awaitingConfirmation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-8 bg-[#fafafa]">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-sm bg-white p-10 rounded-[32px] shadow-soft border border-gray-50 flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="text-teal-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold font-display text-gray-900 mb-3">Check your email</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            We sent a confirmation link to <span className="font-semibold text-gray-700">{email}</span>. Click it to activate your account.
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="w-full bg-primary hover:bg-[#ffca28] text-primary-foreground font-bold py-4 rounded-2xl shadow-lg shadow-yellow-100 transition-all"
          >
            Back to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-8 bg-[#fafafa]">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm bg-white p-8 rounded-[32px] shadow-soft border border-gray-50 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-gray-900 italic">PAWS</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold font-display text-gray-900 mb-2">{t('create_account')}</h1>
        <p className="text-gray-500 mb-8">Join Pawfect Care for a happier pet.</p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-2xl mb-4">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="w-full space-y-4">
          <div className="text-left">
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block ml-1">{t('full_name')}</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                <User size={18} />
              </span>
              <input
                type="text"
                placeholder="e.g. Jane Doe"
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary focus:ring-0 transition-all outline-none"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="text-left">
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block ml-1">{t('email')}</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                <Mail size={18} />
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary focus:ring-0 transition-all outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="text-left">
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block ml-1">{t('password')}</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary focus:ring-0 transition-all outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-start text-left gap-3 py-2 px-1">
            <div className="pt-1">
              <input
                type="checkbox"
                id="terms"
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
            </div>
            <label htmlFor="terms" className="text-xs leading-relaxed text-gray-500">
              {t('terms_agree')}
            </label>
          </div>

          <button
            type="submit"
            disabled={!agreed || loading}
            className="w-full bg-primary disabled:opacity-50 hover:bg-[#ffca28] text-primary-foreground font-bold py-4 rounded-2xl shadow-lg shadow-yellow-100 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : t('signup')}
          </button>
        </form>

        <p className="mt-8 text-sm text-gray-500">
          Already have an account? <button onClick={() => onNavigate('login')} className="text-teal-600 font-bold hover:underline">{t('login')}</button>
        </p>
      </motion.div>
    </div>
  );
}
