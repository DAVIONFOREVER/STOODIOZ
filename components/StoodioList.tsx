import React, { useMemo, useState } from 'react';
import type { Stoodio } from '../types';
import { useAppState } from '../contexts/AppContext.tsx';
import StoodioCard from './StoodioCard';

interface StoodioListProps {
  onSelectStoodio: (stoodio: Stoodio) => void;
}

const StoodioList: React.FC<StoodioListProps> = ({ onSelectStoodio }) => {
  const { stoodioz } = useAppState();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const list = stoodioz ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;

    return list.filter((s) => {
      const name = (s.name || '').toLowerCase();
      const loc = ((s as any).location_text || (s as any).location || '').toLowerCase();
      return name.includes(q) || loc.includes(q);
    });
  }, [stoodioz, query]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100">Find Stoodioz</h1>
          <p className="text-slate-400 mt-1">Browse studios near you and book instantly.</p>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or location..."
          className="w-full sm:w-[320px] rounded-xl bg-zinc-900 border border-zinc-800 text-slate-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="cardSurface p-8 text-center">
          <p className="text-slate-300 font-semibold">No studios found.</p>
          <p className="text-slate-500 text-sm mt-1">Try a different search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((s) => (
            <StoodioCard key={s.id} stoodio={s} onSelectStoodio={onSelectStoodio} />
          ))}
        </div>
      )}
    </div>
  );
};

export default StoodioList;
