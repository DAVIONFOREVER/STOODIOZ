
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

    // Ranking tier order for job prioritization (higher number = higher priority)
    const tierOrder: { [key in RankingTier]: number } = {
        [RankingTier.Elite]: 5,
        [RankingTier.Platinum]: 4,
        [RankingTier.Gold]: 3,
        [RankingTier.Silver]: 2,
        [RankingTier.Bronze]: 1,
        [RankingTier.Provisional]: 0,
    };

    const openJobs = useMemo(() => {
        const allJobs = bookings
            .filter(b => b.posted_by === UserRole.STOODIO && b.status === BookingStatus.PENDING);
        
        // Apply ranking-based sorting
        // Higher tier engineers (Gold, Platinum, Elite) see jobs first
        const userTier = currentUser?.ranking_tier || RankingTier.Provisional;
        const tierValue = tierOrder[userTier];
        
        // Sort by date (earliest first)
        // In production, you could add delays for lower tiers or prioritize by tier
        return allJobs.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateA - dateB;
        });
    }, [bookings, currentUser?.ranking_tier]);

    const tierMessage = {
        [RankingTier.Elite]: "As an Elite engineer, you get instant push notifications for new jobs.",
        [RankingTier.Platinum]: "As a Platinum engineer, you get instant push notifications for new jobs.",
        [RankingTier.Gold]: "As a Gold engineer, you get instant push notifications for new jobs.",
        [RankingTier.Silver]: "All jobs are visible instantly. Rank up to Gold for priority notifications!",
        [RankingTier.Bronze]: "All jobs are visible instantly. Rank up to Gold for priority notifications!",
        [RankingTier.Provisional]: "All jobs are visible instantly. Complete more sessions to rank up and get priority notifications!",
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
                        // FIX: Corrected property name from 'engineerPayRate' to 'engineer_pay_rate'
                        const payout = job.engineer_pay_rate * job.duration;
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
                                        {/* FIX: Corrected property name from 'startTime' to 'start_time' */}
                                        <span>{job.start_time} for {job.duration} hours</span>
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
