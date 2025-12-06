import React, { useState, useEffect, useMemo } from 'react';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { RosterMember, Booking, LabelBudgetOverview } from '../../types';
import { CalendarIcon, DollarSignIcon, TrendingUpIcon, TrendingDownIcon } from '../icons';
import { USER_SILHOUETTE_URL } from '../../constants';

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
    const [roster, setRoster] = useState<RosterMember[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [budget, setBudget] = useState<LabelBudgetOverview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;
        const load = async () => {
            setLoading(true);
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
                console.error("Error loading performance data:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentUser]);

    const performanceData = useMemo(() => {
        if (roster.length === 0) return { artists: [], summary: {} };

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
                if (diff1 < diff2) trend = 'up';
                if (diff1 > diff2) trend = 'down';
            } else if (sortedBookings.length > 0) {
                trend = 'up';
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
        const totalCostOfCompleted = bookings.filter(b => b.status === 'COMPLETED').reduce((sum, b) => sum + b.total_cost, 0);
        const avgCostAcrossLabel = totalCompleted > 0 ? totalCostOfCompleted / totalCompleted : 0;
        
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
                            <img src={artist.image_url || USER_SILHOUETTE_URL} alt={artist.name} className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700"/>
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
                                <p className="text-2xl font-bold text-zinc-100">${artist.avgSessionCost.toFixed(0)}</p>
                            </div>
                            <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                                <p className="text-xs font-bold text-zinc-500 uppercase">Allocation Rem.</p>
                                <p className="text-2xl font-bold text-orange-400">{artist.allocationRemaining !== null ? `$${artist.allocationRemaining.toLocaleString()}`: 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-sm">
                            <span className="text-zinc-500">Activity Trend:</span>
                            {artist.trend === 'up' ? <TrendingUpIcon className="w-5 h-5 text-green-500"/> : artist.trend === 'down' ? <TrendingDownIcon className="w-5 h-5 text-red-500" /> : <div className="w-5 h-5 text-zinc-500 font-bold text-center">-</div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LabelPerformance;
