
import React from 'react';
import type { DashboardStats } from '../types';
import { MoneyIcon, UsersIcon, CalendarIcon, MicrophoneIcon, SoundWaveIcon, HouseIcon } from './icons';

interface FinancialDashboardProps {
    stats: DashboardStats | null;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode, color: string }> = ({ label, value, icon, color }) => (
    <div className="bg-zinc-800 p-6 rounded-xl shadow-md flex items-center gap-4 border border-zinc-700">
        <div className={`p-4 rounded-lg ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-slate-400 text-sm font-medium">{label}</p>
            <p className="text-3xl font-bold text-slate-100">{value}</p>
        </div>
    </div>
);


const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ stats }) => {
    if (!stats) {
        return <div>Loading stats...</div>;
    }

    return (
        <div>
            <h1 className="text-4xl font-bold text-slate-100 mb-2">Dashboard</h1>
            <p className="text-slate-400 mb-8">Live overview of platform metrics.</p>
            
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    label="Total Revenue" 
                    value={`$${stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                    icon={<MoneyIcon className="w-7 h-7 text-green-300" />}
                    color="bg-green-500/20"
                />
                <StatCard 
                    label="Platform Fees Collected" 
                    value={`$${stats.platformFees.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                    icon={<MoneyIcon className="w-7 h-7 text-green-300" />}
                    color="bg-green-500/20"
                />
                 <StatCard 
                    label="Total Bookings" 
                    value={stats.totalBookings.toLocaleString()}
                    icon={<CalendarIcon className="w-7 h-7 text-yellow-300" />}
                    color="bg-yellow-500/20"
                />
                <StatCard 
                    label="Artists" 
                    value={stats.artistCount.toLocaleString()}
                    icon={<MicrophoneIcon className="w-7 h-7 text-purple-300" />}
                    color="bg-purple-500/20"
                />
                 <StatCard 
                    label="Engineers" 
                    value={stats.engineerCount.toLocaleString()}
                    icon={<SoundWaveIcon className="w-7 h-7 text-orange-300" />}
                    color="bg-orange-500/20"
                />
                 <StatCard 
                    label="Stoodioz" 
                    value={stats.stoodioCount.toLocaleString()}
                    icon={<HouseIcon className="w-7 h-7 text-red-300" />}
                    color="bg-red-500/20"
                />
            </div>

            <div className="mt-8 bg-zinc-800 border border-zinc-700 rounded-lg p-8 text-center">
                <h2 className="text-2xl font-semibold text-slate-200">Revenue & Growth Charts</h2>
                <p className="text-slate-400 mt-2">
                    This area will contain charts for revenue over time, user growth, and booking trends.
                </p>
            </div>
        </div>
    );
};

export default FinancialDashboard;