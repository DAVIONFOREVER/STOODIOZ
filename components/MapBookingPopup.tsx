
import React, { useState } from 'react';
import type { Engineer } from '../types';
import { CloseIcon, StarIcon, CogIcon, CalendarIcon } from './icons';

interface MapBookingPopupProps {
    engineer: Engineer;
    onClose: () => void;
    onInitiateBooking: (engineer: Engineer, date: string, time: string) => void;
}

const MapBookingPopup: React.FC<MapBookingPopupProps> = ({ engineer, onClose, onInitiateBooking }) => {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [time, setTime] = useState('14:00');

    const handleSubmit = () => {
        onInitiateBooking(engineer, date, time);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in" role="dialog" aria-modal="true">
            <div className="bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all border border-zinc-700 animate-slide-up">
                <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-100">Request Session</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        {/* FIX: Changed `imageUrl` to `image_url` to match the Engineer type definition. */}
                        <img src={engineer.image_url} alt={engineer.name} className="w-20 h-20 rounded-xl object-cover" />
                        <div>
                            <h3 className="text-2xl font-bold text-orange-400">{engineer.name}</h3>
                            <div className="flex items-center gap-1 text-yellow-400 mt-1">
                                <StarIcon className="w-5 h-5" />
                                {/* FIX: Changed engineer.rating to engineer.rating_overall to match the BaseUser type. */}
                                <span className="font-bold text-lg text-slate-200">{engineer.rating_overall.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 border-t border-zinc-700 pt-4">
                        {engineer.specialties.map(spec => (
                            <span key={spec} className="bg-zinc-700 text-slate-200 text-xs font-medium px-2 py-1 rounded-full">{spec}</span>
                        ))}
                    </div>

                    <div className="mt-6 space-y-4">
                        <div>
                            <label htmlFor="booking-date" className="block text-sm font-medium text-slate-400 mb-1">Select a Date</label>
                            <input
                                type="date"
                                id="booking-date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={today}
                                className="w-full p-2 bg-zinc-700 border-zinc-600 rounded-md text-slate-200"
                            />
                        </div>
                         <div>
                            <label htmlFor="booking-time" className="block text-sm font-medium text-slate-400 mb-1">Select a Time</label>
                            <input
                                type="time"
                                id="booking-time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full p-2 bg-zinc-700 border-zinc-600 rounded-md text-slate-200"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-zinc-800/50 border-t border-zinc-700 rounded-b-2xl">
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                    >
                        <CalendarIcon className="w-5 h-5" />
                        Request & Find Stoodio
                    </button>
                </div>
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default MapBookingPopup;