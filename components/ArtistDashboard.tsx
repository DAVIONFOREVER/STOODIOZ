import React, { useState } from 'react';
import type { Artist, Booking, Stoodio, Engineer, LinkAttachment, Post, Conversation, Transaction } from '../types';
import { DollarSignIcon, CalendarIcon, UsersIcon, MagicWandIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import Following from './Following';
import FollowersList from './FollowersList';

interface ArtistDashboardProps {
    artist: Artist;
    bookings: Booking[];
    conversations: Conversation[];
    onNavigate: (view: any) => void;
    onUpdateProfile: (updatedProfile: Partial<Artist>) => void;
    allStoodioz: Stoodio[];
    allEngineers: Engineer[];
    allArtists: Artist[];
    onToggleFollow: (type: 'stoodio' | 'engineer' | 'artist', id: string) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectArtist: (artist: Artist) => void;
    onPost: (postData: { text: string; imageUrl?: string; link?: LinkAttachment }) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | null;
    onOpenVibeMatcher: () => void;
}

type DashboardTab = 'dashboard' | 'wallet' | 'followers' | 'following';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4 border border-slate-200">
        <div className="bg-orange-500/10 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-slate-500 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-3 font-semibold text-sm transition-colors ${isActive ? 'border-b-2 border-orange-500 text-orange-500' : 'text-slate-500 hover:text-slate-800'}`}
    >
        {label}
    </button>
);

const ArtistDashboard: React.FC<ArtistDashboardProps> = (props) => {
    const { artist, bookings, onPost, onLikePost, onCommentOnPost, currentUser, allStoodioz, allEngineers, allArtists, onToggleFollow, onSelectStoodio, onSelectEngineer, onSelectArtist, onOpenVibeMatcher, onUpdateProfile } = props;
    const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
    
    const followers = [...allArtists, ...allEngineers, ...allStoodioz].filter(u => u.followerIds.includes(artist.id));
    const followedStoodioz = allStoodioz.filter(s => artist.following.stoodioz.includes(s.id));
    const followedEngineers = allEngineers.filter(e => artist.following.engineers.includes(e.id));
    const followedArtists = allArtists.filter(a => artist.following.artists.includes(a.id));
    
    const renderContent = () => {
        switch (activeTab) {
            case 'wallet':
                return (
                    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                        <h3 className="text-xl font-bold mb-4">Wallet</h3>
                        <p className="text-4xl font-bold text-green-500 mb-6">${artist.walletBalance.toFixed(2)}</p>
                        <h4 className="font-semibold mb-2">Transaction History</h4>
                        <div className="space-y-2">
                            {artist.walletTransactions.map((tx: Transaction) => (
                                <div key={tx.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-md">
                                    <div>
                                        <p className="font-medium text-slate-700">{tx.description}</p>
                                        <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleString()}</p>
                                    </div>
                                    <p className={`font-semibold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                                        {tx.type === 'credit' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                             {artist.walletTransactions.length === 0 && <p className="text-slate-500 text-sm">No transactions yet.</p>}
                        </div>
                    </div>
                );
            case 'followers':
                 return <FollowersList followers={followers} onSelectArtist={onSelectArtist} onSelectEngineer={onSelectEngineer} onSelectStoodio={onSelectStoodio} />;
            case 'following':
                 return <Following studios={followedStoodioz} engineers={followedEngineers} artists={followedArtists} onToggleFollow={onToggleFollow} onSelectStudio={onSelectStoodio} onSelectArtist={onSelectArtist} onSelectEngineer={onSelectEngineer} />;
            case 'dashboard':
            default:
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <CreatePost currentUser={currentUser!} onPost={onPost} />
                            <PostFeed
                                posts={artist.posts || []}
                                authors={new Map([[artist.id, artist]])}
                                onLikePost={onLikePost}
                                onCommentOnPost={onCommentOnPost}
                                currentUser={currentUser}
                            />
                        </div>
                        <div className="space-y-8">
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 text-center flex flex-col items-center">
                                <MagicWandIcon className="w-10 h-10 text-orange-500 mb-3" />
                                <h3 className="text-xl font-bold text-slate-900 mb-2">AI Vibe Matcher</h3>
                                <p className="text-slate-600 text-sm mb-4">
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
        <div className="space-y-8">
            {/* Profile Header */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <img src={artist.imageUrl} alt={artist.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-slate-200 flex-shrink-0" />
                        <div className="text-center sm:text-left">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">{artist.name}</h1>
                            <p className="text-slate-500 mt-2">Artist Dashboard</p>
                        </div>
                    </div>
                    <div className="flex-shrink-0 pt-2">
                        <label className="flex items-center cursor-pointer">
                            <span className="text-sm font-medium text-slate-700 mr-3">Show on Map</span>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={artist.showOnMap ?? false} 
                                    onChange={(e) => onUpdateProfile({ showOnMap: e.target.checked })} 
                                />
                                <div className={`block w-12 h-6 rounded-full transition-colors ${artist.showOnMap ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${artist.showOnMap ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <StatCard label="Wallet Balance" value={`$${artist.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-500" />} />
                    <StatCard label="Total Bookings" value={bookings.length} icon={<CalendarIcon className="w-6 h-6 text-orange-500" />} />
                    <StatCard label="Followers" value={artist.followers} icon={<UsersIcon className="w-6 h-6 text-blue-500" />} />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-lg">
                <div className="flex border-b border-slate-200 overflow-x-auto">
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