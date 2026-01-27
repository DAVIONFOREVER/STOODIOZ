
import React, { useState, useMemo } from 'react';
// FIX: Import missing types
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

// FIX: Define the missing RadioOption component locally.
const RadioOption: React.FC<{id: string, value: 'REMOTE' | 'IN_STUDIO', label: string, description: string, checked: boolean, onChange: (value: 'REMOTE' | 'IN_STUDIO') => void, disabled?: boolean}> = ({id, value, label, description, checked, onChange, disabled}) => (
    <label htmlFor={id} className={`block p-3 rounded-lg border-2 transition-all ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${checked ? 'bg-orange-500/10 border-orange-500' : 'bg-zinc-800/60 border-zinc-700 hover:border-zinc-500'}`}>
        <input type="radio" name="mixType" id={id} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" disabled={disabled}/>
        <p className={`font-bold ${checked ? 'text-orange-400' : 'text-zinc-100'}`}>{label}</p>
        <p className="text-xs text-zinc-400">{description}</p>
    </label>
);

const MixingRequestModal: React.FC<MixingRequestModalProps> = ({ engineer, onClose, onConfirm, onInitiateInStudio, isLoading }) => {
    const [trackCount, setTrackCount] = useState(1);
    const [notes, setNotes] = useState('');
    const [mixType, setMixType] = useState<'REMOTE' | 'IN_STUDIO'>('REMOTE');

    if (!engineer) {
        // This is a safeguard to prevent crashes if the modal is rendered without an engineer.
        return null;
    }

    const services = engineer.mixing_services;
    const totalCost = useMemo(() => {
        return services ? services.price_per_track * trackCount : 0;
    }, [services, trackCount]);

    if (!services) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const mixingDetails = { type: mixType, track_count: trackCount, notes };
        
        if (mixType === 'IN_STUDIO') {
            onInitiateInStudio(engineer, mixingDetails);
            return;
        }

        const bookingRequest: BookingRequest = {
            date: new Date().toISOString().split('T')[0],
            start_time: 'N/A',
            duration: 0,
            total_cost: totalCost,
            engineer_pay_rate: totalCost, // For remote mixing, engineer gets the full amount (minus platform fee later)
            request_type: BookingRequestType.SPECIFIC_ENGINEER,
            requested_engineer_id: engineer.id,
            mixing_details: mixingDetails
        };
        onConfirm(bookingRequest);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" role="dialog" aria-modal="true">
            <div className="w-full max-w-lg transform animate-slide-up flex flex-col cardSurface">
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
                                // FIX: Ensure value is parsed as an integer to match state type.
                                onChange={(e) => setTrackCount(parseInt(e.target.value, 10) || 1)}
                                className="w-full bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg p-3"
                            />
                        </div>

                        <div>
                            <label htmlFor="notes" className="block text-sm font-semibold text-zinc-400 mb-2">Notes for the Engineer (Optional)</label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg p-3"
                                placeholder="e.g., References to other songs, specific vocal effects, etc."
                            />
                        </div>
                    </div>

                    <div className="p-6 bg-zinc-900/50 border-t border-zinc-700/50 flex justify-between items-center">
                        <div>
                            <p className="text-zinc-400 text-sm">Total Cost</p>
                            <p className="text-orange-400 font-bold text-2xl">${totalCost.toFixed(2)}</p>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="text-white bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-600 disabled:cursor-not-allowed font-bold rounded-lg text-sm px-5 py-3 text-center transition-colors w-48"
                        >
                            {isLoading ? 'Processing...' : 'Proceed to Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MixingRequestModal;
