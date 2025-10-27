
import React, { useState } from 'react';
import type { Engineer, BookingRequest } from '../types';
import { BookingRequestType } from '../types';
import { CloseIcon, SoundWaveIcon } from './icons';
import { SERVICE_FEE_PERCENTAGE } from '../constants';

interface MixingRequestModalProps {
    engineer: Engineer;
    onClose: () => void;
    onConfirm: (bookingRequest: BookingRequest) => void;
    onInitiateInStudio: (engineer: Engineer, mixingDetails: any) => void;
    isLoading: boolean;
}

const MixingRequestModal: React.FC<MixingRequestModalProps> = ({ engineer, onClose, onConfirm, onInitiateInStudio, isLoading }) => {
    const [trackCount, setTrackCount] = useState(1);
    const [notes, setNotes] = useState('');
    
    if (!engineer.mixingServices) return null;

    const subtotal = engineer.mixingServices.pricePerTrack * trackCount;
    const serviceFee = subtotal * SERVICE_FEE_PERCENTAGE;
    const totalCost = subtotal + serviceFee;

    const handleConfirmRemote = () => {
        const bookingRequest: BookingRequest = {
            date: new Date().toISOString().split('T')[0],
            startTime: 'N/A',
            duration: 0,
            totalCost,
            engineerPayRate: engineer.mixingServices!.pricePerTrack * trackCount,
            requestType: BookingRequestType.SPECIFIC_ENGINEER,
            requestedEngineerId: engineer.id,
            mixingDetails: {
                type: 'REMOTE',
                trackCount,
                notes,
            }
        };
        onConfirm(bookingRequest);
    };

    const handleInitiateInStudio = () => {
        onInitiateInStudio(engineer, {
            type: 'IN_STUDIO',
            trackCount,
            notes,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-zinc-800 rounded-2xl shadow-xl w-full max-w-lg border border-zinc-700 animate-slide-up">
                <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-100">Request Mixing Services</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-100"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <img src={engineer.imageUrl} alt={engineer.name} className="w-16 h-16 rounded-xl object-cover" />
                        <div>
                            <p className="text-sm text-slate-400">Mixing Engineer</p>
                            <h3 className="text-2xl font-bold text-orange-400">{engineer.name}</h3>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <p className="text-sm text-slate-300">{engineer.mixingServices.description}</p>
                        <div className="flex items-center gap-4">
                            <label htmlFor="trackCount" className="text-slate-300 font-semibold">Number of Tracks</label>
                            <input type="number" id="trackCount" value={trackCount} onChange={e => setTrackCount(Math.max(1, parseInt(e.target.value)))} min="1" className="w-20 p-2 bg-zinc-700 rounded-md text-center" />
                        </div>
                         <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">Notes for the Engineer (optional)</label>
                            <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full mt-1 p-2 bg-zinc-700 rounded-md" placeholder="e.g., specific references, vocal effects, etc."></textarea>
                        </div>
                    </div>
                     <div className="p-4 mt-4 bg-zinc-900/50 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-400">Subtotal ({trackCount} tracks)</span><span className="text-slate-200">${subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Service Fee</span><span className="text-slate-200">${serviceFee.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-zinc-700"><span className="text-slate-100">Total</span><span className="text-orange-400">${totalCost.toFixed(2)}</span></div>
                    </div>
                </div>
                <div className="p-4 bg-zinc-800/50 border-t border-zinc-700 grid grid-cols-2 gap-4">
                     <button onClick={handleInitiateInStudio} className="w-full bg-zinc-700 text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-zinc-600 transition-all">Book In-Studio Session</button>
                    <button onClick={handleConfirmRemote} disabled={isLoading} className="w-full bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 disabled:bg-slate-600">
                        {isLoading ? 'Processing...' : 'Request Remote Mix'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MixingRequestModal;
