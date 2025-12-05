import React, { useMemo, useEffect, useState } from 'react';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { ChartBarIcon, UsersIcon, DollarSignIcon, TrendingUpIcon } from '../icons';

const InsightCard: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => (
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

const LabelInsights: React.FC = () => {
    const { currentUser, userRole } = useAppState();
    const [bookings, setBookings] = useState<any[]>([]);
    const [budget, setBudget] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser || userRole !== 'LABEL') return;

        const load = async () => {
            setLoading(true);
            try {
                const [bookingsData, budgetData] = await Promise.all([
                    apiService.fetchLabelBookings(currentUser.id),
                    apiService.getLabelBudgetOverview(currentUser.id)
                ]);
                setBookings(bookingsData || []);
                setBudget(budgetData || null);
            } catch (err) {
                console.error("Insights error:", err);
            }
            setLoading(false);
        };

        load();
    }, [currentUser, userRole]);

    const insights = useMemo(() => {
        if (!budget || !budget.budget) return [];

        const totalSpend = budget.budget.amount_spent;
        const remaining = budget.budget.total_budget - totalSpend;

        const completedSessions = bookings.filter(b => b.status === 'COMPLETED').length;
        const avgSpend = totalSpend > 0 && completedSessions > 0 
            ? totalSpend / completedSessions 
            : 0;

        const artists = budget.artists || [];
        const topArtist = artists.length 
            ? artists.reduce((max: any, a: any) => a.amount_spent > max.amount_spent ? a : max, artists[0])
            : null;

        let predictions = [];
        if (remaining > 0 && avgSpend > 0) {
            const projectedSessionsRemaining = Math.floor(remaining / avgSpend);
            predictions.push(`At the current spending rate, you can fund approximately ${projectedSessionsRemaining} more sessions.`);
        } else {
            predictions.push("Insufficient data to predict remaining session capacity.");
        }

        let list = [];

        list.push({
            title: "Top Spending Artist",
            description: topArtist 
                ? `${topArtist.artist_name} has used $${topArtist.amount_spent.toLocaleString()} of their allocation.` 
                : "No artist spending data available.",
            icon: <UsersIcon className="w-6 h-6 text-blue-400" />
        });

        list.push({
            title: "Budget Overview",
            description: `Your label has spent $${totalSpend.toLocaleString()} and has $${remaining.toLocaleString()} remaining.`,
            icon: <DollarSignIcon className="w-6 h-6 text-green-400" />
        });

        list.push({
            title: "Average Cost Per Completed Session",
            description: avgSpend > 0 
                ? `Average spend is $${avgSpend.toFixed(2)} per completed session.` 
                : "Not enough completed sessions to calculate average cost.",
            icon: <ChartBarIcon className="w-6 h-6 text-purple-400" />
        });

        list.push({
            title: "AI Projection",
            description: predictions[0],
            icon: <TrendingUpIcon className="w-6 h-6 text-orange-400" />
        });

        return list;
    }, [budget, bookings]);

    if (loading) {
        return <div className="p-20 text-center text-zinc-500">Loading insights...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in pb-20">
            <h1 className="text-3xl font-bold text-zinc-100">Label Insights</h1>
            <p className="text-zinc-400 mb-6">AI-style recommendations and data-driven observations.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {insights.map((ins, index) => (
                    <InsightCard 
                        key={index}
                        title={ins.title}
                        description={ins.description}
                        icon={ins.icon}
                    />
                ))}
            </div>
        </div>
    );
};

export default LabelInsights;
