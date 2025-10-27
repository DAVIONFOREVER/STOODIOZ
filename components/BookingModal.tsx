
import React, { useState } from 'react';
import { BookingRequestType, type BookingRequest, type Instrumental, type Engineer, type Producer } from '../types';
import { useAppState } from '../contexts/AppContext';
import { CloseIcon, CalendarIcon, ClockIcon, UsersIcon, SoundWaveIcon, MusicNoteIcon } from './icons';

interface BookingModalProps {
    onClose: () => void;
    onConfirm: (bookingRequest: BookingRequest) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ onClose, onConfirm }) => {
    const { bookingTime, selectedStoodio, currentUser, bookingIntent, engineers, producers } = useAppState();
    const [duration, setDuration] = useState(2);
    const [requestType, setRequestType] = useState(bookingIntent?.engineer ? BookingRequestType.SPECIFIC_ENGINEER : BookingRequestType.FIND_AVAILABLE);
    const [selectedEngineerId, setSelectedEngineerId] = useState(bookingIntent?.engineer?.id || '');
    const [selectedInstrumentals, setSelectedInstrumentals] = useState<Instrumental[]>([]);
    
    if (!bookingTime || !selectedStoodio || !currentUser) return null;

    const { date, time, room } = bookingTime;

    const inHouseEngineers = (selectedStoodio.inHouseEngineers || [])
        .map(info => engineers.find(e => e.id === info.engineerId))
        .filter((e): e is Engineer => !!e);
    
    const producer = bookingIntent?.producer;
    const requestedEngineer = bookingIntent?.engineer;
    const engineerPayRate = selectedEngineerId ? (inHouseEngineers.find(e => e.id === selectedEngineerId) ? selectedStoodio.engineerPayRate : 0) : selectedStoodio.engineerPayRate;
    const roomCost = room.hourlyRate * duration;
    const engineerCost = (requestType === BookingRequestType.BRING_YOUR_OWN) ? 0 : engineerPayRate * duration;
    const producerCost = producer ? (producer.pullUpPrice || 0) : 0;
    const instrumentalsCost = selectedInstrumentals.reduce((sum, beat) => sum + beat.priceLease, 0);
    const totalCost = roomCost + engineerCost + producerCost + instrumentalsCost;

    const handleSubmit = () => {
        const bookingRequest: BookingRequest = {
            date,
            startTime: time,
            duration,
            totalCost,
            requestType,
            requestedEngineerId: requestType === BookingRequestType.SPECIFIC_ENGINEER ? selectedEngineerId : (requestedEngineer?.id || undefined),
            engineerPayRate,
            room,
            producerId: producer?.id,
            instrumentalsToPurchase: selectedInstrumentals,
            pullUpFee: producer?.pullUpPrice,
            mixingDetails: bookingIntent?.mixingDetails,
        };
        onConfirm(bookingRequest);
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-zinc-800 rounded-2xl shadow-xl w-full max-w-lg border border-zinc-700 animate-slide-up">
                <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-100">Confirm Your Booking</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-100"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-orange-400">{selectedStoodio.name} - {room.name}</h3>
                    <div className="flex items-center gap-4 my-4 text-slate-300">
                        <span className="flex items-center gap-2"><CalendarIcon className="w-5 h-5" /> {date}</span>
                        <span className="flex items-center gap-2"><ClockIcon className="w-5 h-5" /> {time}</span>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-slate-300">Duration (hours)</label>
                            <input type="number" id="duration" value={duration} onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value, 10)))} min="1" className="w-full mt-1 p-2 bg-zinc-700 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Engineer Option</label>
                            <select value={requestType} onChange={(e) => setRequestType(e.target.value as BookingRequestType)} className="w-full mt-1 p-2 bg-zinc-700 rounded-md">
                                <option value={BookingRequestType.FIND_AVAILABLE}>Assign an available engineer</option>
                                <option value={BookingRequestType.SPECIFIC_ENGINEER}>Request a specific engineer</option>
                                <option value={BookingRequestType.BRING_YOUR_OWN}>I'm bringing my own engineer</option>
                            </select>
                        </div>
                        {requestType === BookingRequestType.SPECIFIC_ENGINEER && (
                             <div>
                                <label className="block text-sm font-medium text-slate-300">Select Engineer</label>
                                <select value={selectedEngineerId} onChange={(e) => setSelectedEngineerId(e.target.value)} className="w-full mt-1 p-2 bg-zinc-700 rounded-md">
                                    <option value="">Choose an engineer...</option>
                                    {inHouseEngineers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                        )}
                        {producer && (
                            <div className="bg-zinc-700/50 p-3 rounded-lg">
                                <p className="text-sm font-medium text-slate-300">Producer Add-on</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <MusicNoteIcon className="w-5 h-5 text-purple-400" />
                                    <p className="font-semibold text-slate-100">{producer.name}</p>
                                    <p className="ml-auto font-bold text-green-400">${producer.pullUpPrice?.toFixed(2)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-6 bg-zinc-900/50 rounded-b-2xl space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Room Cost ({duration} hrs)</span><span className="text-slate-200">${roomCost.toFixed(2)}</span></div>
                    {requestType !== BookingRequestType.BRING_YOUR_OWN && <div className="flex justify-between"><span className="text-slate-400">Engineer Cost</span><span className="text-slate-200">${engineerCost.toFixed(2)}</span></div>}
                    {producerCost > 0 && <div className="flex justify-between"><span className="text-slate-400">Producer Fee</span><span className="text-slate-200">${producerCost.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-zinc-700"><span className="text-slate-100">Total</span><span className="text-orange-400">${totalCost.toFixed(2)}</span></div>
                </div>
                <div className="p-4 bg-zinc-800/50 border-t border-zinc-700">
                    <button onClick={handleSubmit} className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-all">Proceed to Payment</button>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
