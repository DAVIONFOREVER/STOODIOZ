import React, { useState, useEffect } from 'react';
import type { Engineer, Booking } from '../types';
import { UserRole, BookingStatus, AppView, SubscriptionPlan } from '../types';
import { BriefcaseIcon, CalendarIcon, UsersIcon, DollarSignIcon, PhotoIcon, StarIcon, EditIcon, SoundWaveIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import AvailabilityManager from './AvailabilityManager';
import Following from './Following';
import FollowersList from './FollowersList';
import Wallet from './Wallet';
import NotificationSettings from './NotificationSettings';
import MixingSampleManager from './MixingSampleManager';
import MixingServicesManager from './MixingServicesManager';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useProfile } from '../hooks/useProfile';
import { useSession } from '../hooks/useSession';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-zinc-800/50 p-4 rounded-xl flex items-center gap-4 border border-zinc-700/50">
        <div className="bg-orange-500/10 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-zinc-400 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-zinc-100">{value}</p>
        </div>
    </div>
);

const UpgradeProCard: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-2xl text-white text-center shadow-lg shadow-orange-500/10">
        <StarIcon className="w-10 h-10 mx-auto text-white/80 mb-2" />
        <h3 className="text-xl font-bold mb-2">Upgrade to Engineer+</h3>
        <p className="text-sm opacity-90 mb-4">Unlock job alerts, lower service fees, and priority placement to get more work.</p>
        <button 
            onClick={() => onNavigate(AppView.SUBSCRIPTION_PLANS)}
            className="bg-white text-orange-500 font-bold py-2 px-6 rounded-lg hover:bg-zinc-100 transition-all duration-300"
        >
            View Plans
        </button>
    </div>
);

const EngineerSettings: React.FC<{ engineer: Engineer, onUpdateEngineer: (updates: Partial<Engineer>) => void }> = ({ engineer, onUpdateEngineer }) => {
    const [name, setName] = useState(engineer.name);
    const [bio, setBio] = useState(engineer.bio);
    const [specialties, setSpecialties] = useState(engineer.specialties.join(', '));
    const [imageUrl, setImageUrl] = useState(engineer.imageUrl);
    const [coverUrl, setCoverUrl] = useState(engineer.cover_image_url || '');

    const handleSave = () => {
        onUpdateEngineer({
            name,
            bio,
            specialties: specialties.split(',').map(s => s.trim()).filter(Boolean),
            imageUrl,
            cover_image_url: coverUrl,
        });
    };

    const hasChanges = name !== engineer.name || bio !== engineer.bio || specialties !== engineer.specialties.join(', ') || imageUrl !== engineer.imageUrl || coverUrl !== (engineer.cover_image_url || '');

    const inputClasses = "w-full p-2 bg-zinc-700 border-zinc-600 text-zinc-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500";
    const labelClasses = "block text-sm font-medium text-zinc-300 mb-1";

    return (
        <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2 flex items-center gap-2">
                <EditIcon className="w-6 h-6 text-orange-400" />
                Profile Settings
            </h1>
            <p className="text-zinc-400 mb-6">Update your public profile information.</p>
            <div className="space-y-4">
                <div>
                    <label className={labelClasses}>Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} />
                </div>
                <div>
                    <label className={labelClasses}>Bio</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className={inputClasses}></textarea>
                </div>
                <div>
                    <label className={labelClasses}>Specialties (comma-separated)</label>
                    <input type="text" value={specialties} onChange={e => setSpecialties(e.target.value)} className={inputClasses} placeholder="e.g., Vocal Production, Mixing, Mastering" />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClasses}>Profile Picture URL</label>
                        <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={inputClasses} placeholder="https://..." />
                    </div>
                    <div>
                        <label className={labelClasses}>Cover Image URL</label>
                        <input type="text" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} className={inputClasses} placeholder="https://..." />
                    </div>
                </div>
            </div>
             <div className="mt-6 flex justify-end">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};


const EngineerDashboard: React.FC = () => {
    const { currentUser, bookings, artists, engineers, stoodioz, producers, dashboardInitialTab } = useAppState();
    const dispatch = useAppDispatch();
    const { navigate, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile, viewBooking } = useNavigation();
    const { createPost, likePost, commentOnPost, toggleFollow } = useSocial();
    const { updateProfile } = useProfile();
    const { startSession } = useSession(navigate);

    const [activeTab, setActiveTab] = useState(dashboardInitialTab || 'dashboard');
    const engineer = currentUser as Engineer;

    const onOpenAddFundsModal = () => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: true } });
    const onOpenPayoutModal = () => dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: true } });

    useEffect(() => {
        if (dashboardInitialTab) {
            setActiveTab(dashboardInitialTab);
            dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: null } });
        }
    }, [dashboardInitialTab, dispatch]);

    const upcomingBookings = bookings.filter(b => b.engineer?.id === engineer.id && b.status === BookingStatus.CONFIRMED && new Date(b.date) >= new Date());
    
    const isProPlan = engineer.subscription?.plan === SubscriptionPlan.ENGINEER_PLUS;

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <CreatePost currentUser={currentUser!} onPost={createPost} />
                            <PostFeed posts={engineer.posts || []} authors={new Map([[engineer.id, engineer]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={() => viewEngineerProfile(engineer)} />
                        </div>
                         <div className="lg:col-span-1 space-y-6">
                            {!isProPlan && <UpgradeProCard onNavigate={navigate} />}
                        </div>
                    </div>
                );
            case 'settings':
                return <EngineerSettings engineer={engineer} onUpdateEngineer={updateProfile} />;
            case 'jobPreferences':
                return <NotificationSettings engineer={engineer} onUpdateEngineer={updateProfile} />;
            case 'mixingServices':
                return <MixingServicesManager engineer={engineer} onUpdateEngineer={updateProfile} />;
            case 'mixingSamples':
                return <MixingSampleManager engineer={engineer} onUpdateEngineer={updateProfile} />;
            case 'wallet':
                return <Wallet user={engineer} onAddFunds={onOpenAddFundsModal} onRequestPayout={onOpenPayoutModal} onViewBooking={viewBooking} userRole={UserRole.ENGINEER} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-zinc-800/50 p-6 md:p-8 rounded-2xl border border-zinc-700/50 shadow-lg">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <img src={engineer.imageUrl} alt={engineer.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-zinc-700" />
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{engineer.name}</h1>
                        <p className="text-zinc-400 mt-2">Engineer Dashboard</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <StatCard label="Wallet Balance" value={`$${engineer.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                    <StatCard label="Upcoming Sessions" value={upcomingBookings.length} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
                    <StatCard label="Followers" value={engineer.followers} icon={<UsersIcon className="w-6 h-6 text-blue-400" />} />
                </div>
            </div>

             <div className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 shadow-lg">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-3 font-semibold text-sm ${activeTab === 'dashboard' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100'}`}>Dashboard</button>
                    <button onClick={() => setActiveTab('settings')} className={`px-4 py-3 font-semibold text-sm ${activeTab === 'settings' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100'}`}>Settings</button>
                    <button onClick={() => setActiveTab('jobPreferences')} className={`px-4 py-3 font-semibold text-sm ${activeTab === 'jobPreferences' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100'}`}>Job Preferences</button>
                    <button onClick={() => setActiveTab('mixingServices')} className={`px-4 py-3 font-semibold text-sm ${activeTab === 'mixingServices' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100'}`}>Mixing Services</button>
                    <button onClick={() => setActiveTab('mixingSamples')} className={`px-4 py-3 font-semibold text-sm ${activeTab === 'mixingSamples' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100'}`}>Mixing Samples</button>
                    <button onClick={() => setActiveTab('wallet')} className={`px-4 py-3 font-semibold text-sm ${activeTab === 'wallet' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100'}`}>Wallet</button>
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default EngineerDashboard;