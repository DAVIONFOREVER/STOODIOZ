import React, { useEffect, lazy, Suspense } from 'react';
// FIX: All type imports are now correct due to the restored `types.ts` file.
import type { VibeMatchResult, Artist, Engineer, Stoodio, Producer, Booking, AriaCantataMessage, AriaActionResponse } from './types';
import { AppView, UserRole } from './types';
import { getAriaNudge } from './services/geminiService.ts';
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

import Header from './components/Header.tsx';
import BookingModal from './components/BookingModal.tsx';
import TipModal from './components/TipModal.tsx';
import NotificationToasts from './components/NotificationToasts.tsx';
import VibeMatcherModal from './components/VibeMatcherModal.tsx';
import BookingCancellationModal from './components/BookingCancellationModal.tsx';
import AddFundsModal from './components/AddFundsModal.tsx';
import RequestPayoutModal from './components/RequestPayoutModal.tsx';
import MixingRequestModal from './components/MixingRequestModal.tsx';
import { MagicWandIcon } from './components/icons.tsx';
import AriaNudge from './components/AriaNudge.tsx';
import AriaFAB from './components/AriaFAB.tsx';

// --- Lazy Loaded Components ---
const StoodioList = lazy(() => import('./components/StudioList.tsx'));
const StoodioDetail = lazy(() => import('./components/StudioDetail.tsx'));
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
const Login = lazy(() => import('./components/Login.tsx'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy.tsx'));
const TheStage = lazy(() => import('./components/TheStage.tsx'));
const VibeMatcherResults = lazy(() => import('./components/VibeMatcherResults.tsx'));
const SubscriptionPlans = lazy(() => import('./components/SubscriptionPlans.tsx'));
const AriaCantataAssistant = lazy(() => import('./components/AriaAssistant.tsx'));
const AdminRankings = lazy(() => import('./components/AdminRankings.tsx'));
const StudioInsights = lazy(() => import('./components/StudioInsights.tsx'));
const Leaderboard = lazy(() => import('./components/Leaderboard.tsx'));
const PurchaseMasterclassModal = lazy(() => import('./components/PurchaseMasterclassModal.tsx'));
const WatchMasterclassModal = lazy(() => import('./components/WatchMasterclassModal.tsx'));
const MasterclassReviewModal = lazy(() => import('./components/MasterclassReviewModal.tsx'));

const LoadingSpinner: React.FC<{ currentUser: Artist | Engineer | Stoodio | Producer | null }> = ({ currentUser }) => {
    // If the current user is a studio and has a custom animated logo, display it.
    if (currentUser && 'animatedLogoUrl' in currentUser && currentUser.animatedLogoUrl) {
        return (
            <div className="flex justify-center items-center py-20">
                {/* FIX: Cast animatedLogoUrl to string to resolve type error, as its existence is confirmed by the 'in' operator. */}
                <img src={currentUser.animatedLogoUrl as string} alt="Loading..." className="h-24 w-auto" />
            </div>
        );
    }

    // Default SVG spinner
    return (
        <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-10 w-10 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );
};

const App: React.FC = () => {
    const state = useAppState();
    const dispatch = useAppDispatch();
    const { 
        history, historyIndex, currentUser, userRole, loginError, selectedStoodio, selectedEngineer,
        latestBooking, isLoading, bookingTime, tipModalBooking, bookingToCancel, isVibeMatcherOpen, 
        isVibeMatcherLoading, isAddFundsOpen, isPayoutOpen, isMixingModalOpen, isAriaCantataOpen,
        ariaNudge, isNudgeVisible, notifications, ariaHistory, initialAriaCantataPrompt, selectedProducer, bookingIntent,
        masterclassToPurchase, masterclassToWatch, masterclassToReview, isAuthLoading
    } = state;

    // --- Derived State ---
    const currentView = history[historyIndex];
    const canGoBack = historyIndex > 0;
    const canGoForward = historyIndex < history.length - 1;
    
    // --- Custom Hooks for Logic ---
    const { navigate, goBack, goForward, viewStoodioDetails, viewArtistProfile, viewEngineerProfile, viewProducerProfile, navigateToStudio, viewBooking } = useNavigation();
    const { login, logout, selectRoleToSetup, completeSetup } = useAuth(navigate);
    const { openBookingModal, initiateBookingWithEngineer, initiateBookingWithProducer, confirmBooking, confirmCancellation } = useBookings(navigate);
    const { createPost, likePost, commentOnPost, toggleFollow, markAsRead, markAllAsRead, dismissNotification } = useSocial();
    const { startSession, endSession, confirmTip, addFunds, requestPayout } = useSession(navigate);
    const { updateProfile } = useProfile();
    const { vibeMatch } = useVibeMatcher();
    const { confirmRemoteMix, initiateInStudioMix } = useMixing(navigate);
    const { handleSubscribe } = useSubscription(navigate);
    // FIX: The `useMessaging` hook was imported but not called, causing `startConversation` to be undefined. This call initializes the hook and makes the function available.
    const { startConversation } = useMessaging(navigate);
    const { confirmMasterclassPurchase, submitMasterclassReview } = useMasterclass();
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
    });

    useEffect(() => {
        let timerId: number;
        // This effect runs when the user's ID or role changes. It prevents re-fetching a nudge on every minor profile update.
        if (currentUser && userRole) {
            getAriaNudge(currentUser, userRole).then(nudge => {
                // This check prevents the nudge from disappearing if the Gemini API returns an empty string, which would cause the render condition to fail.
                if (nudge && nudge.trim()) {
                    dispatch({ type: ActionTypes.SET_ARIA_NUDGE, payload: { nudge } });
                    timerId = window.setTimeout(() => dispatch({ type: ActionTypes.SET_IS_NUDGE_VISIBLE, payload: { isVisible: true } }), 2000);
                }
            });
        }
        
        // Cleanup function to clear the timeout if the component unmounts or dependencies change
        return () => {
            if (timerId) {
                clearTimeout(timerId);
            }
        };
    }, [currentUser, userRole, dispatch]);

    const closeBookingModal = () => dispatch({ type: ActionTypes.CLOSE_BOOKING_MODAL });
    const closeTipModal = () => dispatch({ type: ActionTypes.CLOSE_TIP_MODAL });
    const closeCancelModal = () => dispatch({ type: ActionTypes.CLOSE_CANCEL_MODAL });
    const closeVibeMatcher = () => dispatch({ type: ActionTypes.SET_VIBE_MATCHER_OPEN, payload: { isOpen: false } });
    const closeAddFundsModal = () => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: false } });
    const closePayoutModal = () => dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: false } });
    const closeMixingModal = () => dispatch({ type: ActionTypes.SET_MIXING_MODAL_OPEN, payload: { isOpen: false } });
    const closeAriaCantata = () => dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: false } });
    const toggleAriaCantata = () => dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: !isAriaCantataOpen } });

    const closePurchaseMasterclassModal = () => dispatch({ type: ActionTypes.CLOSE_PURCHASE_MASTERCLASS_MODAL });
    const closeWatchMasterclassModal = () => dispatch({ type: ActionTypes.CLOSE_WATCH_MASTERCLASS_MODAL });
    const closeReviewMasterclassModal = () => dispatch({ type: ActionTypes.CLOSE_REVIEW_MASTERCLASS_MODAL });


    const handleOpenAriaFromFAB = () => {
        dispatch({ type: ActionTypes.SET_IS_NUDGE_VISIBLE, payload: { isVisible: false } });
        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
    };

    if (isAuthLoading) {
        return (
            <div className="bg-zinc-950 text-slate-200 min-h-screen font-sans flex items-center justify-center">
                <LoadingSpinner currentUser={null} />
            </div>
        );
    }

    const renderView = () => {
        switch (currentView) {
            case AppView.LANDING_PAGE:
                return <LandingPage onNavigate={navigate} onSelectStoodio={viewStoodioDetails} onSelectProducer={viewProducerProfile} onOpenAriaCantata={toggleAriaCantata} />;
            case AppView.LOGIN:
                return <Login onLogin={login} error={loginError} onNavigate={navigate} />;
            case AppView.CHOOSE_PROFILE:
                return <ChooseProfile onSelectRole={selectRoleToSetup} />;
            case AppView.ARTIST_SETUP:
                return <ArtistSetup onCompleteSetup={(name, bio, email, password, imageUrl) => completeSetup({ name, bio, email, password, imageUrl }, UserRole.ARTIST)} onNavigate={navigate} />;
            case AppView.ENGINEER_SETUP:
                return <EngineerSetup onCompleteSetup={(name, bio, email, password, imageUrl) => completeSetup({ name, bio, email, password, imageUrl }, UserRole.ENGINEER)} onNavigate={navigate} />;
            case AppView.PRODUCER_SETUP:
                return <ProducerSetup onCompleteSetup={(name, bio, email, password, imageUrl) => completeSetup({ name, bio, email, password, imageUrl }, UserRole.PRODUCER)} onNavigate={navigate} />;
            case AppView.STOODIO_SETUP:
                return <StoodioSetup onCompleteSetup={(name, description, location, businessAddress, email, password, imageUrl) => completeSetup({ name, description, location, businessAddress, email, password, imageUrl }, UserRole.STOODIO)} onNavigate={navigate} />;
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
                return <MyBookings />;
            case AppView.INBOX:
                return <Inbox />;
            case AppView.MAP_VIEW:
                return <MapView onSelectStoodio={viewStoodioDetails} onSelectEngineer={viewEngineerProfile} onSelectArtist={viewArtistProfile} onSelectProducer={viewProducerProfile} />;
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
                return <TheStage 
                    onPost={createPost} 
                    onLikePost={likePost} 
                    onCommentOnPost={commentOnPost}
                    onToggleFollow={toggleFollow}
                    onSelectArtist={viewArtistProfile}
                    onSelectEngineer={viewEngineerProfile}
                    onSelectStoodio={viewStoodioDetails}
                    onSelectProducer={viewProducerProfile}
                    onNavigate={navigate}
                />;
            case AppView.VIBE_MATCHER_RESULTS:
                return <VibeMatcherResults onSelectStoodio={viewStoodioDetails} onSelectEngineer={viewEngineerProfile} onSelectProducer={viewProducerProfile} onBack={() => navigate(AppView.ARTIST_DASHBOARD)} />;
            case AppView.ARTIST_DASHBOARD:
                return <ArtistDashboard />;
            case AppView.STOODIO_DASHBOARD:
                return <StoodioDashboard />;
            case AppView.ENGINEER_DASHBOARD:
                return <EngineerDashboard />;
            case AppView.PRODUCER_DASHBOARD:
                return <ProducerDashboard />;
            case AppView.ACTIVE_SESSION:
                return <ActiveSession onEndSession={endSession} onSelectArtist={viewArtistProfile} />;
            case AppView.ADMIN_RANKINGS:
                return <AdminRankings />;
            case AppView.STUDIO_INSIGHTS:
                return <StudioInsights />;
            case AppView.LEADERBOARD:
                return <Leaderboard />;
            default:
                return <LandingPage onNavigate={navigate} onSelectStoodio={viewStoodioDetails} onSelectProducer={viewProducerProfile} onOpenAriaCantata={toggleAriaCantata} />;
        }
    };
    
// FIX: The App component was not returning any JSX, causing a type error. This adds the main component structure and return statement.
return (
        <div className="bg-zinc-950 text-slate-200 min-h-screen font-sans">
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

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingSpinner currentUser={currentUser} />}>
                    {renderView()}
                </Suspense>
            </main>

            {/* Modals */}
            {bookingTime && <BookingModal onClose={closeBookingModal} onConfirm={confirmBooking} />}
            {tipModalBooking && <TipModal booking={tipModalBooking} onClose={closeTipModal} onConfirmTip={confirmTip} />}
            {isVibeMatcherOpen && <VibeMatcherModal onClose={closeVibeMatcher} onAnalyze={vibeMatch} isLoading={isVibeMatcherLoading} />}
            {bookingToCancel && <BookingCancellationModal booking={bookingToCancel} onClose={closeCancelModal} onConfirm={confirmCancellation} />}
            {isAddFundsOpen && <AddFundsModal onClose={closeAddFundsModal} onConfirm={addFunds} />}
            {isPayoutOpen && currentUser && <RequestPayoutModal onClose={closePayoutModal} onConfirm={requestPayout} currentBalance={currentUser.walletBalance} />}
            {isMixingModalOpen && (selectedEngineer || bookingIntent?.engineer) && 
                <MixingRequestModal 
                    engineer={selectedEngineer || bookingIntent!.engineer!} 
                    onClose={closeMixingModal} 
                    onConfirm={confirmRemoteMix}
                    onInitiateInStudio={initiateInStudioMix}
                    isLoading={isLoading} 
                />
            }
            {masterclassToPurchase && (
                <Suspense fallback={<div />}>
                    <PurchaseMasterclassModal 
                        masterclassInfo={masterclassToPurchase}
                        onClose={closePurchaseMasterclassModal}
                        onConfirm={confirmMasterclassPurchase}
                    />
                </Suspense>
            )}
             {masterclassToWatch && (
                <Suspense fallback={<div />}>
                    <WatchMasterclassModal 
                        masterclassInfo={masterclassToWatch}
                        onClose={closeWatchMasterclassModal}
                    />
                </Suspense>
            )}
            {masterclassToReview && (
                <Suspense fallback={<div />}>
                    <MasterclassReviewModal 
                        masterclassInfo={masterclassToReview}
                        onClose={closeReviewMasterclassModal}
                        onSubmit={submitMasterclassReview}
                    />
                </Suspense>
            )}

            {/* Global UI Elements */}
            <NotificationToasts notifications={notifications} onDismiss={dismissNotification} />
             {isAriaCantataOpen && (
                <Suspense fallback={<div />}>
                    <AriaCantataAssistant
                        isOpen={isAriaCantataOpen}
                        onClose={closeAriaCantata}
                        onExecuteCommand={executeCommand}
                        history={ariaHistory}
                        setHistory={(newHistory) => dispatch({ type: ActionTypes.SET_ARIA_HISTORY, payload: { history: newHistory } })}
                        initialPrompt={initialAriaCantataPrompt}
                        clearInitialPrompt={() => dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: null } })}
                    />
                </Suspense>
            )}

            {currentUser && !isAriaCantataOpen && (
                <AriaFAB onClick={handleOpenAriaFromFAB} />
            )}

            {isNudgeVisible && ariaNudge && <AriaNudge message={ariaNudge} onDismiss={handleDismissAriaNudge} onClick={handleAriaNudgeClick} />}
            
        </div>
    );
};

// FIX: The App component was not exported, causing an error in index.tsx.
export default App;
