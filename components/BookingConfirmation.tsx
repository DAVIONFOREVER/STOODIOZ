import React from 'react';
import type { Engineer } from '../types';
import { BookingRequestType, BookingStatus } from '../types';
import { CheckCircleIcon, CogIcon, ClockIcon, DownloadIcon, MusicNoteIcon } from './icons';
import { useAppState } from '../contexts/AppContext';

interface BookingConfirmationProps {
    onDone: () => void;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ onDone }) => {
    const { latestBooking, engineers } = useAppState();

    if (!latestBooking) {
        // This should ideally not happen if navigation is correct
        return (
            <div className="text-center">
                <p>No booking information found.</p>
                <button onClick={onDone} className="mt-4 bg-orange-500 text-white font-bold py-2 px-4 rounded-lg">Go to My Bookings</button>
            </div>
        );
    }
    
    const { stoodio, engineer, date, startTime, duration, totalCost, requestType, requestedEngineerId } = latestBooking;
    
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const requestedEngineer = engineers.find(e => e.id === requestedEngineerId);

    const getTitleAndMessage = () => {
        const atStoodio = stoodio ? `at ${stoodio.name}` : '';
        switch (latestBooking.status) {
            case BookingStatus.PENDING:
                return {
                    icon: <ClockIcon className="w-20 h-20 text-yellow-500" />,
                    title: 'Request Sent!',
                    message: `We're finding an available engineer for your session ${atStoodio}. We'll notify you once confirmed!`
                };
            case BookingStatus.PENDING_APPROVAL:
                 const approver = requestedEngineer?.name || 'the engineer';
                 if(latestBooking.mixingDetails?.type === 'REMOTE') {
                     return {
                        icon: <ClockIcon className="w-20 h-20 text-yellow-500" />,
                        title: 'Mix Request Sent!',
                        message: `Your request for a remote mix has been sent to ${approver}. We'll notify you of their response.`
                    };
                 }
                 return {
                    icon: <ClockIcon className="w-20 h-20 text-yellow-500" />,
                    title: 'Request Sent!',
                    message: `Your session request ${atStoodio} has been sent to ${approver}. We'll notify you of their response.`
                };
            case BookingStatus.CONFIRMED:
            default:
                if (requestType === BookingRequestType.BRING_YOUR_OWN) {
                    return {
                        icon: <CheckCircleIcon className="w-20 h-20 text-green-500" />,
                        title: 'Booking Confirmed!',
                        message: `Your session ${atStoodio} is locked in. Don't forget to bring your engineer!`
                    };
                }
                 return {
                    icon: <CheckCircleIcon className="w-20 h-20 text-green-500" />,
                    title: 'Booking Confirmed!',
                    message: `Your session ${atStoodio} is locked in. Get ready to create!`
                };
        }
    };
    
    const { icon, title, message } = getTitleAndMessage();
    const isConfirmedWithStoodiozEngineer = latestBooking.status === BookingStatus.CONFIRMED && requestType !== BookingRequestType.BRING_YOUR_OWN;

    return (
        <div className="max-w-3xl mx-auto text-center">
            <div className="p-8 cardSurface">
                <div className="flex justify-center mb-4">
                    {icon}
                </div>
                <h1 className="text-4xl font-extrabold text-orange-500 mb-2">
                    {title}
                </h1>
                <p className="text-slate-300 mb-8">
                    {message}
                </p>

                <div className="text-left bg-zinc-800/50 p-6 rounded-lg space-y-6 border border-zinc-700">
                    {/* Booking Details */}
                    <div>
                        <h3 className="font-bold text-lg text-orange-400 mb-3">Session Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-300">
                            {stoodio && <p><strong>Stoodio:</strong> {stoodio.name}</p>}
                            {stoodio && <p><strong>Location:</strong> {stoodio.location}</p>}
                            {latestBooking.mixingDetails?.type === 'REMOTE' && <p><strong>Service:</strong> Remote Mixing ({latestBooking.mixingDetails.trackCount} tracks)</p>}
                            {latestBooking.mixingDetails?.type === 'IN_STUDIO' && <p><strong>Add-on:</strong> In-Studio Mixing ({latestBooking.mixingDetails.trackCount} tracks)</p>}
                            <p><strong>Date:</strong> {formattedDate}</p>
                            {startTime !== 'N/A' && <p><strong>Time:</strong> {startTime} for {duration} hours</p>}
                            <p><strong>Total Paid:</strong> <span className="font-bold">${totalCost.toFixed(2)}</span></p>
                            <p><strong>Engineer:</strong> {requestType === BookingRequestType.BRING_YOUR_OWN ? 'Provided by Artist' : (engineer?.name || 'To be assigned')}</p>
                             {latestBooking.producer && <p><strong>Producer:</strong> {latestBooking.producer.name}</p>}
                        </div>
                    </div>

                    {isConfirmedWithStoodiozEngineer && engineer && (
                        <>
                            <div className="border-t border-zinc-700"></div>
                            {/* Engineer Details */}
                            <div>
                                <h3 className="font-bold text-lg text-orange-400 mb-4">Your Assigned Engineer</h3>
                                <div className="flex items-start space-x-4">
                                    <div>
                                    <img src={engineer.imageUrl} alt={engineer.name} className="w-16 h-16 rounded-xl object-cover border-2 border-zinc-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-100 text-xl">{engineer.name}</h4>
                                        <p className="text-slate-300 text-sm mb-2">{engineer.bio}</p>
                                        <div className="flex items-center space-x-2">
                                            <CogIcon className="w-5 h-5 text-slate-400" />
                                            <div className="flex flex-wrap gap-2">
                                                {engineer.specialties.map(spec => (
                                                    <span key={spec} className="bg-zinc-700 text-slate-300 text-xs font-medium px-2 py-1 rounded-full">{spec}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                     {latestBooking.instrumentalsPurchased && latestBooking.instrumentalsPurchased.length > 0 && (
                        <>
                            <div className="border-t border-zinc-700"></div>
                            <div>
                                <h3 className="font-bold text-lg text-orange-400 mb-4">Download Your Beats</h3>
                                <div className="space-y-2">
                                    {latestBooking.instrumentalsPurchased.map(beat => (
                                        <div key={beat.id} className="bg-zinc-700/50 p-3 rounded-md flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <MusicNoteIcon className="w-5 h-5 text-purple-400"/>
                                                <span className="font-semibold text-slate-200">{beat.title}</span>
                                            </div>
                                            <a href={beat.audioUrl} download={`${beat.title.replace(/\s+/g, '_')}.mp3`} className="bg-green-500 text-white font-bold py-1 px-3 rounded-lg hover:bg-green-600 transition-all text-sm flex items-center gap-1.5">
                                                <DownloadIcon className="w-4 h-4"/>
                                                Download
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <button
                    onClick={onDone}
                    className="mt-8 bg-orange-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-orange-600 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 shadow-lg">
                    Done
                </button>
            </div>
        </div>
    );
};

export default BookingConfirmation;