import React from 'react';

// --- Local Icon Definitions (to avoid modifying icons.tsx) ---
const ChartBarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);
const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" />
    </svg>
);
const DollarSignIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182.553-.44 1.282-.659 2.003-.659s1.45.22 2.003.659c1.106.879 1.106 2.303 0 3.182l-.78.585m-7.056.659C3.12 13.623 2.25 15.054 2.25 16.5c0 1.152.486 2.203 1.284 2.924.8.72 1.848 1.172 3.024 1.172h.003c1.141 0 2.115-.417 2.847-1.106.732-.689 1.196-1.662 1.196-2.734 0-1.072-.464-2.045-1.196-2.734C9.373 13.262 8.4 12.845 7.423 12.845h-.003c-1.176 0-2.224.452-3.024 1.172z" />
    </svg>
);
const TrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
);
const TrendingDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-5.94 2.28m5.94-2.28l-2.28-5.941" />
    </svg>
);
// --- End Local Icons ---

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

const mockArtistsPerformance = [
    { id: '1', name: 'Luna Vance', totalSessions: 25, completedSessions: 22, avgCost: 350, trend: 'up' },
    { id: '2', name: 'Kid Astro', totalSessions: 40, completedSessions: 38, avgCost: 500, trend: 'up' },
    { id: '3', name: 'Echo & The Vibe', totalSessions: 15, completedSessions: 12, avgCost: 280, trend: 'down' },
];

export default function LabelPerformance() {
  return (
    <div className="space-y-8 animate-fade-in">
        <h1 className="text-3xl font-extrabold text-zinc-100">Roster Performance</h1>

        {/* Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total Sessions (Label)" value="80" icon={<CalendarIcon className="w-6 h-6"/>} />
            <StatCard label="Avg Session Cost" value="$376.67" icon={<DollarSignIcon className="w-6 h-6"/>} />
            <StatCard label="Most Active" value="Kid Astro" icon={<TrendingUpIcon className="w-6 h-6"/>} />
            <StatCard label="Least Active" value="Echo & The Vibe" icon={<TrendingDownIcon className="w-6 h-6"/>} />
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
                            <tr key={artist.id} className="hover:bg-zinc-800/40">
                                <td className="px-6 py-4 font-medium text-zinc-100">{artist.name}</td>
                                <td className="px-6 py-4 text-center font-semibold">{artist.totalSessions}</td>
                                <td className="px-6 py-4 text-center font-semibold text-green-400">{artist.completedSessions}</td>
                                <td className="px-6 py-4 text-center font-mono">${artist.avgCost.toFixed(2)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center">
                                        {artist.trend === 'up' 
                                            ? <TrendingUpIcon className="w-5 h-5 text-green-500" />
                                            : <TrendingDownIcon className="w-5 h-5 text-red-500" />
                                        }
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Chart Placeholder */}
        <div className="cardSurface p-6">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Spending Chart (Placeholder)</h2>
            <div className="h-64 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                <p className="text-zinc-500">Chart visualization will be rendered here.</p>
            </div>
        </div>
    </div>
  );
}
