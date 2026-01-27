

import React, { useState, useMemo } from 'react';
import { differenceInHours } from 'date-fns';
import type { Booking } from '../types';
import { CloseIcon, TrashIcon } from './icons';

interface BookingCancellationModalProps {
    booking: Booking;
    onClose: () => void;
    onConfirm: (bookingId: string) => void;
}

const BookingCancellationModal: React.FC<BookingCancellationModalProps> = ({ booking, onClose, onConfirm }) => {
    const [isConfirmed, setIsConfirmed] = useState(false);

    const { refundAmount, cancellationFee, policyMessage } = useMemo(() => {
        const bookingStartTime = new Date(`${booking.date}T${booking.start_time}`);
        const hoursUntilSession = differenceInHours(bookingStartTime, new Date());

        let refundPercentage = 0;
        let policyMessage = '';

        if (hoursUntilSession > 48) {
            refundPercentage = 1.0;
            policyMessage = 'Full refund: Session is more than 48 hours away.';
        } else if (hoursUntilSession > 24) {
            refundPercentage = 0.5;
            policyMessage = '50% fee: Session is within 48 hours.';
        } else {
            refundPercentage = 0.0;
            policyMessage = 'Non-refundable: Session is within 24 hours.';
        }

        const refundAmount = booking.total_cost * refundPercentage;
        const cancellationFee = booking.total_cost - refundAmount;

        return { refundAmount, cancellationFee, policyMessage };
    }, [booking]);


    const handleConfirm = () => {
        if (isConfirmed) {
            onConfirm(booking.id);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"  role="dialog" aria-modal="true">
            <div className="w-full max-w-lg transform transition-all cardSurface">
                <div className="p-6 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-100">Cancel Booking</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-slate-300 text-center mb-4">
                        Are you sure you want to cancel your session {booking.stoodio ? <>at <strong className="text-slate-100">{booking.stoodio.name}</strong></> : booking.engineer ? <>with <strong className="text-slate-100">{booking.engineer.name}</strong></> : ''} on {new Date(booking.date + 'T00:00').toLocaleDateString()}?
                    </p>
                    
                    <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                        <h3 className="text-lg font-bold mb-4 flex items-center text-slate-100">Cancellation Summary</h3>
                        <div className="space-y-2 text-sm text-slate-200">
                            <div className="flex justify-between">
                                <span>Total Amount Paid:</span> 
                                <span>${booking.total_cost.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between text-red-400">
                                <span>Cancellation Fee:</span> 
                                <span>-${cancellationFee.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-red-500/20 my-2"></div>
                            <div className="flex justify-between font-bold text-lg text-green-400">
                                <span>Amount to be Refunded:</span> 
                                <span>${refundAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        <p className="text-xs text-center mt-3 text-slate-400">{policyMessage}</p>
                    </div>

                     <div className="mt-6">
                        <label htmlFor="confirm-cancellation" className="flex items-start">
                            <input
                            type="checkbox"
                            id="confirm-cancellation"
                            checked={isConfirmed}
                            onChange={(e) => setIsConfirmed(e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-500 bg-zinc-700 text-orange-500 focus:ring-orange-500 mt-1"
                            />
                            <span className="ml-3 text-sm text-slate-300">
                                I understand the cancellation policy and wish to proceed.
                            </span>
                        </label>
                    </div>

                </div>

                <div className="p-6 bg-zinc-800/50 border-t border-zinc-700 rounded-b-2xl flex justify-end gap-3">
                     <button type="button" onClick={onClose} className="text-slate-300 bg-transparent hover:bg-zinc-700 font-bold rounded-lg text-sm px-5 py-3 text-center transition-colors border border-zinc-600">
                        Keep Booking
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={!isConfirmed}
                        className="text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed font-bold rounded-lg text-sm px-5 py-3 text-center transition-all shadow-md flex items-center gap-2"
                    >
                       <TrashIcon className="w-5 h-5" />
                       Confirm Cancellation
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingCancellationModal;