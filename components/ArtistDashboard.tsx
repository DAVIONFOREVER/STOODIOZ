import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import type { Artist, Booking, Stoodio, Engineer, LinkAttachment, Post, Conversation, Producer } from '../types';
import { UserRole, AppView } from '../types';
import { DollarSignIcon, CalendarIcon, UsersIcon, MagicWandIcon, EditIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import Following from './Following';
import FollowersList from './FollowersList';
import Wallet from './Wallet';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useProfile } from '../hooks/useProfile';

const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));

type DashboardTab = 'dashboard' | 'analytics' | 'wallet' | 'followers' | 'following';

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


const ArtistDashboard: React.FC = () => {
    const { currentUser, bookings, conversations, stoodioz, engineers, artists, producers, dashboardInitialTab } = useAppState();
    const dispatch = useAppDispatch();
    const artist = currentUser as Artist;

    const { navigate, viewStoodioDetails, viewArtistProfile, viewEngineerProfile, viewProducerProfile, viewBooking } = useNavigation();
    const { createPost, likePost, commentOnPost, toggleFollow } = useSocial();
    const { updateProfile } = useProfile();

    const onOpenVibeMatcher = () => dispatch({ type: ActionTypes.SET_VIBE_MATCHER_OPEN, payload: { isOpen: true } });
    const onOpenAddFundsModal = () => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: true } });

    const [activeTab, setActiveTab] = useState<DashboardTab>(dashboardInitialTab as DashboardTab || 'dashboard');

    useEffect(() => {
        if (dashboardInitialTab) {
            setActiveTab(dashboardInitialTab as DashboardTab);
            dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: null } }); // Clear it after use
        }
    }, [dashboardInitialTab, dispatch]);

    const profileFileInputRef = useRef<HTMLInputElement>(null);
    const coverFileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                 if (type === 'profile') {
                    updateProfile({ imageUrl });
                } else {
                    updateProfile({ coverImageUrl: imageUrl });
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const upcomingBookingsCount = bookings.filter(b => new Date(b.date) >= new Date()).length;
    
    const allUsers = [...artists, ...engineers, ...stoodioz, ...producers];
    const followers = allUsers.filter(u => artist.followerIds.includes(u.id));

    const followedArtists = artists.filter(a => artist.following.artists.includes(a.id));
    const followedEngineers = engineers.filter(e => artist.following.engineers.includes(e.id));
    const followedStoodioz = stoodioz.filter(s => artist.following.stoodioz.includes(s.id));
    const followedProducers = producers.filter(p => artist.following.producers.includes(p.id));

    const renderContent = () => {
        switch (activeTab) {
            case 'analytics':
                return (
                    <Suspense fallback={<div>Loading Analytics...</div>}>
                        <AnalyticsDashboard user={artist} />
                    </Suspense>
                );
            case 'wallet':
                return (
                    <Wallet
                        user={artist}
                        onAddFunds={onOpenAddFundsModal}
                        onViewBooking={viewBooking}
                        userRole={UserRole.ARTIST}
                    />
                );
            case 'followers':
                 return <FollowersList followers={followers} onSelectArtist={viewArtistProfile} onSelectEngineer={viewEngineerProfile} onSelectStoodio={viewStoodioDetails} onSelectProducer={viewProducerProfile}/>;
            case 'following':
                return <Following studios={followedStoodioz} engineers={followedEngineers} artists={followedArtists} producers={followedProducers} onToggleFollow={toggleFollow} onSelectStudio={viewStoodioDetails} onSelectArtist={viewArtistProfile} onSelectEngineer={viewEngineerProfile} onSelectProducer={viewProducerProfile}/>;

            case 'dashboard':
            default:
                 return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <CreatePost currentUser={artist} onPost={createPost} />
                            <PostFeed posts={artist.posts || []} authors={new Map([[artist.id, artist]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={viewArtistProfile} />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Profile Header */}
            <div className="cardSurface overflow-hidden">
                <div className="relative h-40 md:h-56 bg-zinc-700">
                    <img src={artist.coverImageUrl || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop'} alt="Cover" className="w-full h-full object-cover"/>
                     <button 
                        onClick={() => coverFileInputRef.current?.click()}
                        className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                        aria-label="Change cover photo"
                    >
                        <EditIcon className="w-5 h-5" />
                    </button>
                    <input type="file" ref={coverFileInputRef} onChange={(e) => handleFileChange(e, 'cover')} className="hidden" accept="image/*"/>
                </div>
                <div className="p-6 pt-0">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20 gap-4">
                        <div className="relative group flex-shrink-0">
                            <img src={artist.imageUrl} alt={artist.name} className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-zinc-800" />
                            <button 
                                onClick={() => profileFileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                aria-label="Change profile photo"
                            >
                                <EditIcon className="w-8 h-8 text-white" />
                            </button>
                            <input type="file" ref={profileFileInputRef} onChange={(e) => handleFileChange(e, 'profile')} className="hidden" accept="image/*" />
                        </div>
                        <div className="flex-grow text-center sm:text-left sm:pb-4">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{artist.name}</h1>
                            <p className="text-zinc-400 mt-1">Artist Dashboard</p>
                        </div>
                        <button
                            onClick={onOpenVibeMatcher}
                            className="bg-purple-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-600 transition-colors text-base shadow-md flex items-center justify-center gap-2 sm:mb-4"
                        >
                            <MagicWandIcon className="w-5 h-5"/>
                            AI Vibe Matcher
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/5">
                    <StatCard label="Wallet Balance" value={`$${artist.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                    <StatCard label="Upcoming Bookings" value={upcomingBookingsCount} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
                    <StatCard label="Followers" value={artist.followers} icon={<UsersIcon className="w-6 h-6 text-blue-400" />} />
                </div>
            </div>
             <div className="cardSurface">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <TabButton label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <TabButton label="Analytics" isActive={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
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