import React from 'react';
// Assuming these icons exist from previous files
import { CalendarIcon, DollarSignIcon, TrendingUpIcon, ChartBarIcon } from '../icons';

// Mock data for placeholder UI
const mockArtistsPerformance = [
    { artist_id: '1', artist_name: 'Luna Vance', total_sessions: 25, completed_sessions: 24, avg_cost: 450.75, trend: 'up' },
    { artist_id: '2', artist_name: 'Kid Astro', total_sessions: 42, completed_sessions: 40, avg_cost: 380.50, trend: 'up' },
    { artist_id: '3', artist_name: 'The Midnight Echo', total_sessions: 18, completed_sessions: 15, avg_cost: 620.00, trend: 'down' },
    { artist_id: '4', artist_name: 'Velvet Voices', total_sessions: 12, completed_sessions: 12, avg_cost: 250.00, trend: 'stable' },
];

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
    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="text-3xl font-extrabold text-zinc-100">Label Performance</h1>

            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard label="Total Sessions (Label)" value="80" icon={<CalendarIcon className="w-6 h-6"/>} />
                <StatCard label="Avg Session Cost" value="$376.67" icon={<DollarSignIcon className="w-6 h-6"/>} />
                <StatCard label="Most Active Artist" value="Kid Astro" icon={<TrendingUpIcon className="w-6 h-6"/>} />
            </div>

            {/* Artist Table */}
            <div className="cardSurface overflow-hidden">
                <h2 className="text-xl font-bold text-zinc-100 p-6">Artist Breakdown</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-800/50 text-zinc-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Artist</th>
                                <th className="px-6 py-3 text-center">Total Sessions</th>
                                <th className="px-6 py-3 text-center">Completed</th>
                                <th className="px-6 py-3 text-center">Avg. Cost</th>
                                <th className="px-6 py-3 text-center rounded-tr-lg">Trend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-zinc-300">
                            {mockArtistsPerformance.map(artist => (
                                <tr key={artist.artist_id} className="hover:bg-zinc-800/40">
                                    <td className="px-6 py-4 font-medium text-zinc-100">{artist.artist_name}</td>
                                    <td className="px-6 py-4 text-center font-semibold">{artist.total_sessions}</td>
                                    <td className="px-6 py-4 text-center font-semibold text-green-400">{artist.completed_sessions}</td>
                                    <td className="px-6 py-4 text-center font-mono">${artist.avg_cost.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center">
                                        {artist.trend === 'up' && <TrendingUpIcon className="w-5 h-5 text-green-500 mx-auto" />}
                                        {artist.trend === 'down' && <TrendingUpIcon className="w-5 h-5 text-red-500 mx-auto transform rotate-180" />}
                                        {artist.trend === 'stable' && <span className="text-zinc-500 font-bold">-</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Chart Placeholder */}
            <div className="cardSurface p-6">
                <h2 className="text-xl font-bold text-zinc-100 mb-4">Performance Chart</h2>
                <div className="h-64 bg-zinc-800/50 rounded-lg flex items-center justify-center border border-zinc-700/50">
                    <div className="text-center text-zinc-500">
                        <ChartBarIcon className="w-10 h-10 mx-auto mb-2" />
                        <p>Chart visualization will be rendered here.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabelPerformance;
