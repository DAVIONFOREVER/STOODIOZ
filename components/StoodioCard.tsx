import React from 'react';
import type { Stoodio } from '../types';
import { getProfileImageUrl, getDisplayName } from '../constants';

export default function StoodioCard({
  stoodio,
  onSelectStoodio,
}: {
  stoodio: Stoodio;
  onSelectStoodio: (stoodio: Stoodio) => void;
}) {
  const location = (stoodio as any).location_text || (stoodio as any).location || 'Location not set';

  return (
    <button
      type="button"
      onClick={() => onSelectStoodio(stoodio)}
      className="text-left rounded-2xl border border-zinc-800/70 bg-gradient-to-br from-zinc-950/80 via-zinc-900/70 to-zinc-950/90 hover:-translate-y-1 transition-transform shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-5"
    >
      <div className="w-64 h-64 mx-auto rounded-full overflow-hidden shrink-0">
        <img src={getProfileImageUrl(stoodio as { email?: string; image_url?: string })} alt={getDisplayName(stoodio as any)} className="w-full h-full object-cover object-center" loading="lazy" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="text-slate-100 font-bold text-lg truncate">{getDisplayName(stoodio as any)}</div>
        <div className="text-slate-400 text-sm truncate">{location}</div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-slate-200">
            View Details
          </span>

          {typeof (stoodio as any).hourly_rate === 'number' && (
            <span className="text-xs text-slate-300">${(stoodio as any).hourly_rate}/hr</span>
          )}
        </div>
      </div>
    </button>
  );
}
