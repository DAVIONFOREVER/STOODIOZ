import React, { useState, useRef, useEffect } from 'react';
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
import ProfileHeroHeader from './ProfileHeroHeader';

type DashboardTab = 'dashboard' | 'wallet' | 'followers' | 'following';

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
    
    const upcomingBookingsCount = bookings.filter(b => new Date(b.date) >= new Date()).length;
    
    const allUsers = [...artists, ...engineers, ...stoodioz, ...producers];
    const followers = allUsers.filter(u => artist.followerIds.includes(u.id));

    const followedArtists = artists.filter(a => artist.following.artists.includes(a.id));
    const followedEngineers = engineers.filter(e => artist.following.engineers.includes(e.id));
    const followedStoodioz = stoodioz.filter(s => artist.following.stoodioz.includes(s.id));
    const followedProducers = producers.filter(p => artist.following.producers.includes(p.id));

    const renderContent = () => {
        switch (activeTab) {
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
                         <div className="lg:col-span-1 space-y-6">
                            <div className="bg-black/50 backdrop-blur-md rounded-2xl p-6 border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                                <h3 className="font-bold text-zinc-100 mb-4">Quick Actions</h3>
                                <button
                                    onClick={onOpenVibeMatcher}
                                    className="w-full bg-purple-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-600 transition-colors text-base shadow-md flex items-center justify-center gap-2"
                                >
                                    <MagicWandIcon className="w-5 h-5"/>
                                    AI Vibe Matcher
                                </button>
                            </div>
                         </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8">
                <ProfileHeroHeader profile={artist} />
            </div>
            
            <div className="bg-black/50 backdrop-blur-md rounded-xl border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                <div className="flex border-b border-orange-500/20 overflow-x-auto">
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
