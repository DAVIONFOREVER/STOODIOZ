
import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import type { Engineer, Artist, Stoodio, Producer } from '../types';
import { AppView, SubscriptionPlan, UserRole } from '../types';
import { DollarSignIcon, CalendarIcon, StarIcon, EditIcon } from './icons';
import CreatePost from './CreatePost.tsx';
import PostFeed from './PostFeed.tsx';
import AvailabilityManager from './AvailabilityManager.tsx';
import NotificationSettings from './NotificationSettings.tsx';
import Wallet from './Wallet.tsx';
import MixingServicesManager from './MixingServicesManager.tsx';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext.tsx';
import { useNavigation } from '../hooks/useNavigation.ts';
import { useSocial } from '../hooks/useSocial.ts';
import { useProfile } from '../hooks/useProfile.ts';
import MixingSampleManager from './MixingSampleManager.tsx';
import Following from './Following.tsx';
import FollowersList from './FollowersList.tsx';

const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard.tsx'));

type DashboardTab = 'dashboard' | 'analytics' | 'jobBoard' | 'availability' | 'mixingSamples' | 'mixingServices' | 'notificationSettings' | 'wallet' | 'followers' | 'following';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="p-4 flex items-center gap-4 cardSurface">
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

const UpgradePlusCard: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => (
    <div className="cardSurface border-2 border-orange-500 p-6 text-zinc-100 text-center">
        <StarIcon className="w-10 h-10 mx-auto text-orange-400/80 mb-2" />
        <h3 className="text-xl font-bold mb-2">Upgrade to Engineer Plus</h3>
        <p className="text-sm text-zinc-400 mb-4">Unlock advanced job filters, lower service fees, and priority support to boost your career.</p>
        <button 
            onClick={() => onNavigate(AppView.SUBSCRIPTION_PLANS)}
            className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all duration-300"
        >
            View Plans
        </button>
    </div>
);

const EngineerDashboard: React.FC = () => {
    const { currentUser, bookings, dashboardInitialTab, artists, engineers, stoodioz, producers } = useAppState();
    const dispatch = useAppDispatch();
    const engineer = currentUser as Engineer;
    
    const { navigate, viewBooking, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile } = useNavigation();
    const { createPost, likePost, commentOnPost, toggleFollow } = useSocial();
    const { updateProfile } = useProfile();

    const [activeTab, setActiveTab] = useState<DashboardTab>(dashboardInitialTab as DashboardTab || 'dashboard');

    useEffect(() => {
        if (dashboardInitialTab) {
            setActiveTab(dashboardInitialTab as DashboardTab);
            dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: null } }); // Clear it after use
        }
    }, [dashboardInitialTab, dispatch]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const onOpenAddFundsModal = () => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: true } });
    const onOpenPayoutModal = () => dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: true } });

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
    
    const upcomingBookings = bookings.filter(b => (b.engineer?.id === engineer.id || b.requestedEngineerId === engineer.id) && new Date(`${b.date}T${b.startTime}`) >= new Date());
    const isProPlan = engineer.subscription?.plan === SubscriptionPlan.ENGINEER_PLUS;
    
    const allUsers = [...artists, ...engineers, ...stoodioz, ...producers];
    const followers = allUsers.filter(u => engineer.followerIds.includes(u.id));
    const followedArtists = artists.filter(a => engineer.following.artists.includes(a.id));
    const followedEngineers = engineers.filter(e => engineer.following.engineers.includes(e.id));
    const followedStoodioz = stoodioz.filter(s => engineer.following.stoodioz.includes(s.id));
    const followedProducers = producers.filter(p => engineer.following.producers.includes(p.id));
    
    const renderContent = () => {
         switch(activeTab) {
             case 'analytics':
                return (
                    <Suspense fallback={<div>Loading Analytics...</div>}>
                        <AnalyticsDashboard user={engineer} />
                    </Suspense>
                );
             case 'availability': return <AvailabilityManager user={engineer} onUpdateUser={updateProfile} />;
             case 'mixingSamples': return <MixingSampleManager engineer={engineer} onUpdateEngineer={updateProfile} />;
             case 'mixingServices': return <MixingServicesManager engineer={engineer} onUpdateEngineer={updateProfile} />;
             case 'notificationSettings': return <NotificationSettings engineer={engineer} onUpdateEngineer={updateProfile} />;
             case 'wallet': return <Wallet user={engineer} onAddFunds={onOpenAddFundsModal} onRequestPayout={onOpenPayoutModal} onViewBooking={viewBooking} userRole={UserRole.ENGINEER} />;
             case 'followers': return <FollowersList followers={followers} onSelectArtist={viewArtistProfile} onSelectEngineer={viewEngineerProfile} onSelectStoodio={viewStoodioDetails} onSelectProducer={viewProducerProfile} />;
             case 'following': return <Following artists={followedArtists} engineers={followedEngineers} studios={followedStoodioz} producers={followedProducers} onToggleFollow={toggleFollow} onSelectArtist={viewArtistProfile} onSelectEngineer={viewEngineerProfile} onSelectStudio={viewStoodioDetails} onSelectProducer={viewProducerProfile} />;
             default: return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <CreatePost currentUser={engineer} onPost={createPost} />
                        <PostFeed posts={engineer.posts || []} authors={new Map([[engineer.id, engineer]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={() => viewEngineerProfile(engineer)} />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        {!isProPlan && <UpgradePlusCard onNavigate={navigate} />}
                    </div>
                </div>
            );
         }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Profile Header */}
            <div className="p-6 md:p-8 cardSurface">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group flex-shrink-0">
                             <img src={engineer.imageUrl} alt={engineer.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-zinc-700" />
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
                            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{engineer.name}</h1>
                            <p className="text-zinc-400 mt-2">Engineer Dashboard</p>
                        </div>
                    </div>
                    <label className="flex items-center cursor-pointer self-center sm:self-auto">
                        <span className="text-sm font-medium text-zinc-300 mr-3">Available for Hire</span>
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only" 
                                checked={engineer.isAvailable} 
                                onChange={(e) => updateProfile({ isAvailable: e.target.checked })} 
                            />
                            <div className={`block w-12 h-6 rounded-full transition-colors ${engineer.isAvailable ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${engineer.isAvailable ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </label>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <StatCard label="Wallet Balance" value={`$${engineer.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                    <StatCard label="Upcoming Sessions" value={upcomingBookings.length} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
                    <StatCard label="Overall Rating" value={engineer.rating_overall.toFixed(1)} icon={<StarIcon className="w-6 h-6 text-yellow-400" />} />
                </div>
            </div>
             <div className="cardSurface">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <TabButton label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <TabButton label="Analytics" isActive={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
                    <TabButton label="Job Board" isActive={activeTab === 'jobBoard'} onClick={() => setActiveTab('jobBoard')} />
                    <TabButton label="Availability" isActive={activeTab === 'availability'} onClick={() => setActiveTab('availability')} />
                    <TabButton label="Mixing Samples" isActive={activeTab === 'mixingSamples'} onClick={() => setActiveTab('mixingSamples')} />
                    <TabButton label="Mixing Services" isActive={activeTab === 'mixingServices'} onClick={() => setActiveTab('mixingServices')} />
                    <TabButton label="Notifications" isActive={activeTab === 'notificationSettings'} onClick={() => setActiveTab('notificationSettings')} />
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

export default EngineerDashboard;
