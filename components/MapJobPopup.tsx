import React from 'react';
import { useBookings } from '../hooks/useBookings';
import type { Booking } from '../types';
import { CloseIcon, CalendarIcon, ClockIcon, DollarSignIcon } from './icons';
import { useNavigation } from '../hooks/useNavigation';
import { AppView } from '../types';

interface MapJobPopupProps {
    job: Booking;
    onClose: () => void;
}

const MapJobPopup: React.FC<MapJobPopupProps> = ({ job, onClose }) => {
    const { navigate } = useNavigation();
    const { acceptJob } = useBookings(navigate);
    
    const payout = job.engineerPayRate * job.duration;

    const handleAccept = () => {
        acceptJob(job);
        onClose();
    };

    return (
        <div className="w-72 text-left cardSurface -translate-x-1/2 translate-y-[-105%] relative">
             <div className="absolute top-0 right-0 p-2">
                <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="p-4">
                <p className="text-xs font-bold uppercase text-orange-400">Open Job</p>
                <h3 className="font-bold text-lg text-zinc-100 mt-1">{job.stoodio?.name}</h3>
                <p className="text-sm text-zinc-400">{job.stoodio?.location}</p>

                <div className="space-y-2 mt-3 text-sm border-t border-zinc-700/50 pt-3">
                    <div className="flex items-center gap-2 text-zinc-300">
                        <CalendarIcon className="w-4 h-4 text-zinc-400" />
                        <span>{new Date(job.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                    </div>
                     <div className="flex items-center gap-2 text-zinc-300">
                        <ClockIcon className="w-4 h-4 text-zinc-400" />
                        <span>{job.startTime} for {job.duration} hours</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-green-400">
                        <DollarSignIcon className="w-4 h-4" />
                        <span>Payout: ${payout.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            <div className="p-3 bg-zinc-900/50 rounded-b-lg">
                <button 
                    onClick={handleAccept} 
                    className="w-full bg-green-500 text-white font-semibold py-2 rounded-md hover:bg-green-600 transition-colors"
                >
                    Accept Job
                </button>
            </div>
        </div>
    );
};

export default MapJobPopup;