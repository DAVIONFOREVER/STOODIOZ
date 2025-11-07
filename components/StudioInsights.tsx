
import React, { useMemo, useState } from 'react';
import { useAppState } from '../contexts/AppContext';
import { AppView, BookingStatus } from '../types';
import type { Booking, Engineer, Stoodio, Producer } from '../types';
import { CalendarIcon, CheckCircleIcon, StarIcon, UsersIcon, CloseIcon } from './icons';
import { format, isThisMonth, startOfMonth, endOfMonth } from 'date-fns';
import RankingBadge from './RankingBadge';

const StatCard: React.FC<{ label: string; value: string | React.ReactNode; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="p-6 flex items-start gap-4 cardSurface">
        <div className="bg-orange-500/10 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-zinc-400 font-medium">{label}</p>
            <div className="text-3xl font-extrabold text-zinc-100 text-glow">{value}</div>
        </div>
    </div>
);

const AssignEngineerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-zinc-800 rounded-xl p-8 text-center border border-zinc-700">
            <h3 className="text-2xl font-bold text-orange-400 mb-2">Coming Soon!</h3>
            <p className="text-zinc-300">Talent assignment and job posting features are on the way.</p>
            <button onClick={onClose} className="mt-6 bg-orange-500 text-white font-bold py-2 px-6 rounded-lg">Got it</button>
        </div>
    </div>
);


const StudioInsights: React.FC = () => {
    const { currentUser, bookings, engineers } = useAppState();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const studio = currentUser as Stoodio;

    const studioBookings = useMemo(() => bookings.filter(b => b.stoodio?.id === studio.id), [bookings, studio.id]);

    const { sessionsThisMonth, onTimeRate, avgRating, mostRequestedEngineer } = useMemo(() => {
        const now = new Date();
        const monthlyBookings = studioBookings.filter(b => isThisMonth(new Date(b.date)));
        
        // In a real app with feedback data, this would be more accurate.
        // This is a placeholder calculation.
        const onTimeCount = monthlyBookings.filter(b => b.status === BookingStatus.COMPLETED).length;
        const onTimeRate = monthlyBookings.length > 0 ? Math.round((onTimeCount / monthlyBookings.length) * 100) : 100;

        const engineerCounts = monthlyBookings
            .filter(b => b.engineer)
            .reduce((acc, b) => {
                acc[b.engineer!.id] = (acc[b.engineer!.id] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            
        const topEngineerId = Object.keys(engineerCounts).sort((a,b) => engineerCounts[b] - engineerCounts[a])[0];
        const mostRequestedEngineer = engineers.find(e => e.id === topEngineerId);

        return {
            sessionsThisMonth: monthlyBookings.length,
            onTimeRate: onTimeRate,
            avgRating: studio.rating_overall,
            mostRequestedEngineer: mostRequestedEngineer || null
        };
    }, [studioBookings, engineers, studio.rating_overall]);

    const upcomingSessions = useMemo(() => {
        return studioBookings
            .filter(b => new Date(b.date) >= new Date() && b.status === BookingStatus.CONFIRMED)
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [studioBookings]);

    return (
        <div className="space-y-8">
            <h1 className="text-5xl font-extrabold tracking-tight text-orange-400">Studio Insights</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Sessions This Month" value={sessionsThisMonth} icon={<CalendarIcon className="w-8 h-8 text-orange-400" />} />
                <StatCard label="Engineer On-Time Rate" value={`${onTimeRate}%`} icon={<CheckCircleIcon className="w-8 h-8 text-green-400" />} />
                <StatCard label="Average Artist Rating" value={`${avgRating.toFixed(1)} / 5`} icon={<StarIcon className="w-8 h-8 text-yellow-400" />} />
                <StatCard 
                    label="Most Requested Engineer"
                    value={mostRequestedEngineer ? <span className="text-2xl">{mostRequestedEngineer.name}</span> : 'N/A'}
                    icon={<UsersIcon className="w-8 h-8 text-blue-400" />} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 p-6 cardSurface">
                    <h2 className="text-2xl font-bold text-zinc-100 mb-4">Upcoming Sessions</h2>
                     <div className="space-y-3">
                        {upcomingSessions.length > 0 ? upcomingSessions.map(b => (
                            <div key={b.id} className="bg-zinc-800/70 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <p className="font-bold text-zinc-200">{format(new Date(b.date), 'EEE, MMM d')} @ {b.startTime}</p>
                                    <p className="text-sm text-zinc-400">{b.artist?.name || 'Studio Booking'} • {b.duration} hrs</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {b.engineer ? (
                                        <div className="text-right">
                                            <p className="font-semibold text-sm text-green-300">Locked In</p>
                                            <p className="text-xs text-zinc-400">{b.engineer.name}</p>
                                        </div>
                                    ) : (
                                        <p className="font-semibold text-sm text-yellow-400">Needs Engineer</p>
                                    )}
                                    <button onClick={() => setIsModalOpen(true)} className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg text-sm">
                                        {b.engineer ? 'View' : 'Assign'}
                                    </button>
                                </div>
                            </div>
                        )) : <p className="text-zinc-500 text-center py-8">No upcoming sessions.</p>}
                     </div>
                </div>
                 <div className="p-6 cardSurface">
                    <h2 className="text-2xl font-bold text-zinc-100 mb-4">Top Talent</h2>
                     <div className="space-y-4">
                        {engineers.slice(0, 3).map(eng => (
                            <div key={eng.id} className="bg-zinc-800/70 p-3 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <img src={eng.imageUrl} alt={eng.name} className="w-10 h-10 rounded-lg object-cover" />
                                        <div>
                                            <p className="font-bold text-zinc-200">{eng.name}</p>
                                            <p className="text-xs text-zinc-400">{eng.sessions_completed} sessions</p>
                                        </div>
                                    </div>
                                    <RankingBadge tier={eng.ranking_tier} isOnStreak={eng.is_on_streak} short />
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {eng.strength_tags.slice(0,2).map(tag => <span key={tag} className="text-[10px] font-semibold bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded">{tag}</span>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {isModalOpen && <AssignEngineerModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
}

export default StudioInsights;
      