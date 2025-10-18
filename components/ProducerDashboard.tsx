
import React, { useState, useRef } from 'react';
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
import { useAppState } from '../contexts/AppContext';

// FIX: Define missing DashboardTab type
type DashboardTab = 'dashboard' | 'beatStore' | 'availability' | 'settings' | 'wallet' | 'followers' | 'following';

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
    // FIX: Removed all props and now get state from context
    const { 
        currentUser, artists, engineers, stoodioz, producers 
    } = useAppState();
    const producer = currentUser as Producer;

    // FIX: Mock handlers defined inside component
    const onUpdateProducer = (updates: Partial<Producer>) => console.log('Update Producer:', updates);
    const onSelectArtist = (a: Artist) => console.log('Select artist:', a.name);
    const onSelectEngineer = (e: Engineer) => console.log('Select engineer:', e.name);
    const onSelectStoodio = (s: Stoodio) => console.log('Select stoodio:', s.name);
    const onSelectProducer = (p: Producer) => console.log('Select producer:', p.name);
    const onToggleFollow = (type: string, id: string) => console.log(`Toggle follow ${type}:`, id);
    const onStartConversation = (p: any) => console.log('Start conversation with:', p.name);
    const onPost = (postData: any) => console.log('New Post:', postData);
    const onLikePost = (postId: string) => console.log('Like post:', postId);
    const onCommentOnPost = (postId: string, text: string) => console.log('Comment on post:', postId, text);
    const onNavigate = (view: AppView) => console.log('Navigate to:', view);
    const onOpenAddFundsModal = () => console.log('Open add funds');
    const onOpenPayoutModal = () => console.log('Open payout');
    const onViewBooking = (id: string) => console.log('View booking:', id);
    const onOpenVibeMatcher = () => console.log('Open vibe matcher');

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
                onUpdateProducer({ imageUrl });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const isProPlan = producer.subscription?.plan === SubscriptionPlan.PRODUCER_PRO;

    const renderContent = () => {
        switch(activeTab) {
            case 'beatStore': return <BeatManager producer={producer} onUpdateProducer={onUpdateProducer} />;
            case 'availability': return <AvailabilityManager user={producer} onUpdateUser={onUpdateProducer} />;
            case 'settings': return <ProducerSettings producer={producer} onUpdateProducer={onUpdateProducer} />;
            case 'wallet': return <Wallet user={producer} onAddFunds={onOpenAddFundsModal} onRequestPayout={onOpenPayoutModal} onViewBooking={onViewBooking} userRole={UserRole.PRODUCER} />;
            // Other cases...
            default: return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <CreatePost currentUser={producer} onPost={onPost} />
                        <PostFeed posts={producer.posts || []} authors={new Map([[producer.id, producer]])} onLikePost={onLikePost} onCommentOnPost={onCommentOnPost} onSelectAuthor={() => {}} />
                    </div>
                     <div className="lg:col-span-1 space-y-6">
                        {!isProPlan && <UpgradeProCard onNavigate={onNavigate} />}
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Profile Header */}
            <div className="bg-zinc-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-zinc-700/50 shadow-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                     <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* FIX: Image upload UI added */}
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
                                onChange={(e) => onUpdateProducer({ isAvailable: e.target.checked })} 
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
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 shadow-lg">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <TabButton label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
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
