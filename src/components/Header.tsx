
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppView, type AppNotification, type Artist, type Engineer, type Stoodio, type Producer, type Label, UserRole } from '../types';
import { StoodiozLogoIcon, InboxIcon, MapIcon, BellIcon, ChevronLeftIcon, ChevronRightIcon, MicrophoneIcon, LogoutIcon, UserCircleIcon, BentoIcon, CloseIcon, HouseIcon, SoundWaveIcon, MusicNoteIcon, UsersIcon, ChartBarIcon, ChevronDownIcon, DollarSignIcon, EyeIcon, BriefcaseIcon, CalendarIcon } from './icons.tsx';
import NotificationPanel from './NotificationPanel.tsx';
import UniversalSearch from './UniversalSearch.tsx';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext.tsx';

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
    console.log('[HEADER RUNTIME CHECK]', {
  userRole,
  currentUser,
});

    const dispatch = useAppDispatch();
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
    if (!userRole) {
        onNavigate(AppView.LANDING_PAGE);
        return;
    }

    if (userRole === UserRole.LABEL) {
        onNavigate(AppView.LABEL_DASHBOARD);
        return;
    }

    onNavigate(AppView.THE_STAGE);
};

    const handleDashboardNavigate = () => {
        if (!userRole) return;
        switch (userRole) {
            case UserRole.ARTIST: onNavigate(AppView.ARTIST_DASHBOARD); break;
            case UserRole.ENGINEER: onNavigate(AppView.ENGINEER_DASHBOARD); break;
            case UserRole.PRODUCER: onNavigate(AppView.PRODUCER_DASHBOARD); break;
            case UserRole.STOODIO: onNavigate(AppView.STOODIO_DASHBOARD); break;
            case UserRole.LABEL: onNavigate(AppView.LABEL_DASHBOARD); break;
        }
    };

    const handleViewProfile = () => {
        if (!currentUser || !userRole) return;
        dispatch({ type: ActionTypes.RESET_PROFILE_SELECTIONS });
        if (userRole === UserRole.STOODIO) onSelectStoodio(currentUser as Stoodio);
        else if (userRole === UserRole.ENGINEER) onSelectEngineer(currentUser as Engineer);
        else if (userRole === UserRole.PRODUCER) onSelectProducer(currentUser as Producer);
        else if (userRole === UserRole.ARTIST) onSelectArtist(currentUser as Artist);
        else if (userRole === UserRole.LABEL) onNavigate(AppView.LABEL_PROFILE);
        setIsMobileMenuOpen(false);
    };
    
    const handleMobileNav = (view: AppView) => {
        onNavigate(view);
        setIsMobileMenuOpen(false);
    };
    
    return (
        <>
            <header className="bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50 relative">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={handleLogoClick} className="flex-shrink-0 flex items-center gap-3 group">
                               <StoodiozLogoIcon className="h-10 w-10 text-orange-500 group-hover:text-orange-400 transition-colors" />
                               <span className="text-3xl font-bold text-slate-100 group-hover:text-orange-400 transition-colors tracking-tight hidden sm:inline">Stoodioz</span>
                            </button>
                             <div className="flex items-center border-l border-zinc-700 ml-2 sm:ml-4 pl-2 sm:pl-4">
                                <button onClick={onGoBack} disabled={!canGoBack} className={`${navButtonClasses} ${canGoBack ? 'text-slate-300 hover:bg-zinc-800' : 'text-slate-600 cursor-not-allowed'}`}><ChevronLeftIcon className="w-6 h-6" /></button>
                                <button onClick={onGoForward} disabled={!canGoForward} className={`${navButtonClasses} ${canGoForward ? 'text-slate-300 hover:bg-zinc-800' : 'text-slate-600 cursor-not-allowed'}`}><ChevronRightIcon className="w-6 h-6" /></button>
                            </div>
                        </div>
                        
                        <div className="hidden lg:flex flex-1 justify-center items-center px-4">
                            {userRole ? (
                                <UniversalSearch allArtists={artists} allEngineers={engineers} allProducers={producers} allStoodioz={stoodioz} onSelectArtist={onSelectArtist} onSelectEngineer={onSelectEngineer} onSelectProducer={onSelectProducer} onSelectStoodio={onSelectStoodio} />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onNavigate(AppView.STOODIO_LIST)} className={navLinkClasses}>Find Stoodioz</button>
                                    <button onClick={() => onNavigate(AppView.ENGINEER_LIST)} className={navLinkClasses}>Find Engineers</button>
                                    <button onClick={() => onNavigate(AppView.PRODUCER_LIST)} className={navLinkClasses}>Find Producers</button>
                                    <button onClick={() => onNavigate(AppView.ARTIST_LIST)} className={navLinkClasses}>Find Artists</button>
                                </div>
                            )}
                        </div>
                        
                        <div className="hidden lg:flex items-center justify-end flex-shrink-0">
                            {userRole ? (
                                <div className="flex items-center space-x-1">
                              {userRole && userRole !== UserRole.LABEL && (
  <>
    <button
      onClick={() => onNavigate(AppView.THE_STAGE)}
      className={`${navLinkClasses} flex items-center gap-1.5`}
    >
      <SoundWaveIcon className="w-5 h-5" />
      <span>Stage</span>
    </button>

    <button
      onClick={() => onNavigate(AppView.MAP_VIEW)}
      className={`${navLinkClasses} flex items-center gap-1.5`}
    >
      <MapIcon className="w-5 h-5" />
      <span>Map</span>
    </button>
  </>
)}

                                    <button onClick={() => onNavigate(AppView.ASSET_VAULT)} className={`${navLinkClasses} flex items-center gap-1.5`} title="Vault">
                                        <BriefcaseIcon className="w-5 h-5" />
                                        <span>Vault</span>
                                    </button>
                                    <button onClick={() => onNavigate(AppView.MASTER_CALENDAR)} className={`${navLinkClasses} flex items-center gap-1.5`} title="Calendar">
                                        <CalendarIcon className="w-5 h-5" />
                                        <span>Calendar</span>
                                    </button>
                                    <button onClick={handleViewProfile} className={`${navLinkClasses} flex items-center gap-1.5`}>
                                        <EyeIcon className="w-5 h-5" />
                                        <span>Profile</span>
                                    </button>
                                    <button onClick={handleDashboardNavigate} className={`${navLinkClasses} flex items-center gap-1.5`}>
                                        <UserCircleIcon className="w-5 h-5" />
                                        <span>Dashboard</span>
                                    </button>
                                    <div ref={panelRef} className="border-l border-zinc-700 ml-2 pl-2 flex items-center gap-1 flex-shrink-0 relative">
                                        <button onClick={() => onNavigate(AppView.INBOX)} className={`${navLinkClasses} flex items-center`}><InboxIcon className="w-5 h-5" /></button>
                                        <button onClick={() => setIsPanelOpen(prev => !prev)} className={`${navLinkClasses} relative`}>
                                            <BellIcon className="w-6 h-6" />
                                            {unreadCount > 0 && <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold ring-2 ring-zinc-900">{unreadCount}</span>}
                                        </button>
                                        {isPanelOpen && <NotificationPanel notifications={notifications} onMarkAsRead={onMarkAsRead} onMarkAllAsRead={onMarkAllAsRead} onNavigate={() => {}} onClose={() => setIsPanelOpen(false)} />}
                                        <button onClick={onLogout} className={`${navLinkClasses} flex items-center gap-1.5`}><LogoutIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onNavigate(AppView.LOGIN)} className="text-slate-300 hover:text-orange-400 px-4 py-2 rounded-md text-sm font-semibold transition-colors">Login</button>
                                    <button onClick={() => onNavigate(AppView.CHOOSE_PROFILE)} className="bg-orange-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-orange-600 transition-all text-sm shadow-md">Get Started</button>
                                </div>
                            )}
                        </div>
                        <div className="lg:hidden flex items-center">
                            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-300 hover:text-orange-400"><BentoIcon className="w-6 h-6"/></button>
                        </div>
                    </div>
                </nav>
            </header>
            {/* Mobile Menu (Abbreviated logic for space) */}
        </>
    );
};

export default Header;
