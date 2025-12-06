import React, { useState, useMemo } from 'react';
import { DollarSignIcon, ChartBarIcon, CalendarIcon, UsersIcon, CloseIcon, BanknotesIcon, CheckCircleIcon, ArrowUpCircleIcon, CloseCircleIcon } from './icons';

// --- Mock Data ---
const MOCK_FINANCIALS = {
    totalRevenue: 142500.50,
    monthlyRevenue: 12400.00,
    pendingPayouts: 3200.00,
    availablePayoutBalance: 15800.00,
    monthlyBreakdown: [
        { month: 'Jan', amount: 8500 },
        { month: 'Feb', amount: 9200 },
        { month: 'Mar', amount: 11000 },
        { month: 'Apr', amount: 10500 },
        { month: 'May', amount: 12400 },
        { month: 'Jun', amount: 13100 },
        { month: 'Jul', amount: 14500 },
        { month: 'Aug', amount: 13800 },
        { month: 'Sep', amount: 15200 },
        { month: 'Oct', amount: 16000 },
        { month: 'Nov', amount: 14800 },
        { month: 'Dec', amount: 17500 },
    ],
    byArtist: [
        { id: '1', name: 'Luna Vance', image_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=200&auto=format&fit=crop', amount: 45200, percentage: 32 },
        { id: '2', name: 'The Midnight Echo', image_url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=200&auto=format&fit=crop', amount: 38500, percentage: 27 },
        { id: '3', name: 'Jaxson Beats', image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop', amount: 28400, percentage: 20 },
        { id: '4', name: 'Velvet Voices', image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop', amount: 18900, percentage: 13 },
        { id: '5', name: 'Neon Drifter', image_url: 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?q=80&w=200&auto=format&fit=crop', amount: 11500, percentage: 8 },
    ],
    byType: [
        { type: 'Studio Sessions', amount: 65000, percentage: 45 },
        { type: 'Mixing & Mastering', amount: 35000, percentage: 25 },
        { type: 'Production', amount: 25000, percentage: 18 },
        { type: 'Feature Bookings', amount: 17500, percentage: 12 },
    ],
    initialPayoutRequests: [
        { id: 'p1', amount: 1200, requested_on: '2024-05-15', status: 'Pending', artist: 'Luna Vance' },
        { id: 'p2', amount: 500, requested_on: '2024-05-14', status: 'Approved', artist: 'Jaxson Beats' },
        { id: 'p3', amount: 2500, requested_on: '2024-05-10', status: 'Approved', artist: 'The Midnight Echo' },
        { id: 'p4', amount: 800, requested_on: '2024-05-08', status: 'Rejected', artist: 'Neon Drifter' },
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
    const [selectedArtist, setSelectedArtist] = useState<any | null>(null);
    const [payoutRequests, setPayoutRequests] = useState(MOCK_FINANCIALS.initialPayoutRequests);

    const handlePayoutAction = (id: string, action: 'Approved' | 'Rejected') => {
        setPayoutRequests(prev => prev.map(req => 
            req.id === id ? { ...req, status: action } : req
        ));
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">Financial Overview</h1>
                <p className="text-zinc-400 mt-1">Track revenue streams, manage payouts, and analyze performance.</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SECTION B: Revenue by Artist */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-orange-400" /> Revenue by Artist
                    </h2>
                    <div className="space-y-4">
                        {MOCK_FINANCIALS.byArtist.map((artist) => (
                            <div 
                                key={artist.id} 
                                onClick={() => setSelectedArtist(artist)}
                                className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 cursor-pointer transition-colors group"
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
                                    <p className="text-xs text-zinc-500">{artist.percentage}% of total</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECTION C: Revenue by Type */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-orange-400" /> Income Sources
                    </h2>
                    <div className="space-y-6">
                        {MOCK_FINANCIALS.byType.map((item, index) => (
                            <div key={index}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-zinc-300 font-medium">{item.type}</span>
                                    <span className="text-zinc-400">${item.amount.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-orange-600 to-orange-400 h-full rounded-full" 
                                        style={{ width: `${item.percentage}%` }}
                                    ></div>
                                </div>
                                <p className="text-right text-xs text-zinc-500 mt-1">{item.percentage}%</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SECTION D: Monthly Revenue Chart (Mock) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg overflow-hidden">
                <h2 className="text-xl font-bold text-zinc-100 mb-6">Monthly Revenue Trend</h2>
                <div className="flex items-end justify-between h-48 gap-2 pt-4">
                    {MOCK_FINANCIALS.monthlyBreakdown.map((data, index) => (
                        <div key={index} className="flex flex-col items-center flex-1 gap-2 group">
                            <div className="relative w-full flex justify-center items-end h-full">
                                <div 
                                    className="w-full max-w-[40px] bg-zinc-800 group-hover:bg-orange-500/80 transition-all rounded-t-sm"
                                    style={{ height: `${(data.amount / 20000) * 100}%` }}
                                ></div>
                                {/* Tooltip-ish value */}
                                <div className="absolute -top-8 text-xs font-bold text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                    ${(data.amount / 1000).toFixed(1)}k
                                </div>
                            </div>
                            <span className="text-xs text-zinc-500 font-medium">{data.month}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECTION E: Payout Requests */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                    <BanknotesIcon className="w-5 h-5 text-green-400" /> Payout Requests
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

            {/* SECTION F: Artist Detail Modal */}
            {selectedArtist && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up relative overflow-hidden">
                        <button 
                            onClick={() => setSelectedArtist(null)} 
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 z-10 bg-black/50 rounded-full p-1"
                        >
                            <CloseIcon className="w-6 h-6" />
                        </button>
                        
                        <div className="h-32 bg-gradient-to-r from-orange-600 to-amber-600"></div>
                        
                        <div className="px-6 pb-6 -mt-12">
                            <img src={selectedArtist.image_url} alt={selectedArtist.name} className="w-24 h-24 rounded-full border-4 border-zinc-900 shadow-xl mb-4" />
                            
                            <h2 className="text-2xl font-bold text-zinc-100">{selectedArtist.name}</h2>
                            <p className="text-zinc-400 text-sm mb-6">Signed Artist</p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-700 text-center">
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Total Earnings</p>
                                    <p className="text-xl font-bold text-green-400">${selectedArtist.amount.toLocaleString()}</p>
                                </div>
                                <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-700 text-center">
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Revenue Share</p>
                                    <p className="text-xl font-bold text-orange-400">{selectedArtist.percentage}%</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-bold text-zinc-300">Monthly Performance</p>
                                <div className="flex items-end justify-between h-16 gap-1">
                                    {/* Random bars for effect */}
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div 
                                            key={i} 
                                            className="w-full bg-zinc-700 rounded-sm"
                                            style={{ height: `${30 + Math.random() * 70}%` }}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabelFinancials;