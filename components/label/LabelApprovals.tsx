
import React, { useEffect, useMemo, useState } from "react";
import { useAppState } from "../../contexts/AppContext";
import { fetchLabelBookings, approveLabelBooking, denyLabelBooking, getLabelBudgetOverview } from "../../services/apiService";
import type { Booking, LabelBudgetOverview } from "../../types";

const LabelApprovals: React.FC = () => {
    const { currentUser } = useAppState();
    const [pending, setPending] = useState<Booking[]>([]);
    const [budgetOverview, setBudgetOverview] = useState<LabelBudgetOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            if (!currentUser?.id) return;
            setLoading(true);

            const [all, budget] = await Promise.all([
                fetchLabelBookings(currentUser.id),
                getLabelBudgetOverview(currentUser.id),
            ]);

            const requiresApproval = (all || []).filter((b: any) => {
                const status = String(b?.status || '').toUpperCase();
                return status === "PENDING_LABEL_APPROVAL" || status === "PENDING_APPROVAL";
            });

            setPending(requiresApproval || []);
            setBudgetOverview(budget || null);
            setLoading(false);
        }
        load();
    }, [currentUser?.id]);

    const allocationByArtist = useMemo(() => {
        const map = new Map<string, { allocation: number; remaining: number }>();
        (budgetOverview?.artists || []).forEach((artist) => {
            const allocation = Number(artist.allocation_amount || 0);
            const remaining = Number(artist.remaining_amount ?? (allocation - Number(artist.amount_spent || 0)));
            map.set(artist.artist_id, { allocation, remaining });
        });
        return map;
    }, [budgetOverview]);

    const artistNameById = useMemo(() => {
        const map = new Map<string, string>();
        (budgetOverview?.artists || []).forEach((artist) => {
            if (artist.artist_id) map.set(artist.artist_id, artist.artist_name);
        });
        return map;
    }, [budgetOverview]);

    const resolveArtistId = (booking: any) =>
        booking.artist?.id ||
        booking.artist_profile_id ||
        booking.artist_id ||
        booking.booked_by_id ||
        '';

    async function handleApprove(b: Booking) {
        if (!currentUser?.id) return;
        setActionId(b.id);
        try {
            await approveLabelBooking(b.id, currentUser.id, currentUser.id);
            setPending(prev => prev.filter(x => x.id !== b.id));
            const budget = await getLabelBudgetOverview(currentUser.id);
            setBudgetOverview(budget || null);
        } catch (e: any) {
            alert(e?.message || 'Unable to approve booking.');
        } finally {
            setActionId(null);
        }
    }

    async function handleDeny(b: Booking) {
        if (!currentUser?.id) return;
        setActionId(b.id);
        try {
            await denyLabelBooking(b.id, currentUser.id, currentUser.id);
            setPending(prev => prev.filter(x => x.id !== b.id));
        } catch (e: any) {
            alert(e?.message || 'Unable to deny booking.');
        } finally {
            setActionId(null);
        }
    }

    if (loading) {
      return <div className='p-10 text-center text-zinc-400'>Loading approval queue...</div>;
    }

    if (pending.length === 0) {
      return <div className='p-10 text-center text-zinc-500'>No bookings need approval.</div>;
    }

    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-extrabold text-zinc-100">Booking Approvals</h1>

        <div className="cardSurface overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800/50 text-zinc-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Artist</th>
                <th className="px-6 py-3">Studio</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Allocation</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800 text-zinc-300">
              {pending.map((b: any) => {
                const artistId = resolveArtistId(b);
                const allocation = allocationByArtist.get(String(artistId));
                const remaining = allocation?.remaining ?? 0;
                const total = Number(b.total_cost || 0);
                const shortfall = Math.max(0, total - remaining);
                const canApprove = shortfall <= 0;
                return (
                <tr key={b.id} className="hover:bg-zinc-800/40">
                  <td className="px-6 py-4">{b.artist?.name || artistNameById.get(String(artistId)) || "Unknown Artist"}</td>
                  <td className="px-6 py-4">{b.stoodio?.name || "Remote"}</td>
                  <td className="px-6 py-4">{b.date}</td>
                  <td className="px-6 py-4">${Number(b.total_cost || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {allocation ? (
                      <div className="space-y-1">
                        <div className={shortfall > 0 ? 'text-red-400' : 'text-green-400'}>
                          ${remaining.toLocaleString()} remaining
                        </div>
                        {shortfall > 0 && (
                          <div className="text-xs text-zinc-500">Short by ${shortfall.toLocaleString()}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-500">No allocation</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleApprove(b)}
                        disabled={actionId === b.id || !canApprove}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >Approve</button>

                      <button
                        onClick={() => handleDeny(b)}
                        disabled={actionId === b.id}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >Deny</button>
                    </div>
                  </td>

                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
};

export default LabelApprovals;
