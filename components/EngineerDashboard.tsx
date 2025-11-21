
import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
// FIX: Import missing types
import type { Engineer, Artist, Stoodio, Producer, Conversation, Post } from '../types';
import { AppView, SubscriptionPlan, UserRole } from '../types';
import { DollarSignIcon, CalendarIcon, StarIcon, EditIcon, PhotoIcon, EyeIcon } from './icons';
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
import { fetchUserPosts } from '../services/apiService';

const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard.tsx'));
const Documents = lazy(() => import('./Documents.tsx'));
// FIX: Corrected import path
const MasterclassManager = lazy(() => import('./MasterclassManager.tsx'));
const MyCourses = lazy(() => import('./MyCourses.tsx'));
const JobBoard = lazy(() => import('./JobBoard.tsx'));

type DashboardTab = 'dashboard' | 'analytics' | 'jobBoard' | 'availability' | 'mixingSamples' | 'mixingServices' | 'notificationSettings' | 'wallet' | 'followers' | 'following' | 'documents' | 'masterclass' | 'myCourses';

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
    const { currentUser, bookings, dashboardInitialTab, artists, engineers, stoodioz, producers, conversations } = useAppState();
    const dispatch = useAppDispatch();
    const [myPosts, setMyPosts] = useState<Post[]>([]);
    
    const { navigate, viewBooking, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile } = useNavigation();
    const { createPost, likePost, commentOnPost, toggleFollow } = useSocial();
    const { updateProfile, refreshCurrentUser } = useProfile();

    if (!currentUser) {
        return (
            <div className="flex justify-center items-center py-20">
                <p className="text-zinc-400">Loading user data...</p>
            </div>
        );
    }
    
    const engineer = currentUser as Engineer;
    
    const [activeTab, setActiveTab] = useState<DashboardTab>(dashboardInitialTab as DashboardTab || 'dashboard');

    useEffect(() => {
        if (dashboardInitialTab) {
            setActiveTab(dashboardInitialTab as DashboardTab);
            dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: null } }); // Clear it after use
        }
    }, [dashboardInitialTab, dispatch]);

    // Fetch user specific posts
    const refreshPosts = async () => {
        if (engineer.id) {
            const posts = await fetchUserPosts(engineer.id);
            setMyPosts(posts);
        }
    };

    useEffect(() => {
        refreshPosts();
    }, [engineer.id]);

    const handleNewPost = async (postData: any) => {
        await createPost(postData);
        refreshPosts();
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverImageInputRef = useRef<HTMLInputElement>(null);

    const onOpenAddFundsModal = () => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: true } });
    const onOpenPayoutModal = () => dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: true } });

    const handleImageUploadClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleCoverImageUploadClick = () => {
        coverImageInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                // FIX: Corrected property name from `imageUrl` to `image_url` to match the type definition.
                updateProfile({ image_url: imageUrl });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const coverImageUrl = e.target?.result as string;
                // FIX: Corrected property name from 'coverImageUrl' to 'cover_image_url' to match the type definition.
                updateProfile({ cover_image_url: coverImageUrl });
            };
            reader.readAsDataURL(file);
        }
    };
    
    // FIX: Corrected property name from 'requestedEngineerId' to 'requested_engineer_id' and 'startTime' to 'start_time'
    const upcomingBookings = bookings.filter(b => (b.engineer?.id === engineer.id || b.requested_engineer_id === engineer.id) && new Date(`${b.date}T${b.start_time}`) >= new Date());
    const isProPlan = engineer.subscription?.plan === SubscriptionPlan.ENGINEER_PLUS;
    
    const allUsers = [...artists, ...engineers, ...stoodioz, ...producers];
    // FIX: Corrected property name from 'followerIds' to 'follower_ids' to match the type definition.
    const followers = allUsers.filter(u => (engineer.follower_ids || []).includes(u.id));
    const followedArtists = artists.filter(a => (engineer.following?.artists || []).includes(a.id));
    const followedEngineers = engineers.filter(e => (engineer.following?.engineers || []).includes(e.id));
    const followedStoodioz = stoodioz.filter(s => (engineer.following?.stoodioz || []).includes(s.id));
    const followedProducers = producers.filter(p => (engineer.following?.producers || []).includes(p.id));
    
    const renderContent = () => {
         switch(activeTab) {
             case 'analytics':
                return (
                    <Suspense fallback={<div>Loading Analytics...</div>}>
                        <AnalyticsDashboard user={engineer} userRole={UserRole.ENGINEER} />
                    </Suspense>
                );
             case 'jobBoard':
                return (
                    <Suspense fallback={<div>Loading Jobs...</div>}>
                        <JobBoard />
                    </Suspense>
                );
             case 'availability': return <AvailabilityManager user={engineer} onUpdateUser={updateProfile} />;
             case 'mixingSamples': return <MixingSampleManager engineer={engineer} onRefresh={refreshCurrentUser} />;
             case 'mixingServices': return <MixingServicesManager engineer={engineer} onUpdateEngineer={updateProfile} />;
             case 'masterclass': return <Suspense fallback={<div/>}><MasterclassManager user={engineer} onUpdateUser={updateProfile} /></Suspense>;
             case 'notificationSettings': return <NotificationSettings engineer={engineer} onUpdateEngineer={updateProfile} />;
             case 'wallet': return <Wallet user={engineer} onAddFunds={onOpenAddFundsModal} onRequestPayout={onOpenPayoutModal} onViewBooking={viewBooking} userRole={UserRole.ENGINEER} />;
             case 'followers': return <FollowersList followers={followers} onSelectArtist={viewArtistProfile} onSelectEngineer={viewEngineerProfile} onSelectStoodio={viewStoodioDetails} onSelectProducer={viewProducerProfile} />;
             case 'following': return <Following artists={followedArtists} engineers={followedEngineers} studios={followedStoodioz} producers={followedProducers} onToggleFollow={toggleFollow} onSelectArtist={viewArtistProfile} onSelectEngineer={viewEngineerProfile} onSelectStudio={viewStoodioDetails} onSelectProducer={viewProducerProfile} />;
             case 'documents':
                return (
                    <Suspense fallback={<div>Loading Documents...</div>}>
                        <Documents conversations={conversations} />
                    </Suspense>
                );
             case 'myCourses':
                return (
                    <Suspense fallback={<div>Loading Courses...</div>}>
                        <MyCourses />
                    </Suspense>
                );
             default: return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <CreatePost currentUser={engineer} onPost={handleNewPost} />
                        <PostFeed posts={myPosts} authors={new Map([[engineer.id, engineer]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={() => viewEngineerProfile(engineer)} />
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
            <div className="relative rounded-2xl overflow-hidden cardSurface group">
                <img 
                    // FIX: Corrected property name from 'coverImageUrl' to 'cover_image_url' to match the type definition.
                    src={engineer.cover_image_url || 'https://images.unsplash.com/photo-1617886322207-6f504e7472c5?q=80&w=1200&auto=format&fit=crop'} 
                    alt={`${engineer.name}'s cover photo`}
                    className="w-full h-48 md:h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
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
                    accept="image/*"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
                            <div className="relative group/pfp flex-shrink-0">
                                {/* FIX: Changed `imageUrl` to `image_url` to match the Engineer type definition. */}
                                <img src={engineer.image_url} alt={engineer.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-zinc-800" />
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
                                    accept="image/*"
                                />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{engineer.name}</h1>
                                <p className="text-zinc-400 mt-1">Engineer Dashboard</p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 flex flex-col gap-y-2 items-center sm:items-end">
                             <button
                                onClick={() => viewEngineerProfile(engineer)}
                                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-3 rounded-lg transition-colors text-sm font-semibold border border-zinc-700 shadow-md w-full sm:w-auto justify-center"
                            >
                                <EyeIcon className="w-4 h-4" />
                                View Public Profile
                            </button>
                            <button
                                onClick={() => navigate(AppView.STOODIO_LIST)}
                                className="bg-orange-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors text-base shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                <CalendarIcon className="w-5 h-5"/>
                                Book a New Session
                            </button>
                            <label className="flex items-center cursor-pointer self-center sm:self-auto mt-2">
                                <span className="text-sm font-medium text-zinc-300 mr-3">Available for Hire</span>
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only" 
                                        // FIX: Corrected property name from 'isAvailable' to 'is_available'
                                        checked={engineer.is_available} 
                                        // FIX: Corrected property name from 'isAvailable' to 'is_available'
                                        onChange={(e) => updateProfile({ is_available: e.target.checked })} 
                                    />
                                    {/* FIX: Corrected property name from 'isAvailable' to 'is_available' */}
                                    <div className={`block w-12 h-6 rounded-full transition-colors ${engineer.is_available ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                                    {/* FIX: Corrected property name from 'isAvailable' to 'is_available' */}
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${engineer.is_available ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* FIX: Corrected property name from 'walletBalance' to 'wallet_balance' to match the type definition. */}
                <StatCard label="Wallet Balance" value={`$${(engineer.wallet_balance || 0).toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                <StatCard label="Upcoming Sessions" value={upcomingBookings.length} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
                <StatCard label="Overall Rating" value={(engineer.rating_overall || 0).toFixed(1)} icon={<StarIcon className="w-6 h-6 text-yellow-400" />} />
            </div>

             <div className="cardSurface">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <TabButton label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <TabButton label="Analytics" isActive={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
                    <TabButton label="Job Board" isActive={activeTab === 'jobBoard'} onClick={() => setActiveTab('jobBoard')} />
                    <TabButton label="Availability" isActive={activeTab === 'availability'} onClick={() => setActiveTab('availability')} />
                    <TabButton label="Mixing Samples" isActive={activeTab === 'mixingSamples'} onClick={() => setActiveTab('mixingSamples')} />
                    <TabButton label="Mixing Services" isActive={activeTab === 'mixingServices'} onClick={() => setActiveTab('mixingServices')} />
                    <TabButton label="Masterclass" isActive={activeTab === 'masterclass'} onClick={() => setActiveTab('masterclass')} />
                    <TabButton label="Notifications" isActive={activeTab === 'notificationSettings'} onClick={() => setActiveTab('notificationSettings')} />
                    <TabButton label="Wallet" isActive={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} />
                    <TabButton label="Followers" isActive={activeTab === 'followers'} onClick={() => setActiveTab('followers')} />
                    <TabButton label="Following" isActive={activeTab === 'following'} onClick={() => setActiveTab('following')} />
                    <TabButton label="Documents" isActive={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
                </div>
                 <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default EngineerDashboard;
