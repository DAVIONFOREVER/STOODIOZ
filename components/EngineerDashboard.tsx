import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import type { Engineer, Artist, Stoodio, Producer } from '../types';
import { AppView, SubscriptionPlan, UserRole } from '../types';
import { DollarSignIcon, CalendarIcon, StarIcon, EditIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import AvailabilityManager from './AvailabilityManager';
import NotificationSettings from './NotificationSettings';
import Wallet from './Wallet';
import MixingServicesManager from './MixingServicesManager';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useProfile } from '../hooks/useProfile';
import MixingSampleManager from './MixingSampleManager';
import ProfileHeroHeader from './ProfileHeroHeader';

const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));

type DashboardTab = 'dashboard' | 'analytics' | 'jobBoard' | 'availability' | 'mixingSamples' | 'mixingServices' | 'notificationSettings' | 'wallet' | 'followers' | 'following';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl flex items-center gap-4 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
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
    <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-6 rounded-2xl text-white text-center shadow-lg shadow-blue-500/10">
        <StarIcon className="w-10 h-10 mx-auto text-white/80 mb-2" />
        <h3 className="text-xl font-bold mb-2">Upgrade to Engineer Pro</h3>
        <p className="text-sm opacity-90 mb-4">Unlock advanced job filters, lower service fees, and priority support to boost your career.</p>
        <button 
            onClick={() => onNavigate(AppView.SUBSCRIPTION_PLANS)}
            className="bg-white text-indigo-500 font-bold py-2 px-6 rounded-lg hover:bg-zinc-100 transition-all duration-300"
        >
            View Plans
        </button>
    </div>
);

const EngineerDashboard: React.FC = () => {
    const { currentUser, bookings, dashboardInitialTab } = useAppState();
    const dispatch = useAppDispatch();
    const engineer = currentUser as Engineer;
    
    const { navigate, viewBooking } = useNavigation();
    const { createPost, likePost, commentOnPost } = useSocial();
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
             // Other cases would be here...
             default: return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <CreatePost currentUser={engineer} onPost={createPost} />
                        <PostFeed posts={engineer.posts || []} authors={new Map([[engineer.id, engineer]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={() => {}} />
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
             <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8">
                 <ProfileHeroHeader profile={engineer} />
            </div>

             <div className="bg-black/50 backdrop-blur-md rounded-xl border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                <div className="flex border-b border-orange-500/20 overflow-x-auto">
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
