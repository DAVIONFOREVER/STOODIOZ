
import React, { useState, useEffect, useMemo } from 'react';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { LabelBudgetOverview, Booking, Transaction } from '../types';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DollarSignIcon, ChartBarIcon, CalendarIcon, UsersIcon } from './icons';
import { getProfileImageUrl } from '../constants';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// Local icon definition since we cannot modify icons.tsx
const TrendingUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
);

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; trend?: string; trendColor?: string }> = ({ label, value, icon, trend, trendColor }) => (
    <div className="bg-zinc-800 border border-zinc-700/50 p-6 rounded-xl flex items-center justify-between shadow-lg">
        <div>
            <p className="text-zinc-400 text-sm font-medium mb-1">{label}</p>
            <p className="text-2xl font-bold text-zinc-100">{value}</p>
            {trend && <p className={`text-xs mt-1 ${trendColor || 'text-zinc-500'}`}>{trend}</p>}
        </div>
        <div className="p-3 bg-zinc-700/50 rounded-lg text-zinc-300">
            {icon}
        </div>
    </div>
);

const LabelAnalytics: React.FC = () => {
    const { currentUser, userRole } = useAppState();
    const [budgetOverview, setBudgetOverview] = useState<LabelBudgetOverview | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser || userRole !== 'LABEL') {
            setLoading(false);
            return;
        }
        
        const loadData = async () => {
            setLoading(true);
            try {
                const [budgetData, bookingsData, transactionsData] = await Promise.all([
                    apiService.getLabelBudgetOverview(currentUser.id),
                    apiService.fetchLabelBookings(currentUser.id),
                    apiService.fetchLabelTransactions(currentUser.id)
                ]);

                setBudgetOverview(budgetData);
                setBookings(bookingsData || []);
                setTransactions(transactionsData || []);
            } catch (error) {
                console.error("Error loading analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [currentUser, userRole]);

    const summaryMetrics = useMemo(() => {
        if (!budgetOverview?.budget) return null;

        const totalSpent = budgetOverview.budget.amount_spent;
        const totalBudget = budgetOverview.budget.total_budget;
        const remaining = totalBudget - totalSpent;
        
        const completedSessions = bookings.filter(b => b.status === 'COMPLETED').length;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const thisMonthSpend = transactions
            .filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.amount < 0; 
            })
            .reduce((acc, t) => acc + Math.abs(t.amount), 0);

        const lastMonthSpend = transactions
            .filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
            })
            .reduce((acc, t) => acc + Math.abs(t.amount), 0);

        const spendDiff = thisMonthSpend - lastMonthSpend;
        const spendTrend = lastMonthSpend > 0 ? ((spendDiff / lastMonthSpend) * 100).toFixed(1) + '%' : 'N/A';
        const trendColor = spendDiff > 0 ? 'text-red-400' : 'text-green-400';

        return {
            totalSpent,
            remaining,
            completedSessions,
            thisMonthSpend,
            spendTrend,
            trendColor
        };
    }, [budgetOverview, bookings, transactions]);

    const chartData = useMemo(() => {
        const labels: string[] = [];
        const dataPoints: number[] = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = d.toLocaleDateString('en-US', { month: 'short' });
            labels.push(monthName);

            const monthlyTotal = transactions
                .filter(t => {
                    const tDate = new Date(t.date);
                    return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear();
                })
                .reduce((acc, t) => acc + Math.abs(t.amount), 0); 
            
            dataPoints.push(monthlyTotal);
        }

        return {
            labels,
            datasets: [
                {
                    label: 'Monthly Spending',
                    data: dataPoints,
                    borderColor: '#f97316', 
                    backgroundColor: 'rgba(249, 115, 22, 0.2)',
                    fill: true,
                    tension: 0.4,
                }
            ]
        };
    }, [transactions]);

    const artistBreakdown = useMemo(() => {
        if (!budgetOverview?.artists) return [];
        return budgetOverview.artists.map(artist => {
            const sessionCount = bookings.filter(b => 
                b.artist?.id === artist.artist_id || 
                (b as any).artist_id === artist.artist_id
            ).length;

            return {
                ...artist,
                sessionCount
            };
        }).sort((a, b) => b.amount_spent - a.amount_spent);
    }, [budgetOverview, bookings]);

    if (loading) {
        return <div className="p-20 text-center text-zinc-500">Loading analytics...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">Analytics & Reports</h1>
                    <p className="text-zinc-400 mt-1">Insights into spending and roster activity.</p>
                </div>
                <div className="text-sm text-zinc-500">
                    Data updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Total Spent (YTD)" 
                    value={`$${(summaryMetrics?.totalSpent || 0).toLocaleString()}`} 
                    icon={<DollarSignIcon className="w-6 h-6 text-orange-400" />} 
                />
                <StatCard 
                    label="Remaining Budget" 
                    value={`$${(summaryMetrics?.remaining || 0).toLocaleString()}`} 
                    icon={<ChartBarIcon className="w-6 h-6 text-green-400" />} 
                />
                <StatCard 
                    label="Sessions Completed" 
                    value={summaryMetrics?.completedSessions || 0} 
                    icon={<CalendarIcon className="w-6 h-6 text-blue-400" />} 
                />
                <StatCard 
                    label="MoM Spending" 
                    value={summaryMetrics?.spendTrend || '0%'} 
                    trend={summaryMetrics?.trendColor === 'text-green-400' ? 'Decreased' : 'Increased'}
                    trendColor={summaryMetrics?.trendColor}
                    icon={<TrendingUpIcon className="w-6 h-6 text-purple-400" />} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Spending Chart */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-zinc-100 mb-6">Spending Timeline</h2>
                    <div className="h-64 w-full">
                        <Line 
                            data={chartData} 
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: { color: '#27272a' },
                                        ticks: { color: '#a1a1aa' }
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: '#a1a1aa' }
                                    }
                                }
                            }} 
                        />
                    </div>
                </div>

                {/* Artist Breakdown */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-zinc-100 mb-6">Top Spenders</h2>
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                        {artistBreakdown.map(artist => (
                            <div key={artist.artist_id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <img src={getProfileImageUrl({ ...artist, image_url: artist.artist_image_url })} alt={artist.artist_name} className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <p className="font-bold text-sm text-zinc-200">{artist.artist_name}</p>
                                        <p className="text-xs text-zinc-400">{artist.sessionCount} sessions</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm text-zinc-200">${artist.amount_spent.toLocaleString()}</p>
                                    <p className="text-xs text-zinc-500">Spent</p>
                                </div>
                            </div>
                        ))}
                        {artistBreakdown.length === 0 && <p className="text-zinc-500 text-sm text-center">No spending data available.</p>}
                    </div>
                </div>
            </div>

            {/* Label Funded Sessions Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-zinc-100 mb-6">Label-Funded Sessions</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-800/50 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-3 rounded-l-lg">Date</th>
                                <th className="p-3">Artist</th>
                                <th className="p-3">Location</th>
                                <th className="p-3">Engineer/Producer</th>
                                <th className="p-3">Cost</th>
                                <th className="p-3 rounded-r-lg text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {bookings.map(booking => (
                                <tr key={booking.id} className="hover:bg-zinc-800/30 transition-colors">
                                    <td className="p-3 whitespace-nowrap">{new Date(booking.date).toLocaleDateString()}</td>
                                    <td className="p-3 text-zinc-200 font-medium">{booking.artist?.name || 'Unknown'}</td>
                                    <td className="p-3">{booking.stoodio?.name || 'Remote'}</td>
                                    <td className="p-3">{booking.engineer?.name || booking.producer?.name || 'N/A'}</td>
                                    <td className="p-3 font-mono text-zinc-300">${booking.total_cost.toFixed(2)}</td>
                                    <td className="p-3 text-right">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                            booking.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 
                                            booking.status === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-400' : 
                                            'bg-zinc-700 text-zinc-400'
                                        }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                             {bookings.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-zinc-500">No sessions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LabelAnalytics;
