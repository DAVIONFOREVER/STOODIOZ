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
        const completedBookings = studioBookings.filter(b => b.status === BookingStatus.COMPLETED);
        
        const sessionsThisMonth = monthlyBookings.length;

        // Mocked for now - these would come from booking feedback
        const onTimeRate = studio.on_time_rate; 
        const avgRating = studio.rating_overall;

        const engineerCounts = new Map<string, number>();
        completedBookings.forEach(b => {
            if (b.engineer) {
                engineerCounts.set(b.engineer.id, (engineerCounts.get(b.engineer.id) || 0) + 1);
            }
        });
        
        let mostRequestedId: string | null = null;
        let maxCount = 0;
        engineerCounts.forEach((count, id) => {
            if (count > maxCount) {
                maxCount = count;
                mostRequestedId = id;
            }
        });

        const mostRequestedEngineer = mostRequestedId ? engineers.find(e => e.id === mostRequestedId) : null;

        return { sessionsThisMonth, onTimeRate, avgRating, mostRequestedEngineer };
    }, [studioBookings, engineers, studio]);

    return (
        <div className="space-y-8 animate-fade-in">
             <div className="text-center">
                <h1 className="text-5xl font-extrabold tracking-tight text-zinc-100">
                    Studio Insights
                </h1>
                <p className="max-w-2xl mx-auto mt-4 text-lg text-zinc-400">
                    Track your studio's performance, manage bookings, and grow your business.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Sessions This Month" value={sessionsThisMonth.toString()} icon={<CalendarIcon className="w-8 h-8 text-orange-400" />} />
                <StatCard label="On-Time Rate" value={`${onTimeRate}%`} icon={<CheckCircleIcon className="w-8 h-8 text-green-400" />} />
                <StatCard label="Average Rating" value={avgRating.toFixed(1)} icon={<StarIcon className="w-8 h-8 text-yellow-400" />} />
                <StatCard 
                    label="Most Booked Engineer" 
                    value={mostRequestedEngineer ? mostRequestedEngineer.name : 'N/A'} 
                    icon={<UsersIcon className="w-8 h-8 text-blue-400" />} 
                />
            </div>

            <div className="cardSurface p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-zinc-100">Upcoming Sessions</h2>
                     <button onClick={() => setIsModalOpen(true)} className="bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm">
                        Assign Engineer
                    </button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-zinc-400">
                        <thead className="text-xs text-zinc-400 uppercase bg-zinc-800/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date & Time</th>
                                <th scope="col" className="px-6 py-3">Artist</th>
                                <th scope="col" className="px-6 py-3">Engineer</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studioBookings.filter(b => new Date(b.date) >= new Date() && b.status !== BookingStatus.CANCELLED).map(b => (
                                <tr key={b.id} className="border-b border-zinc-700/50 hover:bg-zinc-800/30">
                                    <td className="px-6 py-4 font-semibold text-zinc-200">{format(new Date(b.date + 'T' + b.start_time), 'MMM d, h:mm a')}</td>
                                    <td className="px-6 py-4">{b.artist?.name || 'N/A'}</td>
                                    <td className="px-6 py-4">{b.engineer?.name || 'Unassigned'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            b.status === BookingStatus.CONFIRMED ? 'bg-green-400/10 text-green-300' : 'bg-yellow-400/10 text-yellow-300'
                                        }`}>{b.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>

            {isModalOpen && <AssignEngineerModal onClose={() => setIsModalOpen(false)} />}

        </div>
    );
};

export default StudioInsights;