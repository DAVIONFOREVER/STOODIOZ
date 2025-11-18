
import React, { useEffect, lazy, Suspense, useCallback } from 'react';
import type { VibeMatchResult, Artist, Engineer, Stoodio, Producer, Booking, AriaCantataMessage, AriaActionResponse, AriaNudgeData } from './types';
import { AppView, UserRole, RankingTier } from './types';
import { getAriaNudge } from './services/geminiService.ts';
import { useAppState, useAppDispatch, ActionTypes } from './contexts/AppContext.tsx';
import type { User, Session } from '@supabase/supabase-js';

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
import { supabase } from './src/supabaseClient.js';
import { USER_SILHOUETTE_URL } from './constants.ts';

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
import Footer from './components/Footer.tsx';

// --- Lazy Loaded Components ---
const StoodioList = lazy(() => import('./components/StudioList.tsx'));
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
    if (currentUser && 'animated_logo_url' in currentUser && currentUser.animated_logo_url) {
        return (
            <div className="flex justify-center items-center py-20">
                <img src={currentUser.animated_logo_url as string} alt="Loading..." className="h-24 w-auto" />
            </div>
        );
    }

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
        masterclassToPurchase, masterclassToWatch, masterclassToReview, bookings, engineers
    } = state;

    const currentView = history[historyIndex];
    const canGoBack = historyIndex > 0;
    const canGoForward = historyIndex < history.length - 1;
    
    const { navigate, goBack, goForward, viewStoodioDetails, viewArtistProfile, viewEngineerProfile, viewProducerProfile, navigateToStudio, startNavigationForBooking } = useNavigation();
    const { login, logout, selectRoleToSetup, completeSetup: originalCompleteSetup } = useAuth(navigate);
    
    const completeSetup = useCallback(async (userData: any, role: UserRole) => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            await originalCompleteSetup(userData, role);
            return;
        }

        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

        const tableMap = {
            [UserRole.ARTIST]: 'artists',
            [UserRole.STOODIO]: 'stoodioz',
            [UserRole.ENGINEER]: 'engineers',
            [UserRole.PRODUCER]: 'producers',
        };
        const tableName = tableMap[role];
        if (!tableName) {
            console.error("Invalid role for profile creation:", role);
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
            return;
        }
        
        const baseData = {
            id: user.id,
            email: user.email,
            name: userData.name,
            image_url: userData.image_url || USER_SILHOUETTE_URL,
            completion_rate: 0,
            coordinates: { lat: 0, lon: 0 },
            followers: 0,
            following: { stoodioz: [], engineers: [], artists: ["artist-aria-cantata"], producers: [] },
            follower_ids: [],
            wallet_balance: 0,
            wallet_transactions: [],
            posts: [],
            links: [],
            is_online: true,
            rating_overall: 0,
            sessions_completed: 0,
            ranking_tier: RankingTier.Provisional,
            is_on_streak: false,
            on_time_rate: 100,
            repeat_hire_rate: 0,
            strength_tags: [],
            local_rank_text: 'Just getting started!',
            purchased_masterclass_ids: [],
        };

        let profileData: any = {};
        switch (role) {
            case UserRole.ARTIST:
                profileData = { ...baseData, bio: userData.bio, is_seeking_session: false, show_on_map: false };
                break;
            case UserRole.ENGINEER:
                profileData = { ...baseData, bio: userData.bio, specialties: [], mixing_samples: [], is_available: true, show_on_map: true, display_exact_location: false };
                break;
            case UserRole.PRODUCER:
                profileData = { ...baseData, bio: userData.bio, genres: [], instrumentals: [], is_available: true, show_on_map: true };
                break;
            case UserRole.STOODIO:
                profileData = { ...baseData, description: userData.description, location: userData.location, business_address: userData.businessAddress, hourly_rate: 100, engineer_pay_rate: 50, amenities: [], availability: [], photos: [userData.image_url || ''], rooms: [], verification_status: 'UNVERIFIED', show_on_map: true };
                break;
        }

        const { data: newProfile, error } = await supabase
            .from(tableName)
            .insert(profileData)
            .select()
            .single();
        
        if (error) {
            console.error("Error inserting profile:", error);
            alert(`Error: ${error.message}`);
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
            return;
        }

        if (newProfile) {
            dispatch({ type: ActionTypes.COMPLETE_SETUP, payload: { newUser: newProfile as any, role } });
        }
    }, [dispatch, originalCompleteSetup]);

    const { openBookingModal, initiateBookingWithEngineer, initiateBookingWithProducer, confirmBooking, confirmCancellation } = useBookings(navigate);
    const { createPost, likePost, commentOnPost, toggleFollow, markAsRead, markAllAsRead, dismissNotification } = useSocial();
    const { startSession, endSession, confirmTip, addFunds, requestPayout } = useSession(navigate);
    const { updateProfile } = useProfile();
    const { vibeMatch } = useVibeMatcher();
    const { confirmRemoteMix, initiateInStudioMix } = useMixing(navigate);
    const { handleSubscribe } = useSubscription(navigate);
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

    useRealtimeLocation({ currentUser });

    useEffect(() => {
        const handleAuthStateChange = async (_event: string, session: Session | null) => {
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
            
            if (session?.user) {
                const userId = session.user.id;
                const tableMap = {
                    artists: '*',
                    engineers: '*, mixing_samples(*)',
                    producers: '*, instrumentals(*)',
                    stoodioz: '*, rooms(*), in_house_engineers(*)',
                };

                const profilePromises = Object.entries(tableMap).map(([tableName, selectQuery]) => 
                    supabase.from(tableName).select(selectQuery).eq('id', userId).single()
                );
                
                try {
                    const results = await Promise.all(profilePromises);
                    const userProfileResult = results.find(result => result.data);

                    if (userProfileResult) {
                        dispatch({ type: ActionTypes.LOGIN_SUCCESS, payload: { user: userProfileResult.data as any } });
                    } else {
                        console.warn(`Auth session for user ${userId} found, but no profile. Navigating to setup.`);
                        navigate(AppView.CHOOSE_PROFILE);
                    }
                } catch (error) {
                    console.error("A network error occurred while fetching user profiles:", error);
                    dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "Failed to fetch your profile. Please try again." } });
                }
            } else {
                dispatch({ type: ActionTypes.LOGOUT });
            }
            
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

        return () => {
            subscription?.unsubscribe();
        };
    }, [dispatch, navigate]);

    useEffect(() => {
        let timerId: number;
        if (currentUser && userRole) {
            getAriaNudge(currentUser, userRole).then(nudge => {
                if (nudge) {
                    dispatch({ type: ActionTypes.SET_ARIA_NUDGE, payload: { nudge } });
                    timerId = window.setTimeout(() => dispatch({ type: ActionTypes.SET_IS_NUDGE_VISIBLE, payload: { isVisible: true } }), 2000);
                }
            });
        }
        
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

    const openTipModal = (booking: Booking) => dispatch({ type: ActionTypes.OPEN_TIP_MODAL, payload: { booking } });
    const openCancelModal = (booking: Booking) => dispatch({ type: ActionTypes.OPEN_CANCEL_MODAL, payload: { booking } });

    const renderView = () => {
        switch (currentView) {
            case AppView.LANDING_PAGE:
                return <LandingPage onNavigate={navigate} onSelectStoodio={viewStoodioDetails} onSelectProducer={viewProducerProfile} onOpenAriaCantata={toggleAriaCantata} />;
            case AppView.LOGIN:
                return <Login onLogin={login} error={loginError} onNavigate={navigate} />;
            case AppView.CHOOSE_PROFILE:
                return <ChooseProfile onSelectRole={selectRoleToSetup} />;
            case AppView.ARTIST_SETUP:
                return <ArtistSetup onCompleteSetup={(name, bio, email, password, imageUrl) => completeSetup({ name, bio, email, password, image_url: imageUrl }, UserRole.ARTIST)} onNavigate={navigate} />;
            case AppView.ENGINEER_SETUP:
                return <EngineerSetup onCompleteSetup={(name, bio, email, password, imageUrl) => completeSetup({ name, bio, email, password, image_url: imageUrl }, UserRole.ENGINEER)} onNavigate={navigate} />;
            case AppView.PRODUCER_SETUP:
                return <ProducerSetup onCompleteSetup={(name, bio, email, password, imageUrl) => completeSetup({ name, bio, email, password, image_url: imageUrl }, UserRole.PRODUCER)} onNavigate={navigate} />;
            case AppView.STOODIO_SETUP:
                return <StoodioSetup onCompleteSetup={(name, description, location, businessAddress, email, password, imageUrl) => completeSetup({ name, description, location, businessAddress, email, password, image_url: imageUrl }, UserRole.STOODIO)} onNavigate={navigate} />;
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
                return <MyBookings 
                    bookings={bookings} 
                    engineers={engineers} 
                    onOpenTipModal={openTipModal} 
                    onNavigateToStudio={navigateToStudio} 
                    onOpenCancelModal={openCancelModal}
                    onArtistNavigate={startNavigationForBooking}
                    userRole={userRole}
                />;
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
            {isPayoutOpen && currentUser && <RequestPayoutModal onClose={closePayoutModal} onConfirm={requestPayout} currentBalance={currentUser.wallet_balance} />}
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

            {isNudgeVisible && ariaNudge && <AriaNudge nudge={ariaNudge} onDismiss={handleDismissAriaNudge} onClick={handleAriaNudgeClick} />}
            
            <Footer onNavigate={navigate} />
        </div>
    );
};

export default App;
