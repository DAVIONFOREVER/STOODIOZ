
import React, { useState, useEffect, lazy, Suspense } from 'react';
import type { Label, Booking, Artist } from '../types';
import { UserRole, AppView } from '../types';
import { BriefcaseIcon, UsersIcon, CalendarIcon, DollarSignIcon, EditIcon, PlusCircleIcon, SearchIcon } from './icons';
import Wallet from './Wallet';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useProfile } from '../hooks/useProfile';

const Documents = lazy(() => import('./Documents.tsx'));

type DashboardTab = 'overview' | 'roster' | 'bookings' | 'wallet' | 'settings' | 'documents';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="p-4 rounded-xl flex items-center gap-4 cardSurface">
        <div className="bg-orange-500/10 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-zinc-400 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-zinc-100">{value}</p>
        </div>
    </div>
);

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-3 font-semibold text-sm transition-colors whitespace-nowrap ${isActive ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100 border-b-2 border-transparent'}`}
    >
        {label}
    </button>
);

const RosterManagement: React.FC = () => {
    // Placeholder for Roster Logic
    return (
        <div className="p-6 cardSurface">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-zinc-100">Artist Roster</h2>
                <button className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors">
                    <PlusCircleIcon className="w-5 h-5" /> Add Artist
                </button>
            </div>
            <div className="text-center py-12 bg-zinc-800/50 rounded-xl border border-zinc-700 border-dashed">
                <UsersIcon className="w-12 h-12 mx-auto text-zinc-600 mb-2" />
                <p className="text-zinc-400">No artists linked yet.</p>
                <p className="text-sm text-zinc-500 mt-1">Invite artists to your roster to manage their bookings.</p>
            </div>
        </div>
    );
};

const LabelBookings: React.FC<{ bookings: Booking[] }> = ({ bookings }) => {
    return (
        <div className="p-6 cardSurface">
            <h2 className="text-xl font-bold text-zinc-100 mb-6">Label Bookings</h2>
            {bookings.length === 0 ? (
                <div className="text-center py-12 bg-zinc-800/50 rounded-xl border border-zinc-700 border-dashed">
                    <CalendarIcon className="w-12 h-12 mx-auto text-zinc-600 mb-2" />
                    <p className="text-zinc-400">No bookings found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map(booking => (
                        <div key={booking.id} className="bg-zinc-800 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold text-slate-100">{booking.stoodio?.name || 'Session'}</p>
                                <p className="text-sm text-slate-400">{new Date(booking.date).toLocaleDateString()} at {booking.start_time}</p>
                            </div>
                            <span className="px-3 py-1 bg-zinc-700 rounded-full text-xs text-slate-300 capitalize">{booking.status.toLowerCase()}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const LabelSettings: React.FC<{ label: Label; onUpdate: (updates: Partial<Label>) => void }> = ({ label, onUpdate }) => {
    const [companyName, setCompanyName] = useState(label.company_name || '');
    const [contactEmail, setContactEmail] = useState(label.contact_email || '');
    const [website, setWebsite] = useState(label.website || '');

    const handleSave = () => {
        onUpdate({ company_name: companyName, contact_email: contactEmail, website });
    };

    return (
        <div className="p-6 cardSurface">
            <h2 className="text-xl font-bold text-zinc-100 mb-6">Label Settings</h2>
            <div className="space-y-4 max-w-xl">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Company Name</label>
                    <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-zinc-700 border-zinc-600 rounded-lg p-2 text-zinc-100" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Contact Email</label>
                    <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full bg-zinc-700 border-zinc-600 rounded-lg p-2 text-zinc-100" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Website</label>
                    <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className="w-full bg-zinc-700 border-zinc-600 rounded-lg p-2 text-zinc-100" />
                </div>
                <button onClick={handleSave} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600">Save Changes</button>
            </div>
        </div>
    );
};

const LabelDashboard: React.FC = () => {
    const { currentUser, bookings, conversations } = useAppState();
    const { viewBooking } = useNavigation();
    const { updateProfile } = useProfile();
    const dispatch = useAppDispatch();
    
    const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

    if (!currentUser) return <div className="text-center py-20 text-zinc-400">Loading Dashboard...</div>;
    
    const label = currentUser as Label;
    
    // Calculate stats
    const totalSpent = Math.abs(label.wallet_transactions?.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0) || 0);
    const activeBookings = bookings.filter(b => b.booked_by_id === label.id && new Date(b.date) >= new Date()).length;

    const onOpenAddFundsModal = () => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: true } });

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard label="Wallet Balance" value={`$${label.wallet_balance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                            <StatCard label="Total Spent" value={`$${totalSpent.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-red-400" />} />
                            <StatCard label="Upcoming Sessions" value={activeBookings} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
                        </div>
                        <LabelBookings bookings={bookings.filter(b => b.booked_by_id === label.id).slice(0, 5)} />
                    </div>
                );
            case 'roster': return <RosterManagement />;
            case 'bookings': return <LabelBookings bookings={bookings.filter(b => b.booked_by_id === label.id)} />;
            case 'wallet': return <Wallet user={label} onAddFunds={onOpenAddFundsModal} onViewBooking={viewBooking} userRole={UserRole.LABEL} />;
            case 'settings': return <LabelSettings label={label} onUpdate={updateProfile} />;
            case 'documents':
                return (
                    <Suspense fallback={<div>Loading Documents...</div>}>
                        <Documents conversations={conversations} />
                    </Suspense>
                );
            default: return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="relative rounded-2xl overflow-hidden cardSurface p-8 flex items-center gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-2xl shadow-lg">
                    <BriefcaseIcon className="w-12 h-12 text-white" />
                </div>
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-100">{label.company_name || label.name}</h1>
                    <p className="text-zinc-400">Label Management Dashboard</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="cardSurface">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <TabButton label="Overview" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <TabButton label="Roster" isActive={activeTab === 'roster'} onClick={() => setActiveTab('roster')} />
                    <TabButton label="Bookings" isActive={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
                    <TabButton label="Wallet" isActive={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} />
                    <TabButton label="Documents" isActive={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
                    <TabButton label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default LabelDashboard;
