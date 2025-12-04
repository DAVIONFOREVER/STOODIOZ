import React, { useState, lazy, Suspense } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { AppView } from '../types';
import LabelArtists from './LabelArtists';
import LabelBookings from './LabelBookings';
import LabelFinancials from './LabelFinancials';
import LabelNotifications from './LabelNotifications';
import { useAppState } from '../contexts/AppContext';
import { PhotoIcon } from './icons';

const Documents = lazy(() => import('./Documents.tsx'));

type LabelTab = 'roster' | 'bookings' | 'analytics' | 'financials' | 'notifications' | 'settings' | 'documents';

const LabelDashboard: React.FC = () => {
    const { navigate } = useNavigation();
    const { conversations, currentUser } = useAppState();
    const [activeTab, setActiveTab] = useState<LabelTab>('roster');

    const renderContent = () => {
        switch (activeTab) {
            case 'roster': return <LabelArtists />;
            case 'bookings': return <LabelBookings />;
            case 'financials': return <LabelFinancials />;
            case 'notifications': return <LabelNotifications />;
            case 'documents': 
                return (
                    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading Documents...</div>}>
                        <Documents conversations={conversations} />
                    </Suspense>
                );
            case 'analytics':
                 return (
                    <div className="p-20 text-center cardSurface">
                        <p className="text-zinc-400 text-lg">Analytics Dashboard coming soon.</p>
                    </div>
                );
            case 'settings':
            default:
                return (
                    <div className="p-20 text-center cardSurface">
                        <p className="text-zinc-400 text-lg">Settings coming soon.</p>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header Section */}
            <div className="cardSurface p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        {/* Logo */}
                        <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {currentUser?.image_url ? (
                                <img src={currentUser.image_url} alt={currentUser.name} className="w-full h-full object-cover" />
                            ) : (
                                <PhotoIcon className="w-10 h-10 text-zinc-600" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{currentUser?.name || 'Label Name'}</h1>
                            <p className="text-zinc-400 mt-1">Label Dashboard</p>
                        </div>
                    </div>
                    <div>
                        <button
                           onClick={() => navigate(AppView.LABEL_SCOUTING)}
                           className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-bold transition-colors shadow-lg shadow-orange-500/20"
                        >
                           A&R Talent Discovery
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="cardSurface">
                {/* Tab Navigation */}
                <div className="flex border-b border-zinc-700/50 overflow-x-auto scrollbar-hide">
                    {['roster', 'bookings', 'financials', 'notifications', 'documents', 'analytics', 'settings'].map((tab) => (
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
        </div>
    );
};

export default LabelDashboard;