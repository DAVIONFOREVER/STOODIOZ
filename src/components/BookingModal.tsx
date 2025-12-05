
import React, { useState, useMemo, useEffect } from 'react';
import type { BookingRequest, Room, Instrumental, Artist, PaymentSource, LabelBudgetOverview } from '../types';
import { BookingRequestType, UserRole } from '../types';
import { SERVICE_FEE_PERCENTAGE } from '../constants';
import { CloseIcon, CalendarIcon, ClockIcon, DurationIcon, PriceIcon, UserGroupIcon, MusicNoteIcon, BriefcaseIcon, CheckCircleIcon, CloseCircleIcon } from './icons.tsx';
import { useAppState } from '../contexts/AppContext.tsx';
import * as apiService from '../services/apiService';

interface BookingModalProps {
    onClose: () => void;
    onConfirm: (bookingRequest: BookingRequest) => void;
}

const BookingModal: React.FC<BookingModalProps> = (props) => {
    const { onClose, onConfirm } = props;
    const { stoodioz, engineers, producers, currentUser, userRole, isLoading, bookingTime, bookingIntent, selectedStoodio } = useAppState();

    const stoodio = selectedStoodio;

    if (!stoodio || !bookingTime) {
        return null;
    }

    const initialRoom = bookingTime.room;

    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState<string>(bookingTime?.date || bookingIntent?.date || today);
    const [startTime, setStartTime] = useState<string>(bookingTime?.time || bookingIntent?.time || '12:00');
    const [duration, setDuration] = useState<number>(2);
    const [requestType, setRequestType] = useState<BookingRequestType>(
        bookingIntent?.engineer ? BookingRequestType.SPECIFIC_ENGINEER : BookingRequestType.FIND_AVAILABLE
    );
    const [requestedEngineerId, setRequestedEngineerId] = useState<string>(bookingIntent?.engineer?.id || '');
    const [selectedProducerId, setSelectedProducerId] = useState<string>(bookingIntent?.producer?.id || '');
    const [selectedBeats, setSelectedBeats] = useState<Instrumental[]>([]);
    const [addMixing, setAddMixing] = useState<boolean>(!!bookingIntent?.mixingDetails);
    const [mixTrackCount, setMixTrackCount] = useState<number>(bookingIntent?.mixingDetails?.track_count || 1);
    const [includeProducer, setIncludeProducer] = useState<boolean>(!!bookingIntent?.producer && !!bookingIntent?.pullUpFee);
    
    // Payment Source State
    const [paymentSource, setPaymentSource] = useState<PaymentSource>('ARTIST');
    const [labelBudget, setLabelBudget] = useState<LabelBudgetOverview | null>(null);
    const [isCheckingBudget, setIsCheckingBudget] = useState(false);

    const artist = currentUser && userRole === UserRole.ARTIST ? (currentUser as Artist) : null;
    const hasLabel = !!artist?.label_id;

    useEffect(() => {
        if (hasLabel && paymentSource === 'LABEL' && artist?.label_id) {
            setIsCheckingBudget(true);
            apiService.getLabelBudgetOverview(artist.label_id)
                .then(data => setLabelBudget(data))
                .finally(() => setIsCheckingBudget(false));
        }
    }, [hasLabel, paymentSource, artist]);


    const selectedProducer = useMemo(() => {
        return producers.find(p => p.id === selectedProducerId);
    }, [producers, selectedProducerId]);

    const engineerOptions = useMemo(() => {
        const options = [...engineers];
        if (bookingIntent?.engineer && !engineers.find(e => e.id === bookingIntent.engineer!.id)) {
            options.unshift(bookingIntent.engineer);
        }
        return options;
    }, [engineers, bookingIntent]);

    const selectedEngineerForMixing = useMemo(() => {
        if (requestType !== BookingRequestType.SPECIFIC_ENGINEER || !requestedEngineerId) return null;
        return engineerOptions.find(e => e.id === requestedEngineerId);
    }, [requestType, requestedEngineerId, engineerOptions]);

    const canOfferMixing = selectedEngineerForMixing?.mixing_services?.is_enabled;


    const { stoodioCost, engineerFee, serviceFee, totalCost, subtotal, effectivePayRate, beatsCost, pullUpFee, mixingCost } = useMemo(() => {
        const stoodioCost = initialRoom.hourly_rate * duration;
        
        let currentEngineerPayRate = stoodio.engineer_pay_rate;

        if (requestType === BookingRequestType.SPECIFIC_ENGINEER && requestedEngineerId) {
            const inHouseEngineerInfo = stoodio.in_house_engineers?.find(
                e => e.engineer_id === requestedEngineerId
            );
            if (inHouseEngineerInfo) {
                currentEngineerPayRate = inHouseEngineerInfo.pay_rate;
            }
        }

        const engineerFee = requestType !== BookingRequestType.BRING_YOUR_OWN 
            ? currentEngineerPayRate * duration 
            : 0;

        const beatsCost = selectedBeats.reduce((total, beat) => total + beat.price_lease, 0);
        const pullUpFee = (selectedProducer && includeProducer) ? selectedProducer.pull_up_price || 0 : 0;

        const mixingCost = (addMixing && canOfferMixing && selectedEngineerForMixing)
            ? selectedEngineerForMixing.mixing_services!.price_per_track * mixTrackCount
            : 0;

        const subtotal = stoodioCost + engineerFee + beatsCost + pullUpFee + mixingCost;
        const serviceFee = subtotal * SERVICE_FEE_PERCENTAGE;
        const totalCost = subtotal + serviceFee;
        
        return { stoodioCost, engineerFee, serviceFee, totalCost, subtotal, effectivePayRate: currentEngineerPayRate, beatsCost, pullUpFee, mixingCost };
    }, [initialRoom.hourly_rate, stoodio.engineer_pay_rate, stoodio.in_house_engineers, duration, requestType, requestedEngineerId, selectedBeats, selectedProducer, addMixing, mixTrackCount, canOfferMixing, selectedEngineerForMixing, includeProducer]);

    // Label Budget Validation
    const isLabelFundsSufficient = useMemo(() => {
        if (paymentSource !== 'LABEL' || !labelBudget || !labelBudget.budget) return true;
        
        // Check total remaining first
        const remainingTotal = labelBudget.budget.total_budget - labelBudget.budget.amount_spent;
        if (remainingTotal < totalCost) return false;

        // Check artist allocation if applicable
        if (artist) {
             const artistAlloc = labelBudget.artists.find(a => a.artist_id === artist.id);
             if (artistAlloc) {
                 const remainingAlloc = artistAlloc.allocation_amount - artistAlloc.amount_spent;
                 if (remainingAlloc < totalCost) return false;
             }
        }

        return true;
    }, [paymentSource, labelBudget, totalCost, artist]);

    const handleBeatToggle = (beat: Instrumental) => {
        setSelectedBeats(prev => 
            prev.find(b => b.id === beat.id) 
            ? prev.filter(b => b.id !== beat.id) 
            : [...prev, beat]
        );
    };

    const handleConfirmBooking = (e: React.FormEvent) => {
        e.preventDefault();

        const finalMixingDetails = bookingIntent?.mixingDetails || (addMixing && canOfferMixing && selectedEngineerForMixing ? {
            type: 'IN_STUDIO',
            track_count: mixTrackCount,
            notes: '', 
        } : undefined);

        const bookingRequest: BookingRequest = { 
            room: initialRoom,
            date, 
            start_time: startTime, 
            duration, 
            total_cost: totalCost,
            engineer_pay_rate: effectivePayRate,
            request_type: requestType, 
            requested_engineer_id: requestType === BookingRequestType.SPECIFIC_ENGINEER ? requestedEngineerId : undefined,
            producer_id: selectedProducerId || undefined,
            instrumentals_to_purchase: selectedBeats,
            pull_up_fee: (selectedProducer && includeProducer) ? selectedProducer.pull_up_price : undefined,
            mixing_details: finalMixingDetails,
            payment_source: paymentSource // Pass payment source
        };
        onConfirm(bookingRequest);
    };

    const isFormValid = date && startTime && duration > 0 && (requestType !== BookingRequestType.SPECIFIC_ENGINEER || requestedEngineerId) && isLabelFundsSufficient;
    
    React.useEffect(() => {
        if(bookingIntent?.producer?.id !== selectedProducerId) {
            setSelectedBeats([]);
            setIncludeProducer(false);
        }
    }, [selectedProducerId, bookingIntent]);
    
    React.useEffect(() => {
        if(bookingIntent?.mixingDetails) return;
        setAddMixing(false);
    }, [requestedEngineerId, bookingIntent]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" role="dialog" aria-modal="true">
            <div className="w-full max-w-4xl transform animate-slide-up flex flex-col max-h-[90vh] sm:max-h-[85vh] cardSurface" >
                <div className="p-6 border-b border-zinc-700/50 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-100">Book {stoodio.name}</h2>
                        <p className="text-orange-400 font-semibold">{initialRoom.name}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleConfirmBooking} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Booking Details */}
                            <div className="lg:col-span-1 space-y-4">
                                <div>
                                    <label htmlFor="date" className="flex items-center text-sm font-semibold text-zinc-400 mb-2"><CalendarIcon className="w-4 h-4 mr-2" /> Date</label>
                                    <input type="date" id="date" value={date} min={today} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                                </div>
                                <div>
                                    <label htmlFor="startTime" className="flex items-center text-sm font-semibold text-zinc-400 mb-2"><ClockIcon className="w-4 h-4 mr-2" /> Start Time</label>
                                    <input type="time" id="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                                </div>
                                <div>
                                    <label htmlFor="duration" className="flex items-center text-sm font-semibold text-zinc-400 mb-2"><DurationIcon className="w-4 h-4 mr-2" /> Duration (hours)</label>
                                    <input type="number" id="duration" value={duration} min="1" max="12" onChange={e => setDuration(parseInt(e.target.value))} className="w-full bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                                </div>
                            </div>

                            {/* Middle Column: Engineer & Producer Options */}
                             <div className="lg:col-span-1 space-y-4">
                                 <div>
                                    <label className="flex items-center text-sm font-semibold text-zinc-400 mb-2"><UserGroupIcon className="w-4 h-4 mr-2" /> Engineer</label>
                                    <div className="space-y-2">
                                        <RadioOption id="find" value={BookingRequestType.FIND_AVAILABLE} label="Find an Engineer for Me" description="Fastest response. We'll find an available engineer for you." checked={requestType === BookingRequestType.FIND_AVAILABLE} onChange={setRequestType} disabled={!!bookingIntent?.mixingDetails} />
                                        <RadioOption id="specific" value={BookingRequestType.SPECIFIC_ENGINEER} label="Choose a Specific Engineer" description="Send a request to an engineer of your choice." checked={requestType === BookingRequestType.SPECIFIC_ENGINEER} onChange={setRequestType} disabled={!!bookingIntent?.mixingDetails} />
                                        <RadioOption id="byo" value={BookingRequestType.BRING_YOUR_OWN} label="Bring My Own Engineer" description="Book the studio only. No engineer fee." checked={requestType === BookingRequestType.BRING_YOUR_OWN} onChange={setRequestType} disabled={!!bookingIntent?.mixingDetails}/>
                                    </div>
                                </div>
                                {requestType === BookingRequestType.SPECIFIC_ENGINEER && (
                                    <div className="animate-fade-in-fast">
                                        <label htmlFor="engineer-select" className="sr-only">Select Engineer</label>
                                        <select id="engineer-select" value={requestedEngineerId} onChange={e => setRequestedEngineerId(e.target.value)} className="w-full bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" disabled={!!bookingIntent?.mixingDetails}>
                                            <option value="" disabled>-- Select an Engineer --</option>
                                            {engineerOptions.map(engineer => (
                                                <option key={engineer.id} value={engineer.id}>{engineer.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {requestType === BookingRequestType.SPECIFIC_ENGINEER && canOfferMixing && (
                                    <div className="animate-fade-in-fast bg-zinc-800/60 p-3 rounded-lg border border-zinc-700/50 mt-4">
                                        <label className="flex items-center gap-3 p-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                onChange={() => setAddMixing(!addMixing)} 
                                                checked={addMixing}
                                                className="h-4 w-4 rounded border-zinc-500 bg-zinc-800 text-orange-500 focus:ring-orange-500"
                                                disabled={!!bookingIntent?.mixingDetails}
                                            />
                                            <div className="flex-grow">
                                                <p className="font-semibold text-zinc-200">Add In-Studio Mixing</p>
                                                <p className="text-xs text-zinc-400">
                                                    ${selectedEngineerForMixing?.mixing_services?.price_per_track}/track
                                                </p>
                                            </div>
                                        </label>
                                        {addMixing && (
                                            <div className="pl-9 pt-2">
                                                <label htmlFor="mix-track-count" className="block text-sm font-medium text-zinc-400 mb-1">Number of Tracks</label>
                                                <input 
                                                    type="number"
                                                    id="mix-track-count"
                                                    value={mixTrackCount}
                                                    onChange={e => setMixTrackCount(Math.max(1, parseInt(e.target.value) || 1))}
                                                    min="1"
                                                    className="w-full bg-zinc-700/80 border-zinc-600 text-zinc-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500"
                                                    disabled={!!bookingIntent?.mixingDetails}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="bg-zinc-800/60 p-3 rounded-lg border border-zinc-700/50">
                                    <label htmlFor="producer-select" className="flex items-center text-sm font-semibold text-zinc-400 mb-2"><MusicNoteIcon className="w-4 h-4 mr-2" /> Producer (Optional)</label>
                                    <select id="producer-select" value={selectedProducerId} onChange={e => setSelectedProducerId(e.target.value)} className="w-full bg-zinc-700/80 border-zinc-600 text-zinc-200 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                                        <option value="">-- No Producer --</option>
                                        {producers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    
                                    {selectedProducer && (
                                        <div className="mt-3 border-t border-zinc-700 pt-3">
                                            {selectedProducer.pull_up_price && (
                                                <label className="flex items-center gap-3 p-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        onChange={() => setIncludeProducer(!includeProducer)} 
                                                        checked={includeProducer}
                                                        className="h-4 w-4 rounded border-zinc-500 bg-zinc-800 text-orange-500 focus:ring-orange-500"
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-zinc-200">Include {selectedProducer.name} in Session (Pull Up)</p>
                                                        <p className="text-xs text-zinc-400">
                                                            Adds a ${selectedProducer.pull_up_price} fee for the producer's time.
                                                        </p>
                                                    </div>
                                                </label>
                                            )}
                                            {selectedProducer.instrumentals.length > 0 && (
                                                <div className="space-y-2 mt-3 max-h-48 overflow-y-auto border-t border-zinc-700 pt-3">
                                                    {selectedProducer.instrumentals.map(beat => (
                                                        <label key={beat.id} className="flex items-center gap-3 p-2 bg-zinc-700/50 rounded-md cursor-pointer">
                                                            <input type="checkbox" onChange={() => handleBeatToggle(beat)} checked={selectedBeats.some(b => b.id === beat.id)} className="h-4 w-4 rounded border-zinc-500 bg-zinc-800 text-orange-500 focus:ring-orange-500"/>
                                                            <div className="flex-grow">
                                                                <p className="text-sm font-semibold text-zinc-200">{beat.title}</p>
                                                                <p className="text-xs text-zinc-400">{beat.genre}</p>
                                                            </div>
                                                            <p className="text-sm font-bold text-green-400">${beat.price_lease.toFixed(2)}</p>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Cost Summary */}
                            <div className="lg:col-span-1">
                                {hasLabel && (
                                    <div className="bg-zinc-800/80 p-4 rounded-lg border border-zinc-700 mb-4">
                                        <h3 className="text-sm font-bold text-zinc-200 mb-3 flex items-center gap-2"><BriefcaseIcon className="w-4 h-4 text-blue-400"/> Payment Source</h3>
                                        <div className="space-y-2">
                                            <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${paymentSource === 'ARTIST' ? 'bg-orange-500/10 border-orange-500' : 'bg-zinc-900/50 border-zinc-700 hover:border-zinc-500'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input type="radio" name="paymentSource" checked={paymentSource === 'ARTIST'} onChange={() => setPaymentSource('ARTIST')} className="sr-only" />
                                                    <span className={`font-semibold text-sm ${paymentSource === 'ARTIST' ? 'text-orange-400' : 'text-zinc-300'}`}>Artist Pays</span>
                                                </div>
                                            </label>
                                            <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${paymentSource === 'LABEL' ? 'bg-blue-500/10 border-blue-500' : 'bg-zinc-900/50 border-zinc-700 hover:border-zinc-500'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input type="radio" name="paymentSource" checked={paymentSource === 'LABEL'} onChange={() => setPaymentSource('LABEL')} className="sr-only" />
                                                    <span className={`font-semibold text-sm ${paymentSource === 'LABEL' ? 'text-blue-400' : 'text-zinc-300'}`}>Label Pays</span>
                                                </div>
                                            </label>
                                        </div>

                                        {paymentSource === 'LABEL' && (
                                            <div className={`mt-3 p-3 rounded-md text-xs font-medium border ${isCheckingBudget ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : isLabelFundsSufficient ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                                                {isCheckingBudget ? (
                                                    <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div> Checking Budget...</span>
                                                ) : isLabelFundsSufficient ? (
                                                    <span className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4" /> Label funds available.</span>
                                                ) : (
                                                    <span className="flex items-center gap-2"><CloseCircleIcon className="w-4 h-4" /> Insufficient label funds.</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20 sticky top-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center text-zinc-100"><PriceIcon className="w-5 h-5 mr-2 text-orange-400" />Cost Summary</h3>
                                    <div className="space-y-2 text-sm text-zinc-200">
                                        <div className="flex justify-between"><span>{initialRoom.name} ({duration} hrs)</span> <span>${stoodioCost.toFixed(2)}</span></div>
                                        <div className={`flex justify-between ${requestType === BookingRequestType.BRING_YOUR_OWN ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                                            <span>Engineer Fee ({duration} hrs at ${effectivePayRate}/hr)</span>
                                            <span>${engineerFee.toFixed(2)}</span>
                                        </div>
                                         {pullUpFee > 0 && (
                                            <div className="flex justify-between text-zinc-300">
                                                <span>{selectedProducer?.name} "Pull Up" Fee</span>
                                                <span>${pullUpFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {beatsCost > 0 && (
                                            <div className="flex justify-between text-zinc-300">
                                                <span>Instrumental Leases ({selectedBeats.length})</span>
                                                <span>${beatsCost.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {mixingCost > 0 && (
                                            <div className="flex justify-between text-zinc-300">
                                                <span>Mixing ({mixTrackCount} tracks)</span>
                                                <span>${mixingCost.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="border-t border-orange-500/20 my-1 opacity-50"></div>
                                        <div className="flex justify-between font-semibold text-zinc-300"><span>Subtotal</span> <span>${subtotal.toFixed(2)}</span></div>
                                        <div className="flex justify-between text-zinc-300"><span>Service Fee ({ (SERVICE_FEE_PERCENTAGE * 100).toFixed(0) }%)</span> <span>+ ${serviceFee.toFixed(2)}</span></div>
                                        <div className="border-t border-orange-500/20 my-2"></div>
                                        <div className="flex justify-between font-bold text-lg"><span>Total</span> <span className="text-orange-400">${totalCost.toFixed(2)}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-zinc-900/50 border-t border-zinc-700/50 rounded-b-2xl flex justify-end flex-shrink-0">
                        <button type="button" onClick={onClose} className="text-zinc-300 bg-transparent hover:bg-zinc-700 font-bold rounded-lg text-sm px-5 py-3 text-center mr-2 transition-colors border border-zinc-600">
                            Cancel
                        </button>
                        <button type="submit" disabled={!isFormValid || isLoading} className="text-white bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed focus:ring-4 focus:outline-none focus:ring-orange-500/50 font-bold rounded-lg text-sm px-5 py-3 text-center transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 w-48">
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
                @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in-fast { animation: fade-in-fast 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

const RadioOption: React.FC<{id: string, value: BookingRequestType, label: string, description: string, checked: boolean, onChange: (value: BookingRequestType) => void, disabled?: boolean}> = ({id, value, label, description, checked, onChange, disabled}) => (
    <label htmlFor={id} className={`block p-3 rounded-lg border-2 transition-all ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${checked ? 'bg-orange-500/10 border-orange-500' : 'bg-zinc-800/60 border-zinc-700 hover:border-zinc-500'}`}>
        <input type="radio" name="requestType" id={id} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" disabled={disabled}/>
        <p className={`font-bold ${checked ? 'text-orange-400' : 'text-zinc-100'}`}>{label}</p>
        <p className="text-xs text-zinc-400">{description}</p>
    </label>
);

export default BookingModal;
