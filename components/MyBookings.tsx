
import React, { useMemo } from 'react';
import type { Booking, Location } from '../types';
import { BookingStatus, BookingRequestType } from '../types';
import { CalendarIcon, ClockIcon, LocationIcon, RoadIcon, TrashIcon, DownloadIcon, MusicNoteIcon, SoundWaveIcon } from './icons';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';

const MyBookings: React.FC = () => {
    const { bookings, engineers, currentUser } = useAppState();
    const dispatch = useAppDispatch();
    const { navigateToStudio } = useNavigation();

    const onOpenTipModal = (booking: Booking) => dispatch({ type: ActionTypes.OPEN_TIP_MODAL, payload: { booking } });
    const onOpenCancelModal = (booking: Booking) => dispatch({ type: ActionTypes.OPEN_CANCEL_MODAL, payload: { booking } });
    
    const userBookings = useMemo(() => {
        if (!currentUser) return [];
        return bookings
            .filter(b => 
                b.bookedById === currentUser.id || 
                b.artist?.id === currentUser.id || 
                b.engineer?.id === currentUser.id || 
                b.stoodio?.id === currentUser.id ||
                b.producer?.id === currentUser.id
            )
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [bookings, currentUser]);

    const getStatusAndParticipant = (booking: Booking) => {
        const requestedEngineer = booking.requestedEngineerId ? engineers.find(e => e.id === booking.requestedEngineerId) : null;
        let mainParticipant = '';

        if (booking.engineer) {
            mainParticipant = `with ${booking.engineer.name}`;
        } else if (booking.producer) {
             mainParticipant = `with ${booking.producer.name}`;
        } else if (booking.mixingDetails) {
            const engineer = engineers.find(e => e.id === booking.requestedEngineerId);
            mainParticipant = `with ${engineer?.name || 'Engineer'}`;
        }

        switch (booking.status) {
            case BookingStatus.PENDING:
                return { statusText: 'Searching for an engineer...', statusColor: 'text-yellow-400 animate-pulse', participantName: null };
            case BookingStatus.PENDING_APPROVAL:
                const approver = requestedEngineer?.name || 'the engineer';
                return { statusText: `Awaiting approval from ${approver}...`, statusColor: 'text-yellow-400', participantName: null };
            case BookingStatus.CONFIRMED:
                if (booking.requestType === BookingRequestType.BRING_YOUR_OWN) {
                     return { statusText: 'Confirmed (BYO Engineer)', statusColor: 'text-green-400', participantName: 'Provided by you' };
                }
                return { statusText: 'Confirmed', statusColor: 'text-green-400', participantName: mainParticipant };
            case BookingStatus.COMPLETED:
                const completedParticipant = booking.requestType === BookingRequestType.BRING_YOUR_OWN ? 'Provided by you' : mainParticipant;
                return { statusText: 'Session Completed', statusColor: 'text-green-400', participantName: completedParticipant };
            case BookingStatus.CANCELLED:
                return { statusText: 'Cancelled', statusColor: 'text-red-400', participantName: null };
            default:
                return { statusText: booking.status, statusColor: 'text-slate-400', participantName: null };
        }
    };
    
    const getBookingImage = (booking: Booking): string => {
        if (booking.stoodio?.imageUrl) return booking.stoodio.imageUrl;
        if (booking.engineer?.imageUrl) return booking.engineer.imageUrl;
        if (booking.producer?.imageUrl) return booking.producer.imageUrl;
        if (booking.requestedEngineerId) {
            const reqEngineer = engineers.find(e => e.id === booking.requestedEngineerId);
            if (reqEngineer?.imageUrl) return reqEngineer.imageUrl;
        }
        return `https://source.unsplash.com/random/400x300?music-studio&${booking.id}`;
    }


    return (
        <div>
            <h1 className="text-5xl font-extrabold text-center mb-2 tracking-tight text-orange-500">My Bookings</h1>
            <p className="text-center text-lg text-slate-500 mb-12">Here are your upcoming and past stoodio sessions.</p>
            {userBookings.length === 0 ? (
                <div className="text-center py-16 cardSurface">
                    <h2 className="text-2xl font-semibold text-slate-100">No Bookings Yet</h2>
                    <p className="text-slate-400 mt-2">Time to book a stoodio and make some magic happen!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {userBookings.map(booking => {
                        const { statusText, statusColor, participantName } = getStatusAndParticipant(booking);
                        const isUpcoming = new Date(`${booking.date}T${booking.startTime || '00:00'}`) >= new Date();
                        const canCancel = [BookingStatus.PENDING, BookingStatus.PENDING_APPROVAL, BookingStatus.CONFIRMED].includes(booking.status) && isUpcoming;
                        return (
                        <div key={booking.id} className={`p-6 flex flex-col md:flex-row gap-6 hover:border-orange-500/50 transition-colors duration-300 cardSurface ${booking.status === BookingStatus.CANCELLED ? 'opacity-60' : ''}`}>
                            <div className="flex-shrink-0">
                                <img src={getBookingImage(booking)} alt={booking.stoodio?.name || booking.engineer?.name} className="w-full md:w-48 h-32 object-cover rounded-xl" />
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center gap-4 mb-1">
                                    <h2 className="text-2xl font-bold text-slate-100">{booking.stoodio?.name || 'Remote Mixing Session'}</h2>
                                    {booking.mixingDetails && <span className="text-xs font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full">Mixing Session</span>}
                                </div>
                                {participantName && (
                                    <p className="text-orange-400 font-semibold mb-3">{participantName}</p>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-slate-300">
                                    {booking.stoodio && (
                                        <div className="flex items-center">
                                            <LocationIcon className="w-5 h-5 mr-2 text-slate-400" />
                                            <span>{booking.stoodio.location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center">
                                        <CalendarIcon className="w-5 h-5 mr-2 text-slate-400" />
                                        <span>{new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    {booking.startTime !== 'N/A' && (
                                        <div className="flex items-center">
                                            <ClockIcon className="w-5 h-5 mr-2 text-slate-400" />
                                            <span>{booking.startTime} for {booking.duration} hours</span>
                                        </div>
                                    )}
                                    <div className={`flex items-center font-semibold ${statusColor}`}>
                                        <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        {statusText}
                                    </div>
                                </div>
                                {booking.instrumentalsPurchased && booking.instrumentalsPurchased.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-zinc-700">
                                        <h4 className="font-semibold text-sm text-slate-200 mb-2">Purchased Beats</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {booking.instrumentalsPurchased.map(beat => (
                                                <a key={beat.id} href={beat.audioUrl} download={`${beat.title}.mp3`} className="bg-zinc-700 text-slate-200 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1.5 hover:bg-green-500/20 hover:text-green-300 transition-colors">
                                                    <DownloadIcon className="w-3 h-3"/>
                                                    {beat.title}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-shrink-0 flex md:flex-col items-center md:items-end justify-between gap-2">
                                 <div className="text-right">
                                    <p className="text-slate-400 text-sm">Total Paid</p>
                                    <p className="text-xl font-bold text-slate-100">${booking.totalCost.toFixed(2)}</p>
                                     {booking.tip && <p className="text-sm text-green-400 font-semibold">+ ${booking.tip.toFixed(2)} Tip</p>}
                                 </div>
                                 {booking.stoodio && booking.status === BookingStatus.CONFIRMED && isUpcoming && (
                                     <button 
                                        onClick={() => navigateToStudio(booking.stoodio!.coordinates)}
                                        className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-all text-sm shadow-md flex items-center gap-1.5"
                                     >
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
