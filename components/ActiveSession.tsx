import React, { useState } from 'react';
import type { Artist } from '../types';
import { LocationIcon, NavigationArrowIcon, ClockIcon, DollarSignIcon } from './icons';
import { useAppState } from '../contexts/AppContext';

interface ActiveSessionProps {
    onEndSession: (bookingId: string) => void;
    onSelectArtist: (artist: Artist) => void;
}

const TimelineStep: React.FC<{ title: string; isComplete: boolean; isCurrent: boolean }> = ({ title, isComplete, isCurrent }) => {
    return (
        <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isComplete || isCurrent ? 'bg-orange-500' : 'bg-slate-600'}`}>
                {isComplete && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className={`ml-2 font-semibold ${isCurrent ? 'text-orange-400' : isComplete ? 'text-slate-200' : 'text-slate-400'}`}>{title}</span>
        </div>
    );
};

const ActiveSession: React.FC<ActiveSessionProps> = ({ onEndSession, onSelectArtist }) => {
    const { activeSession: session } = useAppState();
    const [progress, setProgress] = useState<'EN_ROUTE' | 'IN_SESSION'>('EN_ROUTE');
    
    if (!session) return null;

    const engineerPayout = session.totalCost * 0.20;

    const handleStartSession = () => {
        setProgress('IN_SESSION');
    };
    
    const handleEndSession = () => {
        if (window.confirm("Are you sure you want to end the session? This will finalize the booking.")) {
            onEndSession(session.id);
        }
    };

    const formattedDate = new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    });

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-extrabold text-center mb-6 tracking-tight text-orange-500">Active Session</h1>
            {/* Timeline Header */}
            <div className="bg-zinc-800 rounded-xl shadow-md p-4 mb-6 border border-zinc-700">
                <div className="flex justify-between items-center">
                    <TimelineStep title="On the Way" isComplete={progress === 'IN_SESSION'} isCurrent={progress === 'EN_ROUTE'} />
                    <div className="flex-grow h-0.5 bg-slate-600 mx-4"><div className={`h-full ${progress === 'IN_SESSION' ? 'bg-orange-500' : 'bg-slate-600'}`}></div></div>
                    <TimelineStep title="In Session" isComplete={false} isCurrent={progress === 'IN_SESSION'} />
                </div>
            </div>
            
            <div className="bg-zinc-800 rounded-2xl shadow-xl border border-zinc-700 overflow-hidden">
                {/* Map/Navigation View */}
                <div className="relative">
                    <img src="https://source.unsplash.com/seeded/map-route/1200x500" alt="Map route to stoodio" className="w-full h-64 md:h-80 object-cover" />
                    <div className="absolute top-0 left-0 w-full h-full bg-black/30"></div>
                    <div className="absolute top-4 left-4 bg-zinc-800/80 backdrop-blur-sm p-4 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-slate-100">{session.stoodio?.name}</h2>
                        <p className="text-slate-300 flex items-center gap-2 mt-1"><LocationIcon className="w-5 h-5" /> {session.stoodio?.location}</p>
                    </div>
                     <div className="absolute bottom-4 right-4 bg-zinc-800/80 backdrop-blur-sm p-3 rounded-lg shadow-lg text-center">
                        <p className="text-sm text-slate-400">ETA</p>
                        <p className="text-2xl font-bold text-orange-400">12 min</p>
                        <p className="text-xs text-slate-400">3.4 miles</p>
                    </div>
                </div>

                {/* Session Details & Artist Info */}
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row gap-6 justify-between">
                        {session.artist ? (
                            <div className="cursor-pointer group" onClick={() => onSelectArtist(session.artist!)}>
                                <p className="text-slate-400 font-semibold">SESSION FOR</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <img src={session.artist.imageUrl} alt={session.artist.name} className="w-12 h-12 rounded-xl object-cover"/>
                                    <div>
                                        <h3 className="text-xl font-bold group-hover:text-orange-400 transition-colors">{session.artist.name}</h3>
                                    </div>
                                </div>
                            </div>
                        ) : (
                             <div>
                                <p className="text-slate-400 font-semibold">SESSION TYPE</p>
                                <h3 className="text-xl font-bold mt-2">Studio Posted Job</h3>
                            </div>
                        )}
                        <div className="text-left sm:text-right">
                            <p className="text-slate-400 font-semibold">DATE & TIME</p>
                            <p className="text-lg font-bold mt-2">{formattedDate}</p>
                            <p className="text-slate-300">{session.startTime} for {session.duration} hours</p>
                        </div>
                    </div>
                    <div className="border-t border-zinc-700 my-6"></div>
                    <div className="bg-zinc-700/50 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <DollarSignIcon className="w-8 h-8 text-green-400" />
                            <div>
                                <p className="font-semibold">Your Payout</p>
                                <p className="text-xs text-slate-400">Paid upon session completion</p>
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-green-400">${engineerPayout.toFixed(2)}</p>
                    </div>
                </div>

                {/* Main Action Button */}
                <div className="p-4 bg-zinc-800/50 border-t border-zinc-700">
                    {progress === 'EN_ROUTE' && (
                        <button onClick={handleStartSession} className="w-full bg-orange-500 text-white font-bold text-lg py-4 px-6 rounded-xl hover:bg-orange-600 transition-all shadow-lg flex items-center justify-center gap-3">
                           <NavigationArrowIcon className="w-6 h-6" /> Start Session
                        </button>
                    )}
                    {progress === 'IN_SESSION' && (
                        <button onClick={handleEndSession} className="w-full bg-red-500 text-white font-bold text-lg py-4 px-6 rounded-xl hover:bg-red-600 transition-all shadow-lg flex items-center justify-center gap-3">
                            <ClockIcon className="w-6 h-6" /> End Session
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActiveSession;
