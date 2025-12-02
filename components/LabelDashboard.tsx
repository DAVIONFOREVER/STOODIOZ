
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { BriefcaseIcon } from './icons';

const LabelDashboard: React.FC = () => {
    const { currentUser } = useAppState();

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="p-8 cardSurface text-center">
                <BriefcaseIcon className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                <h1 className="text-4xl font-extrabold text-slate-100 mb-2">Label Dashboard (Beta)</h1>
                <p className="text-xl text-zinc-400">Welcome, {currentUser?.name || 'Manager'}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="cardSurface p-6 h-48 flex flex-col justify-center items-center">
                    <h2 className="text-2xl font-bold text-zinc-200">Roster Management</h2>
                    <p className="text-zinc-500 mt-2">Coming Soon</p>
                </div>
                <div className="cardSurface p-6 h-48 flex flex-col justify-center items-center">
                    <h2 className="text-2xl font-bold text-zinc-200">Expense Tracking</h2>
                    <p className="text-zinc-500 mt-2">Coming Soon</p>
                </div>
            </div>
        </div>
    );
};

export default LabelDashboard;
