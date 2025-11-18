
import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import type { Producer, Artist, Stoodio, Engineer, LinkAttachment, Post, Conversation } from '../types';
import { UserRole, AppView, SubscriptionPlan } from '../types';
import { DollarSignIcon, CalendarIcon, UsersIcon, StarIcon, MusicNoteIcon, MagicWandIcon, EditIcon, PhotoIcon } from './icons';
import CreatePost from './CreatePost.tsx';
import PostFeed from './PostFeed.tsx';
import Following from './Following.tsx';
import FollowersList from './FollowersList.tsx';
import AvailabilityManager from './AvailabilityManager.tsx';
import Wallet from './Wallet.tsx';
import BeatManager from './BeatManager.tsx';
import ProducerSettings from './ProducerSettings.tsx';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext.tsx';
import { useNavigation } from '../hooks/useNavigation.ts';
import { useSocial } from '../hooks/useSocial.ts';
import { useProfile } from '../hooks/useProfile.ts';

const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard.tsx'));
const Documents = lazy(() => import('./Documents.tsx'));
const MasterclassManager = lazy(() => import('./MasterclassManager.tsx'));
const MyCourses = lazy(() => import('./MyCourses.tsx'));

type DashboardTab = 'dashboard' | 'analytics' | 'beatStore' | 'availability' | 'settings' | 'wallet' | 'followers' | 'following' | 'documents' | 'masterclass' | 'myCourses';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="p-4 rounded-xl flex items-center gap-4 cardSurface">
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
    <div className="cardSurface border-2 border-purple-500 p-6 text-zinc-100 text-center">
        <StarIcon className="w-10 h-10 mx-auto text-purple-400/80 mb-2" />
        <h3 className="text-xl font-bold mb-2">Upgrade to Producer Pro</h3>
        <p className="text-sm text-zinc-400 mb-4">Unlock lower commission fees, unlimited uploads, and priority placement to boost your sales.</p>
        <button 
            onClick={() => onNavigate(AppView.SUBSCRIPTION_PLANS)}
            className="bg-purple-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-600 transition-all duration-300"
        >
            View Plans
        </button>
    </div>
);


const ProducerDashboard: React.FC = () => {
    const { currentUser, artists, engineers, stoodioz, producers, dashboardInitialTab, conversations } = useAppState();
    const dispatch = useAppDispatch();

    if (!currentUser) {
        return (
            <div className="flex justify-center items-center py-20">
                <p className="text-zinc-400">Loading user data...</p>
            </div>
        );
    }

    const producer = currentUser as Producer;

    const { navigate, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile, viewBooking } = useNavigation();
    const { createPost, likePost, commentOnPost, toggleFollow } = useSocial();
    const { updateProfile, refreshCurrentUser } = useProfile();

    const onOpenAddFundsModal = () => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: true } });
    const onOpenPayoutModal = () => dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: true } });

    const [activeTab, setActiveTab] = useState<DashboardTab>(dashboardInitialTab as DashboardTab || 'dashboard');

    useEffect(() => {
        if (dashboardInitialTab) {
            setActiveTab(dashboardInitialTab as DashboardTab);
            dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: null } }); // Clear it after use
        }
    }, [dashboardInitialTab, dispatch]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverImageInputRef = useRef<HTMLInputElement>(null);

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
                updateProfile({ cover_image_url: coverImageUrl });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const isProPlan = producer.subscription?.plan === SubscriptionPlan.PRODUCER_PRO;

    const allUsers = [...artists, ...engineers, ...stoodioz, ...producers];
    const followers = allUsers.filter(u => (producer.follower_ids || []).includes(u.id));
    const followedArtists = artists.filter(a => (producer.following?.artists || []).includes(a.id));
    const followedEngineers = engineers.filter(e => (producer.following?.engineers || []).includes(e.id));
    const followedStoodioz = stoodioz.filter(s => (producer.following?.stoodioz || []).includes(s.id));
    const followedProducers = producers.filter(p => (producer.following?.producers || []).includes(p.id));

    const renderContent = () => {
        switch(activeTab) {
            case 'analytics':
                return (
                    <Suspense fallback={<div>Loading Analytics...</div>}>
                        <AnalyticsDashboard user={producer} userRole={UserRole.PRODUCER} />
                    </Suspense>
                );
            case 'beatStore': return <BeatManager producer={producer} onRefresh={refreshCurrentUser} />;
            case 'availability': return <AvailabilityManager user={producer} onUpdateUser={updateProfile} />;
            case 'settings': return <ProducerSettings producer={producer} onUpdateProducer={updateProfile} />;
            case 'masterclass': return <Suspense fallback={<div/>}><MasterclassManager user={producer} onUpdateUser={updateProfile} /></Suspense>;
            case 'wallet': return <Wallet user={producer} onAddFunds={onOpenAddFundsModal} onRequestPayout={onOpenPayoutModal} onViewBooking={viewBooking} userRole={UserRole.PRODUCER} />;
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
                        <CreatePost currentUser={producer} onPost={createPost} />
                        <PostFeed posts={producer.posts || []} authors={new Map([[producer.id, producer]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={() => viewProducerProfile(producer)} />
                    </div>
                     <div className="lg:col-span-1 space-y-6">
                        {!isProPlan && <UpgradeProCard onNavigate={navigate} />}
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
                    src={producer.cover_image_url || 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=1200&auto=format&fit=crop'} 
                    alt={`${producer.name}'s cover photo`}
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
                                <img src={producer.image_url} alt={producer.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-zinc-800" />
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
                                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{producer.name}</h1>
                                <p className="text-zinc-400 mt-1">Producer Dashboard</p>
                            </div>
                        </div>
                        <label className="flex items-center cursor-pointer self-center sm:self-auto">
                            <span className="text-sm font-medium text-zinc-300 mr-3">Available for Hire</span>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={producer.is_available} 
                                    onChange={(e) => updateProfile({ is_available: e.target.checked })} 
                                />
                                <div className={`block w-12 h-6 rounded-full transition-colors ${producer.is_available ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${producer.is_available ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
            
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard label="Wallet Balance" value={`$${(producer.wallet_balance || 0).toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                <StatCard label="Followers" value={producer.followers} icon={<UsersIcon className="w-6 h-6 text-blue-400" />} />
                <StatCard label="Overall Rating" value={(producer.rating_overall || 0).toFixed(1)} icon={<StarIcon className="w-6 h-6 text-yellow-400" />} />
            </div>

             <div className="cardSurface">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <TabButton label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <TabButton label="Analytics" isActive={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
                    <TabButton label="Beat Store" isActive={activeTab === 'beatStore'} onClick={() => setActiveTab('beatStore')} />
                    <TabButton label="Availability" isActive={activeTab === 'availability'} onClick={() => setActiveTab('availability')} />
                    <TabButton label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                    <TabButton label="Masterclass" isActive={activeTab === 'masterclass'} onClick={() => setActiveTab('masterclass')} />
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

export default ProducerDashboard;
