



import React, { useState, useMemo } from 'react';
import type { Booking } from '../types';
import { CloseIcon, HeartIcon } from './icons';
import { getProfileImageUrl } from '../constants';

interface TipModalProps {
    booking: Booking;
    onClose: () => void;
    onConfirmTip: (bookingId: string, tipAmount: number) => void;
}

const TipModal: React.FC<TipModalProps> = ({ booking, onClose, onConfirmTip }) => {
    const [tipPercentage, setTipPercentage] = useState<number | null>(20);
    const [customAmount, setCustomAmount] = useState<string>('');

    if (!booking.engineer) {
        // This is an invalid state, but we handle it gracefully by not rendering the modal.
        return null;
    }
    
    const tipOptions = [15, 20, 25];

    // FIX: Corrected property 'engineerPayRate' to 'engineer_pay_rate' to match the 'Booking' type definition.
    const engineerPayout = booking.engineer_pay_rate * booking.duration;

    const finalTipAmount = useMemo(() => {
        if (customAmount) return parseFloat(customAmount) || 0;
        if (tipPercentage && engineerPayout > 0) return (engineerPayout * tipPercentage) / 100;
        return 0;
    }, [customAmount, tipPercentage, engineerPayout]);

    const handleTipSelect = (percentage: number) => {
        setTipPercentage(percentage);
        setCustomAmount('');
    };
    
    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomAmount(e.target.value);
        setTipPercentage(null);
    };

    const handleConfirm = () => {
        if (finalTipAmount > 0) {
            onConfirmTip(booking.id, finalTipAmount);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"  role="dialog" aria-modal="true">
            <div className="w-full max-w-md rounded-2xl overflow-hidden cardSurface shadow-2xl shadow-orange-500/20">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-orange-400">Thank You</p>
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2 mt-1">
                            <HeartIcon className="w-6 h-6 text-pink-400" /> Add a Tip
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 text-center space-y-5">
                    {/* FIX: Changed `imageUrl` to `image_url` to match the Engineer type definition. */}
                    <img src={getProfileImageUrl(booking.engineer)} alt={booking.engineer.name} className="w-24 h-24 rounded-xl object-cover mx-auto mb-4 border-4 border-zinc-700 shadow-lg" />
                    <p className="text-xl font-semibold text-slate-100">Enjoyed your session with {booking.engineer.name}?</p>
                    <p className="text-slate-400 mt-1">Show your appreciation by leaving a tip on their payout of ${engineerPayout.toFixed(2)}.</p>

                    <div className="grid grid-cols-3 gap-3">
                        {tipOptions.map(pct => (
                            <button 
                                key={pct}
                                onClick={() => handleTipSelect(pct)}
                                className={`w-20 py-3 rounded-lg font-bold text-lg transition-colors ${
                                    tipPercentage === pct
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-zinc-700 hover:bg-zinc-600 text-slate-200'
                                }`}
                            >
                               {pct}%
                            </button>
                        ))}
                    </div>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-zinc-700" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-zinc-800 px-2 text-sm text-slate-400">OR</span>
                        </div>
                    </div>
                     
                     <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">$</span>
                        <input
                            type="number"
                            placeholder="Custom Amount"
                            value={customAmount}
                            onChange={handleCustomAmountChange}
                            className="w-full text-center bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500 font-semibold"
                        />
                    </div>

                </div>

                <div className="p-6 bg-black/30 border-t border-white/10 rounded-b-2xl backdrop-blur-sm">
                    <button 
                        onClick={handleConfirm}
                        disabled={finalTipAmount <= 0}
                        className="w-full text-white bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 disabled:text-slate-400 focus:ring-4 focus:outline-none focus:ring-orange-300 font-bold rounded-lg text-lg px-5 py-3.5 text-center transition-all shadow-md"
                    >
                       Add Tip (+${finalTipAmount.toFixed(2)})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TipModal;