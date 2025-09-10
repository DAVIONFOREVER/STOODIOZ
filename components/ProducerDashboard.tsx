import React, { useState } from 'react';
import type { Producer, Artist, Stoodio, Engineer, LinkAttachment, Post } from '../types';
import { UserRole, AppView, SubscriptionPlan } from '../types';
import { DollarSignIcon, CalendarIcon, UsersIcon, StarIcon, MusicNoteIcon, MagicWandIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import Following from './Following';
import FollowersList from './FollowersList';
import AvailabilityManager from './AvailabilityManager';
import Wallet from './Wallet';
import BeatManager from './BeatManager';
import ProducerSettings from './ProducerSettings';

interface ProducerDashboardProps {
    producer: Producer;
    onUpdateProducer: (updatedProfile: Partial<Producer>) => void;
    allArtists: Artist[];
    allEngineers: Engineer[];
    allStoodioz: Stoodio[];
    allProducers: Producer[];
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectProducer: (producer: Producer) => void;
    onToggleFollow: (type: 'artist' | 'engineer' | 'stoodio' | 'producer', id: string) => void;
    onStartConversation: (participant: Artist | Stoodio | Engineer | Producer) => void;
    onPost: (postData: any) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | Producer | null;
    onNavigate: (view: AppView) => void;
    onOpenAddFundsModal: () => void;
    onOpenPayoutModal: () => void;
    onViewBooking: (bookingId: string) => void;
    onOpenVibeMatcher: () => void;
}

type DashboardTab = 'dashboard' | 'beats' | 'availability' | 'settings' | 'wallet' | 'followers' | 'following';

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
    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 rounded-2xl text-white text-center shadow-lg shadow-indigo-500/10">
        <StarIcon className="w-10 h-10 mx-auto text-white/80 mb-2" />
        <h3 className="text-xl font-bold mb-2">Upgrade to Producer Pro</h3>
        <p className="text-sm opacity-90 mb-4">Unlock unlimited beat uploads, featured placements, and lower commission fees on sales.</p>
        <button 
            onClick={() => onNavigate(AppView.SUBSCRIPTION_PLANS)}
            className="bg-white text-indigo-500 font-bold py-2 px-6 rounded-lg hover:bg-zinc-100 transition-all duration-300"
        >
            View Plans
        </button>
    </div>
);

const ProducerDashboard: React.FC<ProducerDashboardProps> = (props) => {
    const { producer, currentUser, allArtists, allEngineers, allStoodioz, allProducers, onSelectArtist, onSelectEngineer, onSelectStoodio, onSelectProducer, onToggleFollow, onPost, onLikePost, onCommentOnPost, onUpdateProducer, onNavigate, onOpenAddFundsModal, onOpenPayoutModal, onViewBooking, onOpenVibeMatcher } = props;
    const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');

    const followers = [...allArtists, ...allEngineers, ...allStoodioz, ...allProducers].filter(u => u.followerIds.includes(producer.id));
    const followedStoodioz = allStoodioz.filter(s => producer.following.stoodioz.includes(s.id));
    const followedEngineers = allEngineers.filter(e => producer.following.engineers.includes(e.id));
    const followedArtists = allArtists.filter(a => producer.following.artists.includes(a.id));
    const followedProducers = allProducers.filter(p => producer.following.producers.includes(p.id));
    
    const isProPlan = producer.subscription?.plan === SubscriptionPlan.PRODUCER_PRO;

    const renderContent = () => {
        switch (activeTab) {
            case 'beats':
                return <BeatManager producer={producer} onUpdateProducer={onUpdateProducer} />;
            case 'settings':
                return <ProducerSettings producer={producer} onUpdateProducer={onUpdateProducer} />;
             case 'availability':
                return <AvailabilityManager user={producer} onUpdateUser={onUpdateProducer} />;
            case 'wallet':
                 return (
                    <Wallet
                        user={producer}
                        onAddFunds={onOpenAddFundsModal}
                        onRequestPayout={onOpenPayoutModal}
                        onViewBooking={onViewBooking}
                        userRole={UserRole.PRODUCER}
                    />
                );
            case 'followers':
                 return <FollowersList followers={followers} onSelectArtist={onSelectArtist} onSelectEngineer={onSelectEngineer} onSelectStoodio={onSelectStoodio} onSelectProducer={onSelectProducer} />;
            case 'following':
                return <Following studios={followedStoodioz} engineers={followedEngineers} artists={followedArtists} producers={followedProducers} onToggleFollow={onToggleFollow} onSelectStudio={onSelectStoodio} onSelectArtist={onSelectArtist} onSelectEngineer={onSelectEngineer} onSelectProducer={onSelectProducer} />;
            case 'dashboard':
            default:
                return (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <CreatePost currentUser={currentUser as Producer} onPost={onPost} />
                            <PostFeed posts={producer.posts || []} authors={new Map([[producer.id, producer]])} onLikePost={onLikePost} onCommentOnPost={onCommentOnPost} currentUser={currentUser} />
                        </div>
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-zinc-700/50 text-center flex flex-col items-center">
                                <MagicWandIcon className="w-10 h-10 text-orange-400 mb-3" />
                                <h3 className="text-xl font-bold text-zinc-100 mb-2">AI Vibe Matcher</h3>
                                <p className="text-zinc-400 text-sm mb-4">
                                    Find artists and collaborators by analyzing a reference track.
                                </p>
                                <button
                                    onClick={onOpenVibeMatcher}
                                    className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all duration-300 shadow-md flex items-center gap-2"
                                >
                                    <MagicWandIcon className="w-5 h-5" />
                                    Launch
                                </button>
                            </div>
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
                        <img src={producer.imageUrl} alt={producer.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-zinc-700 flex-shrink-0" />
                        <div className="text-center sm:text-left">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{producer.name}</h1>
                            <p className="text-zinc-400 mt-2">Producer Dashboard</p>
                        </div>
                    </div>
                    <div className="flex-shrink-0 pt-2">
                         <label className="flex items-center cursor-pointer">
                            <span className="text-sm font-medium text-zinc-300 mr-3">Show on Map</span>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={producer.showOnMap ?? false} 
                                    onChange={(e) => onUpdateProducer({ showOnMap: e.target.checked })} 
                                />
                                <div className={`block w-12 h-6 rounded-full transition-colors ${producer.showOnMap ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${producer.showOnMap ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <StatCard label="Wallet Balance" value={`$${producer.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                    <StatCard label="Instrumentals" value={producer.instrumentals.length} icon={<MusicNoteIcon className="w-6 h-6 text-purple-400" />} />
                    <StatCard label="Avg Rating" value={producer.rating.toFixed(1)} icon={<StarIcon className="w-6 h-6 text-yellow-400" />} />
                    <StatCard label="Followers" value={producer.followers} icon={<UsersIcon className="w-6 h-6 text-blue-400" />} />
                </div>
            </div>
            
             <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 shadow-lg">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <TabButton label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <TabButton label="Profile Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                    <TabButton label="My Beats" isActive={activeTab === 'beats'} onClick={() => setActiveTab('beats')} />
                    <TabButton label="Session Availability" isActive={activeTab === 'availability'} onClick={() => setActiveTab('availability')} />
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