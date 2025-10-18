
import React, { useState, useRef } from 'react';
import type { Engineer, Review, Booking, Artist, Stoodio, Transaction, Producer, Location } from '../types';
import { BookingStatus, AppView, SubscriptionPlan, UserRole } from '../types';
import { DollarSignIcon, CalendarIcon, StarIcon, CheckCircleIcon, CloseCircleIcon, BriefcaseIcon, RoadIcon, EditIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import Following from './Following';
import FollowersList from './FollowersList';
import AvailabilityManager from './AvailabilityManager';
import NotificationSettings from './NotificationSettings';
import Wallet from './Wallet';
import MixingServicesManager from './MixingServicesManager';
import { useAppState } from '../contexts/AppContext';

// FIX: Define missing DashboardTab type
type DashboardTab = 'dashboard' | 'jobBoard' | 'availability' | 'mixingServices' | 'notificationSettings' | 'wallet' | 'followers' | 'following';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-zinc-800/50 p-4 rounded-xl flex items-center gap-4 border border-zinc-700/50">
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
        <h3 className="text-xl font-bold mb-2">Upgrade to Engineer Plus</h3>
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
    // FIX: Removed all props and now get state from context
    const { 
        currentUser, bookings, artists, engineers, stoodioz, producers 
    } = useAppState();
    const engineer = currentUser as Engineer; // Assume currentUser is the correct engineer
    
    // FIX: Mock handlers defined inside component
    const onUpdateEngineer = (updates: Partial<Engineer>) => console.log('Update Engineer:', updates);
    const onAcceptBooking = (id: string) => console.log('Accept booking:', id);
    const onDenyBooking = (id: string) => console.log('Deny booking:', id);
    const onStartSession = (b: Booking) => console.log('Start session:', b.id);
    const onSelectArtist = (a: Artist) => console.log('Select artist:', a.name);
    const onSelectEngineer = (e: Engineer) => console.log('Select engineer:', e.name);
    const onSelectStoodio = (s: Stoodio) => console.log('Select stoodio:', s.name);
    const onSelectProducer = (p: Producer) => console.log('Select producer:', p.name);
    const onToggleFollow = (type: string, id: string) => console.log(`Toggle follow ${type}:`, id);
    const onNavigateToStudio = (loc: any) => console.log('Navigate to studio');
    const onStartConversation = (p: any) => console.log('Start conversation with:', p.name);
    const onPost = (postData: any) => console.log('New Post:', postData);
    const onLikePost = (postId: string) => console.log('Like post:', postId);
    const onCommentOnPost = (postId: string, text: string) => console.log('Comment on post:', postId, text);
    const onNavigate = (view: AppView) => console.log('Navigate to:', view);
    const onOpenAddFundsModal = () => console.log('Open add funds');
    const onOpenPayoutModal = () => console.log('Open payout');
    const onViewBooking = (id: string) => console.log('View booking:', id);
    
    const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // FIX: Added image upload handlers
    const handleImageUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                onUpdateEngineer({ imageUrl });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const upcomingBookings = bookings.filter(b => (b.engineer?.id === engineer.id || b.requestedEngineerId === engineer.id) && b.status === BookingStatus.CONFIRMED && new Date(`${b.date}T${b.startTime}`) >= new Date());
    const isProPlan = engineer.subscription?.plan === SubscriptionPlan.ENGINEER_PLUS;
    
    const renderContent = () => {
         // This is a stub, but we can imagine what it would look like
         switch(activeTab) {
             case 'availability': return <AvailabilityManager user={engineer} onUpdateUser={onUpdateEngineer} />;
             case 'mixingServices': return <MixingServicesManager engineer={engineer} onUpdateUser={onUpdateEngineer} />;
             case 'notificationSettings': return <NotificationSettings engineer={engineer} onUpdateUser={onUpdateEngineer} />;
             case 'wallet': return <Wallet user={engineer} onAddFunds={onOpenAddFundsModal} onRequestPayout={onOpenPayoutModal} onViewBooking={onViewBooking} userRole={UserRole.ENGINEER} />;
             // Other cases would be here...
             default: return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <CreatePost currentUser={engineer} onPost={onPost} />
                        <PostFeed posts={engineer.posts || []} authors={new Map([[engineer.id, engineer]])} onLikePost={onLikePost} onCommentOnPost={onCommentOnPost} onSelectAuthor={() => {}} />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        {!isProPlan && <UpgradePlusCard onNavigate={onNavigate} />}
                    </div>
                </div>
            );
         }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Profile Header */}
            <div className="bg-zinc-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-zinc-700/50 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* FIX: Image upload UI added */}
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
                                onChange={(e) => onUpdateEngineer({ isAvailable: e.target.checked })} 
                            />
                            <div className={`block w-12 h-6 rounded-full transition-colors ${engineer.isAvailable ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${engineer.isAvailable ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </label>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <StatCard label="Wallet Balance" value={`$${engineer.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                    <StatCard label="Upcoming Sessions" value={upcomingBookings.length} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
                    <StatCard label="Overall Rating" value={engineer.rating.toFixed(1)} icon={<StarIcon className="w-6 h-6 text-yellow-400" />} />
                </div>
            </div>
             <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 shadow-lg">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <TabButton label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <TabButton label="Job Board" isActive={activeTab === 'jobBoard'} onClick={() => setActiveTab('jobBoard')} />
                    <TabButton label="Availability" isActive={activeTab === 'availability'} onClick={() => setActiveTab('availability')} />
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
