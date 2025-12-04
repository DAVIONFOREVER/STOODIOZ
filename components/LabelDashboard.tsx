import React, { useState, lazy, Suspense } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { AppView } from '../types';
import LabelArtists from './LabelArtists';
import LabelBookings from './LabelBookings';
import LabelFinancials from './LabelFinancials';
import LabelNotifications from './LabelNotifications';
import { useAppState } from '../contexts/AppContext';

const Documents = lazy(() => import('./Documents.tsx'));

type LabelTab = 'roster' | 'bookings' | 'analytics' | 'financials' | 'notifications' | 'settings' | 'documents';

const LabelDashboard: React.FC = () => {
    const { navigate } = useNavigation();
    const { conversations } = useAppState();
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
                    <div className="p-20 text-center">
                        <p className="text-zinc-400 text-lg">Analytics Dashboard coming soon.</p>
                    </div>
                );
            case 'settings':
            default:
                return (
                    <div className="p-20 text-center">
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
                        {/* Logo Placeholder */}
                        <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center flex-shrink-0">
                            <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">Label Name</h1>
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
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('roster')}
                        className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'roster' ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Roster
                    </button>
                    <button 
                         onClick={() => setActiveTab('bookings')}
                         className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'bookings' ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Bookings
                    </button>
                    <button 
                         onClick={() => setActiveTab('financials')}
                         className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'financials' ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Financials
                    </button>
                    <button 
                         onClick={() => setActiveTab('notifications')}
                         className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'notifications' ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Notifications
                    </button>
                     <button 
                         onClick={() => setActiveTab('documents')}
                         className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'documents' ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Documents
                    </button>
                     <button 
                         onClick={() => setActiveTab('analytics')}
                         className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'analytics' ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Analytics
                    </button>
                    <button 
                         onClick={() => setActiveTab('settings')}
                         className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Settings
                    </button>
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