
import React from 'react';
import type { Booking } from '../types';
import { CloseIcon, TrashIcon } from './icons';

interface BookingCancellationModalProps {
    booking: Booking;
    onClose: () => void;
    onConfirm: (bookingId: string) => void;
}

const BookingCancellationModal: React.FC<BookingCancellationModalProps> = ({ booking, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-zinc-800 rounded-2xl shadow-xl w-full max-w-md border border-zinc-700 animate-slide-up">
                <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-red-400">Cancel Booking</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-100"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6">
                    <p className="text-slate-300">Are you sure you want to cancel your session at <strong className="text-slate-100">{booking.stoodio?.name}</strong> on {new Date(booking.date + 'T00:00:00').toLocaleDateString()} at {booking.startTime}?</p>
                    <p className="text-sm text-yellow-400 bg-yellow-500/10 p-3 rounded-lg mt-4">Please note: Cancellations may be subject to a fee depending on the studio's policy and how close it is to the session date.</p>
                </div>
                <div className="p-4 bg-zinc-800/50 border-t border-zinc-700 flex gap-4">
                    <button onClick={onClose} className="w-full bg-zinc-700 text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-zinc-600 transition-all">
                        Keep Booking
                    </button>
                    <button onClick={() => onConfirm(booking.id)} className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                        <TrashIcon className="w-5 h-5" />
                        Yes, Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingCancellationModal;
