import React, { useMemo, useState } from 'react';
import type { Stoodio } from '../types';
import { useAppState } from '../contexts/AppContext.tsx';
import { getProfileImageUrl } from '../constants';

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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((s) => {
            const location = (s as any).location_text || (s as any).location || 'Location not set';

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectStoodio(s)}
                className="text-left rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60 transition-all shadow-xl"
              >
                <div className="h-44 w-full overflow-hidden bg-zinc-900 flex items-center justify-center">
                  <img src={getProfileImageUrl(s as { email?: string; image_url?: string })} alt={s.name} className="h-full w-full object-cover" />
                </div>

                <div className="p-5 space-y-2">
                  <div className="text-slate-100 font-bold text-lg truncate">{s.name}</div>
                  <div className="text-slate-400 text-sm truncate">{location}</div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-slate-200">
                      View Details
                    </span>

                    {typeof (s as any).hourly_rate === 'number' && (
                      <span className="text-xs text-slate-300">
                        ${(s as any).hourly_rate}/hr
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StoodioList;
