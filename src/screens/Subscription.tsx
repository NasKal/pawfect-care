import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Check, Plus, Settings, PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Subscription({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { t } = useTranslation();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      name: t('free'),
      price: '€0',
      desc: 'Essential care for a happy pet.',
      features: ['1 pet', 'Basic Diary', 'Emergency Vet contact', '50MB Storage'],
      current: true,
      button: t('current_plan')
    },
    {
      name: t('premium'),
      price: billing === 'monthly' ? '€7.99' : '€5.59',
      desc: 'Complete peace of mind for your furry family.',
      features: ['Unlimited pets', 'Advanced Health Analytics', '5GB Storage', 'PDF Medical History Exports'],
      recommended: true,
      button: t('select_premium')
    }
  ];

  return (
    <div className="flex flex-col bg-[#fafafa] min-h-full">
      <header className="px-6 pt-10 pb-6 flex items-center justify-between bg-[#fafafa]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary shadow-sm bg-primary/10 flex items-center justify-center">
            <PawPrint size={20} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold font-display text-[#827717]">Pawfect Care</h1>
        </div>
        <button onClick={() => onNavigate('settings')} className="text-gray-400">
          <Settings size={24} />
        </button>
      </header>

      <div className="px-6 py-4 flex flex-col items-center">
        <h2 className="text-3xl font-bold font-display text-gray-900 mb-8">{t('choose_plan')}</h2>

        {/* Toggle */}
        <div className="bg-gray-100 p-1 rounded-full flex relative mb-12">
          <div className="absolute -top-6 right-0 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
             Save 30%
          </div>
          <button 
            onClick={() => setBilling('monthly')}
            className={cn("px-8 py-2 rounded-full text-sm font-bold transition-all", billing === 'monthly' ? "bg-white shadow-sm text-gray-800" : "text-gray-400")}
          >
            {t('monthly')}
          </button>
          <button 
            onClick={() => setBilling('annual')}
            className={cn("px-8 py-2 rounded-full text-sm font-bold transition-all", billing === 'annual' ? "bg-white shadow-sm text-gray-800" : "text-gray-400")}
          >
            {t('annual')}
          </button>
        </div>

        {/* Plans */}
        <div className="w-full space-y-6">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={cn(
                "relative rounded-[40px] p-8 border transition-all",
                plan.recommended ? "bg-primary border-transparent text-primary-foreground" : "bg-white border-gray-100 text-gray-800"
              )}
            >
              {plan.recommended && (
                <div className="absolute top-6 right-8 bg-[#827717] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                  Recommended
                </div>
              )}
              
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-sm opacity-60">/mo</span>
              </div>
              <p className="text-sm mb-8 opacity-80">{plan.desc}</p>

              <div className="space-y-4 mb-8">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center border", plan.recommended ? "border-white/40" : "border-teal-100 bg-teal-50 text-teal-600")}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-semibold">{f}</span>
                  </div>
                ))}
              </div>

              <button className={cn(
                "w-full py-4 rounded-[20px] font-bold transition-all active:scale-[0.98]",
                plan.current ? "bg-gray-100 text-gray-400 cursor-default" : "bg-[#827717] text-white shadow-xl shadow-yellow-800/20"
              )}>
                {plan.button}
              </button>
            </div>
          ))}
        </div>

        {/* Custom Growth */}
        <div className="w-full mt-12 mb-20 text-center">
          <h3 className="text-2xl font-bold font-display text-gray-800 mb-6 tracking-tight italic">Custom Growth</h3>
          
          <div className="bg-white rounded-[40px] p-8 border-2 border-dashed border-gray-200 flex flex-col items-center">
            <div className="flex items-center gap-6 w-full text-left">
               <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg shadow-yellow-100">
                <Plus size={32} />
              </div>
              <div className="flex-1">
                 <h4 className="text-xl font-bold text-gray-800 tracking-tight">{t('add_1_pet')}</h4>
                 <p className="text-xs text-gray-400 font-medium">Perfect for growing families.</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between w-full mt-8">
              <div className="text-left">
                <span className="text-2xl font-black text-gray-800">1.99€</span>
                <p className="text-[10px] text-gray-400 font-bold uppercase">per month</p>
              </div>
              <button className="bg-teal-800 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-teal-900/20 active:scale-[0.95] transition-all">
                Add Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
