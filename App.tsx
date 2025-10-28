
import React, { useEffect, lazy, Suspense } from 'react';
// FIX: All type imports are now correct due to the restored `types.ts` file.
import type { VibeMatchResult, Artist, Engineer, Stoodio, Producer, Booking, AriaCantataMessage } from './types';
import { AppView, UserRole, VerificationStatus, SmokingPolicy, TransactionCategory, TransactionStatus } from './types';
import { getAriaNudge } from './services/geminiService';
import * as apiService from './services/apiService';
import { useAppState, useAppDispatch, ActionTypes } from './contexts/AppContext';

// Import Custom Hooks
import { useNavigation } from './hooks/useNavigation';
import { useAuth } from './hooks/useAuth';
import { useBookings } from './hooks/useBookings';
import { useSocial } from './hooks/useSocial';
import { useSession } from './hooks/useSession';
import { useMessaging } from './hooks/useMessaging';
import { useAria } from './hooks/useAria';
import { useProfile } from './hooks/useProfile';
import { useVibeMatcher } from './hooks/useVibeMatcher';
import { useMixing } from './hooks/useMixing';
import { useSubscription } from './hooks/useSubscription';

import Header from './components/Header';
import BookingModal from './components/BookingModal';
import TipModal from './components/TipModal';
import NotificationToasts from './components/NotificationToasts';
import VibeMatcherModal from './components/VibeMatcherModal';
import BookingCancellationModal from './components/BookingCancellationModal';
import AddFundsModal from './components/AddFundsModal';
import RequestPayoutModal from './components/RequestPayoutModal';
import MixingRequestModal from './components/MixingRequestModal';
import { MagicWandIcon } from './components/icons';
import AriaNudge from './components/AriaNudge';
import DevNotificationButton from './components/DevNotificationButton';

// --- Lazy Loaded Components ---
const StoodioList = lazy(() => import('./components/StudioList'));
const StoodioDetail = lazy(() => import('./components/StudioDetail'));
const BookingConfirmation = lazy(() => import('./components/BookingConfirmation'));
const MyBookings = lazy(() => import('./components/MyBookings'));
const StoodioDashboard = lazy(() => import('./components/StoodioDashboard'));
const EngineerDashboard = lazy(() => import('./components/EngineerDashboard'));
const ProducerDashboard = lazy(() => import('./components/ProducerDashboard'));
const Inbox = lazy(() => import('./components/Inbox'));
const ActiveSession = lazy(() => import('./components/ActiveSession'));
const ArtistList = lazy(() => import('./components/ArtistList'));
const ArtistProfile = lazy(() => import('./components/ArtistProfile'));
const ArtistDashboard = lazy(() => import('./components/ArtistDashboard'));
const EngineerList = lazy(() => import('./components/EngineerList'));
const EngineerProfile = lazy(() => import('./components/EngineerProfile'));
const ProducerList = lazy(() => import('./components/ProducerList'));
const ProducerProfile = lazy(() => import('./components/ProducerProfile'));
const MapView = lazy(() => import('./components/MapView'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const ChooseProfile = lazy(() => import('./components/ChooseProfile'));
const ArtistSetup = lazy(() => import('./components/ArtistSetup'));
const EngineerSetup = lazy(() => import('./components/EngineerSetup'));
const ProducerSetup = lazy(() => import('./components/ProducerSetup'));
const StoodioSetup = lazy(() => import('./components/StoodioSetup'));
const Login = lazy(() => import('./components/Login'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TheStage = lazy(() => import('./components/TheStage'));
const VibeMatcherResults = lazy(() => import('./components/VibeMatcherResults'));
const SubscriptionPlans = lazy(() => import('./components/SubscriptionPlans'));
const AriaCantataAssistant = lazy(() => import('./components/AriaAssistant'));
// FIX: The import for Leaderboard was truncated, causing a syntax error.
const Leaderboard = lazy(() => import('./components/Leaderboard'));

const App: React.FC = () => {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const {
    history,
    historyIndex,
    currentUser,
    userRole,
    loginError,
    notifications,
    tipModalBooking,
    bookingToCancel,
    isVibeMatcherOpen,
    isVibeMatcherLoading,
    isAddFundsOpen,
    isPayoutOpen,
    isMixingModalOpen,
    isAriaCantataOpen,
    ariaHistory,
    initialAriaCantataPrompt,
    ariaNudge,
    isNudgeVisible,
  } = state;

  const currentView = history[historyIndex];

  // Hooks
  const { navigate, goBack, goForward, viewStoodioDetails, viewArtistProfile, viewEngineerProfile, viewProducerProfile, navigateToStudio } = useNavigation();
  const { login, logout, selectRoleToSetup, completeSetup } = useAuth(navigate);
  const { confirmBooking, confirmCancellation } = useBookings(navigate);
  const { toggleFollow, createPost, likePost, commentOnPost, markAsRead, markAllAsRead, dismissNotification } = useSocial();
  const { startSession, endSession, confirmTip, addFunds, requestPayout } = useSession(navigate);
  const { startConversation } = useMessaging(navigate);
  const { vibeMatch } = useVibeMatcher();
  const { confirmRemoteMix, initiateInStudioMix } = useMixing(navigate);
  const { handleSubscribe } = useSubscription(navigate);
  const { updateProfile } = useProfile();
   const { 
      handleAriaCantataBooking, 
      handleShowVibeResults, 
      handleAriaGroupConversation,
      handleAriaSendMessage,
      handleAriaSendDocument,
      handleAriaNavigation,
      handleAriaGetDirections,
      handleAriaNudgeClick,
      handleDismissAriaNudge,
  } = useAria(
      startConversation,
      navigate,
      viewStoodioDetails,
      viewEngineerProfile,
      viewProducerProfile,
      viewArtistProfile,
      navigateToStudio,
      confirmBooking
  );

  // Effect to get initial nudge
  useEffect(() => {
    if (currentUser && userRole) {
        getAriaNudge(currentUser, userRole).then(nudge => {
            if (nudge) {
                dispatch({ type: ActionTypes.SET_ARIA_NUDGE, payload: { nudge } });
                setTimeout(() => dispatch({ type: ActionTypes.SET_IS_NUDGE_VISIBLE, payload: { isVisible: true } }), 2000);
            }
        });
    }
  }, [currentUser, userRole, dispatch]);
  
  const renderView = () => {
    switch (currentView) {
        case AppView.LANDING_PAGE: return <LandingPage onNavigate={navigate} onSelectStoodio={viewStoodioDetails} onSelectEngineer={viewEngineerProfile} onSelectProducer={viewProducerProfile} onOpenAriaCantata={() => dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } })} />;
        case AppView.LOGIN: return <Login onLogin={login} error={loginError} onNavigate={navigate} />;
        case AppView.CHOOSE_PROFILE: return <ChooseProfile onSelectRole={selectRoleToSetup} />;
        case AppView.ARTIST_SETUP: return <ArtistSetup onCompleteSetup={(name, bio, email, password) => completeSetup({ name, bio, email, password }, UserRole.ARTIST)} onNavigate={navigate} />;
        case AppView.ENGINEER_SETUP: return <EngineerSetup onCompleteSetup={(name, bio, email, password) => completeSetup({ name, bio, email, password }, UserRole.ENGINEER)} onNavigate={navigate} />;
        case AppView.PRODUCER_SETUP: return <ProducerSetup onCompleteSetup={(name, bio, email, password) => completeSetup({ name, bio, email, password }, UserRole.PRODUCER)} onNavigate={navigate} />;
        case AppView.STOODIO_SETUP: return <StoodioSetup onCompleteSetup={(name, description, location, businessAddress, email, password) => completeSetup({ name, description, location, businessAddress, email, password }, UserRole.STOODIO)} onNavigate={navigate} />;
        case AppView.PRIVACY_POLICY: return <PrivacyPolicy onBack={goBack} />;
        case AppView.SUBSCRIPTION_PLANS: return <SubscriptionPlans onSelect={selectRoleToSetup} onSubscribe={handleSubscribe} />;
        case AppView.STOODIO_LIST: return <StoodioList onSelectStoodio={viewStoodioDetails} />;
        case AppView.STOODIO_DETAIL: return <StoodioDetail />;
        case AppView.CONFIRMATION: return <BookingConfirmation onDone={() => navigate(AppView.MY_BOOKINGS)} />;
        case AppView.MY_BOOKINGS: return <MyBookings />;
        case AppView.INBOX: return <Inbox />;
        case AppView.ACTIVE_SESSION: return <ActiveSession onEndSession={endSession} onSelectArtist={viewArtistProfile} />;
        case AppView.ARTIST_LIST: return <ArtistList onSelectArtist={viewArtistProfile} onToggleFollow={toggleFollow} />;
        case AppView.ARTIST_PROFILE: return <ArtistProfile />;
        case AppView.ENGINEER_LIST: return <EngineerList onSelectEngineer={viewEngineerProfile} onToggleFollow={toggleFollow} />;
        case AppView.ENGINEER_PROFILE: return <EngineerProfile />;
        case AppView.PRODUCER_LIST: return <ProducerList onSelectProducer={viewProducerProfile} onToggleFollow={toggleFollow} />;
        case AppView.PRODUCER_PROFILE: return <ProducerProfile />;
        case AppView.MAP_VIEW: return <MapView onSelectStoodio={viewStoodioDetails} onSelectEngineer={viewEngineerProfile} onSelectArtist={viewArtistProfile} onSelectProducer={viewProducerProfile} onInitiateBooking={() => {}} />;
        case AppView.THE_STAGE: return <TheStage onPost={createPost} onLikePost={likePost} onCommentOnPost={commentOnPost} onToggleFollow={toggleFollow} onSelectStoodio={viewStoodioDetails} onSelectEngineer={viewEngineerProfile} onSelectArtist={viewArtistProfile} onSelectProducer={viewProducerProfile} onNavigate={navigate} />;
        case AppView.VIBE_MATCHER_RESULTS: return <VibeMatcherResults onSelectStoodio={viewStoodioDetails} onSelectEngineer={viewEngineerProfile} onSelectProducer={viewProducerProfile} onBack={() => navigate(AppView.ARTIST_DASHBOARD)} />;
        case AppView.ARTIST_DASHBOARD: return <ArtistDashboard />;
        case AppView.STOODIO_DASHBOARD: return <StoodioDashboard onNavigate={navigate} />;
        case AppView.ENGINEER_DASHBOARD: return <EngineerDashboard />;
        case AppView.PRODUCER_DASHBOARD: return <ProducerDashboard />;
        case AppView.LEADERBOARD: return <Leaderboard />;
        default: return <LandingPage onNavigate={navigate} onSelectStoodio={viewStoodioDetails} onSelectEngineer={viewEngineerProfile} onSelectProducer={viewProducerProfile} onOpenAriaCantata={() => dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } })} />;
    }
  };

  const setAriaHistory = (history: AriaCantataMessage[]) => dispatch({ type: ActionTypes.SET_ARIA_HISTORY, payload: { history } });
  const clearInitialAriaPrompt = () => dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: null } });

  return (
    <>
      <div className="bg-zinc-950 text-zinc-200 font-sans min-h-screen">
        <Header 
          onNavigate={navigate}
          onGoBack={goBack}
          onGoForward={goForward}
          canGoBack={historyIndex > 0}
          canGoForward={historyIndex < history.length - 1}
          onLogout={logout}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onSelectArtist={viewArtistProfile}
          onSelectEngineer={viewEngineerProfile}
          onSelectProducer={viewProducerProfile}
          onSelectStoodio={viewStoodioDetails}
        />
        <main className="main-container py-8">
            <Suspense fallback={<div className="text-center p-12">Loading...</div>}>
                {renderView()}
            </Suspense>
        </main>
      </div>

      {state.bookingTime && (
          <Suspense>
              <BookingModal onClose={() => dispatch({ type: ActionTypes.OPEN_BOOKING_MODAL, payload: { date: '', time: '', room: null as any } })} onConfirm={confirmBooking} />
          </Suspense>
      )}

      {tipModalBooking && (
        <TipModal booking={tipModalBooking} onClose={() => dispatch({ type: ActionTypes.CLOSE_TIP_MODAL })} onConfirmTip={confirmTip} />
      )}

      {bookingToCancel && (
        <BookingCancellationModal booking={bookingToCancel} onClose={() => dispatch({ type: ActionTypes.CLOSE_CANCEL_MODAL })} onConfirm={confirmCancellation} />
      )}

      <NotificationToasts notifications={notifications.filter(n => !n.read)} onDismiss={dismissNotification} />

      {isVibeMatcherOpen && (
          <VibeMatcherModal
              onClose={() => dispatch({ type: ActionTypes.SET_VIBE_MATCHER_OPEN, payload: { isOpen: false } })}
              onAnalyze={vibeMatch}
              isLoading={isVibeMatcherLoading}
          />
      )}
      
      {isAddFundsOpen && (
        <AddFundsModal onClose={() => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: false } })} onConfirm={addFunds} />
      )}

      {isPayoutOpen && currentUser && (
        <RequestPayoutModal 
          onClose={() => dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: false } })} 
          onConfirm={requestPayout}
          currentBalance={currentUser.walletBalance}
        />
      )}

      {isMixingModalOpen && state.selectedEngineer && (
          <MixingRequestModal
              engineer={state.selectedEngineer}
              onClose={() => dispatch({ type: ActionTypes.SET_MIXING_MODAL_OPEN, payload: { isOpen: false } })}
              onConfirm={confirmRemoteMix}
              onInitiateInStudio={(engineer, mixingDetails) => {
                  dispatch({ type: ActionTypes.SET_BOOKING_INTENT, payload: { intent: { engineer, mixingDetails } } });
                  dispatch({ type: ActionTypes.SET_MIXING_MODAL_OPEN, payload: { isOpen: false } });
                  navigate(AppView.STOODIO_LIST);
              }}
              isLoading={state.isLoading}
          />
      )}

      {isNudgeVisible && ariaNudge && (
          <AriaNudge
              message={ariaNudge}
              onClick={handleAriaNudgeClick}
              onDismiss={handleDismissAriaNudge}
          />
      )}
      
      {isAriaCantataOpen && (
          <AriaCantataAssistant
              isOpen={isAriaCantataOpen}
              onClose={() => dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: false } })}
              onStartConversation={startConversation}
              onStartGroupConversation={handleAriaGroupConversation}
              onUpdateProfile={updateProfile}
              onBookStudio={handleAriaCantataBooking}
              onShowVibeMatchResults={handleShowVibeResults}
              onNavigateRequest={handleAriaNavigation}
              onStartSetupRequest={(role) => {
                selectRoleToSetup(role);
                dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: false } });
              }}
              onSendMessageRequest={(recipientName, messageText) => handleAriaSendMessage(recipientName, messageText, currentUser)}
              onSendDocument={handleAriaSendDocument}
              onGetDirectionsRequest={handleAriaGetDirections}
              history={ariaHistory}
              setHistory={setAriaHistory}
              initialPrompt={initialAriaCantataPrompt}
              clearInitialPrompt={clearInitialAriaPrompt}
          />
      )}

      {/* For development only, to test notifications */}
      <DevNotificationButton />
    </>
  );
};

export default App;
