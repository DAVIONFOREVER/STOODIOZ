
import React, { useState, useEffect } from 'react';
import { useAppState } from '../../contexts/AppContext';
import * as apiService from '../../services/apiService';
// FIX: Corrected import path for Booking type from ../types to ../../types
import type { Booking } from '../../types';
import { CalendarIcon, CheckCircleIcon, CloseCircleIcon, ClockIcon } from '../icons';

type LocalApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';

interface ApprovalBooking extends Booking {
    localStatus: LocalApprovalStatus;
}

const StatusBadge: React.FC<{ status: LocalApprovalStatus }> = ({ status }) => {
    let classes = "px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider";
    switch (status) {
        case 'PENDING': classes += " bg-yellow-500/20 text-yellow-400"; break;
        case 'APPROVED': classes += " bg-green-500/20 text-green-400"; break;
        case 'REJECTED': classes += " bg-red-500/20 text-red-400"; break;
        case 'CHANGES_REQUESTED': classes += " bg-blue-500/20 text-blue-400"; break;
        default: classes += " bg-zinc-700 text-zinc-400";
    }
    return <span className={classes}>{status.replace('_', ' ')}</span>;
};

const LabelApprovals: React.FC = () => {
    const { currentUser } = useAppState();
    const [bookings, setBookings] = useState<ApprovalBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser) return;
        setLoading(true);
        apiService.fetchLabelBookings(currentUser.id)
            .then(data => {
                const pending = (data || [])
                    .filter((b: Booking) => b.status === 'PENDING_APPROVAL')
                    .map((b: Booking) => ({ ...b, localStatus: 'PENDING' as LocalApprovalStatus }));
                setBookings(pending);
            })
            .catch(err => console.error("Failed to fetch pending bookings:", err))
            .finally(() => setLoading(false));
    }, [currentUser]);

    const handleDecision = (bookingId: string, newStatus: LocalApprovalStatus) => {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, localStatus: newStatus } : b));
        setToastMessage(`Decision saved (mock). Status set to ${newStatus.replace('_', ' ')}.`);
        setTimeout(() => setToastMessage(null), 3000);
    };

    if (loading) {
        return <div className="p-20 text-center text-zinc-500">Loading pending approvals...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-extrabold text-zinc-100">Booking Approvals</h1>
                <p className="text-zinc-400 mt-1">Review and manage booking requests from your roster.</p>
            </div>

            {toastMessage && (
                <div className="fixed top-24 right-6 bg-green-500 text-white font-bold px-4 py-2 rounded-lg shadow-lg animate-fade-in-up">
                    {toastMessage}
                </div>
            )}

            <div className="cardSurface divide-y divide-zinc-800">
                {bookings.length === 0 ? (
                    <p className="p-8 text-center text-zinc-500">No pending approvals.</p>
                ) : (
                    bookings.map(booking => (
                        <div key={booking.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex-grow flex items-center gap-4">
                                <img src={booking.artist?.image_url} alt={booking.artist?.name} className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <p className="font-bold text-zinc-100">{booking.artist?.name || 'Unknown Artist'}</p>
                                    <p className="text-sm text-zinc-400">
                                        Wants to book {booking.stoodio?.name} on {new Date(booking.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-4">
                                <StatusBadge status={booking.localStatus} />
                                {booking.localStatus === 'PENDING' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleDecision(booking.id, 'APPROVED')} className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded" title="Approve"><CheckCircleIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDecision(booking.id, 'REJECTED')} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded" title="Reject"><CloseCircleIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDecision(booking.id, 'CHANGES_REQUESTED')} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded" title="Request Changes"><ClockIcon className="w-5 h-5"/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LabelApprovals;
