import React, { useState, useMemo } from 'react';
import type { Engineer, BookingRequest, MixingDetails } from '../types';
import { BookingRequestType } from '../types';
import { CloseIcon } from './icons';

interface MixingRequestModalProps {
    engineer: Engineer;
    onClose: () => void;
    onConfirm: (bookingRequest: BookingRequest) => void;
    onInitiateInStudio: (engineer: Engineer, mixingDetails: MixingDetails) => void;
    isLoading: boolean;
}

const MixingRequestModal: React.FC<MixingRequestModalProps> = ({ engineer, onClose, onConfirm, onInitiateInStudio, isLoading }) => {
    const [trackCount, setTrackCount] = useState(1);
    const [notes, setNotes] = useState('');
    const [mixType, setMixType] = useState<'REMOTE' | 'IN_STUDIO'>('REMOTE');

    const services = engineer.mixingServices;
    const totalCost = useMemo(() => {
        return services ? services.pricePerTrack * trackCount : 0;
    }, [services, trackCount]);

    if (!services) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const mixingDetails = { type: mixType, trackCount, notes };
        
        if (mixType === 'IN_STUDIO') {
            onInitiateInStudio(engineer, mixingDetails);
            return;
        }

        const bookingRequest: BookingRequest = {
            date: new Date().toISOString().split('T')[0],
            startTime: 'N/A',
            duration: 0,
            totalCost,
            engineerPayRate: totalCost, // For remote mixing, engineer gets the full amount (minus platform fee later)
            requestType: BookingRequestType.SPECIFIC_ENGINEER,
            requestedEngineerId: engineer.id,
            mixingDetails
        };
        onConfirm(bookingRequest);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" role="dialog" aria-modal="true">
            <div className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-lg transform animate-slide-up border border-zinc-700/50 flex flex-col">
                <div className="p-6 border-b border-zinc-700/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-100">Request Mix from {engineer.name}</h2>
                        <p className="text-orange-400 font-semibold">{services.description}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-zinc-400 mb-2">Mixing Type</label>
                            <div className="flex gap-2">
                                <RadioOption id="remote" value="REMOTE" label="Remote Session" description="Send files via chat." checked={mixType === 'REMOTE'} onChange={setMixType} />
                                <RadioOption id="in-studio" value="IN_STUDIO" label="In-Studio Session" description="Book a studio to attend." checked={mixType === 'IN_STUDIO'} onChange={setMixType} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="trackCount" className="block text-sm font-semibold text-zinc-400 mb-2">Number of Tracks to Mix</label>
                            <input
                                type="number"
                                id="trackCount"
                                value={trackCount}
                                min="1"
                                onChange={(e) => setTrackCount(parseInt(e.target.value))}
                                className="w-full bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg p-3"
                            />
                        </div>

                        <div>
                            <label htmlFor="notes" className="block text-sm font-semibold text-zinc-400 mb-2">Notes for {engineer.name} (optional)</label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg p-3"
                                placeholder="e.g., Reference tracks, specific requests..."
                            />
                        </div>
                        
                        {mixType === 'REMOTE' && (
                             <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total Cost</span>
                                    <span className="text-orange-400">${totalCost.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                    </div>
                    <div className="p-4 bg-zinc-900/50 border-t border-zinc-700/50 rounded-b-2xl flex justify-end">
                        <button type="submit" disabled={isLoading} className="text-white bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-600 font-bold rounded-lg text-sm px-5 py-3 text-center transition-all w-48">
                            {isLoading ? 'Requesting...' : (mixType === 'REMOTE' ? 'Send Request' : 'Next: Find Stoodio')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RadioOption: React.FC<{id: string, value: 'REMOTE' | 'IN_STUDIO', label: string, description: string, checked: boolean, onChange: (value: 'REMOTE' | 'IN_STUDIO') => void}> = ({id, value, label, description, checked, onChange}) => (
    <label htmlFor={id} className={`w-full block p-3 rounded-lg border-2 transition-all cursor-pointer ${checked ? 'bg-orange-500/10 border-orange-500' : 'bg-zinc-800/60 border-zinc-700 hover:border-zinc-500'}`}>
        <input type="radio" name="mixType" id={id} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" />
        <p className={`font-bold ${checked ? 'text-orange-400' : 'text-zinc-100'}`}>{label}</p>
        <p className="text-xs text-zinc-400">{description}</p>
    </label>
);

export default MixingRequestModal;