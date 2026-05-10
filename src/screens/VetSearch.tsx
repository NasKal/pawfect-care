import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Star, SlidersHorizontal, Plus, PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';

type Vet = {
  id: number;
  name: string;
  distance: string;
  distanceMi: number;
  rating: number;
  type: string;
  closing: string;
  categories: string[];
  open24: boolean;
};

const VETS: Vet[] = [
  { id: 1, name: 'Sunny Paws Clinic', distance: '1.2 mi away', distanceMi: 1.2, rating: 4.9, type: 'General Practice', closing: '8 PM', categories: ['Clinic'], open24: false },
  { id: 2, name: 'Oak Valley Hospital', distance: '2.5 mi away', distanceMi: 2.5, rating: 4.7, type: '24/7 Emergency', closing: 'Open 24h', categories: ['Emergency'], open24: true },
  { id: 3, name: 'City Vet Specialists', distance: '3.1 mi away', distanceMi: 3.1, rating: 4.8, type: 'Specialist', closing: '6 PM', categories: ['Specialist'], open24: false },
  { id: 4, name: 'PetCare Express', distance: '0.8 mi away', distanceMi: 0.8, rating: 4.5, type: 'General Practice', closing: '9 PM', categories: ['Clinic'], open24: false },
];

const CATEGORIES = ['Emergency', 'Clinic', 'Specialist', 'Open Now'];

export default function VetSearch({ onNavigate }: { onNavigate: (s: any) => void }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let results = VETS;
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q)
      );
    }
    if (activeCategory) {
      if (activeCategory === 'Open Now') {
        results = results.filter(v => v.open24);
      } else {
        results = results.filter(v => v.categories.includes(activeCategory));
      }
    }
    return results.sort((a, b) => a.distanceMi - b.distanceMi);
  }, [search, activeCategory]);

  const toggleCategory = (cat: string) => {
    setActiveCategory(prev => prev === cat ? null : cat);
  };

  return (
    <div className="flex flex-col bg-[#fafafa] min-h-full relative overflow-hidden">
      {/* Map background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1200"
          className="w-full h-full object-cover opacity-30 grayscale"
          alt="Map"
        />
        <div className="absolute inset-0 bg-white/40" />
      </div>

      <header className="px-6 pt-10 pb-6 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center gap-3 border-b border-gray-100">
        <div className="w-10 h-10 rounded-full border-2 border-primary shadow-sm bg-primary/10 flex items-center justify-center shrink-0">
          <PawPrint size={20} className="text-primary" />
        </div>
        <h1 className="text-xl font-bold font-display text-[#827717]">Pawfect Care</h1>
      </header>

      <div className="p-6 relative z-10">
        {/* Search */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative group">
            <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search for vets, clinics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white shadow-xl shadow-gray-200/50 rounded-[20px] outline-none font-medium border border-transparent focus:border-primary transition-all"
            />
          </div>
          <button className="bg-teal-100/50 text-teal-800 p-4 rounded-[20px] shadow-sm">
            <SlidersHorizontal size={24} />
          </button>
        </div>

        {/* Category filters */}
        <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={cn(
                'px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border',
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground border-transparent shadow-md shadow-yellow-100'
                  : 'bg-white text-gray-700 border-gray-100 shadow-sm'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black font-display text-gray-800 tracking-tight">
            {activeCategory || search ? `${filtered.length} Result${filtered.length !== 1 ? 's' : ''}` : 'Nearest Vets'}
          </h2>
        </div>

        {/* Vet cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-bold text-gray-500">No vets found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search or filter</p>
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-32">
            {filtered.map((vet) => (
              <motion.div
                key={vet.id}
                whileTap={{ scale: 0.98 }}
                className="min-w-[300px] bg-white rounded-[32px] p-8 shadow-2xl border-l-[6px] border-teal-800 relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2">{vet.name}</h3>
                    <div className="flex items-center gap-1.5 text-teal-600 font-bold">
                      <MapPin size={16} />
                      <span className="text-sm">{vet.distance}</span>
                    </div>
                  </div>
                  <div className="bg-primary/20 text-[#827717] px-3 py-1 rounded-xl flex items-center gap-1 shrink-0">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-black">{vet.rating}</span>
                  </div>
                </div>

                <p className="text-gray-400 font-bold text-sm mb-6">
                  {vet.type} · {vet.open24 ? 'Open 24h' : `Open until ${vet.closing}`}
                </p>

                {vet.open24 && (
                  <span className="inline-block bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg mb-4">
                    Open Now
                  </span>
                )}

                <button className="w-full bg-[#827717] text-white py-4 rounded-[20px] font-bold shadow-xl shadow-yellow-900/20 active:scale-[0.95] transition-all">
                  Book Appointment
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Map markers */}
      <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white rounded-full shadow-2xl p-1 z-10 flex items-center justify-center">
        <div className="bg-teal-800 w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold">+</div>
      </div>
      <div className="absolute top-1/3 right-1/4 w-10 h-10 bg-white rounded-full shadow-2xl p-1 z-10 flex items-center justify-center">
        <div className="bg-primary w-full h-full rounded-full flex items-center justify-center text-primary-foreground">
          <Plus size={16} />
        </div>
      </div>
      <div className="absolute bottom-1/3 left-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.8)] border-2 border-white z-10" />
    </div>
  );
}
