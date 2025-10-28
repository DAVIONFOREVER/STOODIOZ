import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppView, type AppNotification, type Artist, type Engineer, type Stoodio, type Producer } from '../types';
// FIX: Import UsersIcon to be used for the Leaderboard link in the mobile menu.
import { StoodiozLogoIcon, InboxIcon, MapIcon, BellIcon, ChevronLeftIcon, ChevronRightIcon, LogoutIcon, UserCircleIcon, BentoIcon, CloseIcon, HouseIcon, SoundWaveIcon, MusicNoteIcon, UsersIcon } from './icons';
import NotificationPanel from './NotificationPanel';
import UniversalSearch from './UniversalSearch';
import { useAppState } from '../contexts/AppContext';

interface HeaderProps {
    onNavigate: (view: AppView) => void;
    onGoBack: () => void;
    onGoForward: () => void;
    canGoBack: boolean;
    canGoForward: boolean;
    onLogout: () => void;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectProducer: (producer: Producer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
}

const Header: React.FC<HeaderProps> = (props) => {
    const { 
        onNavigate, onGoBack, onGoForward, canGoBack, canGoForward, onLogout, onMarkAsRead, onMarkAllAsRead,
        onSelectArtist, onSelectEngineer, onSelectProducer, onSelectStoodio
    } = props;
    const { currentUser, userRole, notifications, artists, engineers, producers, stoodioz } = useAppState();
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

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

     useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);


    const handleLogoClick = () => {
        if (userRole) {
            onNavigate(AppView.THE_STAGE);
        } else {
            onNavigate(AppView.LANDING_PAGE);
        }
    };
    
    return (
        <header className="bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-40 border-b border-zinc-700/50">
            <div className="main-container px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={handleLogoClick} className="flex-shrink-0">
                            <StoodiozLogoIcon className="h-8 w-auto text-orange-500" />
                        </button>
                        <nav className="hidden md:flex items-center gap-2">
                            <button onClick={onGoBack} disabled={!canGoBack} className={`${navButtonClasses} ${!canGoBack ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-zinc-700'}`}>
                                <ChevronLeftIcon className="h-6 w-6" />
                            </button>
                            <button onClick={onGoForward} disabled={!canGoForward} className={`${navButtonClasses} ${!canGoForward ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-zinc-700'}`}>
                                <ChevronRightIcon className="h-6 w-6" />
                            </button>
                        </nav>
                         <nav className="hidden lg:flex items-center gap-2">
                             <button onClick={() => onNavigate(AppView.THE_STAGE)} className={navLinkClasses}>The Stage</button>
                             <button onClick={() => onNavigate(AppView.MAP_VIEW)} className={navLinkClasses}>Map</button>
                             <button onClick={() => onNavigate(AppView.STOODIO_LIST)} className={navLinkClasses}>Stoodioz</button>
                             <button onClick={() => onNavigate(AppView.INBOX)} className={navLinkClasses}>Inbox</button>
                             {/* FIX: Navigate to AppView.LEADERBOARD, which now exists. */}
                             <button onClick={() => onNavigate(AppView.LEADERBOARD)} className={navLinkClasses}>Leaderboard</button>
                        </nav>
                    </div>

                    <div className="hidden md:flex flex-1 justify-center px-8">
                         <UniversalSearch 
                            allArtists={artists}
                            allEngineers={engineers}
                            allProducers={producers}
                            allStoodioz={stoodioz}
                            onSelectArtist={onSelectArtist}
                            onSelectEngineer={onSelectEngineer}
                            onSelectProducer={onSelectProducer}
                            onSelectStoodio={onSelectStoodio}
                         />
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {currentUser ? (
                            <>
                                <div className="relative" ref={panelRef}>
                                    <button onClick={() => setIsPanelOpen(!isPanelOpen)} className={`${navButtonClasses} text-slate-300 hover:text-white hover:bg-zinc-700 relative`}>
                                        <BellIcon className="h-6 w-6" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-orange-500 ring-2 ring-zinc-900" />
                                        )}
                                    </button>
                                    {isPanelOpen && (
                                        <NotificationPanel 
                                            notifications={notifications} 
                                            onMarkAsRead={onMarkAsRead}
                                            onMarkAllAsRead={onMarkAllAsRead}
                                            onNavigate={(view, entityId) => {
                                                if (entityId) {
                                                    console.warn("Entity navigation from notification not fully implemented.");
                                                }
                                                onNavigate(view);
                                                setIsPanelOpen(false);
                                            }}
                                            onClose={() => setIsPanelOpen(false)}
                                        />
                                    )}
                                </div>
                                <button onClick={onLogout} className={`${navButtonClasses} text-slate-300 hover:text-red-400 hover:bg-red-500/10`}>
                                    <LogoutIcon className="h-6 w-6" />
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => onNavigate(AppView.LOGIN)} className={navLinkClasses}>Log In</button>
                                <button onClick={() => onNavigate(AppView.CHOOSE_PROFILE)} className="px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-orange-500 text-white hover:bg-orange-600">Sign Up</button>
                            </>
                        )}
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 rounded-md text-slate-300 hover:text-white hover:bg-zinc-700">
                           <BentoIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
                    <div className="fixed top-0 right-0 bottom-0 bg-zinc-900 w-full max-w-xs p-6 shadow-xl border-l border-zinc-700">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-white">Menu</h3>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 rounded-md text-slate-300 hover:bg-zinc-700">
                                <CloseIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <nav className="grid gap-y-4">
                             <button onClick={() => { onNavigate(AppView.THE_STAGE); setIsMobileMenuOpen(false); }} className="flex items-center p-3 -m-3 rounded-md hover:bg-zinc-800 text-base font-medium text-slate-200"><HouseIcon className="h-6 w-6 mr-3 text-orange-400"/>The Stage</button>
                             <button onClick={() => { onNavigate(AppView.MAP_VIEW); setIsMobileMenuOpen(false); }} className="flex items-center p-3 -m-3 rounded-md hover:bg-zinc-800 text-base font-medium text-slate-200"><MapIcon className="h-6 w-6 mr-3 text-orange-400"/>Map</button>
                             <button onClick={() => { onNavigate(AppView.STOODIO_LIST); setIsMobileMenuOpen(false); }} className="flex items-center p-3 -m-3 rounded-md hover:bg-zinc-800 text-base font-medium text-slate-200"><SoundWaveIcon className="h-6 w-6 mr-3 text-orange-400"/>Stoodioz</button>
                             <button onClick={() => { onNavigate(AppView.INBOX); setIsMobileMenuOpen(false); }} className="flex items-center p-3 -m-3 rounded-md hover:bg-zinc-800 text-base font-medium text-slate-200"><InboxIcon className="h-6 w-6 mr-3 text-orange-400"/>Inbox</button>
                             {/* FIX: Navigate to AppView.LEADERBOARD and use UsersIcon instead of the non-existent UserGroupIcon. */}
                             <button onClick={() => { onNavigate(AppView.LEADERBOARD); setIsMobileMenuOpen(false); }} className="flex items-center p-3 -m-3 rounded-md hover:bg-zinc-800 text-base font-medium text-slate-200"><UsersIcon className="h-6 w-6 mr-3 text-orange-400"/>Leaderboard</button>
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;