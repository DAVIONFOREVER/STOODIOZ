
import React, { useState, lazy, Suspense } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { AppView } from '../types';
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
import { useAppState } from '../contexts/AppContext';
import { PhotoIcon, PlusCircleIcon, UsersIcon } from './icons';

const Documents = lazy(() => import('./Documents.tsx'));

type LabelTab = 'roster' | 'bookings' | 'approvals' | 'performance' | 'budget' | 'analytics' | 'financials' | 'notifications' | 'controls' | 'policies' | 'messaging' | 'reports' | 'qa' | 'activity' | 'insights' | 'settings' | 'documents';

const ImportRosterButton: React.FC<{ text: string, onClick: () => void }> = ({ text, onClick }) => (
    <button
        onClick={onClick}
        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg font-bold transition-colors shadow-lg flex items-center justify-center gap-2"
    >
        <UsersIcon className="w-5 h-5"/>
        {text}
    </button>
);

const LabelDashboard: React.FC = () => {
    const { navigate } = useNavigation();
    const { conversations, currentUser, userRole } = useAppState();
    const [activeTab, setActiveTab] = useState<LabelTab>('roster');
    const [showRosterImport, setShowRosterImport] = useState(false);

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
            case 'documents': 
                return (
                    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading Documents...</div>}>
                        <Documents conversations={conversations} />
                    </Suspense>
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
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                           onClick={() => setShowRosterImport(true)}
                           className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg font-bold transition-colors shadow-lg flex items-center justify-center gap-2"
                        >
                           <PlusCircleIcon className="w-5 h-5"/>
                           Add to Roster
                        </button>
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
                    {['roster', 'bookings', 'approvals', 'performance', 'budget', 'analytics', 'financials', 'notifications', 'controls', 'policies', 'messaging', 'reports', 'qa', 'activity', 'documents', 'settings'].map((tab) => (
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
