
import React, { useState, useEffect } from 'react';
import type { Producer, Booking } from '../types';
import { AppView, SubscriptionPlan } from '../types';
import { CalendarIcon, UsersIcon, DollarSignIcon, StarIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import Wallet from './Wallet';
import BeatManager from './BeatManager';
import ProducerSettings from './ProducerSettings';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useProfile } from '../hooks/useProfile';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-zinc-800/50 p-4 rounded-xl flex items-center gap-4 border border-zinc-700/50">
        <div className="bg-orange-500/10 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-zinc-400 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-zinc-100">{value}</p>
        </div>
    </div>
);

const UpgradeProCard: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-2xl text-white text-center shadow-lg shadow-orange-500/10">
        <StarIcon className="w-10 h-10 mx-auto text-white/80 mb-2" />
        <h3 className="text-xl font-bold mb-2">Upgrade to Producer Pro</h3>
        <p className="text-sm opacity-90 mb-4">Unlock advanced analytics, featured placements, and lower commission fees on sales.</p>
        <button 
            onClick={() => onNavigate(AppView.SUBSCRIPTION_PLANS)}
            className="bg-white text-orange-500 font-bold py-2 px-6 rounded-lg hover:bg-zinc-100 transition-all duration-300"
        >
            View Plans
        </button>
    </div>
);

const ProducerDashboard: React.FC = () => {
    const { currentUser, bookings, dashboardInitialTab } = useAppState();
    const dispatch = useAppDispatch();
    const { navigate, viewProducerProfile } = useNavigation();
    const { createPost, likePost, commentOnPost } = useSocial();
    const { updateProfile } = useProfile();

    const [activeTab, setActiveTab] = useState(dashboardInitialTab || 'dashboard');
    const producer = currentUser as Producer;

    const onOpenAddFundsModal = () => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: true } });
    const onOpenPayoutModal = () => dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: true } });

    useEffect(() => {
        if (dashboardInitialTab) {
            setActiveTab(dashboardInitialTab);
            dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: null } });
        }
    }, [dashboardInitialTab, dispatch]);

    const upcomingBookings = bookings.filter(b => b.producer?.id === producer.id && new Date(b.date) >= new Date());
    
    const isProPlan = producer.subscription?.plan === SubscriptionPlan.PRODUCER_PRO;

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <CreatePost currentUser={currentUser!} onPost={createPost} />
                            <PostFeed posts={producer.posts || []} authors={new Map([[producer.id, producer]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={() => viewProducerProfile(producer)} />
                        </div>
                         <div className="lg:col-span-1 space-y-6">
                            {!isProPlan && <UpgradeProCard onNavigate={navigate} />}
                        </div>
                    </div>
                );
            case 'beatStore':
                return <BeatManager producer={producer} onUpdateProducer={updateProfile} />;
            case 'settings':
                return <ProducerSettings producer={producer} onUpdateProducer={updateProfile} />;
            case 'wallet':
                return <Wallet user={producer} onAddFunds={onOpenAddFundsModal} onRequestPayout={onOpenPayoutModal} onViewBooking={() => {}} userRole={'PRODUCER'} />;
            default:
                return null;
        }
    };
    
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-zinc-800/50 p-6 md:p-8 rounded-2xl border border-zinc-700/50 shadow-lg">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <img src={producer.imageUrl} alt={producer.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-zinc-700" />
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{producer.name}</h1>
                        <p className="text-zinc-400 mt-2">Producer Dashboard</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <StatCard label="Wallet Balance" value={`$${producer.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                    <StatCard label="Upcoming Sessions" value={upcomingBookings.length} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
                    <StatCard label="Followers" value={producer.followers} icon={<UsersIcon className="w-6 h-6 text-blue-400" />} />
                </div>
            </div>

            <div className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 shadow-lg">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-3 font-semibold text-sm ${activeTab === 'dashboard' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100'}`}>Dashboard</button>
                    <button onClick={() => setActiveTab('beatStore')} className={`px-4 py-3 font-semibold text-sm ${activeTab === 'beatStore' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100'}`}>Beat Store</button>
                    <button onClick={() => setActiveTab('settings')} className={`px-4 py-3 font-semibold text-sm ${activeTab === 'settings' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100'}`}>Settings</button>
                    <button onClick={() => setActiveTab('wallet')} className={`px-4 py-3 font-semibold text-sm ${activeTab === 'wallet' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100'}`}>Wallet</button>
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ProducerDashboard;
