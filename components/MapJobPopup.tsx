import React from 'react';
import { useBookings } from '../hooks/useBookings';
import type { Booking } from '../types';
import { CloseIcon, CalendarIcon, ClockIcon, DollarSignIcon, RoadIcon } from './icons';
import { useNavigation } from '../hooks/useNavigation';
import { AppView } from '../types';
import { getDisplayName, getProfileImageUrl } from '../constants';

interface MapJobPopupProps {
    job: Booking;
    onClose: () => void;
}

const MapJobPopup: React.FC<MapJobPopupProps> = ({ job, onClose }) => {
    const { navigate } = useNavigation();
    const { acceptJob } = useBookings(navigate);
    
    // FIX: Corrected property 'engineerPayRate' to 'engineer_pay_rate' to match the 'Booking' type definition.
    const payout = Number(job.engineer_pay_rate || 0) * Number(job.duration || 0);
    const coords = job.stoodio?.coordinates;
    const locationLabel = job.stoodio?.location || job.room?.name || 'Remote';

    const openExternalMaps = () => {
        if (!coords) return;
        const lat = Number(coords.lat || coords.latitude);
        const lon = Number(coords.lon || coords.lng || coords.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleAccept = () => {
        acceptJob(job);
        onClose();
    };

    return (
        <div className="w-80 text-left cardSurface -translate-x-1/2 translate-y-[-105%] relative">
             <div className="absolute top-0 right-0 p-2">
                <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="p-4 space-y-3">
                <p className="text-xs font-bold uppercase text-orange-400">Open Session</p>
                <div className="flex items-start gap-3">
                    <img
                        src={getProfileImageUrl(job.stoodio || (job as any).engineer || job.artist || null)}
                        alt={getDisplayName(job.stoodio as any)}
                        className="w-12 h-12 rounded-lg object-cover object-top"
                    />
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-zinc-100">{getDisplayName(job.stoodio as any) || job.stoodio?.name}</h3>
                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Stoodio</p>
                        <p className="text-sm text-zinc-400 truncate">{locationLabel}</p>
                    </div>
                </div>

                <div className="space-y-2 mt-3 text-sm border-t border-zinc-700/50 pt-3">
                    <div className="flex items-center gap-2 text-zinc-300">
                        <CalendarIcon className="w-4 h-4 text-zinc-400" />
                        <span>{new Date(job.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                    </div>
                     <div className="flex items-center gap-2 text-zinc-300">
                        <ClockIcon className="w-4 h-4 text-zinc-400" />
                        {/* FIX: Corrected property 'startTime' to 'start_time' to match the 'Booking' type definition. */}
                        <span>{job.start_time} for {job.duration} hours</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-green-400">
                        <DollarSignIcon className="w-4 h-4" />
                        <span>Payout: ${payout.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            <div className="p-3 bg-zinc-900/50 rounded-b-lg space-y-2">
                <div className="flex gap-2">
                    <button 
                        onClick={handleAccept} 
                        className="flex-1 bg-green-500 text-white font-semibold py-2 rounded-md hover:bg-green-600 transition-colors"
                    >
                        Accept Job
                    </button>
                    {coords && (
                        <button
                            onClick={openExternalMaps}
                            className="px-3 py-2 rounded-md bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
                            title="Open in Maps"
                        >
                            <RoadIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => navigate(AppView.MY_BOOKINGS)}
                    className="w-full text-xs font-semibold py-2 rounded-md bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                    View My Bookings
                </button>
            </div>
        </div>
    );
};

export default MapJobPopup;
