import React, { useEffect, lazy, Suspense, useCallback, useRef } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Booking, Label } from './types';
import { AppView, UserRole } from './types';
import { useAppState, useAppDispatch, ActionTypes } from './contexts/AppContext.tsx';

// Import Custom Hooks
import { useNavigation } from './hooks/useNavigation.ts';
import { useAuth } from './hooks/useAuth.ts';
import { useBookings } from './hooks/useBookings.ts';
import { useSocial } from './hooks/useSocial.ts';
import { useSession } from './hooks/useSession.ts';
import { useMessaging } from './hooks/useMessaging.ts';
import { useAria } from './hooks/useAria.ts';
import { useProfile } from './hooks/useProfile.ts';
import { useVibeMatcher } from './hooks/useVibeMatcher.ts';
import { useMixing } from './hooks/useMixing.ts';
import { useSubscription } from './hooks/useSubscription.ts';
import { useMasterclass } from './hooks/useMasterclass.ts';
import { useRealtimeLocation } from './hooks/useRealtimeLocation.ts';

import { getSupabase } from './lib/supabase.ts';
import * as apiService from './services/apiService.ts';
import { getAriaNudge } from './services/geminiService.ts';
import { ARIA_EMAIL } from './constants.ts';

import appIcon from './assets/stoodioz-app-icon.png';
import Header from './components/Header.tsx';
import BookingModal from './components/BookingModal.tsx';
import TipModal from './components/TipModal.tsx';
import NotificationToasts from './components/NotificationToasts.tsx';
import VibeMatcherModal from './components/VibeMatcherModal.tsx';
import BookingCancellationModal from './components/BookingCancellationModal.tsx';
import AddFundsModal from './components/AddFundsModal.tsx';
import RequestPayoutModal from './components/RequestPayoutModal.tsx';
import MixingRequestModal from './components/MixingRequestModal.tsx';
import AriaNudge from './components/AriaNudge.tsx';
import AriaFAB from './components/AriaFAB.tsx';
import Footer from './components/Footer.tsx';

// --- Lazy Loaded Components ---
const StoodioList = lazy(() => import('./components/StoodioList.tsx'));
const StoodioDetail = lazy(() => import('./components/StoodioDetail.tsx'));
const BookingConfirmation = lazy(() => import('./components/BookingConfirmation.tsx'));
const MyBookings = lazy(() => import('./components/MyBookings.tsx'));
const StoodioDashboard = lazy(() => import('./components/StoodioDashboard.tsx'));
const EngineerDashboard = lazy(() => import('./components/EngineerDashboard.tsx'));
const ProducerDashboard = lazy(() => import('./components/ProducerDashboard.tsx'));
const Inbox = lazy(() => import('./components/Inbox.tsx'));
const ActiveSession = lazy(() => import('./components/ActiveSession.tsx'));
const ArtistList = lazy(() => import('./components/ArtistList.tsx'));
const ArtistProfile = lazy(() => import('./components/ArtistProfile.tsx'));
const ArtistDashboard = lazy(() => import('./components/ArtistDashboard.tsx'));
const EngineerList = lazy(() => import('./components/EngineerList.tsx'));
const EngineerProfile = lazy(() => import('./components/EngineerProfile.tsx'));
const ProducerList = lazy(() => import('./components/ProducerList.tsx'));
const ProducerProfile = lazy(() => import('./components/ProducerProfile.tsx'));
const MapView = lazy(() => import('./components/MapView.tsx'));
const LandingPage = lazy(() => import('./components/LandingPage.tsx'));
const ChooseProfile = lazy(() => import('./components/ChooseProfile.tsx'));
const ArtistSetup = lazy(() => import('./components/ArtistSetup.tsx'));
const EngineerSetup = lazy(() => import('./components/EngineerSetup.tsx'));
const ProducerSetup = lazy(() => import('./components/ProducerSetup.tsx'));
const StoodioSetup = lazy(() => import('./components/StoodioSetup.tsx'));
const LabelSetup = lazy(() => import('./components/LabelSetup.tsx'));
const LabelDashboard = lazy(() => import('./components/LabelDashboard.tsx'));
const LabelScouting = lazy(() => import('./components/LabelScouting.tsx'));
const LabelRosterImport = lazy(() => import('./components/LabelRosterImport.tsx'));
const LabelProfile = lazy(() => import('./components/LabelProfile.tsx'));
const ClaimProfile = lazy(() => import('./components/ClaimProfile.tsx'));
const ClaimEntryScreen = lazy(() => import('./components/ClaimEntryScreen.tsx'));
const ClaimConfirmScreen = lazy(() => import('./components/ClaimConfirmScreen.tsx'));
const ClaimLabelProfile = lazy(() => import('./components/ClaimLabelProfile.tsx'));
const Login = lazy(() => import('./components/Login.tsx'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy.tsx'));
const TheStage = lazy(() => import('./components/TheStage.tsx'));
const VibeMatcherResults = lazy(() => import('./components/VibeMatcherResults.tsx'));
const SubscriptionPlans = lazy(() => import('./components/SubscriptionPlans.tsx'));
const AriaCantataAssistant = lazy(() => import('./components/AriaAssistant.tsx'));
const AdminRankings = lazy(() => import('./components/AdminRankings.tsx'));
const StoodioInsights = lazy(() => import('./components/StoodioInsights.tsx'));
const Leaderboard = lazy(() => import('./components/Leaderboard.tsx'));
const AssetVault = lazy(() => import('./components/AssetVault.tsx'));
const MasterCalendar = lazy(() => import('./components/MasterCalendar.tsx'));
const ReviewPage = lazy(() => import('./components/ReviewPage.tsx'));

const LoadingSpinner: React.FC<{ currentUser: any }> = ({ currentUser }) => {
  if (currentUser && (currentUser as any).animated_logo_url) {
    return (
      <div className="flex flex-col justify-center items-center py-20 min-h-[200px]">
        <img src={(currentUser as any).animated_logo_url as string} alt="Loading..." className="h-24 w-auto" />
        <p className="mt-3 text-zinc-400 text-sm">Loading...</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col justify-center items-center py-20 min-h-[200px]">
      <img src={appIcon} alt="Loading" className="h-16 w-16 animate-spin" />
      <p className="mt-3 text-zinc-400 text-sm">Loading...</p>
    </div>
  );
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode; onRecover: () => void }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('View crashed:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto p-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
          <h2 className="text-2xl font-bold text-slate-100">This page crashed</h2>
          <p className="text-slate-300 mt-2">I recovered the app so you can keep working.</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onRecover();
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600"
          >
            Go Back
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
const AccessDenied: React.FC<{ onNavigate: (view: AppView) => void; message?: string }> = ({ onNavigate, message }) => (
  <div className="max-w-xl mx-auto p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
    <h2 className="text-2xl font-bold text-slate-100">Access Restricted</h2>
    <p className="text-slate-300 mt-2">{message || 'This area is not available for your account type.'}</p>
    <button
      type="button"
      onClick={() => onNavigate(AppView.THE_STAGE)}
      className="mt-4 px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600"
    >
      Back to Stage
    </button>
  </div>
);


const App: React.FC = () => {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const {
    history,
    historyIndex,
    currentUser,
    userRole,
    loginError,
    selectedEngineer,
    selectedProducer,
    isLoading,
    bookingTime,
    tipModalBooking,
    bookingToCancel,
    isVibeMatcherOpen,
    isVibeMatcherLoading,
    isAddFundsOpen,
    isPayoutOpen,
    isMixingModalOpen,
    isAriaCantataOpen,
    ariaNudge,
    isNudgeVisible,
    notifications,
    ariaHistory,
    initialAriaCantataPrompt,
    bookingIntent,
    bookings,
    engineers,
  } = state;

  const currentView = history[historyIndex];
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  // never strand authenticated users on public views (LOGIN, LANDING, CHOOSE)
  // never redirect away from profile/detail views – same fix as landing flicker
  useEffect(() => {
    const profileAndDetailViews = [
      AppView.ARTIST_PROFILE,
      AppView.ENGINEER_PROFILE,
      AppView.PRODUCER_PROFILE,
      AppView.STOODIO_DETAIL,
      AppView.LABEL_PROFILE,
      AppView.REVIEW_PAGE,
    ];
    if (profileAndDetailViews.includes(currentView)) return;

    const isPublic =
      currentView === AppView.LOGIN ||
      currentView === AppView.LANDING_PAGE ||
      currentView === AppView.CHOOSE_PROFILE;

    if (!isPublic) return;

    if (currentUser && userRole) {
      if (isLoadingRef.current) {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
      }
      const landing = userRole === UserRole.LABEL ? AppView.LABEL_DASHBOARD : AppView.THE_STAGE;
      dispatch({ type: ActionTypes.NAVIGATE, payload: { view: landing } });
    }
  }, [currentView, currentUser, userRole, dispatch]);

  // If not authenticated, only allow public views (don't kick guests off profiles/lists)
  useEffect(() => {
    if (isLoadingRef.current) return;
    if (currentUser || userRole) return;
    const isPublic =
      currentView === AppView.LOGIN ||
      currentView === AppView.LANDING_PAGE ||
      currentView === AppView.CHOOSE_PROFILE ||
      currentView === AppView.ARTIST_SETUP ||
      currentView === AppView.ENGINEER_SETUP ||
      currentView === AppView.PRODUCER_SETUP ||
      currentView === AppView.STOODIO_SETUP ||
      currentView === AppView.LABEL_SETUP ||
      currentView === AppView.PRIVACY_POLICY ||
      currentView === AppView.SUBSCRIPTION_PLANS ||
      currentView === AppView.STOODIO_LIST ||
      currentView === AppView.ARTIST_LIST ||
      currentView === AppView.ENGINEER_LIST ||
      currentView === AppView.PRODUCER_LIST ||
      currentView === AppView.MAP_VIEW ||
      currentView === AppView.STOODIO_DETAIL ||
      currentView === AppView.ARTIST_PROFILE ||
      currentView === AppView.ENGINEER_PROFILE ||
      currentView === AppView.PRODUCER_PROFILE ||
      currentView === AppView.LABEL_PROFILE ||
      currentView === AppView.REVIEW_PAGE ||
      currentView === AppView.CLAIM_ENTRY ||
      currentView === AppView.INBOX;
    if (!isPublic) {
      dispatch({ type: ActionTypes.NAVIGATE, payload: { view: AppView.LANDING_PAGE } });
    }
  }, [currentUser, userRole, currentView, dispatch]);

  // Claim link: /?claim=TOKEN or ?token=TOKEN -> go to Claim Entry
  useEffect(() => {
    const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (q?.get('claim') || q?.get('token')) {
      dispatch({ type: ActionTypes.NAVIGATE, payload: { view: AppView.CLAIM_ENTRY } });
    }
  }, [dispatch]);

  // --- Guards to prevent loops / double work ---
  const hydrateInFlightRef = useRef<Promise<UserRole | null> | null>(null);
  const lastHydratedUserIdRef = useRef<string | null>(null);
  const didBootstrapRef = useRef(false);
  const didLoadDirectoryRef = useRef(false);
  const currentUserRef = useRef(currentUser);
  const userRoleRef = useRef(userRole);
  const currentViewRef = useRef(currentView);
  const isLoadingRef = useRef(isLoading);
  const hydrateUserRef = useRef<((uid: string) => Promise<UserRole | null>) | null>(null);
  currentUserRef.current = currentUser;
  userRoleRef.current = userRole;
  currentViewRef.current = currentView;
  isLoadingRef.current = isLoading;

  // Navigation hook (drives history)
        const {
    navigate,
    goBack,
    goForward,
    viewStoodioDetails,
    viewArtistProfile,
    viewEngineerProfile,
    viewProducerProfile,
    viewLabelProfile,
    navigateToStudio,
    startNavigationForBooking,
  } = useNavigation();

  const dashboardForRole = (role?: UserRole | null) => {
    if (!role) return AppView.THE_STAGE;
    if (role === UserRole.STOODIO) return AppView.STOODIO_DASHBOARD;
    if (role === UserRole.ENGINEER) return AppView.ENGINEER_DASHBOARD;
    if (role === UserRole.PRODUCER) return AppView.PRODUCER_DASHBOARD;
    if (role === UserRole.ARTIST) return AppView.ARTIST_DASHBOARD;
    if (role === UserRole.LABEL) return AppView.LABEL_DASHBOARD;
    return AppView.THE_STAGE;
  };

  // Stripe success: beat_purchase or kit_purchase -> fetch booking, auto-download/open, clean URL, go to MY_BOOKINGS
  useEffect(() => {
    const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (!q || q.get('stripe') !== 'success') return;
    const beatPurchase = q.get('beat_purchase') === '1';
    const kitPurchase = q.get('kit_purchase') === '1';
    const bookingId = q.get('booking_id');
    if ((!beatPurchase && !kitPurchase) || !bookingId) return;

    (async () => {
      try {
        const b = await apiService.fetchBookingById(bookingId);
        if (!b) return;

        if (beatPurchase) {
          const list = b.instrumentals_purchased || [];
          const type = b.beat_purchase_type || 'lease_mp3';
          for (const it of list) {
            let url: string | undefined;
            if (type === 'lease_mp3') url = it.audio_url;
            else if (type === 'lease_wav') url = it.wav_url;
            else url = it.wav_url;
            if (url) {
              const a = document.createElement('a');
              a.href = url;
              a.download = `${(it.title || 'beat').replace(/[^a-zA-Z0-9-_]/g, '_')}${type === 'lease_mp3' ? '.mp3' : '.wav'}`;
              a.rel = 'noopener';
              document.body.appendChild(a);
              a.click();
              a.remove();
            }
            if (type === 'exclusive' && it.stems_url) {
              setTimeout(() => {
                const s = document.createElement('a');
                s.href = it.stems_url!;
                s.download = `${(it.title || 'stems').replace(/[^a-zA-Z0-9-_]/g, '_')}.zip`;
                s.rel = 'noopener';
                document.body.appendChild(s);
                s.click();
                s.remove();
              }, 500);
            }
          }
        }

        if (kitPurchase && b.product_purchase) {
          const { delivery_type, delivery_value } = b.product_purchase;
          if (delivery_type === 'link' && delivery_value) window.open(delivery_value, '_blank', 'noopener');
          else if (delivery_type === 'file' && delivery_value) {
            const a = document.createElement('a');
            a.href = delivery_value;
            a.download = 'download';
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            a.remove();
          }
        }

        const u = new URL(window.location.href);
        u.searchParams.delete('stripe');
        u.searchParams.delete('beat_purchase');
        u.searchParams.delete('kit_purchase');
        u.searchParams.delete('booking_id');
        window.history.replaceState({}, '', u.pathname + (u.search || ''));
        navigate(AppView.MY_BOOKINGS);
      } catch (e) {
        console.error('[Stripe success]', e);
      }
    })();
  }, [navigate]);

  // Stripe cancel or wallet top-up success: return to dashboard, clean URL, and refetch user so balance updates
  useEffect(() => {
    const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (!q) return;
    const stripeStatus = q.get('stripe');
    if (!stripeStatus) return;
    const beatPurchase = q.get('beat_purchase') === '1';
    const kitPurchase = q.get('kit_purchase') === '1';
    if (stripeStatus === 'success' && (beatPurchase || kitPurchase)) return;

    const u = new URL(window.location.href);
    const bookingIdFromUrl = q.get('booking_id');
    u.searchParams.delete('stripe');
    u.searchParams.delete('beat_purchase');
    u.searchParams.delete('kit_purchase');
    u.searchParams.delete('booking_id');
    window.history.replaceState({}, '', u.pathname + (u.search || ''));
    if (stripeStatus === 'success' && bookingIdFromUrl) {
      navigate(AppView.MY_BOOKINGS);
    } else {
      navigate(dashboardForRole(userRoleRef.current || userRole));
    }

    // Refetch current user so wallet_balance and wallet_transactions reflect after add funds.
    // Webhook can be delayed; refetch immediately and again after 2.5s and 5s so balance updates.
    if (stripeStatus === 'success') {
      const doRefetch = async () => {
        try {
          const supabase = getSupabase();
          const { data } = await supabase.auth.getSession();
          const uid = data?.session?.user?.id;
          if (uid && hydrateUserRef.current) await hydrateUserRef.current(uid);
        } catch (e) {
          console.warn('[App] Refetch after Stripe success failed:', e);
        }
      };
      doRefetch();
      const t1 = setTimeout(doRefetch, 2500);
      const t2 = setTimeout(doRefetch, 5000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [navigate, userRole]);

  // Auth hook (UI login/logout)
  const { login, logout, selectRoleToSetup } = useAuth(navigate);

  // Other hooks
  const { confirmBooking, confirmCancellation } = useBookings(navigate);
  const { createPost, likePost, commentOnPost, toggleFollow, markAsRead, markAllAsRead, dismissNotification } =
    useSocial();
  const { endSession, confirmTip, addFunds, requestPayout } = useSession(navigate);
  const { updateProfile } = useProfile();
  const { vibeMatch } = useVibeMatcher();
  const { confirmRemoteMix, initiateInStudioMix } = useMixing(navigate);
  const { handleSubscribe } = useSubscription(navigate);
  const { startConversation } = useMessaging(navigate);

  const startStripeConnect = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await apiService.createConnectOnboarding(currentUser.id);
      if (res?.url) {
        window.location.href = res.url;
      } else {
        alert('Unable to start Stripe onboarding. Please try again.');
      }
    } catch (e) {
      console.error('Stripe connect onboarding failed', e);
      alert('Stripe onboarding failed. Please try again.');
    }
  };

  // Aria
  const { executeCommand, handleAriaNudgeClick, handleDismissAriaNudge } = useAria({
    startConversation,
    navigate,
    viewStoodioDetails,
    viewEngineerProfile,
    viewProducerProfile,
    viewArtistProfile,
    navigateToStudio,
    confirmBooking,
    updateProfile,
    selectRoleToSetup,
    logout,
  });

  useRealtimeLocation({ currentUser });

  // ---------- CRITICAL: single-flight hydration ----------
  const hydrateUser = useCallback(
    async (userId: string): Promise<UserRole | null> => {
      if (!userId) return null;

      if (lastHydratedUserIdRef.current === userId) return (userRole as UserRole) || null;
      if (hydrateInFlightRef.current) return hydrateInFlightRef.current;

      hydrateInFlightRef.current = (async () => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

        try {
          const res = await apiService.fetchCurrentUserProfile(userId);

          if (!res) {
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
            lastHydratedUserIdRef.current = null;
            return null;
          }

          const role = res.role as UserRole;

          dispatch({
            type: ActionTypes.LOGIN_SUCCESS,
            payload: { user: res.user, role },
          });

          lastHydratedUserIdRef.current = userId;

          const viewNow = currentViewRef.current;
          const isPublic =
            viewNow === AppView.LANDING_PAGE ||
            viewNow === AppView.LOGIN ||
            viewNow === AppView.CHOOSE_PROFILE;

          if (isPublic) {
            const landing = role === UserRole.LABEL ? AppView.LABEL_DASHBOARD : AppView.THE_STAGE;
            dispatch({ type: ActionTypes.NAVIGATE, payload: { view: landing } });
          }

          dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
          return role;
        } catch (e) {
          console.error('[hydrateUser]', e);
          dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
          lastHydratedUserIdRef.current = null;
          return null;
        }
      })();

      try {
        return await hydrateInFlightRef.current;
      } finally {
        hydrateInFlightRef.current = null;
      }
    },
    [dispatch, currentView, userRole]
  );
  hydrateUserRef.current = hydrateUser;

  // ---------- Bootstrap + Auth Listener ----------
  useEffect(() => {
    let isMounted = true;

    if (typeof window !== 'undefined') {
      try {
        (window as any).supabase = getSupabase();
      } catch (e) {
        console.warn('[App] Supabase client unavailable:', e);
      }
    }

    // 1) Load public directory data (should NOT block login)
    console.log('[App] Loading public users directory...');
    // Expose cache clearing function to window for debugging
    if (typeof window !== 'undefined') {
      (window as any).clearUsersCache = () => {
        if (apiService.clearPublicUsersCache) {
          apiService.clearPublicUsersCache();
          console.log('[App] Cache cleared - refresh the page to reload users');
        }
      };
      (window as any).getAllPublicUsers = (forceRefresh = false) => {
        if (!apiService.getAllPublicUsers) {
          throw new Error('getAllPublicUsers is unavailable');
        }
        return apiService.getAllPublicUsers(forceRefresh);
      };
    }
    const loadDirectory = async () => {
      if (didLoadDirectoryRef.current) return;
      didLoadDirectoryRef.current = true;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/cc967317-43d1-4243-8dbd-a2cbfedc53fb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:loadDirectory',message:'loadDirectory started',data:{},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      try {
        let directory = await apiService.getAllPublicUsers(false);
        if (!isMounted) return;
        // #region agent log
        const dirCounts = { artists: directory.artists?.length ?? 0, engineers: directory.engineers?.length ?? 0, producers: directory.producers?.length ?? 0, stoodioz: directory.stoodioz?.length ?? 0, labels: directory.labels?.length ?? 0 };
        fetch('http://127.0.0.1:7242/ingest/cc967317-43d1-4243-8dbd-a2cbfedc53fb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:loadDirectory',message:'directory loaded',data:dirCounts,timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        let hasAnyData =
          (directory.artists?.length || 0) > 0 ||
          (directory.engineers?.length || 0) > 0 ||
          (directory.producers?.length || 0) > 0 ||
          (directory.stoodioz?.length || 0) > 0 ||
          (directory.labels?.length || 0) > 0;
        const stateHasAny =
          (state.artists?.length || 0) > 0 ||
          (state.engineers?.length || 0) > 0 ||
          (state.producers?.length || 0) > 0 ||
          (state.stoodioz?.length || 0) > 0 ||
          (state.labels?.length || 0) > 0;
        if (!hasAnyData && stateHasAny) {
          console.warn('[App] Directory empty; preserving existing lists.');
          return;
        }
        if (!hasAnyData) {
          const retry = await apiService.getAllPublicUsers(true);
          if (!isMounted) return;
          directory = retry;
          hasAnyData =
            (directory.artists?.length || 0) > 0 ||
            (directory.engineers?.length || 0) > 0 ||
            (directory.producers?.length || 0) > 0 ||
            (directory.stoodioz?.length || 0) > 0 ||
            (directory.labels?.length || 0) > 0;
        }
        console.log('[App] Loaded directory:', {
          artists: directory.artists?.length || 0,
          engineers: directory.engineers?.length || 0,
          producers: directory.producers?.length || 0,
          stoodioz: directory.stoodioz?.length || 0,
          labels: directory.labels?.length || 0,
        });
        // Normalize: never send undefined for directory arrays (avoids .slice/.length throws)
        dispatch({
          type: ActionTypes.SET_INITIAL_DATA,
          payload: {
            artists: directory.artists ?? [],
            engineers: directory.engineers ?? [],
            producers: directory.producers ?? [],
            stoodioz: directory.stoodioz ?? [],
            labels: directory.labels ?? [],
            reviews: [],
          },
        });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/cc967317-43d1-4243-8dbd-a2cbfedc53fb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:loadDirectory',message:'SET_INITIAL_DATA dispatched',data:dirCounts,timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
      } catch (e) {
        console.error('[App] Failed to load public users:', e);
        // Don't blow away existing directory lists on transient errors
        if (!isMounted) return;
        const stateHasAny =
          (state.artists?.length || 0) > 0 ||
          (state.engineers?.length || 0) > 0 ||
          (state.producers?.length || 0) > 0 ||
          (state.stoodioz?.length || 0) > 0 ||
          (state.labels?.length || 0) > 0;
        if (stateHasAny) return;
        if (isMounted) {
          dispatch({
            type: ActionTypes.SET_INITIAL_DATA,
            payload: {
              artists: [],
              engineers: [],
              producers: [],
              stoodioz: [],
              labels: [],
              reviews: [],
            },
          });
        }
      }
    };
    loadDirectory();
    const directoryRetry = setTimeout(() => {
      const hasAny =
        (state.artists?.length || 0) > 0 ||
        (state.engineers?.length || 0) > 0 ||
        (state.producers?.length || 0) > 0 ||
        (state.stoodioz?.length || 0) > 0 ||
        (state.labels?.length || 0) > 0;
      if (!hasAny) {
        didLoadDirectoryRef.current = false;
        loadDirectory();
      }
    }, 2000);

    // 2) Bootstrap session ONCE (but do not block login page)
    const bootstrap = async () => {
      if (didBootstrapRef.current) return;
      didBootstrapRef.current = true;

      try {
        const supabase = getSupabase();

        const { data } = await supabase.auth.getSession();
        const sessionUserId = data.session?.user?.id;

        if (sessionUserId) {
          // Only show loading if there is actually a session to hydrate
          if (hydrateUserRef.current) await hydrateUserRef.current(sessionUserId);
        } else {
          // No session -> make sure login isn't locked
          dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        }
      } catch (e) {
        console.error('[bootstrap]', e);
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
      }
    };

    bootstrap();

    // 3) Auth transitions
    let supabase;
    try {
      supabase = getSupabase();
    } catch (e) {
      console.error('[bootstrap] getSupabase for auth listener:', e);
      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
      return () => { isMounted = false; };
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_OUT') {
          // Reset guards
          lastHydratedUserIdRef.current = null;
          hydrateInFlightRef.current = null;
          didLoadDirectoryRef.current = false;

          dispatch({ type: ActionTypes.LOGOUT });
          dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
          dispatch({ type: ActionTypes.NAVIGATE, payload: { view: AppView.LANDING_PAGE } });
          loadDirectory();
          return;
        }

        const uid = session?.user?.id;
        if (!uid) return;

        // If app state already has this user + role, don't re-hydrate. Just clear any spinner.
        if (currentUserRef.current?.id === uid && userRoleRef.current) {
          dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
          return;
        }

        // If already hydrated for this user, ignore
        if (lastHydratedUserIdRef.current === uid) return;

        if (hydrateUserRef.current) await hydrateUserRef.current(uid);
      } catch (e) {
        console.error('[onAuthStateChange]', e);
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(directoryRetry);
      listener.subscription.unsubscribe();
    };
    // Intentionally run once on mount. Refs (currentUserRef, userRoleRef, hydrateUserRef) hold latest values for the auth listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // ---------- UI handlers ----------
  const closeBookingModal = () => dispatch({ type: ActionTypes.CLOSE_BOOKING_MODAL });
  const closeTipModal = () => dispatch({ type: ActionTypes.CLOSE_TIP_MODAL });
  const closeCancelModal = () => dispatch({ type: ActionTypes.CLOSE_CANCEL_MODAL });
  const closeVibeMatcher = () => dispatch({ type: ActionTypes.SET_VIBE_MATCHER_OPEN, payload: { isOpen: false } });
  const closeAddFundsModal = () => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: false } });
  const closePayoutModal = () => dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: false } });
  const closeMixingModal = () => dispatch({ type: ActionTypes.SET_MIXING_MODAL_OPEN, payload: { isOpen: false } });
  const closeAriaCantata = () => dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: false } });
  const toggleAriaCantata = () =>
    dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: !isAriaCantataOpen } });

  const handleOpenAriaFromFAB = () => {
    dispatch({ type: ActionTypes.SET_IS_NUDGE_VISIBLE, payload: { isVisible: false } });
    dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
  };

  useEffect(() => {
    if (!currentUser || !userRole) return;
    if ((currentUser as any).aria_tools_enabled === false) return;

    const now = Date.now();
    const last = Number(localStorage.getItem('aria_nudge_last') || 0);
    if (now - last < 15 * 60 * 1000) return;

    let isActive = true;
    (async () => {
      try {
        const nudge = await getAriaNudge(currentUser, userRole);
        if (!isActive || !nudge) return;
        dispatch({ type: ActionTypes.SET_ARIA_NUDGE, payload: { nudge } });
        dispatch({ type: ActionTypes.SET_IS_NUDGE_VISIBLE, payload: { isVisible: true } });
        localStorage.setItem('aria_nudge_last', String(Date.now()));
      } catch (e) {
        console.error('Failed to load Aria nudge', e);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [currentUser, userRole, dispatch]);

  const openTipModal = (booking: Booking) => dispatch({ type: ActionTypes.OPEN_TIP_MODAL, payload: { booking } });
  const openCancelModal = (booking: Booking) =>
    dispatch({ type: ActionTypes.OPEN_CANCEL_MODAL, payload: { booking } });

  const completeSetup = useCallback(
    async (userData: any, role: UserRole) => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

      try {
        let result = await apiService.createUser(userData, role);
        if (result) {
          // Auto-follow Aria forever on signup
          try {
            const ariaProfile = await apiService.fetchProfileByEmail(ARIA_EMAIL);
            if (ariaProfile?.id && result?.id && String(ariaProfile.id) !== String(result.id)) {
              await apiService.toggleFollow(result.id, ariaProfile.id);
              const defaults = { artists: [], engineers: [], producers: [], stoodioz: [], labels: [] };
              const existing = (result as any).following || defaults;
              const artists = Array.isArray(existing.artists) ? existing.artists : [];
              const nextFollowing = {
                ...defaults,
                ...existing,
                artists: artists.includes(ariaProfile.id) ? artists : [...artists, ariaProfile.id],
              };
              result = { ...result, following: nextFollowing };
            }
          } catch (e) {
            console.warn('[completeSetup] auto-follow Aria failed:', e);
          }

          dispatch({ type: ActionTypes.COMPLETE_SETUP, payload: { newUser: result as any, role } });
          const hasClaim = typeof window !== 'undefined' && (sessionStorage.getItem('pending_claim_token') || localStorage.getItem('pending_claim_token'));
          if (hasClaim) navigate(AppView.CLAIM_CONFIRM);
        }
      } catch (error: any) {
        alert(`Setup failed: ${error?.message || 'Unknown error'}`);
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
      }
    },
    [dispatch, navigate]
  );

  // ---------- Render ----------
  const renderView = () => {
    switch (currentView) {
      case AppView.LANDING_PAGE:
        if (currentUser && userRole) {
          return userRole === UserRole.LABEL ? (
            <LabelDashboard />
          ) : (
            <TheStage
              onPost={createPost}
              onLikePost={likePost}
              onCommentOnPost={commentOnPost}
              onToggleFollow={toggleFollow}
              onSelectArtist={viewArtistProfile}
              onSelectEngineer={viewEngineerProfile}
              onSelectStoodio={viewStoodioDetails}
              onSelectProducer={viewProducerProfile}
              onOpenAria={toggleAriaCantata}
              onNavigate={navigate}
            />
          );
        }
        return (
          <LandingPage
            onNavigate={navigate}
            onSelectStoodio={viewStoodioDetails}
            onSelectProducer={viewProducerProfile}
            onSelectArtist={viewArtistProfile}
            onSelectEngineer={viewEngineerProfile}
            onOpenAriaCantata={toggleAriaCantata}
            onLogout={logout}
          />
        );

      case AppView.LOGIN:
        return <Login onLogin={login} error={loginError} onNavigate={navigate} isLoading={isLoading} />;

      case AppView.CHOOSE_PROFILE:
        return <ChooseProfile onSelectRole={selectRoleToSetup} />;

      case AppView.ARTIST_SETUP:
        return (
          <ArtistSetup
            onCompleteSetup={(name, bio, email, password, imageUrl, imageFile) =>
              completeSetup({ name, bio, email, password, image_url: imageUrl, imageFile }, UserRole.ARTIST)
            }
            onNavigate={navigate}
            isLoading={isLoading}
          />
        );

      case AppView.ENGINEER_SETUP:
        return (
          <EngineerSetup
            onCompleteSetup={(name, bio, email, password, imageUrl, imageFile) =>
              completeSetup({ name, bio, email, password, image_url: imageUrl, imageFile }, UserRole.ENGINEER)
            }
            onNavigate={navigate}
            isLoading={isLoading}
          />
        );

      case AppView.PRODUCER_SETUP:
        return (
          <ProducerSetup
            onCompleteSetup={(name, bio, email, password, imageUrl, imageFile) =>
              completeSetup({ name, bio, email, password, image_url: imageUrl, imageFile }, UserRole.PRODUCER)
            }
            onNavigate={navigate}
            isLoading={isLoading}
          />
        );

      case AppView.STOODIO_SETUP:
        return (
          <StoodioSetup
            onCompleteSetup={(name, description, location, businessAddress, email, password, imageUrl, imageFile) =>
              completeSetup(
                { name, description, location, businessAddress, email, password, image_url: imageUrl, imageFile },
                UserRole.STOODIO
              )
            }
            onNavigate={navigate}
            isLoading={isLoading}
          />
        );

      case AppView.LABEL_SETUP:
        return <LabelSetup onCompleteSetup={(data) => completeSetup(data, UserRole.LABEL)} onNavigate={navigate} />;

      case AppView.PRIVACY_POLICY:
        return <PrivacyPolicy onBack={goBack} />;

      case AppView.SUBSCRIPTION_PLANS:
        return <SubscriptionPlans onSelect={selectRoleToSetup} onSubscribe={handleSubscribe} />;

      case AppView.STOODIO_LIST:
        return <StoodioList onSelectStoodio={viewStoodioDetails} />;

      case AppView.STOODIO_DETAIL:
        return <StoodioDetail />;

      case AppView.CONFIRMATION:
        return <BookingConfirmation onDone={() => navigate(AppView.MY_BOOKINGS)} />;

      case AppView.MY_BOOKINGS:
        return (
          <MyBookings
            bookings={bookings}
            engineers={engineers}
            onOpenTipModal={openTipModal}
            onNavigateToStudio={navigateToStudio}
            onOpenCancelModal={openCancelModal}
            onArtistNavigate={startNavigationForBooking}
            userRole={userRole}
          />
        );

      case AppView.INBOX:
        return <Inbox />;

      case AppView.MAP_VIEW:
        return (
          <MapView
            onSelectStoodio={viewStoodioDetails}
            onSelectEngineer={viewEngineerProfile}
            onSelectArtist={viewArtistProfile}
            onSelectProducer={viewProducerProfile}
            onSelectLabel={viewLabelProfile}
          />
        );

      case AppView.ARTIST_LIST:
        return <ArtistList onSelectArtist={viewArtistProfile} onToggleFollow={toggleFollow} />;

      case AppView.ARTIST_PROFILE:
        return <ArtistProfile />;

      case AppView.ENGINEER_LIST:
        return <EngineerList onSelectEngineer={viewEngineerProfile} onToggleFollow={toggleFollow} />;

      case AppView.ENGINEER_PROFILE:
        return <EngineerProfile />;

      case AppView.PRODUCER_LIST:
        return <ProducerList onSelectProducer={viewProducerProfile} onToggleFollow={toggleFollow} />;

      case AppView.PRODUCER_PROFILE:
        return <ProducerProfile />;

      case AppView.THE_STAGE:
        return (
          <TheStage
            onPost={createPost}
            onLikePost={likePost}
            onCommentOnPost={commentOnPost}
            onToggleFollow={toggleFollow}
            onSelectArtist={viewArtistProfile}
            onSelectEngineer={viewEngineerProfile}
            onSelectStoodio={viewStoodioDetails}
            onSelectProducer={viewProducerProfile}
            onOpenAria={toggleAriaCantata}
            onNavigate={navigate}
          />
        );

      case AppView.VIBE_MATCHER_RESULTS:
        return (
          <VibeMatcherResults
            onSelectStoodio={viewStoodioDetails}
            onSelectEngineer={viewEngineerProfile}
            onSelectProducer={viewProducerProfile}
            onBack={() => navigate(AppView.ARTIST_DASHBOARD)}
          />
        );

      case AppView.ARTIST_DASHBOARD:
        return <ArtistDashboard />;

      case AppView.STOODIO_DASHBOARD:
        return <StoodioDashboard />;

      case AppView.ENGINEER_DASHBOARD:
        return <EngineerDashboard />;

      case AppView.PRODUCER_DASHBOARD:
        return <ProducerDashboard />;

      case AppView.LABEL_DASHBOARD:
        return <LabelDashboard />;

      case AppView.LABEL_SCOUTING:
        return <LabelScouting onNavigate={navigate} />;

      case AppView.LABEL_IMPORT:
        return <LabelRosterImport />;

      case AppView.LABEL_PROFILE:
        return <LabelProfile />;

      case AppView.REVIEW_PAGE:
        return <ReviewPage />;

      case AppView.CLAIM_PROFILE:
        return <ClaimProfile />;

      case AppView.CLAIM_ENTRY:
        return <ClaimEntryScreen token={''} />;

      case AppView.CLAIM_CONFIRM:
        return <ClaimConfirmScreen />;

      case AppView.CLAIM_LABEL_PROFILE:
        return <ClaimLabelProfile onNavigate={navigate} />;

      case AppView.ACTIVE_SESSION:
        return <ActiveSession onEndSession={endSession} onSelectArtist={viewArtistProfile} />;

      case AppView.ADMIN_RANKINGS:
        return <AdminRankings />;

      case AppView.STUDIO_INSIGHTS:
  return <StoodioInsights />;


      case AppView.LEADERBOARD:
        return <Leaderboard />;

      case AppView.ASSET_VAULT:
        if (userRole !== UserRole.LABEL) return <AccessDenied onNavigate={navigate} message="The Vault is available to labels only." />;
        return <AssetVault />;

      case AppView.MASTER_CALENDAR:
        if (userRole !== UserRole.LABEL) return <AccessDenied onNavigate={navigate} message="The Master Calendar is available to labels only." />;
        return <MasterCalendar />;

      default:
        if (userRole) {
          return userRole === UserRole.LABEL ? (
            <LabelDashboard />
          ) : (
            <TheStage
              onPost={createPost}
              onLikePost={likePost}
              onCommentOnPost={commentOnPost}
              onToggleFollow={toggleFollow}
              onSelectArtist={viewArtistProfile}
              onSelectEngineer={viewEngineerProfile}
              onSelectStoodio={viewStoodioDetails}
              onSelectProducer={viewProducerProfile}
              onOpenAria={toggleAriaCantata}
              onNavigate={navigate}
            />
          );
        }

        return (
          <LandingPage
            onNavigate={navigate}
            onSelectStoodio={viewStoodioDetails}
            onSelectProducer={viewProducerProfile}
            onSelectArtist={viewArtistProfile}
            onSelectEngineer={viewEngineerProfile}
            onOpenAriaCantata={toggleAriaCantata}
            onLogout={logout}
          />
        );
    }
  };

  return (
    <div className="bg-zinc-950 text-slate-200 min-h-screen font-sans flex flex-col">
      <Header
        onNavigate={navigate}
        onGoBack={goBack}
        onGoForward={goForward}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onLogout={logout}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onSelectArtist={viewArtistProfile}
        onSelectEngineer={viewEngineerProfile}
        onSelectProducer={viewProducerProfile}
        onSelectStoodio={viewStoodioDetails}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <ErrorBoundary
          onRecover={() =>
            dispatch({
              type: ActionTypes.NAVIGATE,
              payload: { view: userRole ? AppView.THE_STAGE : AppView.LANDING_PAGE },
            })
          }
        >
          <Suspense fallback={<LoadingSpinner currentUser={currentUser} />}>{renderView()}</Suspense>
        </ErrorBoundary>
      </main>

      {bookingTime && <BookingModal onClose={closeBookingModal} onConfirm={confirmBooking} />}
      {tipModalBooking && <TipModal booking={tipModalBooking} onClose={closeTipModal} onConfirmTip={confirmTip} />}
      {isVibeMatcherOpen && <VibeMatcherModal onClose={closeVibeMatcher} onAnalyze={vibeMatch} isLoading={isVibeMatcherLoading} />}
      {bookingToCancel && <BookingCancellationModal booking={bookingToCancel} onClose={closeCancelModal} onConfirm={confirmCancellation} />}
      {isAddFundsOpen && <AddFundsModal onClose={closeAddFundsModal} onConfirm={addFunds} />}
      {isPayoutOpen && currentUser && (
        <RequestPayoutModal
          onClose={closePayoutModal}
          onConfirm={requestPayout}
          onConnect={startStripeConnect}
          currentBalance={(currentUser as any).wallet_balance ?? 0}
          hasConnect={Boolean((currentUser as any).stripe_connect_account_id || (currentUser as any).stripe_connect_id)}
          payoutsEnabled={(currentUser as any).payouts_enabled !== false}
        />
      )}

      {isMixingModalOpen && (selectedEngineer || (bookingIntent && bookingIntent.engineer)) && (
        <MixingRequestModal
          engineer={(selectedEngineer || bookingIntent!.engineer!) as any}
          onClose={closeMixingModal}
          onConfirm={confirmRemoteMix}
          onInitiateInStudio={initiateInStudioMix}
          isLoading={isLoading}
        />
      )}

      <NotificationToasts notifications={notifications} onDismiss={dismissNotification} />

      {isAriaCantataOpen && (
        <Suspense fallback={<div />}>
          <AriaCantataAssistant
            isOpen={isAriaCantataOpen}
            onClose={() => dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: false } })}
            onExecuteCommand={executeCommand}
            history={ariaHistory}
            setHistory={(newHistory) => dispatch({ type: ActionTypes.SET_ARIA_HISTORY, payload: { history: newHistory } })}
            initialPrompt={initialAriaCantataPrompt}
            clearInitialPrompt={() => dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: null } })}
          />
        </Suspense>
      )}

      {currentUser && !isAriaCantataOpen && <AriaFAB onClick={handleOpenAriaFromFAB} />}
      {isNudgeVisible && ariaNudge && <AriaNudge nudge={ariaNudge} onDismiss={handleDismissAriaNudge} onClick={handleAriaNudgeClick} />}

      <Footer onNavigate={navigate} />
    </div>
  );
};

export default App;
