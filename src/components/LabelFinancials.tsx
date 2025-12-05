
import React, { useState, useEffect } from 'react';
import { DollarSignIcon, ChartBarIcon, CalendarIcon, UsersIcon, BanknotesIcon, ArrowUpCircleIcon, BriefcaseIcon, CheckCircleIcon, PlusCircleIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { LabelContract, LabelBudgetOverview, Transaction, LabelBudgetMode } from '../types';
import { TransactionCategory } from '../types';

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

    // Budget Mode State
    const [budgetMode, setBudgetMode] = useState<LabelBudgetMode>('MANUAL');
    const [monthlyAllowance, setMonthlyAllowance] = useState<number>(0);
    const [resetDay, setResetDay] = useState<number>(1);
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
                setMonthlyAllowance(budgetData.budget.monthly_allowance || 0);
                setResetDay(budgetData.budget.reset_day || 1);
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

    const handleSaveBudgetSettings = async () => {
        if (!currentUser) return;
        try {
            await apiService.updateLabelBudgetMode(currentUser.id, budgetMode, monthlyAllowance, resetDay);
            alert("Budget settings updated.");
            loadData();
        } catch (error) {
            console.error("Failed to update budget settings:", error);
            alert("Failed to update settings.");
        }
    };

    const handleTopUp = async () => {
        if (!currentUser || !topUpAmount) return;
        const amount = parseFloat(topUpAmount);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        try {
            await apiService.addLabelFunds(currentUser.id, amount, topUpNote || 'Manual Top Up');
            setTopUpAmount('');
            setTopUpNote('');
            alert("Funds added successfully.");
            loadData();
        } catch (error) {
            console.error("Failed to add funds:", error);
            alert("Failed to add funds.");
        }
    };

    if (loading) {
        return <div className="p-20 text-center text-zinc-500">Loading financial data...</div>;
    }

    const totalFunds = budgetOverview?.budget?.total_budget || 0;
    const spentFunds = budgetOverview?.budget?.amount_spent || 0;
    const remainingFunds = totalFunds - spentFunds;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">Financial Overview</h1>
                <p className="text-zinc-400 mt-1">Manage budget, payouts, and track transactions.</p>
            </div>

            {/* SECTION A: Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Total Funds" 
                    value={`$${totalFunds.toLocaleString()}`} 
                    icon={<DollarSignIcon className="w-6 h-6" />} 
                />
                <StatCard 
                    label="Amount Spent" 
                    value={`$${spentFunds.toLocaleString()}`} 
                    icon={<ChartBarIcon className="w-6 h-6" />} 
                />
                <StatCard 
                    label="Remaining" 
                    value={`$${remainingFunds.toLocaleString()}`} 
                    icon={<BanknotesIcon className="w-6 h-6" />} 
                />
                <StatCard 
                    label="Budget Mode" 
                    value={budgetMode.replace('_', ' ')} 
                    icon={<ArrowUpCircleIcon className="w-6 h-6" />} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SECTION B: Budget Settings */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-blue-400" /> Budget Configuration
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Budget Mode</label>
                            <select 
                                value={budgetMode} 
                                onChange={(e) => setBudgetMode(e.target.value as LabelBudgetMode)}
                                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg p-3 outline-none focus:border-orange-500"
                            >
                                <option value="MANUAL">Manual Control</option>
                                <option value="MONTHLY_FIXED">Monthly Fixed (Reset)</option>
                                <option value="MONTHLY_ROLLING">Monthly Rolling (Accumulate)</option>
                            </select>
                        </div>

                        {(budgetMode === 'MONTHLY_FIXED' || budgetMode === 'MONTHLY_ROLLING') && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Monthly Amount ($)</label>
                                    <input 
                                        type="number" 
                                        value={monthlyAllowance} 
                                        onChange={(e) => setMonthlyAllowance(Number(e.target.value))}
                                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg p-3 outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Reset Day (1-31)</label>
                                    <input 
                                        type="number" 
                                        value={resetDay} 
                                        min="1" max="31"
                                        onChange={(e) => setResetDay(Number(e.target.value))}
                                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg p-3 outline-none focus:border-orange-500"
                                    />
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={handleSaveBudgetSettings}
                            className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
                        >
                            <CheckCircleIcon className="w-5 h-5" /> Save Settings
                        </button>
                    </div>
                </div>

                {/* SECTION C: Manual Top Up */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <PlusCircleIcon className="w-5 h-5 text-green-400" /> Add Funds Manually
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Amount ($)</label>
                            <input 
                                type="number" 
                                value={topUpAmount}
                                onChange={(e) => setTopUpAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg p-3 outline-none focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Note (Optional)</label>
                            <input 
                                type="text" 
                                value={topUpNote}
                                onChange={(e) => setTopUpNote(e.target.value)}
                                placeholder="Reason for deposit..."
                                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg p-3 outline-none focus:border-green-500"
                            />
                        </div>
                        
                        <button 
                            onClick={handleTopUp}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
                        >
                            <DollarSignIcon className="w-5 h-5" /> Add Funds
                        </button>
                    </div>
                </div>
            </div>

            {/* SECTION D: Transaction History */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                    <BanknotesIcon className="w-5 h-5 text-purple-400" /> Transaction History
                </h2>
                
                {transactions.length === 0 ? (
                    <p className="text-zinc-500 text-sm py-4 text-center">No transactions recorded.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="bg-zinc-800/50 uppercase font-bold text-xs">
                                <tr>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Description</th>
                                    <th className="p-3">Category</th>
                                    <th className="p-3 text-right">Amount</th>
                                    <th className="p-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {transactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="p-3 whitespace-nowrap">{new Date(tx.date).toLocaleDateString()}</td>
                                        <td className="p-3 text-zinc-300">{tx.description}</td>
                                        <td className="p-3">
                                            <span className="bg-zinc-800 px-2 py-1 rounded text-xs">{tx.category.replace(/_/g, ' ')}</span>
                                        </td>
                                        <td className={`p-3 text-right font-mono font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {tx.amount > 0 ? '+' : ''}${tx.amount.toLocaleString()}
                                        </td>
                                        <td className="p-3 text-right">
                                            <span className={`text-xs uppercase font-bold ${tx.status === 'COMPLETED' ? 'text-green-500' : 'text-yellow-500'}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* SECTION E: Contracts (Existing logic kept or minimized if needed, but visually secondary now) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                    <BriefcaseIcon className="w-5 h-5 text-orange-400" /> Active Contracts
                </h2>
                {contracts.length === 0 ? (
                    <p className="text-zinc-500 text-sm">No active contracts found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="bg-zinc-800/50 uppercase font-bold text-xs">
                                <tr>
                                    <th className="p-3">Talent ID</th>
                                    <th className="p-3">Role</th>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Split %</th>
                                    <th className="p-3">Recoup Bal</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {contracts.map(c => (
                                    <tr key={c.id}>
                                        <td className="p-3 font-mono text-zinc-300">{c.talent_user_id.slice(0, 8)}...</td>
                                        <td className="p-3">{c.talent_role}</td>
                                        <td className="p-3">{c.contract_type}</td>
                                        <td className="p-3">{c.split_percent}%</td>
                                        <td className="p-3 font-mono text-orange-400">${c.recoup_balance.toFixed(2)}</td>
                                        <td className="p-3 uppercase text-xs font-bold">{c.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabelFinancials;
