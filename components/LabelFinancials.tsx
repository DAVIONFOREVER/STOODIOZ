import React, { useState, useEffect, useMemo } from 'react';
// FIX: Added UsersIcon to imports from ./icons
import { DollarSignIcon, ChartBarIcon, CalendarIcon, BanknotesIcon, ArrowUpCircleIcon, CheckCircleIcon, PlusCircleIcon, CloseCircleIcon, UsersIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
// FIX: Added USER_SILHOUETTE_URL import from ../constants
import { USER_SILHOUETTE_URL, getProfileImageUrl } from '../constants';
import type { LabelContract, LabelBudgetOverview, Transaction, LabelBudgetMode, Booking, RosterMember } from '../types';
import appIcon from '../assets/stoodioz-app-icon.png';
import { redirectToCheckout } from '../lib/stripe';

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
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [roster, setRoster] = useState<RosterMember[]>([]);
    const [loading, setLoading] = useState(true);

    const [budgetMode, setBudgetMode] = useState<LabelBudgetMode>('MANUAL');
    const [monthlyAllowance, setMonthlyAllowance] = useState<number>(0);
    const [resetDay, setResetDay] = useState<number>(1);
    const [topUpAmount, setTopUpAmount] = useState<string>('');
    const [topUpNote, setTopUpNote] = useState<string>('');
    
    const [payoutRequests, setPayoutRequests] = useState<any[]>([]);

    const loadData = async () => {
        if (!currentUser || userRole !== 'LABEL') return;
        setLoading(true);
        try {
            const [contractsData, budgetData, transactionsData, bookingsData, rosterData, payoutData] = await Promise.all([
                apiService.fetchLabelContracts(currentUser.id),
                apiService.getLabelBudgetOverview(currentUser.id),
                apiService.fetchLabelTransactions(currentUser.id),
                apiService.fetchLabelBookings(currentUser.id),
                apiService.fetchLabelRoster(currentUser.id),
                apiService.fetchLabelPayoutRequests(currentUser.id)
            ]);

            setContracts(contractsData || []);
            setBudgetOverview(budgetData);
            setTransactions(transactionsData || []);
            setBookings(bookingsData || []);
            setRoster(rosterData || []);
            setPayoutRequests(payoutData || []);

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

    const financialMetrics = useMemo(() => {
        const completedSessions = bookings.filter(b => b.status === 'COMPLETED');
        const totalRevenue = completedSessions.reduce((sum, b) => sum + b.total_cost, 0);
        
        const now = new Date();
        const thisMonthRevenue = completedSessions
            .filter(b => new Date(b.date).getMonth() === now.getMonth() && new Date(b.date).getFullYear() === now.getFullYear())
            .reduce((sum, b) => sum + b.total_cost, 0);

        const totalFunds = budgetOverview?.budget?.total_budget || 0;
        const spentFunds = budgetOverview?.budget?.amount_spent || 0;
        const remainingFunds = totalFunds - spentFunds;

        // Calculate Revenue Breakdown by Type from Transactions
        const typeTotals: Record<string, number> = {};
        transactions.forEach(t => {
            // Handle missing or undefined category
            const category = (t.category || 'uncategorized').replace(/_/g, ' ');
            typeTotals[category] = (typeTotals[category] || 0) + Math.abs(t.amount || 0);
        });

        const totalTxAmount = Object.values(typeTotals).reduce((a, b) => a + b, 0);
        const byType = Object.entries(typeTotals).map(([type, amount]) => ({
            type,
            amount,
            percentage: totalTxAmount > 0 ? Math.round((amount / totalTxAmount) * 100) : 0
        })).sort((a, b) => b.amount - a.amount);

        // Calculate Revenue by Artist from Bookings
        const artistTotals: Record<string, { name: string, img: string, amount: number }> = {};
        completedSessions.forEach(b => {
            if (b.artist) {
                const existing = artistTotals[b.artist.id] || { name: b.artist.name, img: getProfileImageUrl(b.artist), amount: 0 };
                existing.amount += b.total_cost;
                artistTotals[b.artist.id] = existing;
            }
        });

        const byArtist = Object.entries(artistTotals).map(([id, data]) => ({
            id,
            ...data,
            percentage: totalRevenue > 0 ? Math.round((data.amount / totalRevenue) * 100) : 0
        })).sort((a, b) => b.amount - a.amount);

        return {
            totalRevenue,
            thisMonthRevenue,
            remainingFunds,
            byType: byType.length > 0 ? byType : [
                { type: 'Studio Sessions', amount: totalRevenue, percentage: 100 }
            ],
            byArtist: byArtist.slice(0, 5)
        };
    }, [bookings, transactions, budgetOverview]);

    const handlePayoutAction = async (id: string, action: 'Approved' | 'Rejected') => {
        try {
            await apiService.updatePayoutRequestStatus(id, action);
            setPayoutRequests(prev => prev.map(req => 
                req.id === id ? { ...req, status: action } : req
            ));
        } catch (error) {
            console.error('Failed to update payout request:', error);
            alert('Failed to update payout request status. Please try again.');
        }
    };

    const handleSaveBudgetSettings = async () => {
        if (!currentUser) return;
        try {
            await apiService.updateLabelBudgetMode(currentUser.id, budgetMode, monthlyAllowance, resetDay);
            alert("Budget settings updated.");
            loadData();
        } catch (error) {
            alert("Failed to update settings.");
        }
    };

    const handleTopUp = async () => {
        if (!currentUser || !topUpAmount) return;
        const amount = parseFloat(topUpAmount);
        try {
            if (!Number.isFinite(amount) || amount <= 0) {
                alert('Enter a valid amount.');
                return;
            }
            const profileId = (currentUser as any)?.profile_id ?? currentUser?.id;
            const { sessionId } = await apiService.createCheckoutSessionForWallet(amount, profileId, topUpNote || '');
            await redirectToCheckout(sessionId);
        } catch (error) {
            console.error('Failed to start top-up checkout', error);
            alert("Failed to add funds.");
        }
    };

    if (loading) {
        return (
             <div className="flex flex-col items-center justify-center py-20">
                <img src={appIcon} alt="Loading" className="h-10 w-10 animate-spin mb-4" />
                <p className="text-zinc-500">Loading financials...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in pb-20">
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">Global P&L</h1>
                <p className="text-zinc-400 mt-1">Real-time revenue monitoring and budget management for {currentUser?.name}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Annual Gross Revenue" 
                    value={`$${financialMetrics.totalRevenue.toLocaleString()}`} 
                    icon={<DollarSignIcon className="w-6 h-6" />} 
                    subtext="YTD Earnings"
                />
                <StatCard 
                    label="Revenue This Month" 
                    value={`$${financialMetrics.thisMonthRevenue.toLocaleString()}`} 
                    icon={<CalendarIcon className="w-6 h-6" />} 
                />
                <StatCard 
                    label="Pending Royalty Payouts" 
                    value={`$${payoutRequests.filter(r => r.status === 'Pending').reduce((a,b) => a+b.amount, 0).toLocaleString()}`} 
                    icon={<BanknotesIcon className="w-6 h-6" />} 
                />
                <StatCard 
                    label="A&R Budget Remaining" 
                    value={`$${financialMetrics.remainingFunds.toLocaleString()}`} 
                    icon={<ArrowUpCircleIcon className="w-6 h-6" />} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-blue-400" /> Budget Allocation
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Allocation Mode</label>
                            <select 
                                value={budgetMode} 
                                onChange={(e) => setBudgetMode(e.target.value as LabelBudgetMode)}
                                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg p-3 outline-none focus:border-orange-500"
                            >
                                <option value="MANUAL">Manual Control</option>
                                <option value="MONTHLY_FIXED">Monthly Fixed Allowance</option>
                                <option value="MONTHLY_ROLLING">Monthly Rolling Budget</option>
                            </select>
                        </div>

                        {(budgetMode === 'MONTHLY_FIXED' || budgetMode === 'MONTHLY_ROLLING') && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Monthly Limit ($)</label>
                                    <input 
                                        type="number" 
                                        value={monthlyAllowance} 
                                        onChange={(e) => setMonthlyAllowance(Number(e.target.value))}
                                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg p-3 outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Reset Day</label>
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
                            <CheckCircleIcon className="w-5 h-5" /> Save Budget Configuration
                        </button>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <PlusCircleIcon className="w-5 h-5 text-green-400" /> Capital Injection
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Transfer Amount ($)</label>
                            <input 
                                type="number" 
                                value={topUpAmount}
                                onChange={(e) => setTopUpAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg p-3 outline-none focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Reference Code / Note</label>
                            <input 
                                type="text" 
                                value={topUpNote}
                                onChange={(e) => setTopUpNote(e.target.value)}
                                placeholder="Internal Reference"
                                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg p-3 outline-none focus:border-green-500"
                            />
                        </div>
                        
                        <button 
                            onClick={handleTopUp}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
                        >
                            <DollarSignIcon className="w-5 h-5" /> Authorize Capital Transfer
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-zinc-100 mb-6">Ledger Details</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-800/50 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-3">Transaction Date</th>
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
                                        <span className={tx.status === 'COMPLETED' ? 'text-green-500' : 'text-yellow-500'}>{tx.status}</span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="p-10 text-center text-zinc-600 italic">No ledger activity recorded.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-orange-400" /> Top Grossing Roster
                    </h2>
                    <div className="space-y-4">
                        {financialMetrics.byArtist.map((artist) => (
                            <div 
                                key={artist.id} 
                                className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <img src={artist.img || USER_SILHOUETTE_URL} alt={artist.name} className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700 group-hover:border-orange-500 transition-colors" />
                                    <div>
                                        <p className="font-bold text-zinc-100 group-hover:text-orange-400 transition-colors">{artist.name}</p>
                                        <div className="w-24 h-1.5 bg-zinc-700 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${artist.percentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-zinc-100">${artist.amount.toLocaleString()}</p>
                                    <p className="text-xs text-zinc-500">{artist.percentage}% Share</p>
                                </div>
                            </div>
                        ))}
                        {financialMetrics.byArtist.length === 0 && (
                            <p className="text-center py-10 text-zinc-600">No session data available for roster members.</p>
                        )}
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-purple-400" /> Revenue Split
                    </h2>
                    <div className="space-y-6">
                        {financialMetrics.byType.map((item, index) => (
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

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                    <BanknotesIcon className="w-5 h-5 text-green-400" /> Royalty Claims
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4 rounded-tl-lg">Beneficiary</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Requested On</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 rounded-tr-lg text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                            {payoutRequests.length > 0 ? payoutRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-zinc-800/30 transition-colors">
                                    <td className="p-4 font-semibold text-zinc-200">{req.artist_name || req.artist || 'Unknown Artist'}</td>
                                    <td className="p-4 font-mono text-zinc-300">${Number(req.amount || 0).toLocaleString()}</td>
                                    <td className="p-4 text-zinc-400">{req.requested_on ? new Date(req.requested_on).toLocaleDateString() : 'N/A'}</td>
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
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-zinc-600 italic">No payout requests found.</td>
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
