import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppView, type AppNotification, type Artist, type Engineer, type Stoodio, type Producer } from '../types';
import { StoodiozLogoIcon, InboxIcon, MapIcon, BellIcon, ChevronLeftIcon, ChevronRightIcon, MicrophoneIcon, LogoutIcon, UserCircleIcon, BentoIcon, CloseIcon, HouseIcon, SoundWaveIcon, MusicNoteIcon, UsersIcon, ChartBarIcon } from './icons';
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
    const { userRole, notifications, artists, engineers, producers, stoodioz } = useAppState();
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

    const handleDashboardNavigate = () => {
        if (!userRole) return;
        switch (userRole) {
            case 'ARTIST':
                onNavigate(AppView.ARTIST_DASHBOARD);
                break;
            case 'ENGINEER':
                onNavigate(AppView.ENGINEER_DASHBOARD);
                break;
            case 'PRODUCER':
                onNavigate(AppView.PRODUCER_DASHBOARD);
                break;
            case 'STOODIO':
                onNavigate(AppView.STOODIO_DASHBOARD);
                break;
        }
    };
    
    const handleMobileNav = (view: AppView) => {
        onNavigate(view);
        setIsMobileMenuOpen(false);
    };
    
    const handleMobileDashboardNav = () => {
        handleDashboardNavigate();
        setIsMobileMenuOpen(false);
    }

    const handleMobileLogout = () => {
        onLogout();
        setIsMobileMenuOpen(false);
    }

    return (
        <>
            <header className="bg-black/60 backdrop-blur-md sticky top-0 z-50 border-b border-orange-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.1),_0_2px_20px_rgba(249,115,22,0.1)]">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* LEFT SECTION */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={handleLogoClick} className="flex-shrink-0 flex items-center gap-3 group">
                               <StoodiozLogoIcon className="h-10 w-10 text-orange-500 group-hover:text-orange-400 transition-colors" />
                               <span className="text-3xl font-bold text-slate-100 group-hover:text-orange-400 transition-colors tracking-tight hidden sm:inline">
                                    Stoodioz
                                </span>
                            </button>
                             <div className="flex items-center border-l border-zinc-700 ml-2 sm:ml-4 pl-2 sm:pl-4">
                                <button onClick={onGoBack} disabled={!canGoBack} className={`${navButtonClasses} ${canGoBack ? 'text-slate-300 hover:bg-zinc-800' : 'text-slate-600 cursor-not-allowed'}`}>
                                    <ChevronLeftIcon className="w-6 h-6" />
                                </button>
                                <button onClick={onGoForward} disabled={!canGoForward} className={`${navButtonClasses} ${canGoForward ? 'text-slate-300 hover:bg-zinc-800' : 'text-slate-600 cursor-not-allowed'}`}>
                                    <ChevronRightIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        
                        {/* CENTER SECTION */}
                        <div className="hidden lg:flex flex-1 justify-center items-center px-4">
                            {userRole ? (
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
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onNavigate(AppView.STOODIO_LIST)} className={navLinkClasses}>Find Stoodioz</button>
                                    <button onClick={() => onNavigate(AppView.ENGINEER_LIST)} className={navLinkClasses}>Find Engineers</button>
                                    <button onClick={() => onNavigate(AppView.PRODUCER_LIST)} className={navLinkClasses}>Find Producers</button>
                                    <button onClick={() => onNavigate(AppView.ARTIST_LIST)} className={navLinkClasses}>Find Artists</button>
                                    <button onClick={() => onNavigate(AppView.SUBSCRIPTION_PLANS)} className={navLinkClasses}>Pricing</button>
                                </div>
                            )}
                        </div>
                        
                        {/* RIGHT SECTION - DESKTOP */}
                        <div className="hidden lg:flex items-center justify-end flex-shrink-0">
                            {userRole ? (
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => onNavigate(AppView.THE_STAGE)} className={`${navLinkClasses} flex items-center gap-1.5`}>
                                        <MicrophoneIcon className="w-5 h-5" />
                                        <span>The Stage</span>
                                    </button>
                                    <button onClick={handleDashboardNavigate} className={`${navLinkClasses} flex items-center gap-1.5`}>
                                        <UserCircleIcon className="w-5 h-5" />
                                        <span>My Dashboard</span>
                                    </button>
                                     <button onClick={() => onNavigate(AppView.LEADERBOARD)} className={`${navLinkClasses} flex items-center gap-1.5`}>
                                        <ChartBarIcon className="w-5 h-5" />
                                        <span>Top Talent</span>
                                    </button>
                                    <button onClick={() => onNavigate(AppView.MAP_VIEW)} className={`${navLinkClasses} flex items-center gap-1.5`}>
                                        <MapIcon className="w-5 h-5" />
                                        <span>Map</span>
                                    </button>
                                    <div ref={panelRef} className="border-l border-zinc-700 ml-2 pl-2 flex items-center gap-1 flex-shrink-0 relative">
                                        <button onClick={() => onNavigate(AppView.INBOX)} className={`${navLinkClasses} flex items-center`}>
                                            <InboxIcon className="w-5 h-5" />
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
                                                onNavigate={() => {}}
                                                onClose={() => setIsPanelOpen(false)}
                                            />
                                        )}
                                        <button onClick={onLogout} className={`${navLinkClasses} flex items-center gap-1.5`}>
                                            <LogoutIcon className="w-5 h-5"/>
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onNavigate(AppView.LOGIN)} className="text-slate-300 hover:text-orange-400 px-4 py-2 rounded-md text-sm font-semibold transition-colors">Login</button>
                                    <button onClick={() => onNavigate(AppView.CHOOSE_PROFILE)} className="bg-orange-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-orange-600 transition-all text-sm shadow-md shadow-orange-500/20">Get Started</button>
                                </div>
                            )}
                        </div>

                        {/* RIGHT SECTION - MOBILE */}
                        <div className="lg:hidden flex items-center">
                            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-300 hover:text-orange-400">
                                <BentoIcon className="w-6 h-6"/>
                            </button>
                        </div>
                    </div>
                </nav>
            </header>

            {/* MOBILE MENU */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-[100] bg-zinc-900" role="dialog" aria-modal="true">
                    <div className="p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                             <button onClick={() => handleMobileNav(userRole ? AppView.THE_STAGE : AppView.LANDING_PAGE)} className="flex-shrink-0 flex items-center gap-3 group">
                                <StoodiozLogoIcon className="h-9 w-9 text-orange-500" />
                                <span className="text-2xl font-bold text-slate-100">Stoodioz</span>
                            </button>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-100">
                                <CloseIcon className="w-6 h-6"/>
                            </button>
                        </div>
                        <nav className={`flex flex-col flex-grow ${userRole ? 'space-y-2' : ''}`}>
                            {userRole ? (
                                <>
                                    <MobileNavLink icon={<MicrophoneIcon className="w-5 h-5"/>} label="The Stage" onClick={() => handleMobileNav(AppView.THE_STAGE)} />
                                    <MobileNavLink icon={<UserCircleIcon className="w-5 h-5"/>} label="My Dashboard" onClick={handleMobileDashboardNav} />
                                    <MobileNavLink icon={<ChartBarIcon className="w-5 h-5"/>} label="Top Talent" onClick={() => handleMobileNav(AppView.LEADERBOARD)} />
                                    <MobileNavLink icon={<MapIcon className="w-5 h-5"/>} label="Map View" onClick={() => handleMobileNav(AppView.MAP_VIEW)} />
                                    <MobileNavLink icon={<InboxIcon className="w-5 h-5"/>} label="Inbox" onClick={() => handleMobileNav(AppView.INBOX)} />
                                    <div className="border-t border-zinc-700 my-2"></div>
                                    <MobileNavLink icon={<LogoutIcon className="w-5 h-5"/>} label="Logout" onClick={handleMobileLogout} />
                                </>
                            ) : (
                                 <>
                                    <div>
                                        <MobileNavLink icon={<HouseIcon className="w-5 h-5"/>} label="Find Stoodioz" onClick={() => handleMobileNav(AppView.STOODIO_LIST)} />
                                        <MobileNavLink icon={<SoundWaveIcon className="w-5 h-5"/>} label="Find Engineers" onClick={() => handleMobileNav(AppView.ENGINEER_LIST)} />
                                        <MobileNavLink icon={<MusicNoteIcon className="w-5 h-5"/>} label="Find Producers" onClick={() => handleMobileNav(AppView.PRODUCER_LIST)} />
                                        <MobileNavLink icon={<MicrophoneIcon className="w-5 h-5"/>} label="Find Artists" onClick={() => handleMobileNav(AppView.ARTIST_LIST)} />
                                    </div>
                                     <div className="border-t border-zinc-700 pt-4 mt-auto space-y-2">
                                        <button onClick={() => handleMobileNav(AppView.LOGIN)} className="w-full text-center text-slate-300 hover:text-orange-400 px-4 py-3 rounded-md text-base font-semibold transition-colors">
                                            Login
                                        </button>
                                        <button onClick={() => handleMobileNav(AppView.CHOOSE_PROFILE)} className="w-full text-center bg-orange-500 text-white font-bold py-3 px-5 rounded-lg hover:bg-orange-600 transition-all text-base shadow-md shadow-orange-500/20">
                                            Get Started
                                        </button>
                                     </div>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
};

const MobileNavLink: React.FC<{icon: React.ReactNode, label: string, onClick: () => void}> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex items-center gap-4 text-slate-200 hover:bg-zinc-800 p-3 rounded-lg text-base font-semibold transition-colors">
        {icon}
        <span>{label}</span>
    </button>
);


export default Header;