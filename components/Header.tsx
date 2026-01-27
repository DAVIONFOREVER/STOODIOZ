import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppView, type Artist, type Engineer, type Stoodio, type Producer, type Label, UserRole } from '../types';

import {
  InboxIcon,
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogoutIcon,
  UserCircleIcon,
  BentoIcon,
  CloseIcon,
  EyeIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartBarIcon, // ✅ ADDED (Top Talent)
} from './icons.tsx';
// Header: wordmark only (no app icon). Paths must match assets folder.
const wordmarkLogo = new URL('../assets/stoodioz-wordmark.png', import.meta.url).href;
const fallbackWordmark = '/wordmark.png'; // public fallback if assets path fails

import NotificationPanel from './NotificationPanel.tsx';
import UniversalSearch from './UniversalSearch.tsx';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext.tsx';

interface HeaderProps {
  onNavigate: (view: AppView) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onLogout: () => void; // parent handler (should call supabase.auth.signOut)
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectArtist: (artist: Artist) => void;
  onSelectEngineer: (engineer: Engineer) => void;
  onSelectProducer: (producer: Producer) => void;
  onSelectStoodio: (stoodio: Stoodio) => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const {
    onNavigate,
    onGoBack,
    onGoForward,
    canGoBack,
    canGoForward,
    onLogout,
    onMarkAsRead,
    onMarkAllAsRead,
    onSelectArtist,
    onSelectEngineer,
    onSelectProducer,
    onSelectStoodio,
  } = props;

  const {
    userRole,
    notifications,
    artists,
    engineers,
    producers,
    stoodioz,
    currentUser,
    history,
    historyIndex,
  } = useAppState();

  const dispatch = useAppDispatch();

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [wordmarkSrc, setWordmarkSrc] = useState(wordmarkLogo);
  const panelRef = useRef<HTMLDivElement>(null);

  const currentView = history[historyIndex];
  const unreadCount = useMemo(() => (notifications ?? []).filter((n) => !n.read).length, [notifications]);

  const navLinkClasses =
    'text-slate-300 hover:text-orange-400 px-3 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap';
  const navButtonClasses = 'p-2 rounded-full transition-colors';

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
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleLogoClick = () => {
    const setupViews = [
      AppView.ARTIST_SETUP,
      AppView.ENGINEER_SETUP,
      AppView.PRODUCER_SETUP,
      AppView.STOODIO_SETUP,
      AppView.LABEL_SETUP,
    ];

    if (setupViews.includes(currentView)) {
      const ok = window.confirm(
        'You are currently setting up your profile. If you leave now, your progress will be lost. Continue?'
      );
      if (!ok) return;
    }

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
      case UserRole.ARTIST:
        onNavigate(AppView.ARTIST_DASHBOARD);
        break;
      case UserRole.ENGINEER:
        onNavigate(AppView.ENGINEER_DASHBOARD);
        break;
      case UserRole.PRODUCER:
        onNavigate(AppView.PRODUCER_DASHBOARD);
        break;
      case UserRole.STOODIO:
        onNavigate(AppView.STOODIO_DASHBOARD);
        break;
      case UserRole.LABEL:
        onNavigate(AppView.LABEL_DASHBOARD);
        break;
      default:
        onNavigate(AppView.THE_STAGE);
        break;
    }

    setIsMobileMenuOpen(false);
  };

  const handleViewProfile = () => {
    if (!currentUser || !userRole) return;

    // Use directory row when present (match by profile_id; currentUser.id is profile id).
    // Avoid RESET_PROFILE_SELECTIONS here — it can cause a bad intermediate state before
    // the new selection and navigate are applied, and we overwrite with "me" anyway.
    if (userRole === UserRole.STOODIO) {
      const stoodio =
        (stoodioz || []).find((s) => s.id === currentUser.id || (s as any).profile_id === currentUser.id) ||
        (currentUser as Stoodio);
      onSelectStoodio(stoodio);
    } else if (userRole === UserRole.ENGINEER) {
      const engineer =
        (engineers || []).find((e) => e.id === currentUser.id || (e as any).profile_id === currentUser.id) ||
        (currentUser as Engineer);
      onSelectEngineer(engineer);
    } else if (userRole === UserRole.PRODUCER) {
      const producer =
        (producers || []).find((p) => p.id === currentUser.id || (p as any).profile_id === currentUser.id) ||
        (currentUser as Producer);
      onSelectProducer(producer);
    } else if (userRole === UserRole.ARTIST) {
      const artist =
        (artists || []).find((a) => a.id === currentUser.id || (a as any).profile_id === currentUser.id) ||
        (currentUser as Artist);
      onSelectArtist(artist);
    } else if (userRole === UserRole.LABEL) {
      if (currentUser.id) {
        localStorage.setItem('selected_entity_id', String(currentUser.id));
        localStorage.setItem('selected_entity_type', 'label');
      }
      dispatch({ type: ActionTypes.VIEW_LABEL_PROFILE, payload: { label: currentUser as Label } });
      onNavigate(AppView.LABEL_PROFILE);
    }

    setIsMobileMenuOpen(false);
  };

  const navAndCloseMobile = (view: AppView) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const handleLogoutClick = async () => {
    // ✅ Hard-reset app state first so the next login doesn’t inherit anything.
    dispatch({ type: ActionTypes.LOGOUT }); // or ActionTypes.RESET_APP
    setIsPanelOpen(false);
    setIsMobileMenuOpen(false);

    // Parent should do supabase.auth.signOut + navigate to login
    onLogout();
  };

  return (
    <>
      <header className="bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50 relative">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={handleLogoClick} className="flex-shrink-0 flex items-center group">
                <img
                  src={wordmarkSrc}
                  alt="Stoodioz"
                  onError={() => setWordmarkSrc(fallbackWordmark)}
                  className="h-10 sm:h-12 md:h-14 w-auto object-contain object-left drop-shadow"
                />
              </button>

              <div className="flex items-center border-l border-zinc-700 ml-2 sm:ml-4 pl-2 sm:pl-4">
                <button
                  onClick={onGoBack}
                  disabled={!canGoBack}
                  className={`${navButtonClasses} ${
                    canGoBack ? 'text-slate-300 hover:bg-zinc-800' : 'text-slate-600 cursor-not-allowed'
                  }`}
                  aria-label="Back"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>

                <button
                  onClick={onGoForward}
                  disabled={!canGoForward}
                  className={`${navButtonClasses} ${
                    canGoForward ? 'text-slate-300 hover:bg-zinc-800' : 'text-slate-600 cursor-not-allowed'
                  }`}
                  aria-label="Forward"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Center */}
            <div className="hidden lg:flex flex-1 justify-center items-center px-4">
              {!userRole && (
                <div className="flex items-center gap-2">
                  <button onClick={() => onNavigate(AppView.SUBSCRIPTION_PLANS)} className={navLinkClasses}>
                    Plans
                  </button>
                  <button onClick={() => onNavigate(AppView.STOODIO_LIST)} className={navLinkClasses}>
                    Find Stoodioz
                  </button>
                  <button onClick={() => onNavigate(AppView.ENGINEER_LIST)} className={navLinkClasses}>
                    Find Engineers
                  </button>
                  <button onClick={() => onNavigate(AppView.PRODUCER_LIST)} className={navLinkClasses}>
                    Find Producers
                  </button>
                  <button onClick={() => onNavigate(AppView.ARTIST_LIST)} className={navLinkClasses}>
                    Find Artists
                  </button>
                </div>
              )}
            </div>

            {/* Right: Desktop actions */}
            <div className="hidden lg:flex items-center justify-end flex-1 gap-3">
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
              {userRole ? (
                <div className="flex items-center space-x-1">
                  {/* ✅ ADDED: Top Talent (Leaderboard) */}
                  <button
                    onClick={() => onNavigate(AppView.LEADERBOARD)}
                    className={`${navLinkClasses} flex items-center gap-1.5`}
                    title="Top Talent"
                  >
                    <ChartBarIcon className="w-5 h-5" />
                    <span>Top Talent</span>
                  </button>

                  {/* Role tabs */}
                  {userRole !== UserRole.LABEL ? (
                    <>
                      <button onClick={() => onNavigate(AppView.THE_STAGE)} className={navLinkClasses} title="Stage">
                        Stage
                      </button>
                      <button onClick={() => onNavigate(AppView.MAP_VIEW)} className={navLinkClasses} title="Map">
                        Map
                      </button>
                    </>
                  ) : (
                    <>
                      {/* ✅ Only ONE Dashboard entry for labels: use the standard dashboard button below */}
                      <button onClick={() => onNavigate(AppView.LABEL_SCOUTING)} className={navLinkClasses} title="Scouting">
                        Scouting
                      </button>
                      <button onClick={() => onNavigate(AppView.LABEL_IMPORT)} className={navLinkClasses} title="Roster">
                        Roster
                      </button>
                    </>
                  )}

                  {/* Label-only actions */}
                  {userRole === UserRole.LABEL && (
                    <>
                      <button
                        onClick={() => onNavigate(AppView.ASSET_VAULT)}
                        className={`${navLinkClasses} flex items-center gap-1.5`}
                        title="Vault"
                      >
                        <BriefcaseIcon className="w-5 h-5" />
                        <span>Vault</span>
                      </button>

                      <button
                        onClick={() => onNavigate(AppView.MASTER_CALENDAR)}
                        className={`${navLinkClasses} flex items-center gap-1.5`}
                        title="Calendar"
                      >
                        <CalendarIcon className="w-5 h-5" />
                        <span>Calendar</span>
                      </button>
                    </>
                  )}

                  <button onClick={handleViewProfile} className={`${navLinkClasses} flex items-center gap-1.5`}>
                    <EyeIcon className="w-5 h-5" />
                    <span>Profile</span>
                  </button>

                  {/* ✅ Single dashboard button for all roles (labels included) */}
                  <button onClick={handleDashboardNavigate} className={`${navLinkClasses} flex items-center gap-1.5`}>
                    <UserCircleIcon className="w-5 h-5" />
                    <span>Dashboard</span>
                  </button>

                  <div
                    ref={panelRef}
                    className="border-l border-zinc-700 ml-2 pl-2 flex items-center gap-1 flex-shrink-0 relative"
                  >
                    <button
                      onClick={() => onNavigate(AppView.INBOX)}
                      className={`${navLinkClasses} flex items-center`}
                      aria-label="Inbox"
                    >
                      <InboxIcon className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => setIsPanelOpen((prev) => !prev)}
                      className={`${navLinkClasses} relative`}
                      aria-label="Notifications"
                    >
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

                    <button
                      onClick={handleLogoutClick}
                      className={`${navLinkClasses} flex items-center gap-1.5`}
                      aria-label="Logout"
                    >
                      <LogoutIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate(AppView.LOGIN)}
                    className="text-slate-300 hover:text-orange-400 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => onNavigate(AppView.CHOOSE_PROFILE)}
                    className="bg-orange-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-orange-600 transition-all text-sm shadow-md"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center flex-1 gap-2">
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
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-slate-300 hover:text-orange-400"
                aria-label="Open menu"
              >
                <BentoIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[320px] max-w-[85vw] bg-zinc-950 border-l border-zinc-800 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-16 border-b border-zinc-800">
              <span className="text-slate-100 font-bold">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-300 hover:text-orange-400"
                aria-label="Close menu"
                title="Close"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-3 flex flex-col gap-2 overflow-y-auto">
              {!userRole ? (
                <>
                  <button
                    onClick={() => navAndCloseMobile(AppView.SUBSCRIPTION_PLANS)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-zinc-900 text-slate-200"
                  >
                    Plans
                  </button>
                  <button
                    onClick={() => navAndCloseMobile(AppView.STOODIO_LIST)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-slate-200"
                  >
                    Find Stoodioz
                  </button>
                  <button
                    onClick={() => navAndCloseMobile(AppView.ENGINEER_LIST)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-slate-200"
                  >
                    Find Engineers
                  </button>
                  <button
                    onClick={() => navAndCloseMobile(AppView.PRODUCER_LIST)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-slate-200"
                  >
                    Find Producers
                  </button>
                  <button
                    onClick={() => navAndCloseMobile(AppView.ARTIST_LIST)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-slate-200"
                  >
                    Find Artists
                  </button>

                  <div className="h-px bg-zinc-800 my-2" />

                  <button
                    onClick={() => navAndCloseMobile(AppView.LOGIN)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-slate-200"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navAndCloseMobile(AppView.CHOOSE_PROFILE)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                  >
                    Get Started
                  </button>
                </>
              ) : (
                <>
                  {/* ✅ ADDED: Top Talent (Leaderboard) */}
                  <button
                    onClick={() => navAndCloseMobile(AppView.LEADERBOARD)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-slate-200"
                  >
                    Top Talent
                  </button>

                  {userRole !== UserRole.LABEL ? (
                    <>
                      <button
                        onClick={() => navAndCloseMobile(AppView.THE_STAGE)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-slate-200"
                      >
                        The Stage
                      </button>
                      <button
                        onClick={() => navAndCloseMobile(AppView.MAP_VIEW)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-slate-200"
                      >
                        Map
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => navAndCloseMobile(AppView.LABEL_DASHBOARD)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-slate-200"
                      >
                        Label Dashboard
                      </button>
                      <button
                        onClick={() => navAndCloseMobile(AppView.LABEL_SCOUTING)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-slate-200"
                      >
                        Scouting
                      </button>
                      <button
                        onClick={() => navAndCloseMobile(AppView.LABEL_IMPORT)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-slate-200"
                      >
                        Roster
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => navAndCloseMobile(AppView.INBOX)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-slate-200"
                  >
                    Inbox
                  </button>

                  {/* Label-only actions */}
                  {userRole === UserRole.LABEL && (
                    <>
                      <button
                        onClick={() => navAndCloseMobile(AppView.ASSET_VAULT)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-slate-200"
                      >
                        Vault
                      </button>
                      <button
                        onClick={() => navAndCloseMobile(AppView.MASTER_CALENDAR)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-slate-200"
                      >
                        Calendar
                      </button>
                    </>
                  )}

                  <button
                    onClick={handleViewProfile}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-slate-200"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleDashboardNavigate}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-slate-200"
                  >
                    Dashboard
                  </button>

                  <div className="h-px bg-zinc-800 my-2" />

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogoutClick();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-slate-200 flex items-center gap-2"
                  >
                    <LogoutIcon className="w-5 h-5" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
