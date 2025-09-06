import React from 'react';
import type { Booking, Location, Engineer } from '../types';
import { BookingStatus, BookingRequestType } from '../types';
import { CalendarIcon, ClockIcon, LocationIcon, RoadIcon, TrashIcon } from './icons';

interface MyBookingsProps {
    bookings: Booking[];
    engineers: Engineer[];
    onOpenTipModal: (booking: Booking) => void;
    onNavigateToStudio: (location: Location) => void;
    onOpenCancelModal: (booking: Booking) => void;
}

const MyBookings: React.FC<MyBookingsProps> = ({ bookings, engineers, onOpenTipModal, onNavigateToStudio, onOpenCancelModal }) => {

    const getStatusAndEngineer = (booking: Booking) => {
        const requestedEngineer = booking.requestedEngineerId ? engineers.find(e => e.id === booking.requestedEngineerId) : null;
        switch (booking.status) {
            case BookingStatus.PENDING:
                return { statusText: 'Searching for an engineer...', statusColor: 'text-yellow-400 animate-pulse', engineerName: null };
            case BookingStatus.PENDING_APPROVAL:
                return { statusText: `Awaiting approval from ${requestedEngineer?.name}...`, statusColor: 'text-yellow-400', engineerName: null };
            case BookingStatus.CONFIRMED:
                if (booking.requestType === BookingRequestType.BRING_YOUR_OWN) {
                     return { statusText: 'Confirmed (BYO Engineer)', statusColor: 'text-green-400', engineerName: 'Provided by you' };
                }
                return { statusText: 'Confirmed', statusColor: 'text-green-400', engineerName: `with ${booking.engineer?.name}` };
            case BookingStatus.COMPLETED:
                const engineerName = booking.requestType === BookingRequestType.BRING_YOUR_OWN ? 'Provided by you' : `with ${booking.engineer?.name}`;
                return { statusText: 'Session Completed', statusColor: 'text-green-400', engineerName };
            case BookingStatus.CANCELLED:
                return { statusText: 'Cancelled', statusColor: 'text-red-400', engineerName: null };
            default:
                return { statusText: booking.status, statusColor: 'text-slate-400', engineerName: null };
        }
    };

    return (
        <div>
            <h1 className="text-5xl font-extrabold text-center mb-2 tracking-tight text-orange-500">My Bookings</h1>
            <p className="text-center text-lg text-slate-500 mb-12">Here are your upcoming and past stoodio sessions.</p>
            {bookings.length === 0 ? (
                <div className="text-center py-16 bg-zinc-800 rounded-lg border border-zinc-700">
                    <h2 className="text-2xl font-semibold text-slate-100">No Bookings Yet</h2>
                    <p className="text-slate-400 mt-2">Time to book a stoodio and make some magic happen!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {bookings.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(booking => {
                        const { statusText, statusColor, engineerName } = getStatusAndEngineer(booking);
                        const canCancel = [BookingStatus.PENDING, BookingStatus.PENDING_APPROVAL, BookingStatus.CONFIRMED].includes(booking.status);
                        return (
                        <div key={booking.id} className={`bg-zinc-800 rounded-2xl shadow-lg p-6 flex flex-col md:flex-row gap-6 border border-zinc-700 hover:border-orange-500/50 transition-colors duration-300 ${booking.status === BookingStatus.CANCELLED ? 'opacity-60' : ''}`}>
                            <div className="flex-shrink-0">
                                <img src={booking.stoodio.imageUrl} alt={booking.stoodio.name} className="w-full md:w-48 h-32 object-cover rounded-xl" />
                            </div>
                            <div className="flex-grow">
                                <h2 className="text-2xl font-bold text-slate-100 mb-1">{booking.stoodio.name}</h2>
                                {engineerName && (
                                    <p className="text-orange-400 font-semibold mb-3">{engineerName}</p>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-slate-300">
                                    <div className="flex items-center">
                                        <LocationIcon className="w-5 h-5 mr-2 text-slate-400" />
                                        <span>{booking.stoodio.location}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <CalendarIcon className="w-5 h-5 mr-2 text-slate-400" />
                                        <span>{new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <ClockIcon className="w-5 h-5 mr-2 text-slate-400" />
                                        <span>{booking.startTime} for {booking.duration} hours</span>
                                    </div>
                                    <div className={`flex items-center font-semibold ${statusColor}`}>
                                        <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        {statusText}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 flex md:flex-col items-center md:items-end justify-between gap-2">
                                 <div className="text-right">
                                    <p className="text-slate-400 text-sm">Total Paid</p>
                                    <p className="text-xl font-bold text-slate-100">${booking.totalCost.toFixed(2)}</p>
                                     {booking.tip && <p className="text-sm text-green-400 font-semibold">+ ${booking.tip.toFixed(2)} Tip</p>}
                                 </div>
                                 {booking.status === BookingStatus.CONFIRMED && (
                                     <button onClick={() => onNavigateToStudio(booking.stoodio.coordinates)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-all text-sm shadow-md flex items-center gap-1.5">
                                        <RoadIcon className="w-4 h-4"/>
                                        Navigate
                                     </button>
                                 )}
                                 {booking.status === BookingStatus.COMPLETED && booking.requestType !== BookingRequestType.BRING_YOUR_OWN && !booking.tip && (
                                     <button onClick={() => onOpenTipModal(booking)} className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-all text-sm shadow-md">
                                        Rate & Tip
                                     </button>
                                 )}
                                 {canCancel && (
                                     <button onClick={() => onOpenCancelModal(booking)} className="bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-2 px-4 rounded-lg hover:bg-red-500/30 hover:text-red-300 transition-all text-sm flex items-center gap-1.5">
                                        <TrashIcon className="w-4 h-4" />
                                        Cancel
                                     </button>
                                 )}
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyBookings;