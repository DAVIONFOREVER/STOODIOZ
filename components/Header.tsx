
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserRole, type AppNotification, type Artist, type Engineer, type Stoodio } from '../types';
import { StoodiozLogoIcon, InboxIcon, MapIcon, BellIcon, ChevronLeftIcon, ChevronRightIcon, MicrophoneIcon, LogoutIcon, UserCircleIcon, BentoIcon, CloseIcon, HouseIcon, SoundWaveIcon } from './icons';
import NotificationPanel from './NotificationPanel';
import UniversalSearch from './UniversalSearch';

interface HeaderProps {
    onNavigate: (view: AppView) => void;
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
    allArtists: Artist[];
    allEngineers: Engineer[];
    allStoodioz: Stoodio[];
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
}

const Header: React.FC<HeaderProps> = (props) => {
    const { 
        onNavigate, userRole, notifications, unreadCount, onGoBack, onGoForward, canGoBack, canGoForward, onLogout, onMarkAsRead, onMarkAllAsRead,
        allArtists, allEngineers, allStoodioz, onSelectArtist, onSelectEngineer, onSelectStoodio
    } = props;
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const navLinkClasses = "text-slate-600 hover:text-orange-500 px-3 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap";
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
            <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-md">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* LEFT SECTION */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={handleLogoClick} className="flex-shrink-0 flex items-center gap-3 group">
                               <StoodiozLogoIcon className="h-9 w-9 text-orange-500 group-hover:text-orange-400 transition-colors" />
                               <span className="text-2xl font-bold text-slate-900 group-hover:text-orange-400 transition-colors tracking-tight hidden sm:inline">
                                    Stoodioz
                                </span>
                            </button>
                             <div className="flex items-center border-l border-slate-200 ml-2 sm:ml-4 pl-2 sm:pl-4">
                                <button onClick={onGoBack} disabled={!canGoBack} className={`${navButtonClasses} ${canGoBack ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 cursor-not-allowed'}`}>
                                    <ChevronLeftIcon className="w-6 h-6" />
                                </button>
                                <button onClick={onGoForward} disabled={!canGoForward} className={`${navButtonClasses} ${canGoForward ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 cursor-not-allowed'}`}>
                                    <ChevronRightIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        
                        {/* CENTER SECTION (Search) */}
                         {userRole && (
                            <div className="flex-1 flex justify-center px-4">
                                <UniversalSearch 
                                    allArtists={allArtists}
                                    allEngineers={allEngineers}
                                    allStoodioz={allStoodioz}
                                    onSelectArtist={onSelectArtist}
                                    onSelectEngineer={onSelectEngineer}
                                    onSelectStoodio={onSelectStoodio}
                                />
                            </div>
                        )}
                        
                        {/* RIGHT SECTION - DESKTOP */}
                        <div className="hidden md:flex items-center justify-end">
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
                                    <button onClick={() => onNavigate(AppView.MAP_VIEW)} className={`${navLinkClasses} flex items-center gap-1.5`}>
                                        <MapIcon className="w-5 h-5" />
                                        <span>Map</span>
                                    </button>
                                    <div ref={panelRef} className="border-l border-slate-200 ml-2 pl-2 flex items-center gap-1 flex-shrink-0 relative">
                                        <button onClick={() => onNavigate(AppView.INBOX)} className={`${navLinkClasses} flex items-center`}>
                                            <InboxIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setIsPanelOpen(prev => !prev)} className={`${navLinkClasses} relative`}>
                                            <BellIcon className="w-6 h-6" />
                                            {unreadCount > 0 && (
                                                <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold ring-2 ring-white">
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
                                        <button onClick={onLogout} className={`${navLinkClasses} flex items-center gap-1.5`}>
                                            <LogoutIcon className="w-5 h-5"/>
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onNavigate(AppView.STOODIO_LIST)} className={navLinkClasses}>Find Stoodioz</button>
                                    <button onClick={() => onNavigate(AppView.ENGINEER_LIST)} className={navLinkClasses}>Find Engineers</button>
                                    <button onClick={() => onNavigate(AppView.SUBSCRIPTION_PLANS)} className={navLinkClasses}>Pricing</button>
                                    <button onClick={() => onNavigate(AppView.LOGIN)} className="text-slate-600 hover:text-orange-500 px-4 py-2 rounded-md text-sm font-semibold transition-colors">Login</button>
                                    <button onClick={() => onNavigate(AppView.CHOOSE_PROFILE)} className="bg-orange-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-orange-600 transition-all text-sm shadow-md">Get Started</button>
                                </div>
                            )}
                        </div>

                        {/* RIGHT SECTION - MOBILE */}
                        <div className="md:hidden flex items-center">
                            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:text-orange-500">
                                <BentoIcon className="w-6 h-6"/>
                            </button>
                        </div>
                    </div>
                </nav>
            </header>

            {/* MOBILE MENU */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[100] bg-white" role="dialog" aria-modal="true">
                    <div className="p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                             <button onClick={() => handleMobileNav(userRole ? AppView.THE_STAGE : AppView.LANDING_PAGE)} className="flex-shrink-0 flex items-center gap-3 group">
                                <StoodiozLogoIcon className="h-8 w-8 text-orange-500" />
                                <span className="text-xl font-bold text-slate-900">Stoodioz</span>
                            </button>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500 hover:text-slate-800">
                                <CloseIcon className="w-6 h-6"/>
                            </button>
                        </div>
                        <nav className={`flex flex-col flex-grow ${userRole ? 'space-y-2' : ''}`}>
                            {userRole ? (
                                <>
                                    <MobileNavLink icon={<MicrophoneIcon className="w-5 h-5"/>} label="The Stage" onClick={() => handleMobileNav(AppView.THE_STAGE)} />
                                    <MobileNavLink icon={<UserCircleIcon className="w-5 h-5"/>} label="My Dashboard" onClick={handleMobileDashboardNav} />
                                    <MobileNavLink icon={<MapIcon className="w-5 h-5"/>} label="Map View" onClick={() => handleMobileNav(AppView.MAP_VIEW)} />
                                    <MobileNavLink icon={<InboxIcon className="w-5 h-5"/>} label="Inbox" onClick={() => handleMobileNav(AppView.INBOX)} />
                                    <div className="border-t border-slate-200 my-2"></div>
                                    <MobileNavLink icon={<LogoutIcon className="w-5 h-5"/>} label="Logout" onClick={handleMobileLogout} />
                                </>
                            ) : (
                                 <>
                                    <div>
                                        <MobileNavLink icon={<HouseIcon className="w-5 h-5"/>} label="Find Stoodioz" onClick={() => handleMobileNav(AppView.STOODIO_LIST)} />
                                        <MobileNavLink icon={<SoundWaveIcon className="w-5 h-5"/>} label="Find Engineers" onClick={() => handleMobileNav(AppView.ENGINEER_LIST)} />
                                        <MobileNavLink icon={<MicrophoneIcon className="w-5 h-5"/>} label="Find Artists" onClick={() => handleMobileNav(AppView.ARTIST_LIST)} />
                                    </div>
                                     <div className="border-t border-slate-200 pt-4 mt-auto space-y-2">
                                        <button onClick={() => handleMobileNav(AppView.LOGIN)} className="w-full text-center text-slate-600 hover:text-orange-500 px-4 py-3 rounded-md text-base font-semibold transition-colors">
                                            Login
                                        </button>
                                        <button onClick={() => handleMobileNav(AppView.CHOOSE_PROFILE)} className="w-full text-center bg-orange-500 text-white font-bold py-3 px-5 rounded-lg hover:bg-orange-600 transition-all text-base shadow-md">
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
    <button onClick={onClick} className="flex items-center gap-4 text-slate-700 hover:bg-slate-200 p-3 rounded-lg text-base font-semibold transition-colors">
        {icon}
        <span>{label}</span>
    </button>
);


export default Header;