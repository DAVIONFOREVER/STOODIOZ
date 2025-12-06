
import React, { useState, useEffect } from 'react';
import { useAppState } from '../../contexts/AppContext';
import * as apiService from '../../services/apiService';
import type { Booking, Engineer } from '../../types';
import { CheckCircleIcon, CloseCircleIcon } from '../icons';

const LabelApprovals: React.FC = () => {
    const { currentUser } = useAppState();
    const [pending, setPending] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        if (!currentUser?.id) return;
        setLoading(true);
        try {
            const bookings = await apiService.fetchLabelBookings(currentUser.id);
            const needsApproval = (bookings || []).filter((b: Booking) => b.status === 'PENDING_APPROVAL');
            setPending(needsApproval);
        } catch (error) {
            console.error("Failed to load approvals", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [currentUser?.id]);

    async function handleApprove(b: Booking) {
        try {
            // The respondToBooking function expects an Engineer object, but for this mock-style update,
            // we might not have it fully populated. Passing what we have or an empty object.
            await apiService.respondToBooking(b, 'accept', b.engineer as Engineer || {} as Engineer);
            setPending(prev => prev.filter(x => x.id !== b.id));
        } catch (error) {
            console.error("Failed to approve booking:", error);
            alert("Approval failed. Please try again.");
        }
    }

    async function handleDeny(b: Booking) {
        try {
            await apiService.respondToBooking(b, 'deny', b.engineer as Engineer || {} as Engineer);
            setPending(prev => prev.filter(x => x.id !== b.id));
        } catch (error) {
            console.error("Failed to deny booking:", error);
            alert("Rejection failed. Please try again.");
        }
    }

    if (loading) {
        return <div className="p-10 text-center text-zinc-400">Loading approvals...</div>;
    }

    if (pending.length === 0) {
        return (
            <div className="p-10 text-center text-zinc-500 cardSurface">
                <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <h3 className="font-bold text-zinc-200">All Caught Up!</h3>
                <p>No pending approvals at this time.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-extrabold text-zinc-100">Pending Approvals</h1>
            {pending.map(b => (
                <div key={b.id} className="cardSurface p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <img src={b.artist?.image_url} alt={b.artist?.name} className="w-12 h-12 rounded-full object-cover"/>
                        <div>
                            <p className="text-zinc-100 font-bold">{b.artist?.name || 'Artist'}</p>
                            <p className="text-zinc-400 text-sm">{b.stoodio?.name || 'Remote Session'}</p>
                            <p className="text-zinc-400 text-sm">{new Date(b.date).toLocaleDateString()} at {b.start_time}</p>
                        </div>
                    </div>

                    <div className="flex gap-3 self-end md:self-center">
                        <button 
                            onClick={() => handleApprove(b)} 
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm flex items-center gap-2"
                        >
                           <CheckCircleIcon className="w-4 h-4"/> Approve
                        </button>
                        <button 
                            onClick={() => handleDeny(b)} 
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm flex items-center gap-2"
                        >
                           <CloseCircleIcon className="w-4 h-4"/> Reject
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LabelApprovals;
