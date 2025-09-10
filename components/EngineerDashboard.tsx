import React, { useState } from 'react';
import type { Engineer, Review, Booking, Artist, Stoodio, Transaction, Producer } from '../types';
import { BookingStatus, AppView, SubscriptionPlan, UserRole } from '../types';
import { DollarSignIcon, CalendarIcon, StarIcon, CheckCircleIcon, CloseCircleIcon, BriefcaseIcon, RoadIcon, EditIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import Following from './Following';
import FollowersList from './FollowersList';
import AvailabilityManager from './AvailabilityManager';
import NotificationSettings from './NotificationSettings';
import Wallet from './Wallet';
import MixingServicesManager from './MixingServicesManager';

interface EngineerDashboardProps {
    engineer: Engineer;
    reviews: Review[];
    bookings: Booking[];
    onUpdateEngineer: (updatedProfile: Partial<Engineer>) => void;
    onAcceptBooking: (bookingId: string) => void;
    onDenyBooking: (bookingId: string) => void;
    allArtists: Artist[];
    allEngineers: Engineer[];
    allStoodioz: Stoodio[];
    allProducers: Producer[];
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectProducer: (producer: Producer) => void;
    onToggleFollow: (type: 'artist' | 'engineer' | 'stoodio' | 'producer', id: string) => void;
    onNavigateToStudio: (location: any) => void;
    onStartConversation: (participant: Artist | Stoodio | Engineer) => void;
    onPost: (postData: any) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | Producer | null;
    onStartSession: (booking: Booking) => void;
    onNavigate: (view: AppView) => void;
    onOpenAddFundsModal: () => void;
    onOpenPayoutModal: () => void;
    onViewBooking: (bookingId: string) => void;
}

type DashboardTab = 'dashboard' | 'jobs' | 'availability' | 'preferences' | 'wallet' | 'followers' | 'following' | 'mixing';

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

const UpgradePlusCard: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => (
    <div className="bg-gradient-to-r from-sky-500 to-indigo-500 p-6 rounded-2xl text-white text-center shadow-lg shadow-indigo-500/10">
        <StarIcon className="w-10 h-10 mx-auto text-white/80 mb-2" />
        <h3 className="text-xl font-bold mb-2">Upgrade to Engineer Plus</h3>
        <p className="text-sm opacity-90 mb-4">Get enhanced visibility, access the job board, and showcase your profile to more artists.</p>
        <button 
            onClick={() => onNavigate(AppView.SUBSCRIPTION_PLANS)}
            className="bg-white text-indigo-500 font-bold py-2 px-6 rounded-lg hover:bg-zinc-100 transition-all duration-300"
        >
            View Plans
        </button>
    </div>
);


const EngineerDashboard: React.FC<EngineerDashboardProps> = (props) => {
    const { engineer, bookings, onAcceptBooking, onDenyBooking, onStartSession, currentUser, allArtists, allEngineers, allStoodioz, allProducers, onSelectArtist, onSelectEngineer, onSelectStoodio, onSelectProducer, onToggleFollow, onPost, onLikePost, onCommentOnPost, onUpdateEngineer, onNavigate, onNavigateToStudio, onOpenAddFundsModal, onOpenPayoutModal, onViewBooking } = props;
    const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');

    const openJobs = bookings.filter(job => {
        const isRelevantJob = job.status === BookingStatus.PENDING || 
                              (job.status === BookingStatus.PENDING_APPROVAL && job.requestedEngineerId === engineer.id);
                              
        if (!isRelevantJob) {
            return false;
        }
        
        if (job.status === BookingStatus.PENDING_APPROVAL) {
            return true;
        }
        
        if (job.status === BookingStatus.PENDING) {
            if (engineer.minimumPayRate && job.engineerPayRate < engineer.minimumPayRate) {
                return false;
            }
        }
        
        return true;
    });
    
    const upcomingSessions = bookings.filter(b => b.engineer?.id === engineer.id && b.status === BookingStatus.CONFIRMED && new Date(`${b.date}T${b.startTime}`) >= new Date());

    const followers = [...allArtists, ...allEngineers, ...allStoodioz, ...allProducers].filter(u => u.followerIds.includes(engineer.id));
    const followedStoodioz = allStoodioz.filter(s => engineer.following.stoodioz.includes(s.id));
    const followedEngineers = allEngineers.filter(e => engineer.following.engineers.includes(e.id));
    const followedArtists = allArtists.filter(a => engineer.following.artists.includes(a.id));
    const followedProducers = allProducers.filter(p => engineer.following.producers.includes(p.id));
    
    const isProPlan = engineer.subscription?.plan === SubscriptionPlan.ENGINEER_PLUS;

    const renderContent = () => {
        switch (activeTab) {
            case 'jobs':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-lg shadow-md border border-zinc-700/50">
                            <h2 className="text-xl font-bold text-zinc-100 mb-4">Open Job Board</h2>
                            {openJobs.length > 0 ? (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {openJobs.map(job => (
                                        <div key={job.id} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700">
                                            <p className="font-bold text-zinc-200">{job.stoodio?.name || 'Remote Mix Request'}</p>
                                            <p className="text-sm text-zinc-400">{new Date(job.date + 'T00:00:00').toLocaleDateString()} at {job.startTime}</p>
                                            <p className="text-sm text-green-400 font-semibold">${job.engineerPayRate}/hr for {job.duration} hrs</p>
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => onAcceptBooking(job.id)} className="w-full bg-green-500/10 text-green-300 text-xs font-bold py-1 px-2 rounded hover:bg-green-500/20"><CheckCircleIcon className="w-4 h-4 inline mr-1"/>Accept</button>
                                                {job.status === BookingStatus.PENDING_APPROVAL && <button onClick={() => onDenyBooking(job.id)} className="w-full bg-red-500/10 text-red-300 text-xs font-bold py-1 px-2 rounded hover:bg-red-500/20"><CloseCircleIcon className="w-4 h-4 inline mr-1"/>Deny</button>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-zinc-400">No open jobs right now that match your criteria.</p>}
                        </div>
                        <div className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-lg shadow-md border border-zinc-700/50">
                            <h2 className="text-xl font-bold text-zinc-100 mb-4">Upcoming Sessions</h2>
                            {upcomingSessions.length > 0 ? (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {upcomingSessions.map(session => (
                                        <div key={session.id} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700">
                                            <p className="font-bold text-zinc-200">{session.stoodio?.name || 'Remote Mix'}</p>
                                            <p className="text-sm text-zinc-400">with {session.artist?.name || 'Studio Job'}</p>
                                            <p className="text-sm text-zinc-400">{new Date(session.date + 'T00:00:00').toLocaleDateString()} at {session.startTime}</p>
                                            <div className="flex gap-2 mt-2">
                                                {session.stoodio && <button onClick={() => onNavigateToStudio(session.stoodio!.coordinates)} className="w-full bg-green-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-600 transition-all text-sm shadow-md flex items-center gap-1.5 justify-center">
                                                    <RoadIcon className="w-4 h-4"/>
                                                    Navigate
                                                </button>}
                                                <button onClick={() => onStartSession(session)} className="w-full bg-orange-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-orange-600 transition-all text-sm shadow-md">
                                                    Start Session
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-zinc-400">No upcoming sessions.</p>}
                        </div>
                    </div>
                );
            case 'mixing':
                return <MixingServicesManager engineer={engineer} onUpdateEngineer={onUpdateEngineer} />;
             case 'availability':
                return <AvailabilityManager user={engineer} onUpdateUser={onUpdateEngineer} />;
            case 'preferences':
                return <NotificationSettings engineer={engineer} onUpdateEngineer={onUpdateEngineer} />;
            case 'wallet':
                 return (
                    <Wallet
                        user={engineer}
                        onAddFunds={onOpenAddFundsModal}
                        onRequestPayout={onOpenPayoutModal}
                        onViewBooking={onViewBooking}
                        userRole={UserRole.ENGINEER}
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
                            <CreatePost currentUser={currentUser as Engineer} onPost={onPost} />
                            <PostFeed posts={engineer.posts || []} authors={new Map([[engineer.id, engineer]])} onLikePost={onLikePost} onCommentOnPost={onCommentOnPost} currentUser={currentUser} />
                        </div>
                        <div className="lg:col-span-1 space-y-6">
                            {!isProPlan && <UpgradePlusCard onNavigate={onNavigate} />}
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
                        <img src={engineer.imageUrl} alt={engineer.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-zinc-700 flex-shrink-0" />
                        <div className="text-center sm:text-left">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{engineer.name}</h1>
                            <p className="text-zinc-400 mt-2">Engineer Dashboard</p>
                        </div>
                    </div>
                    <div className="flex-shrink-0 pt-2">
                        <label className="flex items-center cursor-pointer">
                            <span className="text-sm font-medium text-zinc-300 mr-3">Show on Map</span>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={engineer.showOnMap ?? false} 
                                    onChange={(e) => onUpdateEngineer({ showOnMap: e.target.checked })} 
                                />
                                <div className={`block w-12 h-6 rounded-full transition-colors ${engineer.showOnMap ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${engineer.showOnMap ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <StatCard label="Wallet Balance" value={`$${engineer.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                    <StatCard label="Upcoming Sessions" value={upcomingSessions.length} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
                    <StatCard label="Avg Rating" value={engineer.rating.toFixed(1)} icon={<StarIcon className="w-6 h-6 text-yellow-400" />} />
                    <StatCard label="Open Jobs" value={openJobs.length} icon={<BriefcaseIcon className="w-6 h-6 text-indigo-400" />} />
                </div>
            </div>
            
             <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 shadow-lg">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <TabButton label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <TabButton label="Job Board" isActive={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} />
                    <TabButton label="Mixing Services" isActive={activeTab === 'mixing'} onClick={() => setActiveTab('mixing')} />
                    <TabButton label="Availability" isActive={activeTab === 'availability'} onClick={() => setActiveTab('availability')} />
                    <TabButton label="Job Preferences" isActive={activeTab === 'preferences'} onClick={() => setActiveTab('preferences')} />
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