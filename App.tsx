import React, { useEffect, lazy, Suspense } from 'react';
import type { VibeMatchResult, Transaction } from './types';
// FIX: Import VerificationStatus to use it as a value.
import { AppView, UserRole, VerificationStatus } from './types';
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
const StoodioDashboard = lazy(() => import('./components/StudioDashboard'));
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

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center py-20">
        <svg className="animate-spin h-10 w-10 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

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
    const { updateProfile, verificationSubmit } = useProfile();
    const { vibeMatch } = useVibeMatcher();
    const { confirmRemoteMix, initiateInStudioMix } = useMixing(navigate);
    const { handleAriaCantataBooking, handleShowVibeResults, handleAriaGroupConversation, handleAriaSendMessage, handleAriaNavigation, handleAriaGetDirections, handleAriaNudgeClick, handleDismissAriaNudge, ariaHistory, initialAriaCantataPrompt } = useAria(startConversation, navigate, viewStoodioDetails, viewEngineerProfile, viewProducerProfile, viewArtistProfile, navigateToStudio, confirmBooking);


    // --- Data Fetching ---
    useEffect(() => {
        const loadData = async () => {
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
            try {
                const [artistsData, engineersData, producersData, stoodiozData] = await Promise.all([
                    apiService.fetchArtists(), apiService.fetchEngineers(), apiService.fetchProducers(), apiService.fetchStoodioz()
                ]);
                dispatch({ type: ActionTypes.SET_INITIAL_DATA, payload: { artists: artistsData, engineers: engineersData, producers: producersData, stoodioz: stoodiozData }});
            } catch (error) {
                console.error("Failed to fetch initial app data:", error);
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
                return <ArtistSetup onCompleteSetup={(...args) => completeSetup({id: `artist-${Date.now()}`, name: args[0], bio: args[1], email: args[2], password: args[3], imageUrl: '', followers: 0, following: { stoodioz: [], engineers: [], artists: ['artist-aria-cantata'], producers: [] }, followerIds: [], coordinates: { lat: 34.0522, lon: -118.2437 }, isSeekingSession: true, walletBalance: 2000, walletTransactions: []}, UserRole.ARTIST)} onNavigate={navigate} />;
            case AppView.ENGINEER_SETUP:
                return <EngineerSetup onCompleteSetup={(...args) => completeSetup({id: `eng-${Date.now()}`, name: args[0], bio: args[1], email: args[2], password: args[3], specialties: ['Mixing', 'Mastering'], rating: 5.0, sessionsCompleted: 0, imageUrl: '', audioSampleUrl: '', followers: 0, following: { artists: ['artist-aria-cantata'], engineers: [], stoodioz: [], producers: [] }, followerIds: [], coordinates: { lat: 40.7128, lon: -74.0060 }, isAvailable: true, walletBalance: 100, walletTransactions: []}, UserRole.ENGINEER)} onNavigate={navigate} />;
            case AppView.PRODUCER_SETUP:
                return <ProducerSetup onCompleteSetup={(...args) => completeSetup({id: `prod-${Date.now()}`, name: args[0], bio: args[1], email: args[2], password: args[3], genres: ['Hip-Hop', 'Trap', 'R&B'], rating: 5.0, imageUrl: '', followers: 0, following: { artists: ['artist-aria-cantata'], engineers: [], stoodioz: [], producers: [] }, followerIds: [], coordinates: { lat: 33.7490, lon: -84.3880 }, isAvailable: true, walletBalance: 50, walletTransactions: [], instrumentals: []}, UserRole.PRODUCER)} onNavigate={navigate} />;
            case AppView.STOODIO_SETUP:
                // FIX: Use VerificationStatus.UNVERIFIED enum instead of string literal.
                return <StoodioSetup onCompleteSetup={(...args) => completeSetup({id: `studio-${Date.now()}`, name: args[0], description: args[1], email: args[2], password: args[3], location: 'Miami, FL', hourlyRate: 80, engineerPayRate: 40, rating: 5.0, imageUrl: '', amenities: ['Vocal Booth', 'Lounge Area'], coordinates: { lat: 25.7617, lon: -80.1918 }, availability: [], photos: [], followers: 0, following: { artists: ['artist-aria-cantata'], engineers: [], stoodioz: [], producers: [] }, followerIds: [], walletBalance: 0, walletTransactions: [], rooms: [ { id: `room-${Date.now()}`, name: 'Main Control Room', description: 'The primary recording and mixing space.', hourlyRate: 80, photos: [] } ], verificationStatus: VerificationStatus.UNVERIFIED}, UserRole.STOODIO)} onNavigate={navigate} />;
            case AppView.PRIVACY_POLICY:
                return <PrivacyPolicy onBack={goBack} />;
            case AppView.SUBSCRIPTION_PLANS:
                return <SubscriptionPlans onSelect={selectRoleToSetup} />;

            case AppView.STOODIO_LIST:
                return <StoodioList onSelectStoodio={viewStoodioDetails} />;
            case AppView.BOOKING_MODAL:
            case AppView.STOODIO_DETAIL:
                return <StoodioDetail onBook={currentUser ? openBookingModal : handleGuestInteraction} onBack={goBack} onToggleFollow={currentUser ? toggleFollow : handleGuestInteraction} onSelectArtist={viewArtistProfile} onSelectEngineer={viewEngineerProfile} onSelectStoodio={viewStoodioDetails} onSelectProducer={viewProducerProfile} onStartConversation={currentUser ? startConversation : handleGuestInteraction} onLikePost={likePost} onCommentOnPost={commentOnPost} />;
            case AppView.ENGINEER_LIST:
                return <EngineerList onSelectEngineer={viewEngineerProfile} onToggleFollow={currentUser ? toggleFollow : handleGuestInteraction} />;
            case AppView.ENGINEER_PROFILE:
                return <EngineerProfile onBack={goBack} onToggleFollow={currentUser ? toggleFollow : handleGuestInteraction} onSelectArtist={viewArtistProfile} onSelectEngineer={viewEngineerProfile} onSelectStoodio={viewStoodioDetails} onSelectProducer={viewProducerProfile} onStartNavigation={navigateToStudio} onStartConversation={currentUser ? startConversation : handleGuestInteraction} onLikePost={likePost} onCommentOnPost={commentOnPost} onInitiateBooking={initiateBookingWithEngineer} onOpenMixingModal={() => dispatch({ type: ActionTypes.SET_MIXING_MODAL_OPEN, payload: { isOpen: true } })} />;
            case AppView.PRODUCER_LIST:
                return <ProducerList onSelectProducer={viewProducerProfile} onToggleFollow={currentUser ? toggleFollow : handleGuestInteraction} />;
            case AppView.PRODUCER_PROFILE:
                return <ProducerProfile onBack={goBack} onToggleFollow={currentUser ? toggleFollow : handleGuestInteraction} onSelectArtist={viewArtistProfile} onSelectEngineer={viewEngineerProfile} onSelectStoodio={viewStoodioDetails} onSelectProducer={viewProducerProfile} onStartConversation={currentUser ? startConversation : handleGuestInteraction} onLikePost={likePost} onCommentOnPost={commentOnPost} onInitiateBookingWithProducer={initiateBookingWithProducer} />;
            case AppView.ARTIST_LIST:
                 return <ArtistList onSelectArtist={viewArtistProfile} onToggleFollow={currentUser ? toggleFollow : handleGuestInteraction} />;
            case AppView.ARTIST_PROFILE:
                return <ArtistProfile onBack={goBack} onToggleFollow={currentUser ? toggleFollow : handleGuestInteraction} onStartNavigation={()=>{}} onStartConversation={currentUser ? startConversation : handleGuestInteraction} onSelectArtist={viewArtistProfile} onSelectEngineer={viewEngineerProfile} onSelectStoodio={viewStoodioDetails} onSelectProducer={viewProducerProfile} onLikePost={likePost} onCommentOnPost={commentOnPost} />;
            case AppView.MAP_VIEW:
                return <MapView onSelectStoodio={viewStoodioDetails} onSelectEngineer={viewEngineerProfile} onSelectArtist={viewArtistProfile} onSelectProducer={viewProducerProfile} onInitiateBooking={currentUser ? initiateBookingWithEngineer : undefined} />;
            
            case AppView.THE_STAGE:
                if (currentUser) return <TheStage onPost={createPost} onLikePost={likePost} onCommentOnPost={commentOnPost} onToggleFollow={toggleFollow} onSelectArtist={viewArtistProfile} onSelectEngineer={viewEngineerProfile} onSelectStoodio={viewStoodioDetails} onSelectProducer={viewProducerProfile} onNavigate={navigate} />;
                return <Login onLogin={login} error={null} onNavigate={navigate} />;
            case AppView.CONFIRMATION:
                return <BookingConfirmation onDone={() => navigate(AppView.MY_BOOKINGS)} />;
            case AppView.MY_BOOKINGS:
                return <MyBookings onOpenTipModal={(b) => dispatch({ type: ActionTypes.OPEN_TIP_MODAL, payload: { booking: b } })} onNavigateToStudio={navigateToStudio} onOpenCancelModal={(b) => dispatch({ type: ActionTypes.OPEN_CANCEL_MODAL, payload: { booking: b } })} />;

            case AppView.STOODIO_DASHBOARD:
                if (userRole === UserRole.STOODIO) return <StoodioDashboard />;
                return <Login onLogin={login} error={null} onNavigate={navigate} />;

            case AppView.ENGINEER_DASHBOARD:
                if (userRole === UserRole.ENGINEER) return <EngineerDashboard />;
                return <Login onLogin={login} error={null} onNavigate={navigate} />;

            case AppView.PRODUCER_DASHBOARD:
                if (userRole === UserRole.PRODUCER) return <ProducerDashboard />;
                return <Login onLogin={login} error={null} onNavigate={navigate} />;

            case AppView.ARTIST_DASHBOARD:
                if (userRole === UserRole.ARTIST) return <ArtistDashboard />;
                 return <Login onLogin={login} error={null} onNavigate={navigate} />;

            case AppView.INBOX:
                 if (currentUser) return <Inbox onSendMessage={sendMessage} onSelectConversation={selectConversation} onNavigate={navigate} onFetchSmartReplies={fetchSmartReplies} />;
                 return <Login onLogin={login} error={null} onNavigate={navigate} />;
            
            case AppView.ACTIVE_SESSION:
                 return <ActiveSession onEndSession={endSession} onSelectArtist={viewArtistProfile} />;

            case AppView.VIBE_MATCHER_RESULTS:
                return <VibeMatcherResults onSelectStoodio={viewStoodioDetails} onSelectEngineer={viewEngineerProfile} onSelectProducer={viewProducerProfile} onBack={goBack} />;

            default:
                return <LandingPage onNavigate={navigate} onSelectStoodio={viewStoodioDetails} onSelectProducer={viewProducerProfile} onOpenAriaCantata={() => dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } })} />;
        }
    };

    return (
        <div className="main-container animate-fade-in">
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
                <Suspense fallback={<LoadingSpinner />}>
                    {isLoading ? <LoadingSpinner /> : renderAppContent()}

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
                            onStartSetupRequest={selectRoleToSetup}
                            onSendMessageRequest={(r, m) => handleAriaSendMessage(r, m, currentUser)}
                            onGetDirectionsRequest={handleAriaGetDirections}
                            history={ariaHistory}
                            setHistory={(history) => dispatch({ type: ActionTypes.SET_ARIA_HISTORY, payload: { history } })}
                            initialPrompt={initialAriaCantataPrompt}
                            clearInitialPrompt={() => dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: null } })}
                        />
                    )}
                </Suspense>

                {currentView === AppView.BOOKING_MODAL && selectedStoodio && bookingTime && (
                    <BookingModal onClose={goBack} onConfirm={confirmBooking} />
                )}
                {tipModalBooking && (
                    <TipModal booking={tipModalBooking} onClose={() => dispatch({ type: ActionTypes.CLOSE_TIP_MODAL })} onConfirmTip={confirmTip} />
                )}
                {bookingToCancel && (
                    <BookingCancellationModal booking={bookingToCancel} onClose={() => dispatch({ type: ActionTypes.CLOSE_CANCEL_MODAL })} onConfirm={confirmCancellation} />
                )}
                {isVibeMatcherOpen && (
                    <VibeMatcherModal onClose={() => dispatch({ type: ActionTypes.SET_VIBE_MATCHER_OPEN, payload: { isOpen: false } })} onAnalyze={vibeMatch} isLoading={isVibeMatcherLoading} />
                )}
                {isAddFundsOpen && (
                    <AddFundsModal onClose={() => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: false } })} onConfirm={addFunds} />
                )}
                {isPayoutOpen && currentUser && (
                    <RequestPayoutModal onClose={() => dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: false } })} onConfirm={requestPayout} currentBalance={currentUser.walletBalance} />
                )}
                {isMixingModalOpen && selectedEngineer && (
                    <MixingRequestModal engineer={selectedEngineer} onClose={() => dispatch({ type: ActionTypes.SET_MIXING_MODAL_OPEN, payload: { isOpen: false } })} onConfirm={confirmRemoteMix} onInitiateInStudio={initiateInStudioMix} isLoading={isLoading} />
                )}
                
            </main>
             <NotificationToasts notifications={state.notifications.filter(n => !n.read).slice(0, 3)} onDismiss={dismissNotification} />
            {ariaNudge && isNudgeVisible && (
                <AriaNudge message={ariaNudge} onClick={handleAriaNudgeClick} onDismiss={handleDismissAriaNudge} />
            )}
            {currentUser && currentView !== AppView.LANDING_PAGE && (
                <button
                    onClick={() => dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } })}
                    className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-orange-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transform transition-transform duration-200 animate-fade-in"
                    aria-label="Open AI Assistant Aria Cantata"
                >
                    <MagicWandIcon className="w-6 h-6" />
                </button>
            )}
        </div>
    );
};

export default App;