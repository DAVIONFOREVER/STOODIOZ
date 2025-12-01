
import React from 'react';
import { AppView } from '../../types';
import { ChartBarIcon, UsersIcon, CalendarIcon, BriefcaseIcon, StarIcon, CogIcon, DollarSignIcon } from '../icons';

interface LabelSidebarProps {
    activeView: AppView;
    onNavigate: (view: AppView) => void;
}

const MenuItem: React.FC<{ label: string; icon: React.ReactNode; view: AppView; activeView: AppView; onClick: () => void }> = ({ label, icon, view, activeView, onClick }) => {
    const isActive = activeView === view;
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
        >
            <div className={`${isActive ? 'text-orange-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                {icon}
            </div>
            <span className="font-semibold">{label}</span>
            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]"></div>}
        </button>
    );
};

const LabelSidebar: React.FC<LabelSidebarProps> = ({ activeView, onNavigate }) => {
    return (
        <div className="w-full h-full bg-zinc-900/50 backdrop-blur-sm border-r border-zinc-700/50 p-4 flex flex-col gap-2">
            <div className="px-4 py-4 mb-4">
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Enterprise</h2>
            </div>
            
            <MenuItem label="Dashboard" icon={<ChartBarIcon className="w-5 h-5"/>} view={AppView.LABEL_DASHBOARD} activeView={activeView} onClick={() => onNavigate(AppView.LABEL_DASHBOARD)} />
            <MenuItem label="Roster" icon={<UsersIcon className="w-5 h-5"/>} view={AppView.LABEL_ROSTER} activeView={activeView} onClick={() => onNavigate(AppView.LABEL_ROSTER)} />
            <MenuItem label="Bookings" icon={<CalendarIcon className="w-5 h-5"/>} view={AppView.LABEL_BOOKINGS} activeView={activeView} onClick={() => onNavigate(AppView.LABEL_BOOKINGS)} />
            <MenuItem label="Analytics" icon={<DollarSignIcon className="w-5 h-5"/>} view={AppView.LABEL_ANALYTICS} activeView={activeView} onClick={() => onNavigate(AppView.LABEL_ANALYTICS)} />
            <MenuItem label="Team" icon={<BriefcaseIcon className="w-5 h-5"/>} view={AppView.LABEL_TEAM} activeView={activeView} onClick={() => onNavigate(AppView.LABEL_TEAM)} />
            <MenuItem label="Global Rankings" icon={<StarIcon className="w-5 h-5"/>} view={AppView.LABEL_GLOBAL_RANKINGS} activeView={activeView} onClick={() => onNavigate(AppView.LABEL_GLOBAL_RANKINGS)} />
            
            <div className="mt-auto pt-4 border-t border-zinc-800">
                <MenuItem label="Settings" icon={<CogIcon className="w-5 h-5"/>} view={AppView.LABEL_SETTINGS} activeView={activeView} onClick={() => onNavigate(AppView.LABEL_SETTINGS)} />
            </div>
        </div>
    );
};

export default LabelSidebar;
