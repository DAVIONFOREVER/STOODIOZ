import React, { useEffect, lazy, Suspense, useCallback, useRef, useState } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Booking, Label } from './types';
import { AppView, UserRole, NotificationType } from './types';
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

import { getSupabase, getSupabaseReachable, getSupabaseReachableForStripe, setRealtimeAuth } from './lib/supabase.ts';
import { ingest } from './utils/backgroundLogger.ts';
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
const SecretGame = lazy(() => import('./components/SecretGame.tsx'));

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
    walletBalanceFromPoll,
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
    if (stripeReturnInProgressRef.current) return;
    if (typeof window !== 'undefined' && sessionStorage.getItem('stripe_return_in_progress')) return;
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
      currentView === AppView.INBOX ||
      currentView === AppView.SECRET_GAME;
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

  // Clean Add Funds return params when they appear without stripe=success (e.g. main window at ?popup=1&amount=500).
  // Prevents black/stuck landing when Stripe redirects to success URL that drops stripe=success.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    const hasPopup = q.get('popup') === '1';
    const hasAmount = q.has('amount');
    if (!hasPopup && !hasAmount) return;
    // If we're the popup, the stripe effect handles postMessage and close; don't clean here.
    if (window.opener) return;
    const u = new URL(window.location.href);
    u.searchParams.delete('popup');
    u.searchParams.delete('amount');
    if (u.search !== window.location.search) {
      window.history.replaceState({}, '', u.pathname + (u.search || ''));
    }
  }, []);

  // User pressed Back from Stripe (or returned without completing): no stripe=success/cancel in URL but we have add_funds_return. Restore dashboard immediately so they don't see landing, timeout, or wrong view.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    if (q.get('stripe')) return; // Stripe success/cancel effect handles that
    const raw = sessionStorage.getItem('add_funds_return');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { view?: string; returnTab?: string | null };
      if (!parsed?.view) return;
      const returnView = parsed.view as AppView;
      sessionStorage.removeItem('add_funds_return');
      sessionStorage.removeItem('stripe_return_view');
      sessionStorage.removeItem('stripe_return_pending');
      sessionStorage.removeItem('stripe_return_profile_id');
      if (returnView === AppView.LABEL_DASHBOARD && parsed.returnTab) {
        sessionStorage.setItem('label_dashboard_return_tab', parsed.returnTab);
      }
      if (returnView === AppView.ARTIST_DASHBOARD || returnView === AppView.ENGINEER_DASHBOARD || returnView === AppView.PRODUCER_DASHBOARD || returnView === AppView.STOODIO_DASHBOARD) {
        dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: 'wallet' } });
      }
      dispatch({ type: ActionTypes.NAVIGATE, payload: { view: returnView } });
      // Leave stripe_return_in_progress so "redirect to landing if not authenticated" keeps skipping until hydrate completes
    } catch (_) {}
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
  const lastHydrateAttemptUserIdRef = useRef<string | null>(null);
  const stripeReturnInProgressRef = useRef(false);
  const stripeWalletPollRef = useRef<{ cancelled: boolean; interval?: ReturnType<typeof setInterval>; timer?: ReturnType<typeof setTimeout> }>({ cancelled: false });
  const [showSupabaseUnreachableBanner, setShowSupabaseUnreachableBanner] = useState(false);
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
        u.searchParams.delete('popup');
        u.searchParams.delete('amount');
        window.history.replaceState({}, '', u.pathname + (u.search || ''));
        navigate(AppView.MY_BOOKINGS);
      } catch (e) {
        console.error('[Stripe success]', e);
      }
    })();
  }, [navigate]);

  // Stripe cancel or wallet top-up success: restore return context (e.g. booking flow) or return to dashboard; clean URL and refetch user.
  useEffect(() => {
    const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (!q) return;
    const stripeStatus = q.get('stripe');
    if (!stripeStatus) return;

    // Add funds popup: we are the popup; tell opener and close so main window stays on dashboard and can refetch.
    if (typeof window !== 'undefined' && window.opener && stripeStatus === 'success' && q.get('popup') === '1') {
      const amount = parseFloat(q.get('amount') || '0') || 0;
      try {
        window.opener.postMessage({ type: 'STRIPE_POPUP_SUCCESS', amount: amount || undefined }, window.location.origin);
      } catch (_) {}
      window.close();
      return;
    }

    const beatPurchase = q.get('beat_purchase') === '1';
    const kitPurchase = q.get('kit_purchase') === '1';
    if (stripeStatus === 'success' && (beatPurchase || kitPurchase)) return;
    stripeReturnInProgressRef.current = true;
    try {
      sessionStorage.setItem('stripe_return_in_progress', '1');
    } catch (_) {}

    const u = new URL(window.location.href);
    const bookingIdFromUrl = q.get('booking_id');
    u.searchParams.delete('stripe');
    u.searchParams.delete('beat_purchase');
    u.searchParams.delete('kit_purchase');
    u.searchParams.delete('booking_id');
    u.searchParams.delete('popup');
    u.searchParams.delete('amount');
    window.history.replaceState({}, '', u.pathname + (u.search || ''));
    if (stripeStatus === 'success' && bookingIdFromUrl) {
      (async () => {
        try {
          const b = await apiService.fetchBookingById(bookingIdFromUrl);
          if (b) {
            dispatch({ type: ActionTypes.SET_LATEST_BOOKING, payload: { booking: b } });
            dispatch({ type: ActionTypes.ADD_BOOKING, payload: { booking: b } });
            navigate(AppView.CONFIRMATION);
            const studioName = b.stoodio?.name;
            const bookingPrompt = studioName
              ? `I just booked a session at ${studioName}!`
              : 'I just booked a session!';
            dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: bookingPrompt } });
            dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
          } else {
            navigate(AppView.MY_BOOKINGS);
          }
        } catch (e) {
          console.error('[App] Post-booking fetch failed', e);
          navigate(AppView.MY_BOOKINGS);
        }
      })();
    } else if (stripeStatus === 'success') {
      // Wallet top-up: restore previous view and booking modal if we saved return context before redirect.
      let restored = false;
      try {
        const raw = sessionStorage.getItem('add_funds_return');
        if (raw) {
          const parsed = JSON.parse(raw) as {
            view?: string;
            selectedStoodioId?: string | null;
            bookingTime?: { date: string; time: string; room: { id: string; name: string; description?: string; hourly_rate: number; photos: string[]; smoking_policy: string } } | null;
            returnTab?: string | null;
          };
          sessionStorage.removeItem('add_funds_return');
          if (parsed?.view) {
            const returnView = parsed.view as AppView;
            // Fresh load (no user yet): reload so hydrate runs with clean URL; we'll navigate after hydrate.
            if (!state.currentUser) {
              try {
                sessionStorage.setItem('stripe_return_view', returnView);
                sessionStorage.setItem('stripe_return_pending', '1');
                if (returnView === AppView.LABEL_DASHBOARD && parsed.returnTab) {
                  sessionStorage.setItem('label_dashboard_return_tab', parsed.returnTab);
                }
              } catch (_) {}
              window.location.reload();
              return;
            }
            if (returnView === AppView.LABEL_DASHBOARD && parsed.returnTab) {
              try {
                sessionStorage.setItem('label_dashboard_return_tab', parsed.returnTab);
              } catch (_) {}
            }
            if (returnView === AppView.STOODIO_DETAIL && parsed.selectedStoodioId && state.stoodioz?.length) {
              const stoodio = state.stoodioz.find((s: any) => (s.id || (s as any).profile_id) === parsed.selectedStoodioId);
              if (stoodio) {
                dispatch({ type: ActionTypes.VIEW_STOODIO_DETAILS, payload: { stoodio } });
              }
            }
            // Land on wallet/financials tab so user sees balance immediately
            if (
              returnView === AppView.ARTIST_DASHBOARD ||
              returnView === AppView.ENGINEER_DASHBOARD ||
              returnView === AppView.PRODUCER_DASHBOARD ||
              returnView === AppView.STOODIO_DASHBOARD
            ) {
              dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: 'wallet' } });
            }
            navigate(returnView);
            restored = true;
            if (parsed.bookingTime?.date && parsed.bookingTime?.time && parsed.bookingTime?.room) {
              dispatch({ type: ActionTypes.OPEN_BOOKING_MODAL, payload: parsed.bookingTime });
            }
            const myId = (state.currentUser as any)?.profile_id ?? state.currentUser?.id;
            if (myId) {
              dispatch({
                type: ActionTypes.ADD_NOTIFICATION,
                payload: {
                  notification: {
                    id: `add-funds-${Date.now()}`,
                    recipient_id: myId,
                    type: NotificationType.SCHEDULE_REMINDER,
                    message: parsed.bookingTime
                      ? 'Payment successful. Your booking form is open — tap "Request Session" to complete your session.'
                      : 'Payment successful. Your balance will update shortly—refresh the page if it doesn’t.',
                    read: false,
                    timestamp: new Date().toISOString(),
                  },
                },
              });
            } else {
              try {
                sessionStorage.setItem('add_funds_notification_pending', JSON.stringify({
                  hasBooking: Boolean(parsed?.bookingTime?.date && parsed?.bookingTime?.room),
                }));
              } catch (_) {}
            }
          }
        }
      } catch (_) {}
      if (!restored) navigate(dashboardForRole(userRoleRef.current || userRole));
    } else if (stripeStatus === 'cancel') {
      // Payment cancelled or failed (e.g. card declined): restore stoodio + booking modal so user can try again.
      try {
        const raw = sessionStorage.getItem('add_funds_return');
        if (raw) {
          const parsed = JSON.parse(raw) as {
            view?: string;
            selectedStoodioId?: string | null;
            bookingTime?: { date: string; time: string; room: { id: string; name: string; description?: string; hourly_rate: number; photos: string[]; smoking_policy: string } } | null;
          };
          sessionStorage.removeItem('add_funds_return');
          if (parsed?.view) {
            const returnView = parsed.view as AppView;
            if (returnView === AppView.STOODIO_DETAIL && parsed.selectedStoodioId && state.stoodioz?.length) {
              const stoodio = state.stoodioz.find((s: any) => (s.id || (s as any).profile_id) === parsed.selectedStoodioId);
              if (stoodio) {
                dispatch({ type: ActionTypes.VIEW_STOODIO_DETAILS, payload: { stoodio } });
              }
            }
            navigate(returnView);
            if (parsed.bookingTime?.date && parsed.bookingTime?.time && parsed.bookingTime?.room) {
              dispatch({ type: ActionTypes.OPEN_BOOKING_MODAL, payload: parsed.bookingTime });
            }
            const myId = (state.currentUser as any)?.profile_id ?? state.currentUser?.id;
            if (myId) {
              dispatch({
                type: ActionTypes.ADD_NOTIFICATION,
                payload: {
                  notification: {
                    id: `add-funds-cancel-${Date.now()}`,
                    recipient_id: myId,
                    type: NotificationType.SCHEDULE_REMINDER,
                    message: 'Payment was cancelled or failed. Add funds and try again to complete your booking.',
                    read: false,
                    timestamp: new Date().toISOString(),
                  },
                },
              });
            }
          }
        } else {
          navigate(dashboardForRole(userRoleRef.current || userRole));
        }
      } catch (_) {
        navigate(dashboardForRole(userRoleRef.current || userRole));
      }
    } else {
      navigate(dashboardForRole(userRoleRef.current || userRole));
    }

    // Refetch current user so wallet_balance and wallet_transactions reflect after add funds.
    // Webhook can be delayed; refetch immediately and again so balance updates.
    // Keep stripeReturnInProgressRef true until hydrate succeeds or give-up (30s) so timeouts don't send user to landing.
    const STRIPE_RETURN_GUARD_MS = 30000;
    const clearRefTimer = setTimeout(() => {
      stripeReturnInProgressRef.current = false;
      try {
        sessionStorage.removeItem('stripe_return_in_progress');
      } catch (_) {}
    }, STRIPE_RETURN_GUARD_MS);

    if (stripeStatus === 'success') {
      const supabase = getSupabase();
      const doRefetch = async () => {
        try {
          const { data } = await supabase.auth.getSession();
          const uid = data?.session?.user?.id;
          if (uid && hydrateUserRef.current) {
            const role = await hydrateUserRef.current(uid);
            if (role) {
              stripeReturnInProgressRef.current = false;
              try {
                sessionStorage.removeItem('stripe_return_in_progress');
              } catch (_) {}
            }
          }
        } catch (e) {
          console.warn('[App] Refetch after Stripe success failed:', e);
        }
      };
      doRefetch();
      const t1 = setTimeout(doRefetch, 2500);
      const t2 = setTimeout(doRefetch, 5000);
      const t3 = setTimeout(doRefetch, 10000);
      const t4 = setTimeout(doRefetch, 15000);
      const t5 = setTimeout(doRefetch, 20000);

      // Wallet poll: lightweight balance-only fetch (60s timeout), poll 2min so cold DB can respond. Show balance via walletBalanceFromPoll when hydrate times out.
      const pollRef = stripeWalletPollRef;
      pollRef.current = { cancelled: false };
      const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const storedProfileId =
        (typeof window !== 'undefined' ? sessionStorage.getItem('stripe_return_profile_id') : null) ?? q?.get('profile_id') ?? null;
      const WALLET_POLL_INTERVAL_MS = 5000;
      const WALLET_POLL_DURATION_MS = 120000;
      const startWalletPoll = (uid: string | null) => {
        if (pollRef.current.cancelled || !uid) return;
        let firstAttempt = true;
        const tryWallet = async () => {
          if (pollRef.current.cancelled) return;
          const timeoutMs = firstAttempt ? 90_000 : undefined;
          if (firstAttempt) firstAttempt = false;
          const balance = await apiService.fetchWalletBalanceOnly(uid, timeoutMs ? { timeoutMs } : undefined);
          if (pollRef.current.cancelled) return;
          if (balance != null) {
            dispatch({ type: ActionTypes.SET_WALLET_BALANCE_FROM_POLL, payload: { balance } });
            const cur = (state.currentUser as any) || {};
            if (cur.id || cur.profile_id) {
              dispatch({
                type: ActionTypes.SET_CURRENT_USER,
                payload: { user: { ...cur, wallet_balance: balance } },
              });
            }
          }
        };
        tryWallet();
        pollRef.current.interval = setInterval(tryWallet, WALLET_POLL_INTERVAL_MS);
        pollRef.current.timer = setTimeout(() => {
          if (pollRef.current.interval) clearInterval(pollRef.current.interval);
        }, WALLET_POLL_DURATION_MS);
      };
      // Start immediately if we have profile id from redirect; otherwise wait for session (max 8s).
      const uidFromStored = storedProfileId ?? (state.currentUser as any)?.profile_id ?? state.currentUser?.id ?? null;
      if (uidFromStored) {
        startWalletPoll(uidFromStored);
      } else {
        const SESSION_WAIT_MS = 8000;
        Promise.race([
          supabase.auth.getSession().then((d) => d?.data?.session?.user?.id ?? null),
          new Promise<null>((r) => setTimeout(() => r(null), SESSION_WAIT_MS)),
        ]).then((sessionUid) => {
          if (pollRef.current.cancelled) return;
          const uid = sessionUid ?? storedProfileId ?? null;
          startWalletPoll(uid);
        });
      }

      return () => {
        clearTimeout(clearRefTimer);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
        pollRef.current.cancelled = true;
        if (pollRef.current.interval) clearInterval(pollRef.current.interval);
        if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
      };
    }
    return () => clearTimeout(clearRefTimer);
  }, [navigate, userRole, state.stoodioz, dispatch]);

  // Stripe return after RELOAD: URL no longer has stripe=success, so the effect above never runs. Start wallet poll from sessionStorage (or URL profile_id) so balance can show even when full hydrate times out.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('stripe')) return; // URL effect handles this
    const storedProfileId =
      sessionStorage.getItem('stripe_return_profile_id') || new URLSearchParams(window.location.search).get('profile_id');
    if (!storedProfileId) return;

    const pollRef = stripeWalletPollRef;
    if (pollRef.current.interval || pollRef.current.timer) return; // already running from URL stripe=success effect

    const WALLET_POLL_INTERVAL_MS = 5000;
    const WALLET_POLL_DURATION_MS = 120000;

    const startWalletPoll = (uid: string) => {
      if (pollRef.current.cancelled || !uid) return;
      let firstAttempt = true;
      const tryWallet = async () => {
        if (pollRef.current.cancelled) return;
        const timeoutMs = firstAttempt ? 90_000 : undefined;
        if (firstAttempt) firstAttempt = false;
        const balance = await apiService.fetchWalletBalanceOnly(uid, timeoutMs ? { timeoutMs } : undefined);
        if (pollRef.current.cancelled) return;
        if (balance != null) {
          dispatch({ type: ActionTypes.SET_WALLET_BALANCE_FROM_POLL, payload: { balance } });
          const cur = currentUserRef.current as any;
          if (cur?.id || cur?.profile_id) {
            dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: { user: { ...cur, wallet_balance: balance } } });
          } else {
            const minimal = await apiService.fetchMinimalProfileForStripeReturn(uid);
            if (minimal && !currentUserRef.current) {
              dispatch({
                type: ActionTypes.LOGIN_SUCCESS,
                payload: { user: { ...minimal.user, wallet_balance: balance }, role: minimal.role as UserRole },
              });
              const targetView = minimal.role === 'LABEL' ? AppView.LABEL_DASHBOARD : AppView.THE_STAGE;
              const saved = sessionStorage.getItem('stripe_return_view');
              const viewToShow = saved || targetView;
              if (viewToShow === AppView.ARTIST_DASHBOARD || viewToShow === AppView.ENGINEER_DASHBOARD || viewToShow === AppView.PRODUCER_DASHBOARD || viewToShow === AppView.STOODIO_DASHBOARD) {
                dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: 'wallet' } });
              }
              if (saved) {
                try {
                  sessionStorage.removeItem('stripe_return_view');
                  sessionStorage.removeItem('stripe_return_pending');
                  sessionStorage.removeItem('stripe_return_in_progress');
                  sessionStorage.removeItem('stripe_return_profile_id');
                } catch (_) {}
                dispatch({ type: ActionTypes.NAVIGATE, payload: { view: saved as AppView } });
              } else {
                dispatch({ type: ActionTypes.NAVIGATE, payload: { view: targetView } });
              }
            }
          }
        }
      };
      tryWallet();
      pollRef.current.interval = setInterval(tryWallet, WALLET_POLL_INTERVAL_MS);
      pollRef.current.timer = setTimeout(() => {
        if (pollRef.current.interval) clearInterval(pollRef.current.interval);
        try {
          sessionStorage.removeItem('stripe_return_in_progress');
          sessionStorage.removeItem('stripe_return_profile_id');
        } catch (_) {}
      }, WALLET_POLL_DURATION_MS);
    };

    pollRef.current = { cancelled: false };
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        setRealtimeAuth(data?.session?.access_token ?? null);
        startWalletPoll(storedProfileId);
      })
      .catch(() => startWalletPoll(storedProfileId));

    return () => {
      pollRef.current.cancelled = true;
      if (pollRef.current.interval) clearInterval(pollRef.current.interval);
      if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
    };
  }, [dispatch]);

  // When user loads after returning from Stripe add-funds, show "Funds added" notification if we couldn't earlier.
  useEffect(() => {
    const myId = (state.currentUser as any)?.profile_id ?? state.currentUser?.id;
    if (!myId) return;
    try {
      const raw = sessionStorage.getItem('add_funds_notification_pending');
      if (!raw) return;
      sessionStorage.removeItem('add_funds_notification_pending');
      const { hasBooking } = JSON.parse(raw) as { hasBooking?: boolean };
      dispatch({
        type: ActionTypes.ADD_NOTIFICATION,
        payload: {
          notification: {
            id: `add-funds-late-${Date.now()}`,
            recipient_id: myId,
            type: NotificationType.SCHEDULE_REMINDER,
            message: hasBooking
              ? 'You completed a payment. Your booking form is open — tap "Request Session" to complete your session.'
              : 'You completed a wallet top-up. If your balance doesn’t show the update, refresh the page or contact support.',
            read: false,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (_) {}
  }, [state.currentUser, dispatch]);

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
        lastHydrateAttemptUserIdRef.current = userId;
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

        const stripeReturn = typeof window !== 'undefined' && (sessionStorage.getItem('stripe_return_in_progress') || sessionStorage.getItem('stripe_return_pending'));
        const reachable = stripeReturn
          ? await getSupabaseReachableForStripe().catch(() => true)
          : await getSupabaseReachable().catch(() => true);
        if (!reachable) {
          dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
          setShowSupabaseUnreachableBanner(true);
          console.warn('[App hydrateUser] Supabase unreachable (health check failed); skipping profile fetch.');
          return null;
        }

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
            let targetView: AppView = role === UserRole.LABEL ? AppView.LABEL_DASHBOARD : AppView.THE_STAGE;
            try {
              const saved = typeof window !== 'undefined' && sessionStorage.getItem('stripe_return_view');
              if (saved) {
                sessionStorage.removeItem('stripe_return_view');
                sessionStorage.removeItem('stripe_return_pending');
                targetView = saved as AppView;
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/cc967317-43d1-4243-8dbd-a2cbfedc53fb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:hydrateUser-stripe-return',message:'Navigate to saved Stripe return view',data:{targetView},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
                // #endregion
              }
            } catch (_) {}
            dispatch({ type: ActionTypes.NAVIGATE, payload: { view: targetView } });
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
      ingest({location:'App.tsx:loadDirectory',message:'loadDirectory started',data:{},timestamp:Date.now(),hypothesisId:'H1'});
      // #endregion
      try {
        let directory = await apiService.getAllPublicUsers(false);
        if (!isMounted) return;
        // #region agent log
        const dirCounts = { artists: directory.artists?.length ?? 0, engineers: directory.engineers?.length ?? 0, producers: directory.producers?.length ?? 0, stoodioz: directory.stoodioz?.length ?? 0, labels: directory.labels?.length ?? 0 };
        ingest({location:'App.tsx:loadDirectory',message:'directory loaded',data:dirCounts,timestamp:Date.now(),hypothesisId:'H1'});
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
        ingest({location:'App.tsx:loadDirectory',message:'SET_INITIAL_DATA dispatched',data:dirCounts,timestamp:Date.now(),hypothesisId:'H4'});
        // #endregion
      } catch (e) {
        console.error('[App] Failed to load public users:', e);
        // Never overwrite directory with empty on error — leave state as-is so landing can retry or keep existing data
        didLoadDirectoryRef.current = false;
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

    // 2) Bootstrap session ONCE: getSession → set Realtime auth → then hydrate (Supabase recommendation)
    const bootstrap = async () => {
      if (didBootstrapRef.current) return;
      didBootstrapRef.current = true;

      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.getSession();
        setRealtimeAuth(data?.session?.access_token ?? null);

        const sessionUserId = data?.session?.user?.id;
        if (sessionUserId && hydrateUserRef.current) {
          await hydrateUserRef.current(sessionUserId);
          // User backed from Stripe: we restored view from add_funds_return; clear flag so app is no longer in "stripe return" mode
          if (typeof window !== 'undefined' && !new URLSearchParams(window.location.search).get('stripe')) {
            try {
              sessionStorage.removeItem('stripe_return_in_progress');
            } catch (_) {}
          }
        } else {
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
          lastHydratedUserIdRef.current = null;
          hydrateInFlightRef.current = null;
          didLoadDirectoryRef.current = false;
          stripeReturnInProgressRef.current = false;
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('stripe_return_in_progress');
              sessionStorage.removeItem('stripe_return_pending');
              sessionStorage.removeItem('stripe_return_view');
            }
          } catch (_) {}

          dispatch({ type: ActionTypes.LOGOUT });
          dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
          dispatch({ type: ActionTypes.NAVIGATE, payload: { view: AppView.LANDING_PAGE } });
          // Don't call loadDirectory() here: landing page will load directory when it mounts with empty lists.
          // Avoids slow getAllPublicUsers() and view timeouts right after logout.
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
        // User backed from Stripe: clear flag after hydrate so app is no longer in "stripe return" mode
        if (typeof window !== 'undefined' && !new URLSearchParams(window.location.search).get('stripe')) {
          try {
            sessionStorage.removeItem('stripe_return_in_progress');
          } catch (_) {}
        }
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

      // #region agent log
      ingest({location:'App.tsx:completeSetup',message:'signup_start',data:{hasPassword:Boolean(userData?.password),hasEmail:Boolean(userData?.email)},timestamp:Date.now(),hypothesisId:'H1'});
      // #endregion

      try {
        const email = (userData?.email ?? '').trim();
        const password = userData?.password;
        if (email && password) {
          const { getSupabase } = await import('./lib/supabase');
          const { data: signUpData, error: signUpError } = await getSupabase().auth.signUp({ email, password });
          if (signUpError) {
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
            alert(signUpError.message || 'Sign up failed. Try a different email or password.');
            return;
          }
          if (!signUpData?.user?.id) {
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
            alert('Account could not be created. Please try again.');
            return;
          }
          userData = { ...userData, _authUid: signUpData.user.id };
        }

        let result = await apiService.createUser(userData, role);
        // #region agent log
        const { getSupabase } = await import('./lib/supabase');
        const { data: sess } = await getSupabase().auth.getSession();
        ingest({location:'App.tsx:completeSetup',message:'signup_after_createUser',data:{hasResult:Boolean(result),profileId:result?.id,sessionExists:Boolean(sess?.session),uid:sess?.session?.user?.id},timestamp:Date.now(),hypothesisId:'H2'});
        // #endregion
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
        if (isLoading) {
          return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
              <div className="text-center">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mb-4" />
                <p className="text-zinc-400">Loading your account…</p>
              </div>
            </div>
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
            onCompleteSetup={(name, username, bio, email, password, imageUrl, imageFile) =>
              completeSetup({ name, username, bio, email, password, image_url: imageUrl, imageFile }, UserRole.ARTIST)
            }
            onNavigate={navigate}
            isLoading={isLoading}
          />
        );

      case AppView.ENGINEER_SETUP:
        return (
          <EngineerSetup
            onCompleteSetup={(name, username, bio, email, password, imageUrl, imageFile) =>
              completeSetup({ name, username, bio, email, password, image_url: imageUrl, imageFile }, UserRole.ENGINEER)
            }
            onNavigate={navigate}
            isLoading={isLoading}
          />
        );

      case AppView.PRODUCER_SETUP:
        return (
          <ProducerSetup
            onCompleteSetup={(name, username, bio, email, password, imageUrl, imageFile) =>
              completeSetup({ name, username, bio, email, password, image_url: imageUrl, imageFile }, UserRole.PRODUCER)
            }
            onNavigate={navigate}
            isLoading={isLoading}
          />
        );

      case AppView.STOODIO_SETUP:
        return (
          <StoodioSetup
            onCompleteSetup={(name, username, description, location, businessAddress, email, password, imageUrl, imageFile) =>
              completeSetup(
                { name, username, description, location, businessAddress, email, password, image_url: imageUrl, imageFile },
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
        return (
          <BookingConfirmation
            onDone={() => navigate(AppView.MY_BOOKINGS)}
            onNavigateToStudio={navigateToStudio}
            onViewStoodio={viewStoodioDetails}
          />
        );

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

      case AppView.SECRET_GAME:
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><img src={appIcon} alt="Loading" className="h-10 w-10 animate-spin" /></div>}>
            <SecretGame onExit={() => { if (canGoBack) goBack(); else navigate(AppView.THE_STAGE); }} />
          </Suspense>
        );

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
    <div className="bg-zinc-950 text-slate-200 min-h-[100dvh] font-sans flex flex-col min-w-0 h-[100dvh] max-h-[100dvh] overflow-x-hidden">
      {showSupabaseUnreachableBanner && (
        <div className="bg-amber-900/90 text-amber-100 border-b border-amber-700 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm">
            We can’t reach the database. If you use Supabase free tier, your project may be <strong>paused</strong>. Restore it at{' '}
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-medium">supabase.com/dashboard</a> → your project → <strong>Restore</strong>.
          </span>
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowSupabaseUnreachableBanner(false);
                const uid = lastHydrateAttemptUserIdRef.current;
                if (uid && hydrateUserRef.current) hydrateUserRef.current(uid);
              }}
              className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-amber-100 text-sm font-medium"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => setShowSupabaseUnreachableBanner(false)}
              className="px-3 py-1 rounded bg-amber-700 hover:bg-amber-600 text-amber-100 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
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

      <main className="scroll-main container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow min-h-0 min-w-0 w-full max-w-full">
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
          currentBalance={Number(walletBalanceFromPoll ?? (currentUser as any).wallet_balance ?? 0)}
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
