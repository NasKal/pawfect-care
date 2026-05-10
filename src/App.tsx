import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Home, PawPrint, HeartPulse, MapPin, Bell } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import '@/i18n/config';

import Dashboard from '@/screens/Dashboard';
import Login from '@/screens/Login';
import Signup from '@/screens/Signup';
import PetProfile from '@/screens/PetProfile';
import PetDetail from '@/screens/PetDetail';
import HealthCare from '@/screens/HealthCare';
import VetSearch from '@/screens/VetSearch';
import Settings from '@/screens/Settings';
import Subscription from '@/screens/Subscription';
import Onboarding from '@/screens/Onboarding';
import Alerts from '@/screens/Alerts';
import DiaryEntry from '@/screens/DiaryEntry';
import MyVet from '@/screens/MyVet';
import AddReminder from '@/screens/AddReminder';
import WeightTracker from '@/screens/WeightTracker';

type Screen =
  | 'dashboard' | 'login' | 'signup' | 'pets' | 'health'
  | 'vets' | 'settings' | 'subscription' | 'onboarding'
  | 'alerts' | 'diary-entry' | 'my-vet' | 'add-reminder'
  | 'weight-tracker' | 'pet-detail';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [navData, setNavData] = useState<Record<string, any>>({});
  const { t } = useTranslation();

  const navigate = (screen: any, data?: Record<string, any>) => {
    setCurrentScreen(screen as Screen);
    setNavData(data ?? {});
  };

  useEffect(() => {
    if (!loading) {
      setCurrentScreen(user ? 'dashboard' : 'login');
    }
  }, [user, loading]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':         return <Login onNavigate={navigate} />;
      case 'signup':        return <Signup onNavigate={navigate} />;
      case 'onboarding':    return <Onboarding onNavigate={navigate} />;
      case 'dashboard':     return <Dashboard onNavigate={navigate} />;
      case 'pets':          return <PetProfile onNavigate={navigate} />;
      case 'pet-detail':    return <PetDetail onNavigate={navigate} petId={navData.petId ?? ''} />;
      case 'health':        return <HealthCare onNavigate={navigate} />;
      case 'vets':          return <VetSearch onNavigate={navigate} />;
      case 'settings':      return <Settings onNavigate={navigate} />;
      case 'subscription':  return <Subscription onNavigate={navigate} />;
      case 'alerts':        return <Alerts onNavigate={navigate} />;
      case 'diary-entry':   return <DiaryEntry onNavigate={navigate} entryId={navData.entryId} />;
      case 'my-vet':        return <MyVet onNavigate={navigate} />;
      case 'add-reminder':  return <AddReminder onNavigate={navigate} />;
      case 'weight-tracker': return <WeightTracker onNavigate={navigate} initialPetId={navData.petId} />;
      default:              return <Dashboard onNavigate={navigate} />;
    }
  };

  const NAV_SCREENS: Screen[] = ['dashboard', 'pets', 'health', 'vets', 'alerts', 'settings', 'subscription'];
  const showNavbar = NAV_SCREENS.includes(currentScreen);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white overflow-hidden shadow-2xl relative">
      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="h-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {showNavbar && (
        <nav className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-50">
          <NavButton
            active={currentScreen === 'dashboard'}
            onClick={() => navigate('dashboard')}
            icon={<Home size={22} />}
            label={t('home')}
          />
          <NavButton
            active={currentScreen === 'pets'}
            onClick={() => navigate('pets')}
            icon={<PawPrint size={22} />}
            label={t('pets')}
          />
          {/* Center health button */}
          <div className="flex flex-col items-center justify-center">
            <button
              onClick={() => navigate('health')}
              className={`p-3 rounded-full transition-all ${currentScreen === 'health' ? 'bg-primary text-white scale-110' : 'bg-gray-50 text-gray-400'}`}
            >
              <HeartPulse size={26} />
            </button>
            <span className={`text-[10px] mt-1 font-medium ${currentScreen === 'health' ? 'text-primary' : 'text-gray-400'}`}>
              {t('health')}
            </span>
          </div>
          <NavButton
            active={currentScreen === 'vets'}
            onClick={() => navigate('vets')}
            icon={<MapPin size={22} />}
            label={t('vets')}
          />
          <NavButton
            active={currentScreen === 'alerts'}
            onClick={() => navigate('alerts')}
            icon={<Bell size={22} />}
            label={t('alerts')}
          />
        </nav>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 transition-colors ${active ? 'text-primary' : 'text-gray-400'}`}
    >
      <div className={active ? 'scale-110 transition-transform' : ''}>{icon}</div>
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
