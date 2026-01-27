
import React, { useState, useEffect, useMemo } from 'react';
import { useAppState } from '../../contexts/AppContext';
import * as apiService from '../../services/apiService';
import type { RosterMember, Booking, LabelBudgetOverview } from '../../types';
import { CalendarIcon, DollarSignIcon, UsersIcon } from '../icons';
import { useNavigation } from '../../hooks/useNavigation';
import { AppView } from '../../types';

// Local icon definitions to avoid modifying icons.tsx and ensure build success
const TrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
);

const TrendingDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-5.94 2.28m5.94-2.28l-2.28 5.941" />
    </svg>
);

const StatCard: React.FC<{ label: string; value: string | React.ReactNode; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-zinc-800 border border-zinc-700/50 p-6 rounded-xl flex items-center gap-4 shadow-lg">
        <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400">
            {icon}
        </div>
        <div>
            <p className="text-zinc-400 text-sm font-medium">{label}</p>
            <div className="text-2xl font-bold text-zinc-100">{value}</div>
        </div>
    </div>
);

const LabelPerformance: React.FC = () => {
    const { currentUser } = useAppState();
    const { navigate } = useNavigation();
    const [roster, setRoster] = useState<RosterMember[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [budget, setBudget] = useState<LabelBudgetOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial data fetch
    useEffect(() => {
        async function load() {
            if (!currentUser?.id) {
                setLoading(false);
                setError("Cannot load performance data without a logged-in label user.");
                return;
            };
            setLoading(true);
            setError(null);
            try {
                 const [rosterData, bookingsData, budgetData] = await Promise.all([
                    apiService.fetchLabelRoster(currentUser.id),
                    apiService.fetchLabelBookings(currentUser.id),
                    apiService.getLabelBudgetOverview(currentUser.id),
                ]);
                setRoster(rosterData || []);
                setBookings(bookingsData || []);
                setBudget(budgetData || null);
            } catch (err) {
                console.error("Error in load performance:", err);
                setError("Failed to fetch performance data.");
            }
            setLoading(false);
        }
        load();
    }, [currentUser?.id]);

    const performanceData = useMemo(() => {
        if (roster.length === 0) {
            return { artists: [], summary: { totalSessions: 0, avgCostAcrossLabel: 0, mostActiveArtist: 'N/A', leastActiveArtist: 'N/A' } };
        }

        const artistPerformances = roster.map(artist => {
            const artistBookings = bookings.filter(b => b.artist?.id === artist.id);
            const completedBookings = artistBookings.filter(b => b.status === 'COMPLETED');
            
            const totalSpentOnArtist = completedBookings.reduce((sum, b) => sum + b.total_cost, 0);
            const avgCost = completedBookings.length > 0 ? totalSpentOnArtist / completedBookings.length : 0;
            
            const budgetInfo = budget?.artists.find(a => a.artist_id === artist.id);
            const allocationRemaining = budgetInfo ? budgetInfo.allocation_amount - budgetInfo.amount_spent : null;

            const sortedBookings = artistBookings.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const lastSessionDate = sortedBookings.length > 0 
                ? new Date(sortedBookings[0].date).toLocaleDateString()
                : 'N/A';
            
            let trend = 'stable';
            if (sortedBookings.length >= 3) {
                const diff1 = new Date(sortedBookings[0].date).getTime() - new Date(sortedBookings[1].date).getTime();
                const diff2 = new Date(sortedBookings[1].date).getTime() - new Date(sortedBookings[2].date).getTime();
                if (diff1 < diff2 * 0.8) trend = 'up'; // Activity is accelerating
                if (diff1 > diff2 * 1.2) trend = 'down'; // Activity is slowing
            } else if (sortedBookings.length > 0) {
                trend = 'up'; // Any recent activity is a positive trend
            } else {
                trend = 'down';
            }


            return {
                ...artist,
                totalSessions: artistBookings.length,
                completedSessions: completedBookings.length,
                avgSessionCost: avgCost,
                allocationRemaining,
                lastSessionDate,
                trend,
            };
        });

        const totalLabelSessions = bookings.length;
        const totalCompleted = bookings.filter(b => b.status === 'COMPLETED').length;
        const totalCost = bookings.filter(b => b.status === 'COMPLETED').reduce((sum, b) => sum + b.total_cost, 0);
        const avgCostAcrossLabel = totalCompleted > 0 ? totalCost / totalCompleted : 0;
        
        const mostActive = artistPerformances.length > 0 ? [...artistPerformances].sort((a,b) => b.totalSessions - a.totalSessions)[0] : null;
        const leastActive = artistPerformances.length > 0 ? [...artistPerformances].sort((a,b) => a.totalSessions - b.totalSessions)[0] : null;

        return {
            artists: artistPerformances,
            summary: {
                totalSessions: totalLabelSessions,
                avgCostAcrossLabel,
                mostActiveArtist: mostActive?.name || 'N/A',
                leastActiveArtist: leastActive?.name || 'N/A',
            }
        };

    }, [roster, bookings, budget]);

    if (loading) {
        return <div className="p-20 text-center text-zinc-500">Calculating performance metrics...</div>;
    }
    
    if (error) {
        return <div className="text-center text-red-400 p-10">{error}</div>;
    }

    if (!loading && roster.length === 0) {
        return (
            <div className="cardSurface p-10 text-center text-zinc-500">
                <p className="font-semibold text-lg text-zinc-400 mb-4">You haven't added any artists yet.</p>
                <p className="mb-6">Add artists to your roster to start tracking their performance.</p>
                <button 
                    onClick={() => navigate(AppView.LABEL_IMPORT)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold"
                >
                    Add Artists to Roster
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="text-3xl font-extrabold text-zinc-100">Roster Performance</h1>

            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Sessions (Label)" value={performanceData.summary.totalSessions || 0} icon={<CalendarIcon className="w-6 h-6"/>} />
                <StatCard label="Avg Session Cost" value={`$${(performanceData.summary.avgCostAcrossLabel || 0).toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6"/>} />
                <StatCard label="Most Active" value={performanceData.summary.mostActiveArtist || 'N/A'} icon={<TrendingUpIcon className="w-6 h-6"/>} />
                <StatCard label="Least Active" value={performanceData.summary.leastActiveArtist || 'N/A'} icon={<TrendingDownIcon className="w-6 h-6"/>} />
            </div>

            {/* Artist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {performanceData.artists.map(artist => (
                    <div key={artist.id} className="cardSurface p-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <img src={getProfileImageUrl(artist)} alt={artist.name} className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700"/>
                            <div>
                                <h3 className="text-xl font-bold text-zinc-100">{artist.name}</h3>
                                <p className="text-sm text-zinc-400">Last Session: {artist.lastSessionDate}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-center">
                            <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                                <p className="text-xs font-bold text-zinc-500 uppercase">Total Sessions</p>
                                <p className="text-2xl font-bold text-zinc-100">{artist.totalSessions}</p>
                            </div>
                            <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                                <p className="text-xs font-bold text-zinc-500 uppercase">Completed</p>
                                <p className="text-2xl font-bold text-green-400">{artist.completedSessions}</p>
                            </div>
                             <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                                <p className="text-xs font-bold text-zinc-500 uppercase">Avg. Cost</p>
                                <p className="text-2xl font-bold text-zinc-100">${(Number(artist.avgSessionCost) || 0).toFixed(0)}</p>
                            </div>
                            <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                                <p className="text-xs font-bold text-zinc-500 uppercase">Allocation Rem.</p>
                                <p className="text-2xl font-bold text-orange-400">{artist.allocationRemaining !== null ? `$${artist.allocationRemaining.toLocaleString()}`: 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-sm">
                            <span className="text-zinc-500">Activity Trend:</span>
                            {(artist.totalSessions === 0) && (artist.completedSessions === 0) ? (
                                <span className="text-zinc-500 font-semibold text-xs">Inactive</span>
                            ) : artist.trend === 'up' ? (
                                <TrendingUpIcon className="w-5 h-5 text-green-500"/>
                            ) : artist.trend === 'down' ? (
                                <TrendingDownIcon className="w-5 h-5 text-red-500" />
                            ) : (
                                <div className="w-5 h-5 text-zinc-500 font-bold text-center">-</div>
                            )}
                        </div>
                    </div>
                ))}
                 {performanceData.artists.length === 0 && (
                    <div className="md:col-span-2 lg:col-span-3 text-center p-10 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <p className="text-zinc-500">No artist performance data to display.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabelPerformance;
