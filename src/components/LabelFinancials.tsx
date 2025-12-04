
import React, { useState, useEffect } from 'react';
import { DollarSignIcon, ChartBarIcon, CalendarIcon, UsersIcon, BanknotesIcon, ArrowUpCircleIcon, BriefcaseIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { LabelContract } from '../types';

const MOCK_FINANCIALS = {
    totalRevenue: 142500.50,
    monthlyRevenue: 12400.00,
    pendingPayouts: 3200.00,
    availablePayoutBalance: 15800.00,
    // ... kept for existing UI placeholder ...
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
    
    useEffect(() => {
        const loadContracts = async () => {
            if (currentUser && userRole === 'LABEL') {
                const data = await apiService.fetchLabelContracts(currentUser.id);
                setContracts(data);
            }
        };
        loadContracts();
    }, [currentUser, userRole]);

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">Financial Overview</h1>
                <p className="text-zinc-400 mt-1">Track revenue streams, manage payouts, and contracts.</p>
            </div>

            {/* SECTION A: Revenue Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Total Revenue" 
                    value={`$${MOCK_FINANCIALS.totalRevenue.toLocaleString()}`} 
                    icon={<DollarSignIcon className="w-6 h-6" />} 
                    subtext="+12% from last month"
                />
                <StatCard 
                    label="This Month" 
                    value={`$${MOCK_FINANCIALS.monthlyRevenue.toLocaleString()}`} 
                    icon={<CalendarIcon className="w-6 h-6" />} 
                />
                <StatCard 
                    label="Pending Payouts" 
                    value={`$${MOCK_FINANCIALS.pendingPayouts.toLocaleString()}`} 
                    icon={<BanknotesIcon className="w-6 h-6" />} 
                />
                <StatCard 
                    label="Available Balance" 
                    value={`$${MOCK_FINANCIALS.availablePayoutBalance.toLocaleString()}`} 
                    icon={<ArrowUpCircleIcon className="w-6 h-6" />} 
                />
            </div>

            {/* Contracts Section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                    <BriefcaseIcon className="w-5 h-5 text-purple-400" /> Active Contracts
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
