import React from 'react';
import type { Booking } from '../types';
import { AppView } from '../types';
import { CalendarIcon, ClockIcon, HouseIcon, ChevronRightIcon, SoundWaveIcon } from './icons';

interface BookingContextCardProps {
    booking: Booking;
    onNavigate: (view: AppView) => void;
}

const BookingContextCard: React.FC<BookingContextCardProps> = ({ booking, onNavigate }) => {
    
    const handleViewBooking = () => {
        // This is a simplified navigation. A real implementation might need to
        // also set the selected booking in the parent state before navigating.
        onNavigate(AppView.MY_BOOKINGS);
    }

    const isRemoteMix = booking.mixingDetails?.type === 'REMOTE';
    const imageUrl = isRemoteMix ? booking.engineer?.imageUrl : booking.stoodio?.imageUrl;
    const title = isRemoteMix ? `Remote Mix: ${booking.engineer?.name}` : booking.stoodio?.name;

    return (
        <div className="bg-zinc-800/70 p-3 rounded-xl border border-zinc-700/50 mb-4 mx-0">
            <p className="text-xs font-bold text-orange-400 uppercase mb-2">Booking Details</p>
            <div className="flex items-center gap-4">
                <img src={imageUrl} alt={title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-grow space-y-1 text-sm overflow-hidden">
                    <p className="font-bold text-zinc-200 flex items-center gap-2 truncate">
                         {isRemoteMix ? <SoundWaveIcon className="w-4 h-4 flex-shrink-0" /> : <HouseIcon className="w-4 h-4 flex-shrink-0" />} 
                         {title}
                    </p>
                    <p className="text-zinc-400 flex items-center gap-2"><CalendarIcon className="w-4 h-4 flex-shrink-0" /> {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                    {booking.startTime !== 'N/A' && (
                        <p className="text-zinc-400 flex items-center gap-2"><ClockIcon className="w-4 h-4 flex-shrink-0" /> {booking.startTime} for {booking.duration} hours</p>
                    )}
                </div>
                <button onClick={handleViewBooking} className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-semibold p-2 rounded-full transition-colors flex-shrink-0">
                    <ChevronRightIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
    );
};

export default BookingContextCard;