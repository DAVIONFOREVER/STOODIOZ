import React from 'react';
import type { AdminUser } from '../types';
import { AdminView } from '../types';
import { StoodiozLogoIcon, DashboardIcon, UsersIcon, CalendarIcon, LogoutIcon } from './icons';

interface DashboardLayoutProps {
    user: AdminUser;
    onLogout: () => void;
    currentView: AdminView;
    onNavigate: (view: AdminView) => void;
    children: React.ReactNode;
}

const NavItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
            isActive 
            ? 'bg-orange-500 text-white shadow-md' 
            : 'text-slate-300 hover:bg-zinc-700'
        }`}
    >
        {icon}
        <span className="ml-3 font-semibold">{label}</span>
    </button>
);

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, onLogout, currentView, onNavigate, children }) => {
    return (
        <div className="flex h-screen bg-zinc-900 text-slate-300">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-zinc-800 border-r border-zinc-700 flex flex-col p-4">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <StoodiozLogoIcon className="h-9 w-9 text-orange-500" />
                    <span className="text-2xl font-bold text-slate-100 tracking-tight">
                        Stoodioz Admin
                    </span>
                </div>
                
                <nav className="flex-grow space-y-2">
                    <NavItem 
                        label="Dashboard" 
                        icon={<DashboardIcon className="w-6 h-6" />} 
                        isActive={currentView === AdminView.DASHBOARD}
                        onClick={() => onNavigate(AdminView.DASHBOARD)} 
                    />
                    <NavItem 
                        label="User Management" 
                        icon={<UsersIcon className="w-6 h-6" />} 
                        isActive={currentView === AdminView.USER_MANAGEMENT}
                        onClick={() => onNavigate(AdminView.USER_MANAGEMENT)}
                    />
                    <NavItem 
                        label="Booking Management" 
                        icon={<CalendarIcon className="w-6 h-6" />} 
                        isActive={currentView === AdminView.BOOKING_MANAGEMENT}
                        onClick={() => onNavigate(AdminView.BOOKING_MANAGEMENT)}
                    />
                </nav>

                <div className="mt-auto">
                    <div className="border-t border-zinc-700 mb-4 -mx-4"></div>
                     <div className="px-2 mb-4">
                        <p className="font-semibold text-slate-100">{user.name}</p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center w-full px-4 py-3 rounded-lg text-slate-300 hover:bg-zinc-700 transition-colors"
                    >
                        <LogoutIcon className="w-6 h-6" />
                        <span className="ml-3 font-semibold">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;