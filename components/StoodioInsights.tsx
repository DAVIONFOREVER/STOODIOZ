import React, { useMemo, useState } from 'react';
import type { Stoodio, Booking } from '../types';
import { useAppState } from '../contexts/AppContext.tsx';

type Range = '7D' | '30D' | 'ALL';

const Stat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
    <div className="text-sm text-slate-400">{label}</div>
    <div className="text-2xl font-extrabold text-slate-100 mt-1">{value}</div>
  </div>
);

const StoodioInsights: React.FC = () => {
  const { currentUser, userRole, bookings } = useAppState();
  const [range, setRange] = useState<Range>('30D');

  // This page is meant for STOODIO accounts
  const stoodioId = useMemo(() => {
    if (!currentUser) return null;
    // if your stoodio users are stored in stoodioz table, they still have id
    return (currentUser as any).id || null;
  }, [currentUser]);

  const filteredBookings = useMemo(() => {
    const all = (bookings || []) as any[];

    if (!stoodioId) return [];
    const mine = all.filter((b) => b?.stoodio_id === stoodioId || b?.stoodio?.id === stoodioId);

    if (range === 'ALL') return mine;

    const days = range === '7D' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return mine.filter((b) => {
      const dt = new Date(`${b.date}T${b.start_time || '00:00'}`);
      return !isNaN(dt.getTime()) && dt >= cutoff;
    });
  }, [bookings, stoodioId, range]);

  const kpis = useMemo(() => {
    const totalBookings = filteredBookings.length;

    const totalRevenue = filteredBookings.reduce((sum, b: any) => {
      const amt = Number(b?.total_cost ?? b?.amount ?? 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    const uniqueClients = new Set(
      filteredBookings
        .map((b: any) => b?.booked_by_id || b?.booked_by?.id || b?.client_id)
        .filter(Boolean)
    ).size;

    const upcoming = filteredBookings.filter((b: any) => {
      const dt = new Date(`${b.date}T${b.start_time || '00:00'}`);
      return dt >= new Date();
    }).length;

    return { totalBookings, totalRevenue, uniqueClients, upcoming };
  }, [filteredBookings]);

  // Access guard (soft UI guard; DB/RLS should still enforce real access later)
  const isStoodioRole = userRole === 'STOODIO';

  if (!isStoodioRole) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
        <h2 className="text-2xl font-bold text-slate-100">Access Restricted</h2>
        <p className="text-slate-300 mt-2">Stoodio Insights is available to Stoodio accounts only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100">Stoodio Insights</h1>
          <p className="text-slate-400 mt-1">
            Quick performance snapshot based on your bookings. (We can plug in full analytics later.)
          </p>
        </div>

        <div className="flex gap-2">
          {(['7D', '30D', 'ALL'] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                range === r
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-zinc-900 text-slate-200 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Bookings" value={kpis.totalBookings} />
        <Stat label="Upcoming" value={kpis.upcoming} />
        <Stat label="Unique clients" value={kpis.uniqueClients} />
        <Stat label="Revenue" value={`$${kpis.totalRevenue.toFixed(2)}`} />
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-100">Recent bookings</h2>
          <div className="text-xs text-slate-500">{range} range</div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-slate-400">No bookings found for this range.</div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.slice(0, 12).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="min-w-0">
                  <div className="text-slate-100 font-semibold truncate">
                    {b?.title || b?.service_type || 'Session'}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {b.date} • {b.start_time || '—'} • {b.status || '—'}
                  </div>
                </div>
                <div className="text-slate-200 font-bold">
                  ${Number(b?.total_cost ?? 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoodioInsights;
