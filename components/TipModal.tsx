
import React, { useState } from 'react';
import type { Booking } from '../types';
import { CloseIcon, StarIcon } from './icons';

interface TipModalProps {
    booking: Booking;
    onClose: () => void;
    onConfirmTip: (bookingId: string, tipAmount: number, rating: number, comment: string) => void;
}

const TipModal: React.FC<TipModalProps> = ({ booking, onClose, onConfirmTip }) => {
    const [tipAmount, setTipAmount] = useState(20);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const tipPercentages = [0.15, 0.20, 0.25];

    const targetName = booking.engineer?.name || booking.producer?.name || 'the professional';

    const handleConfirm = () => {
        onConfirmTip(booking.id, tipAmount, rating, comment);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-zinc-800 rounded-2xl shadow-xl w-full max-w-md border border-zinc-700 animate-slide-up">
                <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-100">Rate & Tip {targetName}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-100"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-center text-slate-200 mb-2">Rate Your Session</h3>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => setRating(star)}>
                                    <StarIcon className={`w-10 h-10 transition-colors ${rating >= star ? 'text-yellow-400 fill-current' : 'text-slate-500'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-slate-300 mb-1">Leave a review (optional)</label>
                        <textarea id="comment" value={comment} onChange={e => setComment(e.target.value)} rows={3} className="w-full mt-1 p-2 bg-zinc-700 rounded-md" placeholder={`How was your session with ${targetName}?`}></textarea>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-200 mb-2">Add a Tip</h3>
                        <div className="flex justify-around items-center gap-2 mb-2">
                            {tipPercentages.map(percent => (
                                <button key={percent} onClick={() => setTipAmount(booking.totalCost * percent)} className="bg-zinc-700 hover:bg-zinc-600 text-slate-200 font-semibold py-2 px-4 rounded-lg transition-colors">
                                    {percent * 100}%
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <input type="number" value={tipAmount.toFixed(0)} onChange={e => setTipAmount(Number(e.target.value))} className="w-full pl-7 p-2 bg-zinc-700 rounded-md text-center font-bold text-xl" />
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-zinc-800/50 border-t border-zinc-700">
                    <button onClick={handleConfirm} className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-all">
                        Confirm Tip of ${tipAmount.toFixed(2)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TipModal;
