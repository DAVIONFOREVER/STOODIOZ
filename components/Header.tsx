import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserRole, type AppNotification } from '../types';
import { StoodiozLogoIcon, InboxIcon, MapIcon, BellIcon, ChevronLeftIcon, ChevronRightIcon, MicrophoneIcon } from './icons';
import NotificationPanel from './NotificationPanel';

interface HeaderProps {
    onNavigate: (view: AppView, entityId?: string) => void;
    userRole: UserRole | null;
    notifications: AppNotification[];
    unreadCount: number;
    onGoBack: () => void;
    onGoForward: () => void;
    canGoBack: boolean;
    canGoForward: boolean;
    onLogout: () => void;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
    const { onNavigate, userRole, notifications, unreadCount, onGoBack, onGoForward, canGoBack, canGoForward, onLogout, onMarkAsRead, onMarkAllAsRead } = props;
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const navLinkClasses = "text-slate-300 hover:text-orange-400 px-3 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap";
    const navButtonClasses = "p-2 rounded-full transition-colors";
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const handleLogoClick = () => {
        if (userRole) {
            onNavigate(AppView.THE_STAGE);
        } else {
            onNavigate(AppView.LANDING_PAGE);
        }
    };

    const handleNavigateToDashboard = () => {
        if (!userRole) return;
        switch (userRole) {
            case UserRole.ARTIST:
                onNavigate(AppView.ARTIST_DASHBOARD);
                break;
            case UserRole.ENGINEER:
                onNavigate(AppView.ENGINEER_DASHBOARD);
                break;
            case UserRole.STOODIO:
                onNavigate(AppView.STOODIO_DASHBOARD);
                break;
        }
    };

    return (
        <header className="bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50 shadow-lg shadow-black/20">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={handleLogoClick} className="flex-shrink-0 flex items-center gap-3 group">
                           <StoodiozLogoIcon className="h-9 w-9 text-orange-500 group-hover:text-orange-400 transition-colors" />
                           <span className="text-2xl font-bold text-slate-50 group-hover:text-orange-400 transition-colors tracking-tight hidden sm:inline">
                                Stoodioz
                            </span>
                        </button>
                        <div className="flex items-center border-l border-zinc-700 ml-2 sm:ml-4 pl-2 sm:pl-4">
                            <button onClick={onGoBack} disabled={!canGoBack} className={`${navButtonClasses} ${canGoBack ? 'text-slate-300 hover:bg-zinc-700' : 'text-slate-600 cursor-not-allowed'}`}>
                                <ChevronLeftIcon className="w-6 h-6" />
                            </button>
                            <button onClick={onGoForward} disabled={!canGoForward} className={`${navButtonClasses} ${canGoForward ? 'text-slate-300 hover:bg-zinc-700' : 'text-slate-600 cursor-not-allowed'}`}>
                                <ChevronRightIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Navigation Links Container */}
                    <div className="flex-1 min-w-0 ml-4">
                        <div className="flex items-center justify-end overflow-x-auto no-scrollbar">
                            {userRole ? (
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => onNavigate(AppView.THE_STAGE)} className={`${navLinkClasses} flex items-center gap-1.5`}>
                                        <MicrophoneIcon className="w-5 h-5" />
                                        The Stage
                                    </button>
                                    <button onClick={handleNavigateToDashboard} className={navLinkClasses}>
                                        My Dashboard
                                    </button>
                                    {(userRole === UserRole.ARTIST || userRole === UserRole.ENGINEER) && (
                                        <button onClick={() => onNavigate(AppView.MY_BOOKINGS)} className={navLinkClasses}>
                                            My Bookings
                                        </button>
                                    )}
                                    <button onClick={() => onNavigate(AppView.STOODIO_LIST)} className={navLinkClasses}>
                                        Find Stoodioz
                                    </button>
                                    <button onClick={() => onNavigate(AppView.ENGINEER_LIST)} className={navLinkClasses}>
                                        Find Engineers
                                    </button>
                                    <button onClick={() => onNavigate(AppView.ARTIST_LIST)} className={navLinkClasses}>
                                        Find Artists
                                    </button>
                                    <button onClick={() => onNavigate(AppView.MAP_VIEW)} className={`${navLinkClasses} flex items-center gap-1.5`}>
                                        <MapIcon className="w-5 h-5" />
                                        Map View
                                    </button>
                                    <div ref={panelRef} className="border-l border-zinc-700 ml-4 pl-4 flex items-center gap-1 flex-shrink-0 relative">
                                        <button onClick={() => onNavigate(AppView.INBOX)} className={`${navLinkClasses} flex items-center gap-1.5`}>
                                            <InboxIcon className="w-5 h-5" />
                                            Inbox
                                        </button>
                                        <button onClick={() => setIsPanelOpen(prev => !prev)} className={`${navLinkClasses} relative`}>
                                            <BellIcon className="w-6 h-6" />
                                            {unreadCount > 0 && (
                                                <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold ring-2 ring-zinc-900">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </button>
                                        {isPanelOpen && (
                                            <NotificationPanel 
                                                notifications={notifications}
                                                onMarkAsRead={onMarkAsRead}
                                                onMarkAllAsRead={onMarkAllAsRead}
                                                onNavigate={onNavigate}
                                                onClose={() => setIsPanelOpen(false)}
                                            />
                                        )}
                                        <button onClick={onLogout} className={navLinkClasses}>
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                     <div className="flex items-center space-x-1">
                                        <button onClick={() => onNavigate(AppView.STOODIO_LIST)} className={navLinkClasses}>
                                            Find Stoodioz
                                        </button>
                                        <button onClick={() => onNavigate(AppView.ENGINEER_LIST)} className={navLinkClasses}>
                                            Find Engineers
                                        </button>
                                        <button onClick={() => onNavigate(AppView.ARTIST_LIST)} className={navLinkClasses}>
                                            Find Artists
                                        </button>
                                    </div>
                                    <button onClick={() => onNavigate(AppView.LOGIN)} className="text-slate-300 hover:text-orange-400 px-2 sm:px-4 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap">
                                        Login
                                    </button>
                                    <button 
                                        onClick={() => onNavigate(AppView.CHOOSE_PROFILE)} 
                                        className="bg-orange-500 text-white font-bold py-2 px-3 sm:px-5 rounded-lg hover:bg-orange-600 transition-all text-sm shadow-md whitespace-nowrap"
                                    >
                                        Get Started
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </header>
    );
};

export default Header;