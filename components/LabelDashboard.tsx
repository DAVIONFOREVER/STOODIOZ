
import React, { useState, lazy, Suspense, useRef } from 'react';
import * as apiService from '../services/apiService';
import { useNavigation } from '../hooks/useNavigation';
import { AppView, UserRole } from '../types';
import LabelArtists from './LabelArtists';
import LabelBookings from './LabelBookings';
import LabelFinancials from './LabelFinancials';
import LabelNotifications from './LabelNotifications';
import LabelRosterImport from './LabelRosterImport';
import LabelBudgetDashboard from './LabelBudgetDashboard';
import LabelAnalytics from './LabelAnalytics';
import LabelControls from './label/LabelControls';
import LabelPolicies from './label/LabelPolicies';
import LabelMessaging from './label/LabelMessaging';
import LabelReports from './label/LabelReports';
import LabelQAReview from './label/LabelQAReview';
import LabelActivity from './label/LabelActivity';
import LabelInsights from './label/LabelInsights';
import LabelApprovals from './label/LabelApprovals';
import LabelPerformance from './label/LabelPerformance';
import LabelSettings from './LabelSettings';
import Wallet from './Wallet';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useProfile } from '../hooks/useProfile';
import { PhotoIcon, UsersIcon, EditIcon, EyeIcon, DollarSignIcon } from './icons';
import { getProfileImageUrl } from '../constants';

const Documents = lazy(() => import('./Documents.tsx'));

type LabelTab = 'roster' | 'wallet' | 'bookings' | 'approvals' | 'performance' | 'budget' | 'analytics' | 'financials' | 'notifications' | 'controls' | 'policies' | 'messaging' | 'reports' | 'qa' | 'activity' | 'insights' | 'settings' | 'documents';

const ImportRosterButton: React.FC<{ text: string, onClick: () => void }> = ({ text, onClick }) => (
    <button
        onClick={onClick}
        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg font-bold transition-colors shadow-lg flex items-center justify-center gap-2 text-sm"
    >
        <UsersIcon className="w-4 h-4"/>
        {text}
    </button>
);

const LabelDashboard: React.FC = () => {
    const { navigate } = useNavigation();
    const { conversations, currentUser, userRole } = useAppState();
    const dispatch = useAppDispatch();
    const { updateProfile, refreshCurrentUser } = useProfile();
    const [activeTab, setActiveTab] = useState<LabelTab>('roster');
    const [showRosterImport, setShowRosterImport] = useState(false);

    // Refs for image uploads
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser) return;
        try {
            const url = await apiService.uploadAvatar(currentUser.id, file);
            await updateProfile({ image_url: url });
            await refreshCurrentUser();
        } catch (e: any) {
            console.error('Avatar upload failed', e);
            alert(e?.message || 'Profile photo could not be saved. Check storage/RLS or try again.');
        } finally {
            event.target.value = '';
        }
    };

    const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser) return;
        try {
            const url = await apiService.uploadCoverImage(currentUser.id, file);
            await updateProfile({ cover_image_url: url });
            await refreshCurrentUser();
        } catch (e: any) {
            console.error('Cover upload failed', e);
            alert(e?.message || 'Cover photo could not be saved. Check storage/RLS or try again.');
        } finally {
            event.target.value = '';
        }
    };
    
    const handleViewProfile = () => {
        navigate(AppView.LABEL_PROFILE);
    };

    const handleAddFunds = () => {
        dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: true } });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'roster': return <LabelArtists />;
            case 'bookings': return <LabelBookings />;
            case 'approvals': return <LabelApprovals />;
            case 'performance': return <LabelPerformance />;
            case 'budget': return <LabelBudgetDashboard />;
            case 'financials': return <LabelFinancials />;
            case 'notifications': return <LabelNotifications />;
            case 'analytics': return <LabelAnalytics />;
            case 'controls': return <LabelControls />;
            case 'policies': return <LabelPolicies />;
            case 'messaging': return <LabelMessaging />;
            case 'reports': return <LabelReports />;
            case 'qa': return <LabelQAReview />;
            case 'activity': return <LabelActivity />;
            case 'insights': return <LabelInsights />;
            case 'settings': return <LabelSettings />;
            case 'wallet': 
                return <Wallet 
                    user={currentUser as any} 
                    onAddFunds={handleAddFunds} 
                    onRequestPayout={() => dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: true } })}
                    onViewBooking={() => {}} 
                    userRole={UserRole.LABEL} 
                />;
            case 'documents': 
                return (
                    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading Documents...</div>}>
                        <Documents conversations={conversations} userRole={UserRole.LABEL} />
                    </Suspense>
                );
            default:
                return (
                    <div className="p-20 text-center cardSurface">
                        <p className="text-zinc-400 text-lg">Tab content not found.</p>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header Section */}
            <div className="relative rounded-2xl overflow-hidden cardSurface group">
                {/* Cover Image */}
                <div className="h-48 md:h-64 bg-zinc-800 relative">
                     {currentUser?.cover_image_url ? (
                        <img 
                            src={currentUser.cover_image_url} 
                            alt="Cover" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-zinc-800 to-zinc-900 flex items-center justify-center">
                            <p className="text-zinc-700 font-bold text-4xl opacity-20 uppercase tracking-widest">Label Dashboard</p>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                    
                    {/* Edit Cover Button */}
                    <button 
                        onClick={() => coverInputRef.current?.click()}
                        className="absolute top-4 right-4 bg-black/50 text-white text-xs font-semibold py-1.5 px-3 rounded-full hover:bg-black/70 transition-opacity opacity-0 group-hover:opacity-100 flex items-center gap-2"
                    >
                        <PhotoIcon className="w-4 h-4" /> Edit Cover
                    </button>
                    <input
                        type="file"
                        ref={coverInputRef}
                        onChange={handleCoverChange}
                        className="hidden"
                        accept="image/*"
                    />
                </div>
                
                <div className="px-6 pb-6 md:px-8 md:pb-8 -mt-12 md:-mt-16 flex flex-col md:flex-row items-end md:items-end gap-6 relative z-10">
                    {/* Avatar / Logo */}
                    <div className="relative group/avatar flex-shrink-0">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden shadow-xl">
                            <img src={getProfileImageUrl(currentUser)} alt={currentUser?.name} className="w-full h-full object-cover" />
                        </div>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                        >
                            <EditIcon className="w-8 h-8 text-white" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>

                    <div className="flex-grow mb-2 text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{currentUser?.name || 'Label Name'}</h1>
                        <p className="text-zinc-400 mt-1">Label Dashboard</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mb-2 w-full md:w-auto">
                        <button
                           onClick={handleViewProfile}
                           className="px-4 py-2 bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 rounded-lg font-bold transition-colors shadow-lg flex items-center justify-center gap-2 text-sm"
                        >
                           <EyeIcon className="w-4 h-4"/>
                           View Profile
                        </button>
                        <button
                           onClick={handleAddFunds}
                           className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors shadow-lg flex items-center justify-center gap-2 text-sm"
                        >
                           <DollarSignIcon className="w-4 h-4"/>
                           Add Funds
                        </button>
                        <ImportRosterButton 
                            text="Import Roster"
                            onClick={() => navigate(AppView.LABEL_IMPORT)}
                        />
                    </div>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="cardSurface">
                {/* Tab Navigation */}
                <div className="flex border-b border-zinc-700/50 overflow-x-auto scrollbar-hide">
                    {['wallet', 'roster', 'bookings', 'approvals', 'performance', 'budget', 'analytics', 'financials', 'notifications', 'controls', 'policies', 'messaging', 'reports', 'qa', 'activity', 'insights', 'documents', 'settings'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as LabelTab)}
                            className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap capitalize ${
                                activeTab === tab 
                                ? 'border-orange-500 text-orange-400' 
                                : 'border-transparent text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content Placeholder */}
                <div className="p-6">
                   {renderContent()}
                </div>
            </div>

            {/* Roster Import Modal */}
            {showRosterImport && currentUser?.id && userRole === 'LABEL' && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <LabelRosterImport
                        labelId={currentUser.id}
                        onAdded={() => {
                            setShowRosterImport(false);
                            setActiveTab('roster');
                        }}
                        onClose={() => setShowRosterImport(false)}
                    />
                </div>
            )}
        </div>
    );
};

export default LabelDashboard;
