import React, { useEffect, useState } from "react";
import { useAppState } from "../../contexts/AppContext";
import { fetchLabelBookings } from "../../services/apiService";
import { respondToBooking } from "../../services/apiService";
import type { Booking, Engineer } from "../../types";

const LabelApprovals: React.FC = () => {
    const { currentUser } = useAppState();
    const [pending, setPending] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (!currentUser?.id) return;
            setLoading(true);

            const all = await fetchLabelBookings(currentUser.id);

            const requiresApproval = (all || []).filter(
                (b: any) => b.status === "PENDING_APPROVAL"
            );

            setPending(requiresApproval || []);
            setLoading(false);
        }
        load();
    }, [currentUser?.id]);

    async function handleApprove(b: Booking) {
        await respondToBooking(b, 'accept', b.engineer as Engineer || {} as Engineer);
        setPending(prev => prev.filter(x => x.id !== b.id));
    }

    async function handleDeny(b: Booking) {
        await respondToBooking(b, 'deny', b.engineer as Engineer || {} as Engineer);
        setPending(prev => prev.filter(x => x.id !== b.id));
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
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800 text-zinc-300">
              {pending.map((b: any) => (
                <tr key={b.id} className="hover:bg-zinc-800/40">
                  <td className="px-6 py-4">{b.artist?.name || "Unknown Artist"}</td>
                  <td className="px-6 py-4">{b.stoodio?.name || "Remote"}</td>
                  <td className="px-6 py-4">{b.date}</td>
                  <td className="px-6 py-4">${b.total_cost}</td>

                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleApprove(b)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                      >Approve</button>

                      <button
                        onClick={() => handleDeny(b)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                      >Deny</button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
};

export default LabelApprovals;
