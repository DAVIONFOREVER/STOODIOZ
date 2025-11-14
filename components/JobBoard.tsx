import React, { useMemo } from 'react';
import { useAppState } from '../contexts/AppContext';
import { useBookings } from '../hooks/useBookings';
import { BookingStatus, UserRole, RankingTier } from '../types';
import type { Booking } from '../types';
import { CalendarIcon, ClockIcon, DollarSignIcon, HouseIcon } from './icons';
import { useNavigation } from '../hooks/useNavigation';

const JobBoard: React.FC = () => {
    const { bookings, currentUser } = useAppState();
    const { navigate } = useNavigation();
    const { acceptJob } = useBookings(navigate);

    const openJobs = useMemo(() => {
        return bookings
            .filter(b => b.postedBy === UserRole.STOODIO && b.status === BookingStatus.PENDING)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [bookings]);

    const tierMessage = {
        [RankingTier.Elite]: "You see jobs instantly as an Elite engineer.",
        [RankingTier.Platinum]: "You see jobs instantly as a Platinum engineer.",
        [RankingTier.Gold]: "You see jobs 1 hour after they are posted.",
        [RankingTier.Silver]: "You see jobs 3 hours after they are posted.",
        [RankingTier.Bronze]: "You see jobs 6 hours after they are posted.",
        [RankingTier.Provisional]: "You see jobs 12 hours after they are posted. Complete more sessions to rank up!",
    };
    
    const userTier = currentUser?.ranking_tier || RankingTier.Provisional;

    return (
        <div className="space-y-6">
            <div className="p-6 cardSurface">
                <h1 className="text-2xl font-bold text-zinc-100">Open Job Board</h1>
                <p className="text-zinc-400 mt-2">
                    Jobs are prioritized based on your ranking. {tierMessage[userTier]}
                </p>
            </div>
            {openJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {openJobs.map(job => {
                        const payout = job.engineerPayRate * job.duration;
                        return (
                            <div key={job.id} className="cardSurface p-6 flex flex-col">
                                <h3 className="font-bold text-lg text-orange-400 flex items-center gap-2">
                                    <HouseIcon className="w-5 h-5" />
                                    {job.stoodio?.name}
                                </h3>
                                <p className="text-sm text-zinc-400 mb-4">{job.stoodio?.location}</p>

                                <div className="space-y-2 text-sm border-t border-zinc-700/50 pt-4 flex-grow">
                                    <div className="flex items-center gap-2 text-zinc-300">
                                        <CalendarIcon className="w-4 h-4 text-zinc-400" />
                                        <span>{new Date(job.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-300">
                                        <ClockIcon className="w-4 h-4 text-zinc-400" />
                                        <span>{job.startTime} for {job.duration} hours</span>
                                    </div>
                                    <div className="flex items-center gap-2 font-bold text-green-400">
                                        <DollarSignIcon className="w-4 h-4" />
                                        <span>Payout: ${payout.toFixed(2)}</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => acceptJob(job)}
                                    className="mt-4 w-full bg-green-500 text-white font-semibold py-2 rounded-md hover:bg-green-600 transition-colors"
                                >
                                    Accept Job
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 cardSurface">
                    <p className="text-zinc-400 font-semibold">No open jobs right now.</p>
                    <p className="text-zinc-500 text-sm mt-2">Check back soon!</p>
                </div>
            )}
        </div>
    );
};

export default JobBoard;
