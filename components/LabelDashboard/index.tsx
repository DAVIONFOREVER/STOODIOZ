
import React, { Suspense, lazy } from 'react';
import { AppView } from '../../types';
import LabelSidebar from './LabelSidebar';
import { useAppState } from '../../contexts/AppContext';

// Lazy load components
const LabelAnalytics = lazy(() => import('./Analytics'));
const RosterManager = lazy(() => import('./RosterManager'));
const BookingManager = lazy(() => import('./BookingManager'));
const TeamManager = lazy(() => import('./TeamManager'));
const ActivityFeed = lazy(() => import('./ActivityFeed'));
const LabelAdminRankings = lazy(() => import('./AdminRankings'));

const DashboardHome: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-3 gap-6">
                <div className="cardSurface p-6">
                    <p className="text-zinc-400 text-sm">Active Roster</p>
                    <p className="text-3xl font-extrabold text-white">12</p>
                </div>
                <div className="cardSurface p-6">
                    <p className="text-zinc-400 text-sm">Monthly Spend</p>
                    <p className="text-3xl font-extrabold text-orange-400">$24.5k</p>
                </div>
                <div className="cardSurface p-6">
                    <p className="text-zinc-400 text-sm">Sessions Booked</p>
                    <p className="text-3xl font-extrabold text-white">8</p>
                </div>
            </div>
            <div className="cardSurface p-6 min-h-[300px]">
                <h3 className="font-bold text-zinc-100 mb-4">Roster Performance</h3>
                <div className="w-full h-48 bg-zinc-800/30 rounded-xl flex items-center justify-center text-zinc-500">
                    Chart Placeholder
                </div>
            </div>
        </div>
        <div className="lg:col-span-1">
            <Suspense fallback={<div>Loading Feed...</div>}>
                <ActivityFeed />
            </Suspense>
        </div>
    </div>
);

interface LabelDashboardProps {
    currentView: AppView;
    onNavigate: (view: AppView) => void;
}

const LabelDashboard: React.FC<LabelDashboardProps> = ({ currentView, onNavigate }) => {
    
    const renderContent = () => {
        switch (currentView) {
            case AppView.LABEL_ANALYTICS: return <LabelAnalytics />;
            case AppView.LABEL_ROSTER: return <RosterManager />;
            case AppView.LABEL_BOOKINGS: return <BookingManager />;
            case AppView.LABEL_TEAM: return <TeamManager />;
            case AppView.LABEL_GLOBAL_RANKINGS: return <LabelAdminRankings />;
            default: return <DashboardHome />;
        }
    };

    return (
        <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
            <div className="w-64 flex-shrink-0 hidden md:block">
                <LabelSidebar activeView={currentView} onNavigate={onNavigate} />
            </div>
            <div className="flex-grow overflow-y-auto p-6 md:p-8">
                <Suspense fallback={<div className="text-zinc-400">Loading...</div>}>
                    {renderContent()}
                </Suspense>
            </div>
        </div>
    );
};

export default LabelDashboard;
