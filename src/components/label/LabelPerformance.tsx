
import React, { useState, useEffect, useMemo } from 'react';
import { useAppState } from '../contexts/AppContext';
import { fetchLabelPerformance } from '../services/apiService';
import { getSupabase } from '../lib/supabase';
import { CalendarIcon, DollarSignIcon, TrendingUpIcon } from '../icons';

// Local icon definition to avoid modifying other files if missing
const TrendingDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-5.94 2.28m5.94-2.28l-2.28-5.941" />
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
    const [performance, setPerformance] = useState<any[]>([]);
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
                const data = await fetchLabelPerformance(currentUser.id);
                setPerformance(data || []);
            } catch (err) {
                console.error("Error in load performance:", err);
                setError("Failed to fetch performance data.");
            }
            setLoading(false);
        }
        load();
    }, [currentUser?.id]);

    // Real-time subscription
    useEffect(() => {
        const supabase = getSupabase();
        if (!supabase || !currentUser?.id) return;

        const channel = supabase
            .channel("label-performance-updates")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "bookings" 
                },
                async () => {
                    const data = await fetchLabelPerformance(currentUser.id);
                    setPerformance(data || []);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser?.id]);


    // Computed metrics for summary cards
    const { totalSessions, avgSessionCost, mostActive, leastActive } = useMemo(() => {
        if (performance.length === 0) {
            return { totalSessions: 0, avgSessionCost: 0, mostActive: null, leastActive: null };
        }

        const totalSessions = performance.reduce(
            (sum, a) => sum + Number(a.total_sessions || 0),
            0
        );

        const costs = performance.map(a => Number(a.avg_cost || 0)).filter(n => n > 0);
        const avgSessionCost = costs.length === 0 ? 0 : costs.reduce((a, b) => a + b, 0) / costs.length;

        const mostActive = performance.reduce((max, a) =>
            (a.total_sessions || 0) > (max.total_sessions || 0) ? a : max
          );

        const leastActive = performance.reduce((min, a) =>
            (a.total_sessions || 0) < (min.total_sessions || 0) ? a : min
          );

        return { totalSessions, avgSessionCost, mostActive, leastActive };
    }, [performance]);


    if (loading) {
        return <div className="text-center text-zinc-400 p-10">Loading performance data...</div>;
    }

    if (error) {
        return <div className="text-center text-red-400 p-10">{error}</div>;
    }

    if (!loading && performance.length === 0) {
        return (
            <div className="cardSurface p-10 text-center text-zinc-500">
                No performance data yet. Stats will appear here after your roster completes bookings.
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="text-3xl font-extrabold text-zinc-100">Roster Performance</h1>

            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Total Sessions (Label)" 
                    value={totalSessions.toString()} 
                    icon={<CalendarIcon className="w-6 h-6" />} 
                />
                <StatCard 
                    label="Avg Session Cost" 
                    value={`$${avgSessionCost.toFixed(2)}`} 
                    icon={<DollarSignIcon className="w-6 h-6" />} 
                />
                <StatCard 
                    label="Most Active Artist" 
                    value={mostActive ? mostActive.artist_name : "—"} 
                    icon={<TrendingUpIcon className="w-6 h-6" />} 
                />
                 <StatCard 
                    label="Least Active Artist" 
                    value={leastActive ? leastActive.artist_name : "—"} 
                    icon={<TrendingDownIcon className="w-6 h-6" />} 
                />
            </div>
            
            {/* Artist Grid */}
            <div className="cardSurface overflow-hidden">
                <h3 className="text-xl font-bold text-zinc-100 p-6">Artist Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-800/50 text-zinc-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Artist</th>
                                <th className="px-6 py-3 text-center">Total Sessions</th>
                                <th className="px-6 py-3 text-center">Completed</th>
                                <th className="px-6 py-3 text-center">Avg Cost</th>
                                <th className="px-6 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-zinc-300">
                            {performance.map((artist: any) => (
                                <tr key={artist.artist_id} className="hover:bg-zinc-800/40">
                                    <td className="px-6 py-4 font-medium text-zinc-100">{artist.artist_name}</td>
                                    <td className="px-6 py-4 text-center font-semibold">{artist.total_sessions}</td>
                                    <td className="px-6 py-4 text-center font-semibold text-green-400">{artist.completed_sessions}</td>
                                    <td className="px-6 py-4 text-center font-mono">${Number(artist.avg_cost).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center">
                                        {artist.completed_sessions > 0 ? (
                                            <span className="text-green-400 font-bold">Active</span>
                                        ) : (
                                            <span className="text-zinc-500">No Data</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

             {/* Chart Placeholder */}
            <div className="cardSurface p-10 text-center">
                <p className="text-zinc-500 font-semibold">Chart visualization will be rendered here.</p>
            </div>
        </div>
    );
};

export default LabelPerformance;
