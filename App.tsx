import React, { useEffect, lazy, Suspense } from 'react';
// FIX: The type `WalletTransaction` was renamed to `Transaction`. Since the type is not directly used in this component, the import has been removed to prevent build errors.
import type { VibeMatchResult, Artist, Engineer, Stoodio, Producer } from './types';
// FIX: Import VerificationStatus to use it as a value.
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

const LoadingSpinner: React.FC<{ currentUser: Artist | Engineer | Stoodio | Producer | null }> = ({ currentUser }) => {
    // If the current user is a studio and has a custom animated logo, display it.
    if (currentUser && 'animatedLogoUrl' in currentUser && currentUser.animatedLogoUrl) {
        return (
            <div className="flex justify-center items-center py-20">
                <img src={currentUser.animatedLogoUrl} alt="Loading..." className="h-24 w-auto" />
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
        ariaNudge, isNudgeVisible
    } = state;

    // --- Derived State ---
    const currentView = history[historyIndex];
    const canGoBack = historyIndex > 0;
    const canGoForward = historyIndex < history.length - 1;
    
    // --- Custom Hooks for Logic ---
    const { navigate, goBack, goForward, viewStoodioDetails, viewArtistProfile, viewEngineerProfile, viewProducerProfile, navigateToStudio, viewBooking } = useNavigation();
    const { login, logout, selectRoleToSetup, completeSetup } = useAuth(navigate);
    const { openBookingModal, initiateBookingWithEngineer, initiateBookingWithProducer, confirmBooking, confirmCancellation, acceptBooking, denyBooking } = useBookings(navigate);
    const { toggleFollow, createPost, likePost, commentOnPost, markAsRead, markAllAsRead, dismissNotification } = useSocial();
    const { startSession, endSession, confirmTip, addFunds, requestPayout } = useSession(navigate);
    const { fetchSmartReplies, sendMessage, startConversation, selectConversation } = useMessaging(navigate);
    const { updateProfile, verificationSubmit, isSaved } = useProfile();
    const { vibeMatch } = useVibeMatcher();
    const { confirmRemoteMix, initiateInStudioMix } = useMixing(navigate);
    const { handleSubscribe } = useSubscription(navigate);
    const { handleAriaCantataBooking, handleShowVibeResults, handleAriaGroupConversation, handleAriaSendMessage, handleAriaNavigation, handleAriaGetDirections, handleAriaSendDocument, handleAriaNudgeClick, handleDismissAriaNudge, ariaHistory, initialAriaCantataPrompt } = useAria(startConversation, navigate, viewStoodioDetails, viewEngineerProfile, viewProducerProfile, viewArtistProfile, navigateToStudio, confirmBooking);


    // --- Data Fetching ---
    useEffect(() => {
        const loadData = async () => {
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
            try {
                const [artistsData, engineersData, producersData, stoodiozData, reviewsData, bookingsData] = await Promise.all([
                    apiService.fetchArtists(), 
                    apiService.fetchEngineers(), 
                    apiService.fetchProducers(), 
                    apiService.fetchStoodioz(), 
                    apiService.fetchReviews(),
                    apiService.fetchBookings()
                ]);
                dispatch({ type: ActionTypes.SET_INITIAL_DATA, payload: { artists: artistsData, engineers: engineersData, producers: producersData, stoodioz: stoodiozData, reviews: reviewsData }});
                dispatch({ type: ActionTypes.SET_BOOKINGS, payload: { bookings: bookingsData } });

            } catch (error) {
                console.error("Failed to fetch initial app data:", error);
            } finally {
                dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
            }
        };
        loadData();
    }, [dispatch]);

    // --- Aria Cantata Proactive Nudge ---
    useEffect(() => {
        if (currentUser && userRole && [UserRole.STOODIO, UserRole.ENGINEER, UserRole.PRODUCER].includes(userRole)) {
            dispatch({ type: ActionTypes.SET_ARIA_NUDGE, payload: { nudge: null } });
            dispatch({ type: ActionTypes.SET_IS_NUDGE_VISIBLE, payload: { isVisible: false } });
            const nudgeTimer = setTimeout(async () => {
                try {
                    const nudgeMessage = await getAriaNudge(currentUser, userRole);
                    dispatch({ type: ActionTypes.SET_ARIA_NUDGE, payload: { nudge: nudgeMessage } });
                    dispatch({ type: ActionTypes.SET_IS_NUDGE_VISIBLE, payload: { isVisible: true } });
                } catch (error) { console.error("Failed to get Aria nudge:", error); }
            }, 8000);
            return () => clearTimeout(nudgeTimer);
        } else {
            dispatch({ type: ActionTypes.SET_ARIA_NUDGE, payload: { nudge: null } });
            dispatch({ type: ActionTypes.SET_IS_NUDGE_VISIBLE, payload: { isVisible: false } });
        }
    }, [currentUser, userRole, dispatch]);


    const renderAppContent = () => {
        const handleGuestInteraction = () => navigate(AppView.LOGIN);
        
        switch (currentView) {
            case AppView.LANDING_PAGE:
                return <LandingPage onNavigate={navigate} onSelectStoodio={viewStoodioDetails} onSelectProducer={viewProducerProfile} onOpenAriaCantata={() => dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } })} />;
            case AppView.LOGIN:
                return <Login onLogin={login} error={loginError} onNavigate={navigate} />;
            case AppView.CHOOSE_PROFILE:
                return <ChooseProfile onSelectRole={selectRoleToSetup} />;
            case AppView.ARTIST_SETUP:
                return <ArtistSetup onCompleteSetup={(name, bio, email, password) => completeSetup({ name, bio, email, password }, UserRole.ARTIST)} onNavigate={navigate} />;
            case AppView.ENGINEER_SETUP:
                return <EngineerSetup onCompleteSetup={(name, bio, email, password) => completeSetup({ name, bio, email, password }, UserRole.ENGINEER)} onNavigate={navigate} />;
            case AppView.PRODUCER_SETUP:
                return <ProducerSetup onCompleteSetup={(name, bio, email, password) => completeSetup({ name, bio, email, password }, UserRole.PRODUCER)} onNavigate={navigate} />;
            case AppView.STOODIO_SETUP:
                return <StoodioSetup onCompleteSetup={(name, description, location, businessAddress, email, password) => completeSetup({ name, description, location, businessAddress, email, password }, UserRole.STOODIO)} onNavigate={navigate} />;
            case AppView.PRIVACY_POLICY:
                return <PrivacyPolicy onBack={goBack} />;
            case AppView.SUBSCRIPTION_PLANS:
                return <SubscriptionPlans onSelect={selectRoleToSetup} onSubscribe={handleSubscribe} />;

            case AppView.STOODIO_LIST:
                return <StoodioList onSelectStoodio={viewStoodioDetails} />;
            case AppView.STOODIO_DETAIL:
                return <StoodioDetail />;
            case AppView.BOOKING_MODAL:
                return <BookingModal onClose={goBack} onConfirm={confirmBooking} />;
            case AppView.CONFIRMATION:
                return <BookingConfirmation onDone={() => navigate(AppView.MY_BOOKINGS)} />;
            case AppView.MY_BOOKINGS:
                return <MyBookings />;
            case AppView.INBOX:
                return <Inbox />;
            case AppView.MAP_VIEW:
                return <MapView onSelectStoodio={viewStoodioDetails} onSelectEngineer={viewEngineerProfile} onSelectArtist={viewArtistProfile} onSelectProducer={viewProducerProfile} onInitiateBooking={initiateBookingWithEngineer} />;
            case AppView.ARTIST_LIST:
                return <ArtistList onSelectArtist={viewArtistProfile} onToggleFollow={(type, id) => toggleFollow(type, id)} />;
            case AppView.ARTIST_PROFILE:
                return <ArtistProfile />;
            case AppView.ENGINEER_LIST:
                return <EngineerList onSelectEngineer={viewEngineerProfile} onToggleFollow={(type, id) => toggleFollow(type, id)} />;
            case AppView.ENGINEER_PROFILE:
                return <EngineerProfile />;
            case AppView.PRODUCER_LIST:
                 return <ProducerList onSelectProducer={viewProducerProfile} onToggleFollow={(type, id) => toggleFollow(type, id)} />;
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
                return <VibeMatcherResults onBack={() => navigate(AppView.ARTIST_DASHBOARD)} onSelectStoodio={viewStoodioDetails} onSelectEngineer={viewEngineerProfile} onSelectProducer={viewProducerProfile} />;

            // --- USER-SPECIFIC DASHBOARDS & SESSIONS ---
            default:
                if (!currentUser || !userRole) {
                    return <Login onLogin={login} error={loginError} onNavigate={navigate} />;
                }
                switch (currentView) {
                    case AppView.ARTIST_DASHBOARD:
                        return <ArtistDashboard />;
                    case AppView.STOODIO_DASHBOARD:
                        return <StoodioDashboard onNavigate={navigate} />;
                    case AppView.ENGINEER_DASHBOARD:
                        return <EngineerDashboard />;
                    case AppView.PRODUCER_DASHBOARD:
                        return <ProducerDashboard />;
                    case AppView.ACTIVE_SESSION:
                        return <ActiveSession onEndSession={endSession} onSelectArtist={viewArtistProfile} />;
                    default:
                        return <LandingPage onNavigate={navigate} onSelectStoodio={viewStoodioDetails} onSelectProducer={viewProducerProfile} onOpenAriaCantata={() => dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } })} />;
                }
        }
    };

    return (
        <>
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
                onSelectStoodio={viewStoodioDetails}
                onSelectProducer={viewProducerProfile}
            />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                 <Suspense fallback={<LoadingSpinner currentUser={currentUser} />}>
                    {renderAppContent()}
                </Suspense>
            </main>
            {isVibeMatcherOpen && (
                <VibeMatcherModal
                    onClose={() => dispatch({ type: ActionTypes.SET_VIBE_MATCHER_OPEN, payload: { isOpen: false } })}
                    onAnalyze={vibeMatch}
                    isLoading={isVibeMatcherLoading}
                />
            )}
            {tipModalBooking && (
                <TipModal
                    booking={tipModalBooking}
                    onClose={() => dispatch({ type: ActionTypes.CLOSE_TIP_MODAL })}
                    onConfirmTip={confirmTip}
                />
            )}
            {bookingToCancel && (
                <BookingCancellationModal
                    booking={bookingToCancel}
                    onClose={() => dispatch({ type: ActionTypes.CLOSE_CANCEL_MODAL })}
                    onConfirm={confirmCancellation}
                />
            )}
            {isAddFundsOpen && (
                 <AddFundsModal
                    onClose={() => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: false } })}
                    onConfirm={addFunds}
                />
            )}
            {isPayoutOpen && currentUser && (
                 <RequestPayoutModal
                    onClose={() => dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: false } })}
                    onConfirm={requestPayout}
                    currentBalance={currentUser.walletBalance}
                />
            )}
             {isMixingModalOpen && selectedEngineer && (
                 <MixingRequestModal
                    engineer={selectedEngineer}
                    onClose={() => dispatch({ type: ActionTypes.SET_MIXING_MODAL_OPEN, payload: { isOpen: false } })}
                    onConfirm={confirmRemoteMix}
                    onInitiateInStudio={initiateInStudioMix}
                    isLoading={isLoading}
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
                    onSendMessageRequest={(recipient, text) => handleAriaSendMessage(recipient, text, currentUser)}
                    onGetDirectionsRequest={handleAriaGetDirections}
                    onSendDocument={handleAriaSendDocument}
                    onStartSetupRequest={(role) => {
                        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: false } });
                        selectRoleToSetup(role);
                    }}
                    history={ariaHistory}
                    setHistory={(history) => dispatch({ type: ActionTypes.SET_ARIA_HISTORY, payload: { history } })}
                    initialPrompt={initialAriaCantataPrompt}
                    clearInitialPrompt={() => dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: null } })}
                />
            )}
            <NotificationToasts 
                notifications={state.notifications.filter(n => !n.read)}
                onDismiss={dismissNotification}
            />
            {isNudgeVisible && ariaNudge && (
                <AriaNudge 
                    message={ariaNudge} 
                    onDismiss={handleDismissAriaNudge} 
                    onClick={handleAriaNudgeClick} 
                />
            )}
             {isSaved && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg animate-fade-in-up">
                    Changes Saved!
                </div>
            )}
        </>
    );
};

export default App;
