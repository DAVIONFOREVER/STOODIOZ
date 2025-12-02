
import React, { useEffect, lazy, Suspense, useCallback } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Booking, AriaNudgeData, Label } from './types';
import { AppView, UserRole, UserRole as UserRoleEnum } from './types';
import { getAriaNudge } from './services/geminiService.ts';
import { useAppState, useAppDispatch, ActionTypes } from './contexts/AppContext.tsx';
import type { Session } from '@supabase/supabase-js';

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
const LabelSetup = lazy(() => import('./components/LabelSetup.tsx'));
const LabelDashboard = lazy(() => import('./components/LabelDashboard.tsx'));
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

const LoadingSpinner: React.FC<{ currentUser: any }> = ({ currentUser }) => {
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
    const { login, logout, selectRoleToSetup } = useAuth(navigate);
    
    const completeSetup = useCallback(async (userData: any, role: UserRole) => {
        const supabase = getSupabase();
        if (!supabase) {
            alert("System error: Database connection unavailable.");
            return;
        }

        // Ensure previous session is cleared before setup to avoid conflicts
        if (userData.email && userData.password) {
            await supabase.auth.signOut();
        }
        
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

        try {
            const result = await apiService.createUser(userData, role);

            if (result && 'email_confirmation_required' in result) {
                alert("Account created! Please check your email to verify your account before logging in.");
                navigate(AppView.LOGIN);
                return;
            }

            if (result) {
                const newUser = result as Artist | Engineer | Stoodio | Producer | Label;
                dispatch({ type: ActionTypes.COMPLETE_SETUP, payload: { newUser, role } });
                
                // Force navigation based on role
                if (role === UserRole.ARTIST) navigate(AppView.ARTIST_DASHBOARD);
                else if (role === UserRole.ENGINEER) navigate(AppView.ENGINEER_DASHBOARD);
                else if (role === UserRole.PRODUCER) navigate(AppView.PRODUCER_DASHBOARD);
                else if (role === UserRole.STOODIO) navigate(AppView.STOODIO_DASHBOARD);
                else if (role === UserRole.LABEL) navigate(AppView.LABEL_DASHBOARD);
            }
        } catch (error: any) {
            console.error("Complete setup failed:", error);
            // FIX: Stringify object errors to make them readable in alert
            const errorMessage = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
            alert(`Setup failed: ${errorMessage}`);
        } finally {
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        }
    }, [dispatch, navigate]);

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

    // --- DATA FETCHING & INITIALIZATION ---
    useEffect(() => {
        const supabase = getSupabase();
        if (!supabase) return;

        // Fetch Global Directory
        const fetchDirectory = async () => {
            const directory = await apiService.getAllPublicUsers();
            dispatch({ 
                type: ActionTypes.SET_INITIAL_DATA, 
                payload: {
                    artists: directory.artists,
                    engineers: directory.engineers,
                    producers: directory.producers,
                    stoodioz: directory.stoodioz,
                    labels: directory.labels,
                    reviews: [] // Fetch reviews later if needed
                }
            });
        };
        
        fetchDirectory();

        // Helper to fetch and hydrate CURRENT logged-in user profile data
        const fetchAndHydrateUser = async (userId: string) => {
            if (!currentUser) {
                dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
            }

            const fetchProfiles = async () => {
                // Check all tables to find where this user exists.
                // Note: We use maybeSingle() and detailed error checking now to be robust against partial missing data.
                const tableMap = {
                    stoodioz: { query: '*, rooms(*), in_house_engineers(*)', role: UserRoleEnum.STOODIO },
                    producers: { query: '*, instrumentals(*)', role: UserRoleEnum.PRODUCER },
                    engineers: { query: '*, mixing_samples(*)', role: UserRoleEnum.ENGINEER },
                    artists: { query: '*', role: UserRoleEnum.ARTIST },
                    labels: { query: '*', role: UserRoleEnum.LABEL },
                };
                
                const idPromises = Object.entries(tableMap).map(async ([tableName, config]) => {
                    try {
                        // Try fetching with full relational data
                        const { data, error } = await supabase.from(tableName).select(config.query).eq('id', userId).maybeSingle();
                        
                        if (error) {
                             // FALLBACK: If a specific relation is missing/broken (e.g. instrumentals table locked), 
                             // fallback to basic fetch so the user can still login.
                             console.warn(`Hydration warning for ${tableName} (relations failed), retrying basic fetch...`, error.message);
                             const { data: basicData, error: basicError } = await supabase.from(tableName).select('*').eq('id', userId).maybeSingle();
                             
                             if (!basicError && basicData) {
                                 return { data: basicData, role: config.role };
                             }
                             return null;
                        }
                        return data ? { data, role: config.role } : null;
                    } catch (e) {
                        console.warn(`Hydration error for ${tableName}:`, e);
                        return null;
                    }
                });
                
                const idResults = await Promise.all(idPromises);
                const found = idResults.find(result => result !== null);
                
                return found;
            };
            
            try {
                let userProfileResult = await fetchProfiles();
                
                // Retry logic for race conditions on signup
                if (!userProfileResult) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        userProfileResult = await fetchProfiles();
                }

                if (userProfileResult && userProfileResult.data) {
                    dispatch({ 
                        type: ActionTypes.LOGIN_SUCCESS, 
                        payload: { 
                            user: userProfileResult.data as any,
                            role: userProfileResult.role 
                        } 
                    });
                } else {
                    // Only dispatch failure if we truly can't find the profile after retries
                    console.warn("User authenticated but profile not found.");
                }
            } catch (error) {
                console.error("Error hydrating user profile:", error);
                dispatch({ type: ActionTypes.LOGIN_FAILURE, payload: { error: "Failed to load profile." } });
            } finally {
                dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
            }
        };

        // 1. Immediate Session Check on Mount (Fixes Refresh Logout)
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchAndHydrateUser(session.user.id);
            } else {
                dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
            }
        };
        
        initSession();

        // 2. Listen for Auth Changes (Login, Logout, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                dispatch({ type: ActionTypes.LOGOUT });
            } else if (event === 'SIGNED_IN' && session?.user) {
                // Only fetch if current user is not set or different
                if (!currentUser || currentUser.id !== session.user.id) {
                    await fetchAndHydrateUser(session.user.id);
                }
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [dispatch]); 

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
            if (timerId) clearTimeout(timerId);
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
                return <ArtistSetup onCompleteSetup={(name, bio, email, password, imageUrl, imageFile) => completeSetup({ name, bio, email, password, image_url: imageUrl, imageFile }, UserRole.ARTIST)} onNavigate={navigate} />;
            case AppView.ENGINEER_SETUP:
                return <EngineerSetup onCompleteSetup={(name, bio, email, password, imageUrl, imageFile) => completeSetup({ name, bio, email, password, image_url: imageUrl, imageFile }, UserRole.ENGINEER)} onNavigate={navigate} />;
            case AppView.PRODUCER_SETUP:
                return <ProducerSetup onCompleteSetup={(name, bio, email, password, imageUrl, imageFile) => completeSetup({ name, bio, email, password, image_url: imageUrl, imageFile }, UserRole.PRODUCER)} onNavigate={navigate} />;
            case AppView.STOODIO_SETUP:
                return <StoodioSetup onCompleteSetup={(name, description, location, businessAddress, email, password, imageUrl, imageFile) => completeSetup({ name, description, location, businessAddress, email, password, image_url: imageUrl, imageFile }, UserRole.STOODIO)} onNavigate={navigate} />;
            case AppView.LABEL_SETUP:
                return <LabelSetup onCompleteSetup={(name, bio, email, password, imageUrl, imageFile) => completeSetup({ name, bio, email, password, image_url: imageUrl, imageFile }, UserRole.LABEL)} onNavigate={navigate} />;
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
            case AppView.LABEL_DASHBOARD:
                return <LabelDashboard />;
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
