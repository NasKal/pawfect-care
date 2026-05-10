import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Fingerprint, Apple, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function Login({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
    // On success AuthContext picks up the session and App.tsx redirects to dashboard
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-8 bg-[#fafafa]">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm bg-white p-8 rounded-[32px] shadow-soft border border-gray-50 flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6">
          <Fingerprint className="text-white" size={32} />
        </div>

        <h1 className="text-3xl font-bold font-display text-gray-900 mb-2">Pawfect Care</h1>
        <p className="text-gray-500 mb-8">Welcome back to your pet's hub.</p>

        {error && (
          <div className="w-full flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-2xl mb-4">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="w-full space-y-4">
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
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <label className="text-xs font-semibold text-gray-600">{t('password')}</label>
              <button type="button" className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Forgot Password?</button>
            </div>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary focus:ring-0 transition-all outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-[#ffca28] disabled:opacity-60 text-primary-foreground font-bold py-4 rounded-2xl shadow-lg shadow-yellow-100 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : t('login')}
          </button>
        </form>

        <div className="w-full mt-6">
          <button
            className="w-full bg-white border-2 border-teal-600 text-teal-800 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Fingerprint size={20} />
            {t('biometric_login')}
          </button>
        </div>

        <div className="relative w-full my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-400 font-medium">or</span>
          </div>
        </div>

        <div className="flex gap-4 w-full">
          <button className="flex-1 bg-gray-50 hover:bg-gray-100 py-3 rounded-2xl flex items-center justify-center transition-colors">
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5 opacity-70" alt="Google" />
          </button>
          <button className="flex-1 bg-gray-50 hover:bg-gray-100 py-3 rounded-2xl flex items-center justify-center transition-colors">
            <Apple size={20} className="text-gray-800" />
          </button>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Don't have an account? <button onClick={() => onNavigate('signup')} className="text-teal-600 font-bold hover:underline">{t('signup')}</button>
        </p>
      </motion.div>
    </div>
  );
}
