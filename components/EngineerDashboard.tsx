
import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import type { Engineer, Artist, Stoodio, Producer, Booking } from '../types';
import { AppView, SubscriptionPlan, UserRole, BookingStatus } from '../types';
import { DollarSignIcon, CalendarIcon, StarIcon, EditIcon, ClockIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import AvailabilityManager from './AvailabilityManager';
import NotificationSettings from './NotificationSettings';
import Wallet from './Wallet';
import MixingServicesManager from './MixingServicesManager';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useProfile } from '../hooks/useProfile';
import { useBookings } from '../hooks/useBookings';
import MixingSampleManager from './MixingSampleManager';
import FollowersList from './FollowersList';
import Following from './Following';

const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));

type DashboardTab = 'dashboard' | 'analytics' | 'jobBoard' | 'availability' | 'mixingSamples' | 'mixingServices' | 'notificationSettings' | 'wallet' | 'followers' | 'following';

const JobBoard: React.FC<{ 
    jobs: Booking[];
    onAcceptJob: (booking: Booking) => void;
}> = ({ jobs, onAcceptJob }) => {
    return (
        <div className="p-6 cardSurface">
            <h1 className="text-2xl font-bold text-zinc-100 mb-6">Available Jobs</h1>
            <div className="space-y-4">
                {jobs.length > 0 ? jobs.map(job => (
                    <div key={job.id} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50 flex flex-col md:flex-row gap-4 justify-between items-start">
                        <div>
                            <p className="font-bold text-lg text-orange-400">{job.stoodio?.name}</p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-300 mt-2">
                                <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 text-zinc-400"/> {new Date(job.date + 'T00:00:00').toLocaleDateString()}</span>
                                <span className="flex items-center gap-1.5"><ClockIcon className="w-4 h-4 text-zinc-400"/> {job.startTime} for {job.duration} hours</span>
                                <span className="flex items-center gap-1.5"><DollarSignIcon className="w-4 h-4 text-zinc-400"/> ${job.engineerPayRate}/hr</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => onAcceptJob(job)}
                            className="w-full md:w-auto bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm"
                        >
                            Accept Job
                        </button>
                    </div>
                )) : (
                    <p className="text-center py-8 text-zinc-500">No jobs available right now. Check back later!</p>
                )}
            </div>
        </div>
    );
};

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
    <div className="p-6 text-white text-center cardSurface">
        <StarIcon className="w-10 h-10 mx-auto text-white/80 mb-2" />
        <h3 className="text-xl font-bold mb-2">Upgrade to Engineer Plus</h3>
        <p className="text-sm opacity-90 mb-4">Unlock advanced job filters, lower service fees, and priority support to boost your career.</p>
        <button 
            onClick={() => onNavigate(AppView.SUBSCRIPTION_PLANS)}
            className="bg-white text-orange-500 font-bold py-2 px-6 rounded-lg hover:bg-zinc-100 transition-all duration-300"
        >
            View Plans
        </button>
    </div>
);

const EngineerDashboard: React.FC = () => {
    const { currentUser, bookings, dashboardInitialTab, artists, engineers, stoodioz, producers } = useAppState();
    const dispatch = useAppDispatch();
    const engineer = currentUser as Engineer;
    
    const { navigate, viewBooking, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile } = useNavigation();
    const { createPost, likePost, commentOnPost, toggleFollow } = useSocial();
    const { updateProfile } = useProfile();
    const { acceptBooking } = useBookings(navigate);

    const [activeTab, setActiveTab] = useState<DashboardTab>(dashboardInitialTab as DashboardTab || 'dashboard');

    useEffect(() => {
        if (dashboardInitialTab) {
            setActiveTab(dashboardInitialTab as DashboardTab);
            dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: null } }); // Clear it after use
        }
    }, [dashboardInitialTab, dispatch]);

    const profileFileInputRef = useRef<HTMLInputElement>(null);
    const coverFileInputRef = useRef<HTMLInputElement>(null);

    const onOpenAddFundsModal = () => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: true } });
    const onOpenPayoutModal = () => dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: true } });

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
    
    const upcomingBookings = bookings.filter(b => (b.engineer?.id === engineer.id || b.requestedEngineerId === engineer.id) && new Date(`${b.date}T${b.startTime}`) >= new Date());
    const isProPlan = engineer.subscription?.plan === SubscriptionPlan.ENGINEER_PLUS;
    const availableJobs = bookings.filter(b => b.postedBy === UserRole.STOODIO && b.status === BookingStatus.PENDING);
    
    const allUsers = [...artists, ...engineers, ...stoodioz, ...producers];
    const followers = allUsers.filter(u => engineer.followerIds.includes(u.id));
    const followedArtists = artists.filter(a => engineer.following.artists.includes(a.id));
    const followedEngineers = engineers.filter(e => engineer.following.engineers.includes(e.id));
    const followedStoodioz = stoodioz.filter(s => engineer.following.stoodioz.includes(s.id));
    const followedProducers = producers.filter(p => engineer.following.producers.includes(p.id));

    const renderContent = () => {
         switch(activeTab) {
             case 'analytics':
                return (
                    <Suspense fallback={<div>Loading Analytics...</div>}>
                        <AnalyticsDashboard user={engineer} />
                    </Suspense>
                );
             case 'jobBoard': return <JobBoard jobs={availableJobs} onAcceptJob={acceptBooking} />;
             case 'availability': return <AvailabilityManager user={engineer} onUpdateUser={updateProfile} />;
             case 'mixingSamples': return <MixingSampleManager engineer={engineer} onUpdateEngineer={updateProfile} />;
             case 'mixingServices': return <MixingServicesManager engineer={engineer} onUpdateEngineer={updateProfile} />;
             case 'notificationSettings': return <NotificationSettings engineer={engineer} onUpdateEngineer={updateProfile} />;
             case 'wallet': return <Wallet user={engineer} onAddFunds={onOpenAddFundsModal} onRequestPayout={onOpenPayoutModal} onViewBooking={viewBooking} userRole={UserRole.ENGINEER} />;
             case 'followers': return <FollowersList followers={followers} onSelectArtist={viewArtistProfile} onSelectEngineer={viewEngineerProfile} onSelectStoodio={viewStoodioDetails} onSelectProducer={viewProducerProfile} />;
             case 'following': return <Following artists={followedArtists} engineers={followedEngineers} studios={followedStoodioz} producers={followedProducers} onToggleFollow={toggleFollow} onSelectArtist={viewArtistProfile} onSelectEngineer={viewEngineerProfile} onSelectStudio={viewStoodioDetails} onSelectProducer={viewProducerProfile} />;
             default: return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <CreatePost currentUser={engineer} onPost={createPost} />
                        <PostFeed posts={engineer.posts || []} authors={new Map([[engineer.id, engineer]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={() => {}} />
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
            <div className="cardSurface overflow-hidden">
                <div className="relative h-40 md:h-56 bg-zinc-700">
                    <img src={engineer.coverImageUrl || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop'} alt="Cover" className="w-full h-full object-cover"/>
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
                            <img src={engineer.imageUrl} alt={engineer.name} className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-zinc-800" />
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
                            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{engineer.name}</h1>
                            <p className="text-zinc-400 mt-1">Engineer Dashboard</p>
                        </div>
                        <label className="flex items-center cursor-pointer sm:pb-4">
                            <span className="text-sm font-medium text-zinc-300 mr-3">Available for Hire</span>
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={engineer.isAvailable} onChange={(e) => updateProfile({ isAvailable: e.target.checked })} />
                                <div className={`block w-12 h-6 rounded-full transition-colors ${engineer.isAvailable ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${engineer.isAvailable ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/5">
                    <StatCard label="Wallet Balance" value={`$${engineer.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                    <StatCard label="Upcoming Sessions" value={upcomingBookings.length} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
                    <StatCard label="Overall Rating" value={engineer.rating_overall.toFixed(1)} icon={<StarIcon className="w-6 h-6 text-yellow-400" />} />
                </div>
            </div>
             <div className="cardSurface">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <TabButton label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <TabButton label="Analytics" isActive={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
                    <TabButton label="Job Board" isActive={activeTab === 'jobBoard'} onClick={() => setActiveTab('jobBoard')} />
                    <TabButton label="Availability" isActive={activeTab === 'availability'} onClick={() => setActiveTab('availability')} />
                    <TabButton label="Mixing Samples" isActive={activeTab === 'mixingSamples'} onClick={() => setActiveTab('mixingSamples')} />
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
