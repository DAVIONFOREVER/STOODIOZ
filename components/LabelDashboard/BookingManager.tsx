
import React, { useState } from 'react';
import { CalendarIcon, ClockIcon, HouseIcon, UserPlusIcon } from '../icons';
import type { Booking } from '../../types';

// Simplified view for creating label bookings
const BookingManager: React.FC = () => {
    const [step, setStep] = useState(1);
    
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-zinc-100">Booking Management</h1>
                <button className="bg-orange-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
                    + New Session
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {/* Active Bookings List */}
                    <div className="cardSurface p-6">
                        <h3 className="font-bold text-lg text-zinc-100 mb-4">Upcoming Sessions</h3>
                        <div className="space-y-3">
                            <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-zinc-700 w-12 h-12 rounded-lg flex items-center justify-center">
                                        <CalendarIcon className="w-6 h-6 text-zinc-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-200">Nova - Vocal Tracking</p>
                                        <p className="text-sm text-zinc-400">Patchwerk Studios • Today, 2:00 PM</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold">CONFIRMED</span>
                            </div>
                             <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 flex items-center justify-center text-zinc-500 py-8">
                                No other upcoming sessions.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="cardSurface p-6">
                        <h3 className="font-bold text-lg text-zinc-100 mb-4">Quick Book</h3>
                        <p className="text-sm text-zinc-400 mb-4">Ask Aria to book instantly or use the form.</p>
                        <div className="space-y-3">
                            <input type="text" placeholder="Select Artist..." className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200" />
                            <input type="text" placeholder="Select Studio..." className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200" />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="date" className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200" />
                                <input type="time" className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200" />
                            </div>
                            <button className="w-full bg-zinc-100 text-black font-bold py-3 rounded-lg hover:bg-white transition-colors">
                                Check Availability
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingManager;
