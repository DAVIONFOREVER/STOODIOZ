import React, { useState, useEffect, useMemo } from 'react';
import { DollarSignIcon, ChartBarIcon, CalendarIcon, BanknotesIcon, ArrowUpCircleIcon, CheckCircleIcon, PlusCircleIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { LabelContract, LabelBudgetOverview, Transaction, LabelBudgetMode } from '../types';

// Visual Mock Data for Sony Demo
const MOCK_REVENUE_METRICS = {
    totalRevenue: 245000000.00,
    monthlyRevenue: 18500000.00,
    pendingPayouts: 4200000.00,
    byArtist: [
        { id: '1', name: 'Beyoncé', image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Beyonc%C3%A9_at_The_Lion_King_European_Premiere_2019.png', amount: 85200000, percentage: 35 },
        { id: '2', name: 'Harry Styles', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Harry_Styles_Love_on_Tour_2022.jpg/800px-Harry_Styles_Love_on_Tour_2022.jpg', amount: 55500000, percentage: 22 },
        { id: '3', name: 'Travis Scott', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Travis_Scott_2016.jpg/800px-Travis_Scott_2016.jpg', amount: 48400000, percentage: 19 },
    ],
    byType: [
        { type: 'Streaming Royalties', amount: 145000000, percentage: 59 },
        { type: 'Sync & Licensing', amount: 45000000, percentage: 18 },
        { type: 'Physical Sales', amount: 35000000, percentage: 14 },
    ]
};

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; subtext?: string }> = ({ label, value, icon, subtext }) => (
    <div className="bg-zinc-800 border border-zinc-700/50 p-6 rounded-xl flex items-center gap-4 shadow-lg hover:border-orange-500/30 transition-colors">
        <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400">
            {icon}
        </div>
        <div>
            <p className="text-zinc-400 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-zinc-100">{value}</p>
            {subtext && <p className="text-xs text-green-400 mt-1">{subtext}</p>}
        </div>
    </div>
);

const LabelFinancials: React.FC = () => {
    const { currentUser, userRole } = useAppState();
    const [contracts, setContracts] = useState<LabelContract[]>([]);
    const [budgetOverview, setBudgetOverview] = useState<LabelBudgetOverview | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const [budgetMode, setBudgetMode] = useState<LabelBudgetMode>('MANUAL');
    const [topUpAmount, setTopUpAmount] = useState<string>('');
    const [topUpNote, setTopUpNote] = useState<string>('');
    
    const loadData = async () => {
        if (!currentUser || userRole !== 'LABEL') return;
        setLoading(true);
        try {
            const [contractsData, budgetData, transactionsData] = await Promise.all([
                apiService.fetchLabelContracts(currentUser.id),
                apiService.getLabelBudgetOverview(currentUser.id),
                apiService.fetchLabelTransactions(currentUser.id)
            ]);

            setContracts(contractsData);
            setBudgetOverview(budgetData);
            setTransactions(transactionsData);

            if (budgetData?.budget) {
                setBudgetMode(budgetData.budget.budget_mode || 'MANUAL');
            }
        } catch (error) {
            console.error("Error loading financials:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentUser, userRole]);

    const remainingFunds = useMemo(() => {
        const total = budgetOverview?.budget?.total_budget || 0;
        const spent = budgetOverview?.budget?.amount_spent || 0;
        return total - spent;
    }, [budgetOverview]);

    const handleTopUp = async () => {
        if (!currentUser || !topUpAmount) return;
        const amount = parseFloat(topUpAmount);
        try {
            await apiService.addLabelFunds(currentUser.id, amount, topUpNote || 'Manual Top Up');
            setTopUpAmount('');
            setTopUpNote('');
            alert("Funds added successfully. (Live Sync Pending)");
            loadData();
        } catch (error) {
            alert("Failed to add funds.");
        }
    };

    if (loading) {
        return (
             <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
                <p className="text-zinc-500">Syncing ledger...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in pb-20">
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">Global P&L</h1>
                <p className="text-zinc-400 mt-1">Live financial monitoring for Sony Music rosters.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Annual Revenue (YTD)" 
                    value={`$${MOCK_REVENUE_METRICS.totalRevenue.toLocaleString()}`} 
                    icon={<DollarSignIcon className="w-6 h-6" />} 
                    subtext="+12% YoY Growth"
                />
                <StatCard 
                    label="Division Payouts" 
                    value={`$${MOCK_REVENUE_METRICS.monthlyRevenue.toLocaleString()}`} 
                    icon={<CalendarIcon className="w-6 h-6" />} 
                />
                <StatCard 
                    label="Pending Royalties" 
                    value={`$${MOCK_REVENUE_METRICS.pendingPayouts.toLocaleString()}`} 
                    icon={<BanknotesIcon className="w-6 h-6" />} 
                />
                <StatCard 
                    label="Roster Budget Rem." 
                    value={`$${remainingFunds.toLocaleString()}`} 
                    icon={<ArrowUpCircleIcon className="w-6 h-6" />} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <PlusCircleIcon className="w-5 h-5 text-green-400" /> Capital Allocation
                    </h2>
                    <div className="space-y-4">
                        <input 
                            type="number" 
                            value={topUpAmount}
                            onChange={(e) => setTopUpAmount(e.target.value)}
                            placeholder="Amount ($)"
                            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg p-3 outline-none focus:border-green-500"
                        />
                        <input 
                            type="text" 
                            value={topUpNote}
                            onChange={(e) => setTopUpNote(e.target.value)}
                            placeholder="GL Code / Note"
                            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg p-3 outline-none focus:border-green-500"
                        />
                        <button 
                            onClick={handleTopUp}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            Authorize Transfer
                        </button>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-purple-400" /> Revenue Split
                    </h2>
                    <div className="space-y-6">
                        {MOCK_REVENUE_METRICS.byType.map((item, index) => (
                            <div key={index}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-zinc-300 font-medium">{item.type}</span>
                                    <span className="text-zinc-400">{item.percentage}%</span>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full" 
                                        style={{ width: `${item.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-zinc-100 mb-6">Ledger Activity</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-800/50 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-3">Date</th>
                                <th className="p-3">Description</th>
                                <th className="p-3 text-right">Amount</th>
                                <th className="p-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {transactions.length > 0 ? transactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-zinc-800/30 transition-colors">
                                    <td className="p-3">{new Date(tx.date).toLocaleDateString()}</td>
                                    <td className="p-3 text-zinc-300">{tx.description}</td>
                                    <td className={`p-3 text-right font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {tx.amount > 0 ? '+' : ''}${tx.amount.toLocaleString()}
                                    </td>
                                    <td className="p-3 text-right uppercase font-bold text-[10px]">
                                        {tx.status}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="p-10 text-center text-zinc-600">No live ledger entries found. Waiting for transactions...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LabelFinancials;