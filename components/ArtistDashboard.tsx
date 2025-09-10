

import React, { useState } from 'react';
import type { Artist, Booking, Stoodio, Engineer, LinkAttachment, Post, Conversation, Producer } from '../types';
import { UserRole, AppView } from '../types';
import { DollarSignIcon, CalendarIcon, UsersIcon, MagicWandIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import Following from './Following';
import FollowersList from './FollowersList';
import Wallet from './Wallet';

interface ArtistDashboardProps {
    artist: Artist;
    bookings: Booking[];
    conversations: Conversation[];
    onNavigate: (view: any) => void;
    onUpdateProfile: (updatedProfile: Partial<Artist>) => void;
    allStoodioz: Stoodio[];
    allEngineers: Engineer[];
    allArtists: Artist[];
    allProducers: Producer[];
    onToggleFollow: (type: 'stoodio' | 'engineer' | 'artist' | 'producer', id: string) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectProducer: (producer: Producer) => void;
    onPost: (postData: { text: string; imageUrl?: string; link?: LinkAttachment }) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | Producer | null;
    onOpenVibeMatcher: () => void;
    onOpenAddFundsModal: () => void;
    onViewBooking: (bookingId: string) => void;
}

type DashboardTab = 'dashboard' | 'wallet' | 'followers' | 'following';

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

const ArtistDashboard: React.FC<ArtistDashboardProps> = (props) => {
    const { artist, bookings, onPost, onLikePost, onCommentOnPost, currentUser, allStoodioz, allEngineers, allArtists, allProducers, onToggleFollow, onSelectStoodio, onSelectEngineer, onSelectArtist, onSelectProducer, onOpenVibeMatcher, onUpdateProfile, onOpenAddFundsModal, onViewBooking } = props;
    const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
    
    const followers = [...allArtists, ...allEngineers, ...allStoodioz, ...allProducers].filter(u => u.followerIds.includes(artist.id));
    const followedStoodioz = allStoodioz.filter(s => artist.following.stoodioz.includes(s.id));
    const followedEngineers = allEngineers.filter(e => artist.following.engineers.includes(e.id));
    const followedArtists = allArtists.filter(a => artist.following.artists.includes(a.id));
    const followedProducers = allProducers.filter(p => artist.following.producers.includes(p.id));
    
    const renderContent = () => {
        switch (activeTab) {
            case 'wallet':
                return (
                    <Wallet
                        user={artist}
                        onAddFunds={onOpenAddFundsModal}
                        onViewBooking={onViewBooking}
                        userRole={UserRole.ARTIST}
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
                            <CreatePost currentUser={currentUser as Artist} onPost={onPost} />
                            <PostFeed
                                posts={artist.posts || []}
                                authors={new Map([[artist.id, artist]])}
                                onLikePost={onLikePost}
                                onCommentOnPost={onCommentOnPost}
                                currentUser={currentUser}
                            />
                        </div>
                        <div className="space-y-8">
                            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-zinc-700/50 text-center flex flex-col items-center">
                                <MagicWandIcon className="w-10 h-10 text-orange-400 mb-3" />
                                <h3 className="text-xl font-bold text-zinc-100 mb-2">AI Vibe Matcher</h3>
                                <p className="text-zinc-400 text-sm mb-4">
                                    Find collaborators by analyzing a reference track.
                                </p>
                                <button 
                                    onClick={onOpenVibeMatcher} 
                                    className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all duration-300 shadow-md flex items-center gap-2"
                                >
                                    <MagicWandIcon className="w-5 h-5" />
                                    Launch
                                </button>
                            </div>
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
                        <img src={artist.imageUrl} alt={artist.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-zinc-700 flex-shrink-0" />
                        <div className="text-center sm:text-left">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{artist.name}</h1>
                            <p className="text-zinc-400 mt-2">Artist Dashboard</p>
                        </div>
                    </div>
                    <div className="flex-shrink-0 pt-2">
                        <label className="flex items-center cursor-pointer">
                            <span className="text-sm font-medium text-zinc-300 mr-3">Show on Map</span>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={artist.showOnMap ?? false} 
                                    onChange={(e) => onUpdateProfile({ showOnMap: e.target.checked })} 
                                />
                                <div className={`block w-12 h-6 rounded-full transition-colors ${artist.showOnMap ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${artist.showOnMap ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <StatCard label="Wallet Balance" value={`$${artist.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                    <StatCard label="Total Bookings" value={bookings.length} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
                    <StatCard label="Followers" value={artist.followers} icon={<UsersIcon className="w-6 h-6 text-blue-400" />} />
                </div>
            </div>

            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 shadow-lg">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <TabButton label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <TabButton label="Wallet" isActive={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} />
                    <TabButton label="Followers" isActive={activeTab === 'followers'} onClick={() => setActiveTab('followers')} />
                    <TabButton label="Following" isActive={activeTab === 'following'} onClick={() => setActiveTab('following')} />
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    )
};

export default ArtistDashboard;