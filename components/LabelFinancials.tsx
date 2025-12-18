import React, { useState, useEffect } from 'react';
import { DollarSignIcon, ChartBarIcon, CalendarIcon, UsersIcon, BanknotesIcon, ArrowUpCircleIcon, BriefcaseIcon, CheckCircleIcon, PlusCircleIcon, CloseCircleIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { LabelContract, LabelBudgetOverview, Transaction, LabelBudgetMode } from '../types';
import { TransactionCategory } from '../types';

// --- Global Mock Data (Fallback) ---
const MOCK_FINANCIALS_DATA = {
    totalRevenue: 245000000.00, // $245 Million
    monthlyRevenue: 18500000.00, // $18.5 Million
    pendingPayouts: 4200000.00,
    availablePayoutBalance: 12500000.00,
    monthlyBreakdown: [
        { month: 'Jan', amount: 14500000 },
        { month: 'Feb', amount: 15200000 },
        { month: 'Mar', amount: 19000000 },
        { month: 'Apr', amount: 16500000 },
        { month: 'May', amount: 18400000 },
        { month: 'Jun', amount: 21100000 },
        { month: 'Jul', amount: 20500000 },
        { month: 'Aug', amount: 19800000 },
        { month: 'Sep', amount: 18200000 },
        { month: 'Oct', amount: 19000000 },
        { month: 'Nov', amount: 22000000 },
        { month: 'Dec', amount: 24500000 },
    ],
    byArtist: [
        { id: '1', name: 'Beyoncé', image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop', amount: 85200000, percentage: 35 },
        { id: '2', name: 'Harry Styles', image_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop', amount: 55500000, percentage: 22 },
        { id: '3', name: 'Travis Scott', image_url: 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?q=80&w=200&auto=format&fit=crop', amount: 48400000, percentage: 19 },
        { id: '4', name: 'SZA', image_url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop', amount: 32900000, percentage: 13 },
        { id: '5', name: 'Doja Cat', image_url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=200&auto=format&fit=crop', amount: 23000000, percentage: 11 },
    ],
    byType: [
        { type: 'Streaming Royalties', amount: 145000000, percentage: 59 },
        { type: 'Sync & Licensing', amount: 45000000, percentage: 18 },
        { type: 'Physical Sales (Vinyl)', amount: 35000000, percentage: 14 },
        { type: 'Merchandise/D2C', amount: 20000000, percentage: 9 },
    ],
    initialPayoutRequests: [
        { id: 'p1', amount: 2500000, requested_on: '2024-05-15', status: 'Pending', artist: 'Beyoncé' },
        { id: 'p2', amount: 850000, requested_on: '2024-05-14', status: 'Approved', artist: 'Travis Scott' },
        { id: 'p3', amount: 1200000, requested_on: '2024-05-10', status: 'Approved', artist: 'Harry Styles' },
        { id: 'p4', amount: 45000, requested_on: '2024-05-08', status: 'Rejected', artist: 'Developing Artist A' },
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

    // Budget Mode State
    const [budgetMode, setBudgetMode] = useState<LabelBudgetMode>('MANUAL');
    const [monthlyAllowance, setMonthlyAllowance] = useState<number>(0);
    const [resetDay, setResetDay] = useState<number>(1);
    const [topUpAmount, setTopUpAmount] = useState<string>('');
    const [topUpNote, setTopUpNote] = useState<string>('');
    
    // UI State for mock interactivity
    const [payoutRequests, setPayoutRequests] = useState(MOCK_FINANCIALS_DATA.initialPayoutRequests);

    const handlePayoutAction = (id: string, action: 'Approved' | 'Rejected') => {
        setPayoutRequests(prev => prev.map(req => 
            req.id === id ? { ...req, status: action } : req
        ));
    };

    const loadData = async () => {
        if (!currentUser || userRole !== 'LABEL') return;
        setLoading(true);
        try {
            const [contractsData, budgetData, transactionsData] = await Promise.all([
                apiService.fetchLabelContracts(currentUser.id),
                apiService.getLabelBudgetOverview(currentUser.id),
                apiService.fetchLabelTransactions(currentUser.id)
            ]);

            setContracts(contractsData as LabelContract[]);
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
        return (
             <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
                <p className="text-zinc-500">Loading financial data...</p>
            </div>
        );
    }

    const displayRevenue = MOCK_FINANCIALS_DATA.totalRevenue; 
    const totalFunds = budgetOverview?.budget?.total_budget || 0;
    const spentFunds = budgetOverview?.budget?.amount_spent || 0;
    const remainingFunds = totalFunds - spentFunds;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">Financial Overview</h1>
                <p className="text-zinc-400 mt-1">Global P&L, Royalty Payouts, and Division Budgets.</p>
            </div>

            {/* SECTION A: Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Annual Revenue (YTD)" 
                    value={`$${displayRevenue.toLocaleString()}`} 
                    icon={<DollarSignIcon className="w-6 h-6" />} 
                    subtext="+12% YoY Growth"
                />
                <StatCard 
                    label="This Month" 
                    value={`$${MOCK_FINANCIALS_DATA.monthlyRevenue.toLocaleString()}`} 
                    icon={<CalendarIcon className="w-6 h-6" />} 
                />
                <StatCard 
                    label="Pending Payouts" 
                    value={`$${MOCK_FINANCIALS_DATA.pendingPayouts.toLocaleString()}`} 
                    icon={<BanknotesIcon className="w-6 h-6" />} 
                />
                <StatCard 
                    label="A&R Budget Remaining" 
                    value={`$${remainingFunds.toLocaleString()}`} 
                    icon={<ArrowUpCircleIcon className="w-6 h-6" />} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SECTION B: Budget Settings */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-blue-400" /> Department Budgeting
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Budget Allocation Mode</label>
                            <select 
                                value={budgetMode} 
                                onChange={(e) => setBudgetMode(e.target.value as LabelBudgetMode)}
                                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg p-3 outline-none focus:border-orange-500"
                            >
                                <option value="MANUAL">Manual Allocation (Exec Approval)</option>
                                <option value="MONTHLY_FIXED">Quarterly Fixed</option>
                                <option value="MONTHLY_ROLLING">Rolling Cap</option>
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
                            <CheckCircleIcon className="w-5 h-5" /> Save Configuration
                        </button>
                    </div>
                </div>

                {/* SECTION C: Manual Top Up */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <PlusCircleIcon className="w-5 h-5 text-green-400" /> Inject Capital
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
                            <label className="block text-sm font-medium text-zinc-400 mb-1">GL Code / Reference</label>
                            <input 
                                type="text" 
                                value={topUpNote}
                                onChange={(e) => setTopUpNote(e.target.value)}
                                placeholder="e.g. Q3 Marketing Fund..."
                                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg p-3 outline-none focus:border-green-500"
                            />
                        </div>
                        
                        <button 
                            onClick={handleTopUp}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
                        >
                            <DollarSignIcon className="w-5 h-5" /> Authorize Transfer
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
                    <p className="text-zinc-500 text-sm py-4 text-center">No transactions recorded yet.</p>
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

            {/* SECTION E: Revenue by Artist */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-orange-400" /> Top Grossing Artists (YTD)
                    </h2>
                    <div className="space-y-4">
                        {MOCK_FINANCIALS_DATA.byArtist.map((artist) => (
                            <div 
                                key={artist.id} 
                                className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <img src={artist.image_url} alt={artist.name} className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700 group-hover:border-orange-500 transition-colors" />
                                    <div>
                                        <p className="font-bold text-zinc-100 group-hover:text-orange-400 transition-colors">{artist.name}</p>
                                        <div className="w-24 h-1.5 bg-zinc-700 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${artist.percentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-zinc-100">${artist.amount.toLocaleString()}</p>
                                    <p className="text-xs text-zinc-500">{artist.percentage}% of Division Revenue</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECTION F: Income Sources */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-purple-400" /> Revenue Streams
                    </h2>
                    <div className="space-y-6">
                        {MOCK_FINANCIALS_DATA.byType.map((item, index) => (
                            <div key={index}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-zinc-300 font-medium">{item.type}</span>
                                    <span className="text-zinc-400">${item.amount.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full" 
                                        style={{ width: `${item.percentage}%` }}
                                    ></div>
                                </div>
                                <p className="text-right text-xs text-zinc-500 mt-1">{item.percentage}%</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SECTION G: Payout Requests */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                    <BanknotesIcon className="w-5 h-5 text-green-400" /> Royalty & Advance Requests
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4 rounded-tl-lg">Artist</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Date Requested</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 rounded-tr-lg text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                            {payoutRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-zinc-800/30 transition-colors">
                                    <td className="p-4 font-semibold text-zinc-200">{req.artist}</td>
                                    <td className="p-4 font-mono text-zinc-300">${req.amount.toLocaleString()}</td>
                                    <td className="p-4 text-zinc-400">{req.requested_on}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                            req.status === 'Approved' ? 'bg-green-500/20 text-green-400' :
                                            req.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                                            'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {req.status === 'Pending' && (
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handlePayoutAction(req.id, 'Approved')}
                                                    className="p-1.5 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white rounded transition-colors" title="Approve"
                                                >
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handlePayoutAction(req.id, 'Rejected')}
                                                    className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors" title="Reject"
                                                >
                                                    <CloseCircleIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LabelFinancials;