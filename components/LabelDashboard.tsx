import React from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { AppView } from '../types';

const LabelDashboard: React.FC = () => {
    const { navigate } = useNavigation();

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
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
                    <button className="px-6 py-4 font-bold text-sm border-b-2 border-orange-500 text-orange-400 transition-colors whitespace-nowrap">
                        Roster
                    </button>
                    <button className="px-6 py-4 font-bold text-sm border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 transition-colors whitespace-nowrap">
                        Bookings
                    </button>
                    <button className="px-6 py-4 font-bold text-sm border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 transition-colors whitespace-nowrap">
                        Analytics
                    </button>
                    <button className="px-6 py-4 font-bold text-sm border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 transition-colors whitespace-nowrap">
                        Team
                    </button>
                    <button className="px-6 py-4 font-bold text-sm border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 transition-colors whitespace-nowrap">
                        Settings
                    </button>
                </div>

                {/* Content Placeholder */}
                <div className="p-20 text-center">
                    <div className="inline-block p-4 rounded-full bg-zinc-800/50 mb-4">
                        <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <p className="text-zinc-400 text-lg">Select a tab to manage your label.</p>
                </div>
            </div>
        </div>
    );
};

export default LabelDashboard;