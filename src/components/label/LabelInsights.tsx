import React, { useMemo, useEffect, useState } from 'react';
import { useAppState } from '../../contexts/AppContext';
// FIX: Changed fetchRosterActivity to getRosterActivity as it is the correct exported member.
import { fetchLabelPerformance, getRosterActivity } from '../../services/apiService';
import { ChartBarIcon, UsersIcon, DollarSignIcon, TrendingUpIcon } from '../icons';

// Local icon to avoid modifying icons.tsx
const TrendingDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-5.94 2.28m5.94-2.28l-2.28-5.941" />
    </svg>
);

const InsightCard: React.FC<{ title: string; description: string | React.ReactNode; icon: React.ReactNode }> = ({ title, description, icon }) => (
    <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 shadow hover:border-orange-500/40 transition-all">
        <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-zinc-100">{title}</h3>
        </div>
        <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </div>
);

const TrendRow: React.FC<{ artistName: string; score: number; isImproving: boolean }> = ({ artistName, score, isImproving }) => (
    <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
        <span className="font-semibold text-zinc-300">{artistName}</span>
        <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500">{score} pts</span>
            {isImproving ?
                <TrendingUpIcon className="w-5 h-5 text-green-500" /> :
                <TrendingDownIcon className="w-5 h-5 text-red-500" />
            }
        </div>
    </div>
);

const LabelInsights: React.FC = () => {
    const { currentUser } = useAppState();
    const [performance, setPerformance] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (!currentUser?.id) return;
            setLoading(true);

            const perf = await fetchLabelPerformance(currentUser.id);
            // FIX: Changed fetchRosterActivity to getRosterActivity to match the imported function name.
            const act = await getRosterActivity(currentUser.id);

            setPerformance(perf || []);
            setActivity(act || []);
            setLoading(false);
        }
        load();
    }, [currentUser?.id]);

    const mostActive = useMemo(() => performance.length > 0 ? performance.reduce((max, a) => a.total_sessions > max.total_sessions ? a : max) : null, [performance]);
    
    const leastActive = useMemo(() => performance.length > 0 ? performance.reduce((min, a) => a.total_sessions < min.total_sessions ? a : min) : null, [performance]);

    const bestCompletionRate = useMemo(() => {
        if (performance.length === 0) return null;
        return performance.reduce((best, a) => {
            const rate = a.completed_sessions / (a.total_sessions || 1);
            const bestRate = best.rate || 0;
            return rate > bestRate ? { ...a, rate } : best;
        }, { artist_name: '', rate: 0 });
    }, [performance]);
    
    const avgCost = useMemo(() => {
        const costs = performance.map(a => Number(a.avg_cost || 0)).filter(c => c > 0);
        if (costs.length === 0) return 0;
        return costs.reduce((a, b) => a + b) / costs.length;
    }, [performance]);

    const improving = useMemo(() => {
        if (activity.length === 0) return [];
        return activity
            .filter(a => a.output_score > 0)
            .sort((a, b) => b.output_score - a.output_score)
            .slice(0, 3)
            .map(act => ({ ...act, artist_name: performance.find(p => p.artist_id === act.user_id)?.artist_name || '...' }));
    }, [activity, performance]);

    const declining = useMemo(() => {
        if (activity.length === 0) return [];
        return activity
            .filter(a => a.output_score > 0)
            .sort((a, b) => a.output_score - b.output_score)
            .slice(0, 3)
            .map(act => ({ ...act, artist_name: performance.find(p => p.artist_id === act.user_id)?.artist_name || '...' }));
    }, [activity, performance]);


    if (loading) return <p className='text-zinc-400 p-10 text-center'>Loading insights...</p>;

    if (performance.length === 0) return (
        <div className='p-10 text-center text-zinc-500 cardSurface'>
            No performance data yet. Insights will appear after your roster completes some sessions.
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in pb-20">
            <h1 className="text-3xl font-bold text-zinc-100">Label Insights</h1>
            <p className="text-zinc-400 mb-6">AI-style recommendations and data-driven observations.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InsightCard
                    title="Highest Session Count"
                    description={
                        <>
                            <span className="font-bold text-white">{mostActive?.artist_name || 'N/A'}</span> leads with <span className="font-bold text-white">{mostActive?.total_sessions || 0}</span> sessions.
                        </>
                    }
                    icon={<TrendingUpIcon className="w-6 h-6 text-green-400" />}
                />
                <InsightCard
                    title="Lowest Session Count"
                    description={
                        <>
                            <span className="font-bold text-white">{leastActive?.artist_name || 'N/A'}</span> has the fewest sessions with <span className="font-bold text-white">{leastActive?.total_sessions || 0}</span>.
                        </>
                    }
                    icon={<TrendingDownIcon className="w-6 h-6 text-red-400" />}
                />
                <InsightCard
                    title="Most Efficient"
                    description={
                        <>
                            <span className="font-bold text-white">{bestCompletionRate?.artist_name || 'N/A'}</span> has the best completion rate at <span className="font-bold text-white">{((bestCompletionRate?.rate || 0) * 100).toFixed(0)}%</span>.
                        </>
                    }
                    icon={<UsersIcon className="w-6 h-6 text-blue-400" />}
                />
                <InsightCard
                    title="Average Session Cost"
                    description={
                        <>
                            The average session cost across all active artists is <span className="font-bold text-white">${avgCost.toFixed(2)}</span>.
                        </>
                    }
                    icon={<DollarSignIcon className="w-6 h-6 text-purple-400" />}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-800">
                <div className="cardSurface p-6">
                    <h3 className="text-lg font-bold text-zinc-100 mb-4">Top 3 Rising Artists (by Output Score)</h3>
                    <div className="space-y-2">
                        {improving.length > 0 ? improving.map(artist => (
                            <TrendRow key={artist.user_id} artistName={artist.artist_name} score={artist.output_score} isImproving={true} />
                        )) : <p className="text-zinc-500 text-sm">Not enough activity to show trends.</p>}
                    </div>
                </div>
                <div className="cardSurface p-6">
                    <h3 className="text-lg font-bold text-zinc-100 mb-4">Top 3 Declining Artists (by Output Score)</h3>
                    <div className="space-y-2">
                        {declining.length > 0 ? declining.map(artist => (
                            <TrendRow key={artist.user_id} artistName={artist.artist_name} score={artist.output_score} isImproving={false} />
                        )) : <p className="text-zinc-500 text-sm">No declining trends detected.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabelInsights;
