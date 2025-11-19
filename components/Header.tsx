
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppView, type AppNotification, type Artist, type Engineer, type Stoodio, type Producer } from '../types';
import { StoodiozLogoIcon, InboxIcon, MapIcon, BellIcon, ChevronLeftIcon, ChevronRightIcon, MicrophoneIcon, LogoutIcon, UserCircleIcon, BentoIcon, CloseIcon, HouseIcon, SoundWaveIcon, MusicNoteIcon, UsersIcon, ChartBarIcon, ChevronDownIcon, DollarSignIcon, EyeIcon } from './icons.tsx';
import NotificationPanel from './NotificationPanel.tsx';
import UniversalSearch from './UniversalSearch.tsx';
import { useAppState } from '../contexts/AppContext.tsx';

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
    const { userRole, notifications, artists, engineers, producers, stoodioz, currentUser } = useAppState();
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

    const handleViewProfile = () => {
        if (!currentUser) return;
        if ('amenities' in currentUser) onSelectStoodio(currentUser as Stoodio);
        else if ('specialties' in currentUser) onSelectEngineer(currentUser as Engineer);
        else if ('instrumentals' in currentUser) onSelectProducer(currentUser as Producer);
        else onSelectArtist(currentUser as Artist);
        setIsMobileMenuOpen(false);
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
    
    const handleMobileSelect = (callback: (item: any) => void) => (item: any) => {
        callback(item);
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            <header className="bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50 relative">
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
                                    <div className="relative group">
                                        <button className={`${navLinkClasses} flex items-center gap-1.5`}>
                                            <UsersIcon className="w-5 h-5" />
                                            <span>Discover</span>
                                            <ChevronDownIcon className="w-4 h-4 transition-transform group-hover:rotate-180" />
                                        </button>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
                                            <div className="py-1">
                                                <a onClick={() => onNavigate(AppView.STOODIO_LIST)} className="block px-4 py-2 text-sm text-slate-300 hover:bg-zinc-700 hover:text-orange-400 cursor-pointer">Find Stoodioz</a>
                                                <a onClick={() => onNavigate(AppView.ENGINEER_LIST)} className="block px-4 py-2 text-sm text-slate-300 hover:bg-zinc-700 hover:text-orange-400 cursor-pointer">Find Engineers</a>
                                                <a onClick={() => onNavigate(AppView.PRODUCER_LIST)} className="block px-4 py-2 text-sm text-slate-300 hover:bg-zinc-700 hover:text-orange-400 cursor-pointer">Find Producers</a>
                                                <a onClick={() => onNavigate(AppView.ARTIST_LIST)} className="block px-4 py-2 text-sm text-slate-300 hover:bg-zinc-700 hover:text-orange-400 cursor-pointer">Find Artists</a>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={handleViewProfile} className={`${navLinkClasses} flex items-center gap-1.5`}>
                                        <EyeIcon className="w-5 h-5" />
                                        <span>My Profile</span>
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
                {/* The new glowing line effect */}
                <div 
                    className="absolute -bottom-px left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-indigo-500 to-sky-500 opacity-50" 
                    style={{ filter: 'blur(12px)' }}
                    aria-hidden="true"
                ></div>
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
                        {userRole && (
                            <div className="mb-6 px-1">
                                <UniversalSearch 
                                    allArtists={artists}
                                    allEngineers={engineers}
                                    allProducers={producers}
                                    allStoodioz={stoodioz}
                                    onSelectArtist={handleMobileSelect(onSelectArtist)}
                                    onSelectEngineer={handleMobileSelect(onSelectEngineer)}
                                    onSelectProducer={handleMobileSelect(onSelectProducer)}
                                    onSelectStoodio={handleMobileSelect(onSelectStoodio)}
                                />
                            </div>
                        )}
                        <nav className={`flex flex-col flex-grow ${userRole ? 'space-y-1' : ''}`}>
                            {userRole ? (
                                <>
                                    <MobileNavLink icon={<MicrophoneIcon className="w-5 h-5"/>} label="The Stage" onClick={() => handleMobileNav(AppView.THE_STAGE)} />
                                    <MobileNavLink icon={<EyeIcon className="w-5 h-5"/>} label="My Profile" onClick={handleViewProfile} />
                                    <MobileNavLink icon={<UserCircleIcon className="w-5 h-5"/>} label="My Dashboard" onClick={handleMobileDashboardNav} />
                                    <MobileNavLink icon={<ChartBarIcon className="w-5 h-5"/>} label="Top Talent" onClick={() => handleMobileNav(AppView.LEADERBOARD)} />
                                    <MobileNavLink icon={<MapIcon className="w-5 h-5"/>} label="Map View" onClick={() => handleMobileNav(AppView.MAP_VIEW)} />
                                    <MobileNavLink icon={<InboxIcon className="w-5 h-5"/>} label="Inbox" onClick={() => handleMobileNav(AppView.INBOX)} />
                                    
                                    <div className="border-t border-zinc-700 my-2"></div>
                                    <p className="px-3 pt-2 text-xs font-semibold text-zinc-500 uppercase">Discover</p>
                                    <MobileNavLink icon={<HouseIcon className="w-5 h-5"/>} label="Find Stoodioz" onClick={() => handleMobileNav(AppView.STOODIO_LIST)} />
                                    <MobileNavLink icon={<SoundWaveIcon className="w-5 h-5"/>} label="Find Engineers" onClick={() => handleMobileNav(AppView.ENGINEER_LIST)} />
                                    <MobileNavLink icon={<MusicNoteIcon className="w-5 h-5"/>} label="Find Producers" onClick={() => handleMobileNav(AppView.PRODUCER_LIST)} />
                                    <MobileNavLink icon={<UsersIcon className="w-5 h-5"/>} label="Find Artists" onClick={() => handleMobileNav(AppView.ARTIST_LIST)} />
                                    
                                    <div className="border-t border-zinc-700 mt-auto pt-2">
                                        <MobileNavLink icon={<LogoutIcon className="w-5 h-5"/>} label="Logout" onClick={handleMobileLogout} />
                                    </div>
                                </>
                            ) : (
                                 <>
                                    <div>
                                        <MobileNavLink icon={<HouseIcon className="w-5 h-5"/>} label="Find Stoodioz" onClick={() => handleMobileNav(AppView.STOODIO_LIST)} />
                                        <MobileNavLink icon={<SoundWaveIcon className="w-5 h-5"/>} label="Find Engineers" onClick={() => handleMobileNav(AppView.ENGINEER_LIST)} />
                                        <MobileNavLink icon={<MusicNoteIcon className="w-5 h-5"/>} label="Find Producers" onClick={() => handleMobileNav(AppView.PRODUCER_LIST)} />
                                        <MobileNavLink icon={<UsersIcon className="w-5 h-5"/>} label="Find Artists" onClick={() => handleMobileNav(AppView.ARTIST_LIST)} />
                                        <MobileNavLink icon={<DollarSignIcon className="w-5 h-5"/>} label="Pricing" onClick={() => handleMobileNav(AppView.SUBSCRIPTION_PLANS)} />
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
