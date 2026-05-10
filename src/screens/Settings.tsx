import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, CreditCard, Languages, Bell, Shield, HelpCircle, Mail, Trash2, LogOut, ChevronRight, Fingerprint } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function Settings({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'el' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="flex flex-col bg-[#fafafa] min-h-full">
      <header className="px-6 pt-10 pb-6 bg-white sticky top-0 z-20 shadow-sm flex items-center justify-between">
         <button onClick={() => onNavigate('dashboard')} className="text-gray-400">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
         </button>
         <h1 className="text-2xl font-bold font-display text-[#827717]">{t('settings')}</h1>
         <div className="w-6"></div>
      </header>

      <div className="p-6 space-y-8">
        {/* Profile Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-card border border-gray-50 flex items-center gap-5">
           <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-gray-50 shadow-sm bg-primary/10 flex items-center justify-center">
             {user?.user_metadata?.avatar_url
               ? <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
               : <span className="text-2xl font-bold text-primary">{(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}</span>
             }
           </div>
           <div>
             <h2 className="text-xl font-bold text-gray-900 leading-none mb-1">
               {user?.user_metadata?.full_name || t('profile')}
             </h2>
             <p className="text-xs font-medium text-gray-400">{user?.email}</p>
           </div>
        </div>

        {/* Sections */}
        <SettingsSection title={t('account_section')}>
          <SettingsItem icon={<User size={20} />} label={t('profile')} onClick={() => {}} />
          <SettingsItem
            icon={<CreditCard size={20} />}
            label={t('subscription_plan')}
            sublabel={t('premium_active')}
            onClick={() => onNavigate('subscription')}
          />
        </SettingsSection>

        <SettingsSection title={t('app_settings_section')}>
          <SettingsItem
            icon={<Languages size={20} />}
            label={t('language')}
            sublabel={t(i18n.language === 'en' ? 'english' : 'greek')}
            onClick={toggleLanguage}
          />
          <SettingsItem
            icon={<Bell size={20} />}
            label={t('push_notifications')}
            sublabel={t('coming_soon')}
            onClick={() => {}}
          />
        </SettingsSection>

        <SettingsSection title={t('security_section')}>
           <SettingsItem
            icon={<Fingerprint size={20} />}
            label={t('biometric_login')}
            sublabel={t('coming_soon')}
            onClick={() => {}}
          />
          <SettingsItem icon={<Shield size={20} />} label={t('change_password')} onClick={() => {}} />
        </SettingsSection>

        <SettingsSection title={t('legal_support_section')}>
           <SettingsItem icon={<Shield size={20} />} label={t('terms_of_service')} onClick={() => {}} />
           <SettingsItem icon={<Shield size={20} />} label={t('privacy_policy')} onClick={() => {}} />
           <SettingsItem icon={<HelpCircle size={20} />} label={t('help_center')} onClick={() => {}} />
           <SettingsItem icon={<Mail size={20} />} label={t('contact_us')} onClick={() => {}} />
        </SettingsSection>

        <div className="space-y-4 pt-10 pb-20">
          <button className="w-full bg-red-50 text-red-500 py-4 rounded-[20px] font-bold flex items-center justify-center gap-2 shadow-sm border border-red-100">
            <Trash2 size={20} />
            {t('delete_account')}
          </button>

          <button
            onClick={() => { signOut(); onNavigate('login'); }}
            className="w-full bg-white border-2 border-[#827717] text-[#827717] py-4 rounded-[24px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <LogOut size={20} />
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black text-[#827717] tracking-widest pl-2 opacity-80">{title}</h3>
      <div className="bg-white rounded-[32px] overflow-hidden shadow-card border border-gray-50">
        {children}
      </div>
    </div>
  );
}

function SettingsItem({ icon, label, sublabel, onClick, isToggle, toggled }: { icon: React.ReactNode, label: string, sublabel?: string, onClick?: () => void, isToggle?: boolean, toggled?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-5 p-5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-gray-50 text-[#827717] flex items-center justify-center transition-colors group-hover:bg-primary/20">
         {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-800">{label}</p>
        {sublabel && <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600/70">{sublabel}</p>}
      </div>
      {isToggle ? (
         <div className={cn("w-12 h-6 rounded-full p-1 relative transition-all", toggled ? "bg-teal-600" : "bg-gray-200")}>
            <div className={cn("w-4 h-4 bg-white rounded-full absolute transition-all", toggled ? "right-1" : "left-1")}></div>
         </div>
      ) : (
        <ChevronRight size={18} className="text-gray-300" />
      )}
    </button>
  );
}
