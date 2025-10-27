import React, { useState, useEffect } from 'react';
import type { AnalyticsData } from '../types';
import * as apiService from '../services/apiService';
import { DollarSignIcon, EyeIcon, UsersIcon, CalendarIcon } from './icons';

interface AnalyticsDashboardProps {
    userId: string;
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

const BarChart: React.FC<{ data: { date: string; revenue: number }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.revenue), 0);
    return (
        <div className="bg-zinc-800/50 p-6 rounded-lg border border-zinc-700/50">
            <h3 className="font-bold text-lg mb-4">Revenue Over Time (Last 30 Days)</h3>
            <div className="flex gap-1 h-48 items-end">
                {data.map(d => (
                    <div
                        key={d.date}
                        className="flex-1 bg-orange-500 rounded-t-sm hover:bg-orange-400 transition-colors"
                        style={{ height: `${(d.revenue / maxValue) * 100}%` }}
                        title={`${d.date}: $${d.revenue.toFixed(2)}`}
                    ></div>
                ))}
            </div>
        </div>
    );
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ userId }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        apiService.fetchAnalyticsData(userId)
            .then(setData)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [userId]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <svg className="animate-spin h-10 w-10 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }
    
    if (!data) {
        return <div className="text-center text-red-400">Could not load analytics data.</div>;
    }

    const { kpis, revenueOverTime } = data;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Revenue" value={`$${kpis.totalRevenue.toLocaleString()}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                <StatCard label="Profile Views" value={kpis.profileViews.toLocaleString()} icon={<EyeIcon className="w-6 h-6 text-blue-400" />} />
                <StatCard label="New Followers" value={kpis.newFollowers.toLocaleString()} icon={<UsersIcon className="w-6 h-6 text-purple-400" />} />
                <StatCard label="Total Bookings" value={kpis.bookings.toLocaleString()} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
            </div>
            <BarChart data={revenueOverTime} />
        </div>
    );
};

export default AnalyticsDashboard;
