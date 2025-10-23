import React, { useState, useEffect } from 'react';
import type { AnalyticsData, Stoodio, Engineer, Producer } from '../types';
import { fetchAnalyticsData } from '../services/apiService';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { DollarSignIcon, UsersIcon, EyeIcon, CalendarIcon } from './icons';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

interface AnalyticsDashboardProps {
    user: Stoodio | Engineer | Producer;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-zinc-800/50 p-4 rounded-xl flex items-center gap-4 border border-zinc-700/50">
        <div className="bg-orange-500/10 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-zinc-400 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-zinc-100">{value}</p>
        </div>
    </div>
);

const ChartContainer: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
        <h3 className="text-xl font-bold text-zinc-100 mb-4">{title}</h3>
        {children}
    </div>
);

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-zinc-800/50 rounded-xl animate-pulse"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-zinc-800/50 rounded-lg animate-pulse"></div>
            <div className="h-80 bg-zinc-800/50 rounded-lg animate-pulse"></div>
        </div>
    </div>
);

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ user }) => {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [timeframe, setTimeframe] = useState<30 | 60 | 90>(30);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await fetchAnalyticsData(user.id, timeframe);
            setAnalyticsData(data);
            setLoading(false);
        };
        loadData();
    }, [user.id, timeframe]);

    if (loading || !analyticsData) {
        return <LoadingSkeleton />;
    }

    const { kpis, revenueOverTime, engagementOverTime, revenueSources } = analyticsData;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { ticks: { color: '#a1a1aa' }, grid: { color: 'rgba(161, 161, 170, 0.1)' } },
            y: { ticks: { color: '#a1a1aa' }, grid: { color: 'rgba(161, 161, 170, 0.1)' } },
        },
    };
    
    const revenueChartData = {
        labels: revenueOverTime.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [{
            label: 'Revenue',
            data: revenueOverTime.map(d => d.revenue),
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.2)',
            fill: true,
            tension: 0.4,
        }],
    };

    const engagementChartData = {
        labels: engagementOverTime.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [
            { label: 'Views', data: engagementOverTime.map(d => d.views), backgroundColor: '#3b82f6' },
            { label: 'Followers', data: engagementOverTime.map(d => d.followers), backgroundColor: '#8b5cf6' },
            { label: 'Likes', data: engagementOverTime.map(d => d.likes), backgroundColor: '#ec4899' },
        ]
    };

    const doughnutChartData = {
        labels: revenueSources.map(s => s.name),
        datasets: [{
            data: revenueSources.map(s => s.revenue),
            backgroundColor: ['#f97316', '#8b5cf6', '#ec4899'],
            borderColor: '#27272a',
            borderWidth: 2,
        }],
    };
    
    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: { color: '#e4e4e7' }
            }
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-zinc-100">Performance Overview</h2>
                <div className="flex items-center bg-zinc-900/50 rounded-lg p-1 border border-zinc-700">
                    {[30, 60, 90].map(days => (
                        <button 
                            key={days}
                            onClick={() => setTimeframe(days as 30|60|90)}
                            className={`px-3 py-1 text-sm font-semibold rounded-md ${timeframe === days ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-zinc-700'}`}
                        >
                            {days} days
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Revenue" value={`$${kpis.totalRevenue.toLocaleString()}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400"/>} />
                <StatCard label="Profile Views" value={kpis.profileViews.toLocaleString()} icon={<EyeIcon className="w-6 h-6 text-blue-400"/>} />
                <StatCard label="New Followers" value={kpis.newFollowers.toLocaleString()} icon={<UsersIcon className="w-6 h-6 text-purple-400"/>} />
                <StatCard label="Bookings / Sales" value={kpis.bookings.toLocaleString()} icon={<CalendarIcon className="w-6 h-6 text-orange-400"/>} />
            </div>

            <ChartContainer title="Revenue Over Time">
                <div className="h-72"><Line options={chartOptions as any} data={revenueChartData} /></div>
            </ChartContainer>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <ChartContainer title="Engagement Reach">
                        <div className="h-80"><Bar options={chartOptions as any} data={engagementChartData} /></div>
                    </ChartContainer>
                </div>
                <div className="lg:col-span-2">
                     <ChartContainer title="Revenue Sources">
                        <div className="h-80"><Doughnut data={doughnutChartData} options={doughnutOptions as any} /></div>
                    </ChartContainer>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;