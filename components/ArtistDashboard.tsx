
import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import type { Artist, Booking, Stoodio, Engineer, LinkAttachment, Post, Conversation, Producer } from '../types';
import { UserRole, AppView } from '../types';
import { DollarSignIcon, CalendarIcon, UsersIcon, MagicWandIcon, EditIcon, PhotoIcon, PaperclipIcon, MusicNoteIcon, EyeIcon, MicrophoneIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import Following from './Following';
import FollowersList from './FollowersList';
import Wallet from './Wallet';
import VerifiedBadge from './VerifiedBadge';
import ProfileBioEditor from './ProfileBioEditor';
import StageCreatorHub from './StageCreatorHub';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useProfile } from '../hooks/useProfile';
import * as apiService from '../services/apiService';
import { getProfileImageUrl } from '../constants';

const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard.tsx'));
const Documents = lazy(() => import('./Documents.tsx'));
const MyCourses = lazy(() => import('./MyCourses.tsx'));

type DashboardTab = 'dashboard' | 'analytics' | 'wallet' | 'followers' | 'following' | 'documents' | 'deliverables' | 'myCourses';

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
    const [myPosts, setMyPosts] = useState<Post[]>([]);
    const postSectionRef = useRef<HTMLDivElement>(null);
    
    if (!currentUser) {
        return (
            <div className="flex justify-center items-center py-20">
                <p className="text-zinc-400">Loading user data...</p>
            </div>
        );
    }

    const artist = currentUser as Artist;

    const { navigate, viewStoodioDetails, viewArtistProfile, viewEngineerProfile, viewProducerProfile, viewBooking } = useNavigation();
    const { createPost, likePost, commentOnPost, toggleFollow } = useSocial();
    const { updateProfile, refreshCurrentUser } = useProfile();

    const onOpenVibeMatcher = () => dispatch({ type: ActionTypes.SET_VIBE_MATCHER_OPEN, payload: { isOpen: true } });
    const onOpenAddFundsModal = () => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: true } });
    const onOpenAria = () => dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
    const handleManagePosts = () => {
        setActiveTab('dashboard');
        requestAnimationFrame(() => {
            postSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

    const [activeTab, setActiveTab] = useState<DashboardTab>(dashboardInitialTab as DashboardTab || 'dashboard');

    useEffect(() => {
        if (dashboardInitialTab) {
            setActiveTab(dashboardInitialTab as DashboardTab);
            dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: null } }); // Clear it after use
        }
    }, [dashboardInitialTab, dispatch]);

    // Fetch user specific posts for personal feed
    const refreshPosts = async () => {
        if (artist.id) {
            const posts = await apiService.fetchUserPosts(artist.id);
            setMyPosts(posts);
        }
    };

    useEffect(() => {
        refreshPosts();
    }, [artist.id]);

    const handleNewPost = async (postData: any) => {
        // Optimistic update for immediate feedback
        const tempPost: Post = {
            id: `temp-${Date.now()}`,
            authorId: artist.id,
            authorType: UserRole.ARTIST,
            text: postData.text,
            image_url: postData.imageUrl,
            video_url: postData.videoUrl,
            video_thumbnail_url: postData.videoThumbnailUrl,
            link: postData.link,
            timestamp: new Date().toISOString(),
            likes: [],
            comments: []
        };
        setMyPosts(prev => [tempPost, ...prev]);

        // Explicitly pass role to ensure correct posting
        await createPost(postData, UserRole.ARTIST);
        refreshPosts();
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverImageInputRef = useRef<HTMLInputElement>(null);

    const handleImageUploadClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleCoverImageUploadClick = () => {
        coverImageInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser) return;
        try {
            const profileId = (currentUser as any)?.profile_id ?? currentUser?.id;
            const url = await apiService.uploadAvatar(profileId, file);
            await updateProfile({ image_url: url });
            await refreshCurrentUser();
        } catch (e: any) {
            console.error('Avatar upload failed', e);
            alert(e?.message || 'Profile photo could not be saved. Check storage/RLS or try again.');
        } finally {
            event.target.value = '';
        }
    };

    const handleCoverFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser) return;
        try {
            const profileId = (currentUser as any)?.profile_id ?? currentUser?.id;
            const url = await apiService.uploadCoverImage(profileId, file);
            await updateProfile({ cover_image_url: url });
            await refreshCurrentUser();
        } catch (e: any) {
            console.error('Cover upload failed', e);
            alert(e?.message || 'Cover photo could not be saved. Check storage/RLS or try again.');
        } finally {
            event.target.value = '';
        }
    };
    
    const upcomingBookingsCount = bookings.filter(b => new Date(b.date) >= new Date()).length;
    
    const allUsers = [...artists, ...engineers, ...stoodioz, ...producers];
    const followers = allUsers.filter(u => (artist.follower_ids || []).includes(u.id));
    const followedArtists = artists.filter(a => (artist.following?.artists || []).includes(a.id));
    const followedEngineers = engineers.filter(e => (artist.following?.engineers || []).includes(e.id));
    const followedStoodioz = stoodioz.filter(s => (artist.following?.stoodioz || []).includes(s.id));
    const followedProducers = producers.filter(p => (artist.following?.producers || []).includes(p.id));


    const renderContent = () => {
        switch (activeTab) {
            case 'analytics':
                return (
                    <Suspense fallback={<div>Loading Analytics...</div>}>
                        <AnalyticsDashboard user={artist} userRole={UserRole.ARTIST} />
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
            case 'documents':
                return (
                    <Suspense fallback={<div>Loading Documents...</div>}>
                        <Documents conversations={conversations} />
                    </Suspense>
                );
            case 'deliverables':
                return (
                    <Suspense fallback={<div>Loading Deliverables...</div>}>
                        <Documents conversations={conversations} variant="deliverables" />
                    </Suspense>
                );
            case 'myCourses':
                return (
                    <Suspense fallback={<div>Loading Courses...</div>}>
                        <MyCourses />
                    </Suspense>
                );
            case 'dashboard':
            default:
                 const isAria = artist.email === 'aria@stoodioz.ai';
                 return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <StageCreatorHub
                                currentUser={artist}
                                suggestions={[]}
                                trendingPost={null}
                                trendingPostAuthor={null}
                                onToggleFollow={() => {}}
                                onLikePost={() => {}}
                                onCommentOnPost={() => {}}
                                onSelectUser={() => {}}
                                onNavigate={navigate}
                                onOpenAria={onOpenAria}
                                onManagePosts={handleManagePosts}
                                onStartLive={() => navigate(AppView.INBOX)}
                                onJoinLive={() => navigate(AppView.INBOX)}
                                showSideSections={false}
                                showQuickAccess={false}
                            />
                            {isAria && (
                                <div className="p-6 bg-gradient-to-br from-orange-500/10 to-pink-500/10 border-2 border-orange-500/30 rounded-2xl backdrop-blur-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-lg bg-orange-500/20">
                                            <MicrophoneIcon className="w-5 h-5 text-orange-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white">Developer Posting</h3>
                                            <p className="text-sm text-zinc-400">Post important updates about the app or Aria's music. These will appear on The Stage and Aria's Activity tab.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={postSectionRef} className="space-y-6">
                                <CreatePost currentUser={artist} onPost={handleNewPost} />
                                <PostFeed posts={myPosts} authors={new Map([[artist.id, artist]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={(author) => viewArtistProfile(author as Artist)} />
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Profile Header */}
            <div className="relative rounded-2xl overflow-hidden cardSurface group">
                {/* Cover Image */}
                <div className="h-48 md:h-64 bg-zinc-900 relative">
                    {artist.cover_image_url ? (
                        <img 
                            src={artist.cover_image_url}
                            alt={`${artist.name}'s cover photo`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
                            <p className="text-zinc-700 font-bold text-4xl opacity-20 uppercase tracking-widest">Artist</p>
                        </div>
                    )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                
                {/* Edit Cover Button */}
                <button 
                    onClick={handleCoverImageUploadClick}
                    className="absolute top-4 right-4 bg-black/50 text-white text-xs font-semibold py-1.5 px-3 rounded-full hover:bg-black/70 transition-opacity opacity-0 group-hover:opacity-100 flex items-center gap-2"
                >
                    <PhotoIcon className="w-4 h-4" /> Edit Cover
                </button>
                <input
                    type="file"
                    ref={coverImageInputRef}
                    onChange={handleCoverFileChange}
                    className="hidden"
                    accept="image/*,.heic,.heif"
                />

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
                            <div className="relative group/pfp flex-shrink-0">
                                <img src={getProfileImageUrl(artist)} alt={artist.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-zinc-800" />
                                <button 
                                    onClick={handleImageUploadClick} 
                                    className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/pfp:opacity-100 transition-opacity cursor-pointer"
                                    aria-label="Change profile photo"
                                >
                                    <EditIcon className="w-8 h-8 text-white" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*,.heic,.heif"
                                />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{artist.name}</h1>
                                <div className="flex flex-wrap items-center gap-2 mt-1"><VerifiedBadge labelVerified={!!(artist as any).label_verified} /><p className="text-zinc-400">Artist Dashboard</p></div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 items-center">
                             <button
                                onClick={() => viewArtistProfile(artist)}
                                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-3 rounded-lg transition-colors text-sm font-semibold border border-zinc-700 shadow-md"
                            >
                                <EyeIcon className="w-4 h-4" />
                                View Public Profile
                            </button>
                            <button
                                onClick={() => navigate(AppView.STOODIO_LIST)}
                                className="bg-orange-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors text-base shadow-md flex items-center justify-center gap-2"
                            >
                                <CalendarIcon className="w-5 h-5"/>
                                Book a New Session
                            </button>
                            <button
                                onClick={onOpenVibeMatcher}
                                className="bg-purple-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-600 transition-colors text-base shadow-md flex items-center justify-center gap-2"
                            >
                                <MagicWandIcon className="w-5 h-5"/>
                                AI Vibe Matcher
                            </button>
                            <label className="flex items-center cursor-pointer self-center sm:self-auto">
                                <span className="text-sm font-medium text-zinc-300 mr-3">Show on Map</span>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={Boolean((artist as any).show_on_map)}
                                        onChange={(e) => updateProfile({ show_on_map: e.target.checked } as any)}
                                    />
                                    <div className={`block w-12 h-6 rounded-full transition-colors ${(artist as any).show_on_map ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${(artist as any).show_on_map ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard label="Wallet Balance" value={`$${(artist.wallet_balance ?? 0).toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                <StatCard label="Upcoming Bookings" value={upcomingBookingsCount} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
                <StatCard label="Followers" value={artist.followers ?? 0} icon={<UsersIcon className="w-6 h-6 text-blue-400" />} />
            </div>

            <ProfileBioEditor
                value={artist.bio || ''}
                placeholder="Describe your sound, story, and the kind of sessions you want."
                onSave={async (next) => {
                    await updateProfile({ bio: next });
                    await refreshCurrentUser();
                }}
            />

             <div className="cardSurface">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <TabButton label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <TabButton label="My Activity" isActive={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
                    <TabButton label="My Courses" isActive={activeTab === 'myCourses'} onClick={() => setActiveTab('myCourses')} />
                    <TabButton label="Wallet" isActive={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} />
                    <TabButton label="Followers" isActive={activeTab === 'followers'} onClick={() => setActiveTab('followers')} />
                    <TabButton label="Following" isActive={activeTab === 'following'} onClick={() => setActiveTab('following')} />
                    <TabButton label="Documents" isActive={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
                    <TabButton label="Deliverables" isActive={activeTab === 'deliverables'} onClick={() => setActiveTab('deliverables')} />
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    )
};

export default ArtistDashboard;
