import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import type { Producer, Artist, Stoodio, Engineer, LinkAttachment, Post } from '../types';
import { UserRole, AppView, SubscriptionPlan } from '../types';
import { DollarSignIcon, CalendarIcon, UsersIcon, StarIcon, MusicNoteIcon, MagicWandIcon, EditIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import Following from './Following';
import FollowersList from './FollowersList';
import AvailabilityManager from './AvailabilityManager';
import Wallet from './Wallet';
import BeatManager from './BeatManager';
import ProducerSettings from './ProducerSettings';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useProfile } from '../hooks/useProfile';

const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));

type DashboardTab = 'dashboard' | 'analytics' | 'beatStore' | 'availability' | 'settings' | 'wallet' | 'followers' | 'following';

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

const UpgradeProCard: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => (
    <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 p-6 rounded-2xl text-white text-center shadow-lg shadow-purple-500/10">
        <StarIcon className="w-10 h-10 mx-auto text-white/80 mb-2" />
        <h3 className="text-xl font-bold mb-2">Upgrade to Producer Pro</h3>
        <p className="text-sm opacity-90 mb-4">Unlock lower commission fees, unlimited uploads, and priority placement to boost your sales.</p>
        <button 
            onClick={() => onNavigate(AppView.SUBSCRIPTION_PLANS)}
            className="bg-white text-purple-500 font-bold py-2 px-6 rounded-lg hover:bg-zinc-100 transition-all duration-300"
        >
            View Plans
        </button>
    </div>
);


const ProducerDashboard: React.FC = () => {
    const { currentUser, artists, engineers, stoodioz, producers, dashboardInitialTab } = useAppState();
    const dispatch = useAppDispatch();
    const producer = currentUser as Producer;

    const { navigate, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile, viewBooking } = useNavigation();
    const { createPost, likePost, commentOnPost, toggleFollow } = useSocial();
    const { updateProfile } = useProfile();

    const onOpenAddFundsModal = () => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: true } });
    const onOpenPayoutModal = () => dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: true } });

    const [activeTab, setActiveTab] = useState<DashboardTab>(dashboardInitialTab as DashboardTab || 'dashboard');

    useEffect(() => {
        if (dashboardInitialTab) {
            setActiveTab(dashboardInitialTab as DashboardTab);
            dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: null } }); // Clear it after use
        }
    }, [dashboardInitialTab, dispatch]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                updateProfile({ imageUrl });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const isProPlan = producer.subscription?.plan === SubscriptionPlan.PRODUCER_PRO;

    const allUsers = [...artists, ...engineers, ...stoodioz, ...producers];
    const followers = allUsers.filter(u => producer.followerIds.includes(u.id));
    const followedArtists = artists.filter(a => producer.following.artists.includes(a.id));
    const followedEngineers = engineers.filter(e => producer.following.engineers.includes(e.id));
    const followedStoodioz = stoodioz.filter(s => producer.following.stoodioz.includes(s.id));
    const followedProducers = producers.filter(p => producer.following.producers.includes(p.id));

    const renderContent = () => {
        switch(activeTab) {
            case 'analytics':
                return (
                    <Suspense fallback={<div>Loading Analytics...</div>}>
                        <AnalyticsDashboard user={producer} />
                    </Suspense>
                );
            case 'beatStore': return <BeatManager producer={producer} onUpdateProducer={updateProfile} />;
            case 'availability': return <AvailabilityManager user={producer} onUpdateUser={updateProfile} />;
            case 'settings': return <ProducerSettings producer={producer} onUpdateProducer={updateProfile} />;
            case 'wallet': return <Wallet user={producer} onAddFunds={onOpenAddFundsModal} onRequestPayout={onOpenPayoutModal} onViewBooking={viewBooking} userRole={UserRole.PRODUCER} />;
            case 'followers': return <FollowersList followers={followers} onSelectArtist={viewArtistProfile} onSelectEngineer={viewEngineerProfile} onSelectStoodio={viewStoodioDetails} onSelectProducer={viewProducerProfile} />;
            case 'following': return <Following artists={followedArtists} engineers={followedEngineers} studios={followedStoodioz} producers={followedProducers} onToggleFollow={toggleFollow} onSelectArtist={viewArtistProfile} onSelectEngineer={viewEngineerProfile} onSelectStudio={viewStoodioDetails} onSelectProducer={viewProducerProfile} />;
            default: return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <CreatePost currentUser={producer} onPost={createPost} />
                        <PostFeed posts={producer.posts || []} authors={new Map([[producer.id, producer]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={() => viewProducerProfile(producer)} />
                    </div>
                     <div className="lg:col-span-1 space-y-6">
                        {!isProPlan && <UpgradeProCard onNavigate={navigate} />}
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Profile Header */}
            <div className="p-6 md:p-8 cardSurface">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                     <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group flex-shrink-0">
                            <img src={producer.imageUrl} alt={producer.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-zinc-700" />
                             <button 
                                onClick={handleImageUploadClick} 
                                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                aria-label="Change profile photo"
                            >
                                <EditIcon className="w-8 h-8 text-white" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{producer.name}</h1>
                            <p className="text-zinc-400 mt-2">Producer Dashboard</p>
                        </div>
                    </div>
                     <label className="flex items-center cursor-pointer self-center sm:self-auto">
                        <span className="text-sm font-medium text-zinc-300 mr-3">Available for Hire</span>
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only" 
                                checked={producer.isAvailable} 
                                onChange={(e) => updateProfile({ isAvailable: e.target.checked })} 
                            />
                            <div className={`block w-12 h-6 rounded-full transition-colors ${producer.isAvailable ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${producer.isAvailable ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <StatCard label="Wallet Balance" value={`$${producer.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                    <StatCard label="Beats for Sale" value={producer.instrumentals.length} icon={<MusicNoteIcon className="w-6 h-6 text-purple-400" />} />
                    <StatCard label="Followers" value={producer.followers} icon={<UsersIcon className="w-6 h-6 text-blue-400" />} />
                </div>
            </div>
            <div className="cardSurface">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <TabButton label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <TabButton label="Analytics" isActive={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
                    <TabButton label="Beat Store" isActive={activeTab === 'beatStore'} onClick={() => setActiveTab('beatStore')} />
                    <TabButton label="Availability" isActive={activeTab === 'availability'} onClick={() => setActiveTab('availability')} />
                    <TabButton label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                    <TabButton label="Wallet" isActive={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} />
                    <TabButton label="Followers" isActive={activeTab === 'followers'} onClick={() => setActiveTab('followers')} />
                    <TabButton label="Following" isActive={activeTab === 'following'} onClick={() => setActiveTab('following')} />
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ProducerDashboard;
