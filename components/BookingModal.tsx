import React, { useState, useMemo } from 'react';
import type { Stoodio, Engineer, BookingRequest } from '../types';
import { BookingRequestType } from '../types';
import { SERVICE_FEE_PERCENTAGE } from '../constants';
import { CloseIcon, CalendarIcon, ClockIcon, DurationIcon, PriceIcon, UserGroupIcon } from './icons';

interface BookingModalProps {
    stoodio: Stoodio;
    engineers: Engineer[];
    onClose: () => void;
    onConfirm: (bookingRequest: BookingRequest) => void;
    isLoading: boolean;
    initialDate?: string;
    initialTime?: string;
    initialEngineer?: Engineer;
}

const BookingModal: React.FC<BookingModalProps> = ({ stoodio, engineers, onClose, onConfirm, isLoading, initialDate, initialTime, initialEngineer }) => {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState<string>(initialDate || today);
    const [startTime, setStartTime] = useState<string>(initialTime || '12:00');
    const [duration, setDuration] = useState<number>(2);
    const [requestType, setRequestType] = useState<BookingRequestType>(
        initialEngineer ? BookingRequestType.SPECIFIC_ENGINEER : BookingRequestType.FIND_AVAILABLE
    );
    const [requestedEngineerId, setRequestedEngineerId] = useState<string>(initialEngineer?.id || '');

    const { stoodioCost, engineerFee, serviceFee, totalCost } = useMemo(() => {
        const stoodioCost = stoodio.hourlyRate * duration;
        const engineerFee = requestType !== BookingRequestType.BRING_YOUR_OWN ? stoodio.engineerPayRate * duration : 0;
        // The service fee is now calculated only on the studio's portion of the booking.
        const serviceFee = stoodioCost * SERVICE_FEE_PERCENTAGE;
        const totalCost = stoodioCost + engineerFee + serviceFee;
        return { stoodioCost, engineerFee, serviceFee, totalCost };
    }, [stoodio.hourlyRate, stoodio.engineerPayRate, duration, requestType]);

    const handleConfirmBooking = (e: React.FormEvent) => {
        e.preventDefault();
        const bookingRequest: BookingRequest = { 
            date, 
            startTime, 
            duration, 
            totalCost,
            engineerPayRate: stoodio.engineerPayRate,
            requestType, 
            requestedEngineerId: requestType === BookingRequestType.SPECIFIC_ENGINEER ? requestedEngineerId : undefined 
        };
        onConfirm(bookingRequest);
    };

    const isFormValid = date && startTime && duration > 0 && (requestType !== BookingRequestType.SPECIFIC_ENGINEER || requestedEngineerId);

    const engineerOptions = useMemo(() => {
        const options = [...engineers];
        if (initialEngineer && !engineers.find(e => e.id === initialEngineer.id)) {
            options.unshift(initialEngineer);
        }
        return options;
    }, [engineers, initialEngineer]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl transform animate-slide-up border border-zinc-700" role="dialog" aria-modal="true">
                <div className="p-6 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-100">Book {stoodio.name}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleConfirmBooking}>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Date, Time, Duration */}
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="date" className="flex items-center text-sm font-semibold text-slate-400 mb-2"><CalendarIcon className="w-4 h-4 mr-2" /> Date</label>
                                <input type="date" id="date" value={date} min={today} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500" />
                            </div>
                            <div>
                                <label htmlFor="startTime" className="flex items-center text-sm font-semibold text-slate-400 mb-2"><ClockIcon className="w-4 h-4 mr-2" /> Start Time</label>
                                <input type="time" id="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500" />
                            </div>
                            <div>
                                <label htmlFor="duration" className="flex items-center text-sm font-semibold text-slate-400 mb-2"><DurationIcon className="w-4 h-4 mr-2" /> Duration (hours)</label>
                                <input type="number" id="duration" value={duration} min="1" max="12" onChange={e => setDuration(parseInt(e.target.value))} className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500" />
                            </div>
                        </div>

                        {/* Right Column: Engineer Options */}
                        <div className="space-y-4">
                             <div>
                                <label className="flex items-center text-sm font-semibold text-slate-400 mb-2"><UserGroupIcon className="w-4 h-4 mr-2" /> Engineer</label>
                                <div className="space-y-2">
                                    <RadioOption id="find" value={BookingRequestType.FIND_AVAILABLE} label="Find an Engineer for Me" description="Fastest response. We'll find an available engineer for you." checked={requestType === BookingRequestType.FIND_AVAILABLE} onChange={setRequestType} disabled={!!initialEngineer} />
                                    <RadioOption id="specific" value={BookingRequestType.SPECIFIC_ENGINEER} label="Choose a Specific Engineer" description="Send a request to an engineer of your choice." checked={requestType === BookingRequestType.SPECIFIC_ENGINEER} onChange={setRequestType} disabled={!!initialEngineer} />
                                    <RadioOption id="byo" value={BookingRequestType.BRING_YOUR_OWN} label="Bring My Own Engineer" description="Book the studio only. No engineer fee." checked={requestType === BookingRequestType.BRING_YOUR_OWN} onChange={setRequestType} disabled={!!initialEngineer}/>
                                </div>
                            </div>
                            {requestType === BookingRequestType.SPECIFIC_ENGINEER && (
                                <div className="animate-fade-in-fast">
                                    <label htmlFor="engineer-select" className="sr-only">Select Engineer</label>
                                    <select id="engineer-select" value={requestedEngineerId} onChange={e => setRequestedEngineerId(e.target.value)} className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-70" disabled={!!initialEngineer}>
                                        <option value="" disabled>-- Select an Engineer --</option>
                                        {engineerOptions.map(engineer => (
                                            <option key={engineer.id} value={engineer.id}>{engineer.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Cost Summary */}
                    <div className="px-6 pb-6">
                        <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20">
                            <h3 className="text-lg font-bold mb-4 flex items-center text-slate-100"><PriceIcon className="w-5 h-5 mr-2 text-orange-400" />Cost Summary</h3>
                            <div className="space-y-2 text-sm text-slate-200">
                                <div className="flex justify-between"><span>Stoodio Time ({duration} hrs)</span> <span>${stoodioCost.toFixed(2)}</span></div>
                                <div className={`flex justify-between ${requestType === BookingRequestType.BRING_YOUR_OWN ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                    <span>Engineer Fee ({duration} hrs at ${stoodio.engineerPayRate}/hr)</span>
                                    <span>${engineerFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-300"><span>Service Fee</span> <span>${serviceFee.toFixed(2)}</span></div>
                                <div className="border-t border-orange-500/20 my-2"></div>
                                <div className="flex justify-between font-bold text-lg"><span>Total</span> <span className="text-orange-400">${totalCost.toFixed(2)}</span></div>
                            </div>
                        </div>
                    </div>


                    <div className="p-6 bg-zinc-800/50 border-t border-zinc-700 rounded-b-xl flex justify-end">
                        <button type="button" onClick={onClose} className="text-slate-300 bg-transparent hover:bg-zinc-700 font-bold rounded-lg text-sm px-5 py-3 text-center mr-2 transition-colors border border-zinc-600">
                            Cancel
                        </button>
                        <button type="submit" disabled={!isFormValid || isLoading} className="text-white bg-orange-500 hover:bg-orange-600 disabled:bg-slate-500 disabled:text-slate-300 disabled:cursor-not-allowed focus:ring-4 focus:outline-none focus:ring-orange-300 font-bold rounded-lg text-sm px-5 py-3 text-center transition-all shadow-md hover:shadow-lg w-48">
                             {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Requesting...
                                </div>
                            ) : 'Request Session'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
                .animate-fade-in-fast { animation: fade-in-fast 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

const RadioOption: React.FC<{id: string, value: BookingRequestType, label: string, description: string, checked: boolean, onChange: (value: BookingRequestType) => void, disabled?: boolean}> = ({id, value, label, description, checked, onChange, disabled}) => (
    <label htmlFor={id} className={`block p-3 rounded-lg border-2 transition-all ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${checked ? 'bg-orange-500/10 border-orange-500' : 'bg-zinc-700/50 border-zinc-600 hover:border-zinc-500'}`}>
        <input type="radio" name="requestType" id={id} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" disabled={disabled}/>
        <p className={`font-bold ${checked ? 'text-orange-400' : 'text-slate-100'}`}>{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
    </label>
);

export default BookingModal;