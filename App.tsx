import React, { useState, useCallback, useMemo, useEffect, lazy, Suspense } from 'react';
import { differenceInHours } from 'date-fns';
import type { Stoodio, Booking, BookingRequest, Engineer, Location, Review, Conversation, Message, Artist, AppNotification, Post, LinkAttachment, Comment, Transaction, VibeMatchResult, Room, Producer, Instrumental, MixingDetails } from './types';
import { AppView, UserRole, BookingStatus, BookingRequestType, NotificationType, VerificationStatus, TransactionCategory, TransactionStatus, SubscriptionPlan, SubscriptionStatus } from './types';
import { USER_SILHOUETTE_URL, STOODIO_ICON_URL, SERVICE_FEE_PERCENTAGE } from './constants';
import { generateSmartReplies } from './services/geminiService';
import Header from './components/Header';
import BookingModal from './components/BookingModal';
import TipModal from './components/TipModal';
import NotificationToasts from './components/NotificationToasts';
import VibeMatcherModal from './components/VibeMatcherModal';
import BookingCancellationModal from './components/BookingCancellationModal';
import AddFundsModal from './components/AddFundsModal';
import RequestPayoutModal from './components/RequestPayoutModal';
import MixingRequestModal from './components/MixingRequestModal';

// --- Lazy Loaded Components ---
const StoodioList = lazy(() => import('./components/StudioList'));
const StoodioDetail = lazy(() => import('./components/StoodioDetail'));
const BookingConfirmation = lazy(() => import('./components/BookingConfirmation'));
const MyBookings = lazy(() => import('./components/MyBookings'));
const StoodioDashboard = lazy(() => import('./components/StoodioDashboard'));
const EngineerDashboard = lazy(() => import('./components/EngineerDashboard'));
const ProducerDashboard = lazy(() => import('./components/ProducerDashboard'));
// FIX: Ensure lazy-loaded component has a default export
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

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center py-20">
        <svg className="animate-spin h-10 w-10 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);


type JobPostData = Pick<BookingRequest, 'date' | 'startTime' | 'duration' | 'requiredSkills' | 'engineerPayRate'>;

const App: React.FC = () => {
    // --- App State ---
    const [history, setHistory] = useState<AppView[]>([AppView.LANDING_PAGE]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);
    const [stoodioz, setStoodioz] = useState<Stoodio[]>([]);
    const [engineers, setEngineers] = useState<Engineer[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [producers, setProducers] = useState<Producer[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reviews] = useState<Review[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    
    // --- Auth State ---
    const [currentUser, setCurrentUser] = useState<Artist | Engineer | Stoodio | Producer | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [setupRole, setSetupRole] = useState<UserRole | null>(null);

    // --- UI State ---
    const [selectedStoodio, setSelectedStoodio] = useState<Stoodio | null>(null);
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    const [selectedEngineer, setSelectedEngineer] = useState<Engineer | null>(null);
    const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
    const [latestBooking, setLatestBooking] = useState<Booking | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [bookingTime, setBookingTime] = useState<{ date: string, time: string, room: Room } | null>(null);
    const [activeSession, setActiveSession] = useState<Booking | null>(null);
    const [tipModalBooking, setTipModalBooking] = useState<Booking | null>(null);
    const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isVibeMatcherOpen, setIsVibeMatcherOpen] = useState<boolean>(false);
    const [vibeMatchResults, setVibeMatchResults] = useState<VibeMatchResult | null>(null);
    const [isVibeMatcherLoading, setIsVibeMatcherLoading] = useState<boolean>(false);
    const [bookingIntent, setBookingIntent] = useState<{ engineer?: Engineer; producer?: Producer; date?: string; time?: string; mixingDetails?: MixingDetails; pullUpFee?: number; } | null>(null);
    const [smartReplies, setSmartReplies] = useState<string[]>([]);
    const [isSmartRepliesLoading, setIsSmartRepliesLoading] = useState<boolean>(false);
    const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
    const [isPayoutOpen, setIsPayoutOpen] = useState(false);
    const [isMixingModalOpen, setIsMixingModalOpen] = useState(false);


    // --- Derived State ---
    const currentView = history[historyIndex];
    const canGoBack = historyIndex > 0;
    const canGoForward = historyIndex < history.length - 1;
    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const userRole: UserRole | null = useMemo(() => {
        if (!currentUser) return null;
        if ('instrumentals' in currentUser) return UserRole.PRODUCER;
        if ('specialties' in currentUser) return UserRole.ENGINEER;
        if ('amenities' in currentUser) return UserRole.STOODIO;
        return UserRole.ARTIST;
    }, [currentUser]);
    
    // --- Data Fetching Simulation ---
    useEffect(() => {
        // Simulate fetching initial data from a backend on app load
        const fetchData = () => {
            setIsLoading(true);

            // This data would come from your API / Firebase
            const mockArtists: Artist[] = [
                { id: 'artist-1', name: 'Luna Vance', email: 'artist@stoodioz.com', password: 'password', bio: 'Dream-pop artist from Los Angeles.', imageUrl: USER_SILHOUETTE_URL, followers: 1258, following: { stoodioz: [], engineers: [], artists: [], producers: [] }, followerIds: [], coordinates: { lat: 34.0522, lon: -118.2437 }, isSeekingSession: true, walletBalance: 1500, walletTransactions: [] }
            ];
            const mockEngineers: Engineer[] = [
                { id: 'eng-1', name: 'Alex Robinson', email: 'engineer@stoodioz.com', password: 'password', bio: 'Seasoned audio engineer.', specialties: ['Indie Rock', 'Hip-Hop'], rating: 4.9, sessionsCompleted: 238, imageUrl: USER_SILHOUETTE_URL, audioSampleUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-1-short.mp3', followers: 841, following: { artists: [], engineers: [], stoodioz: [], producers: [] }, followerIds: [], coordinates: { lat: 34.06, lon: -118.25 }, isAvailable: true, walletBalance: 5800, walletTransactions: [], notificationPreferences: { radius: 50, enabled: true }, subscription: { plan: SubscriptionPlan.ENGINEER_PLUS, status: SubscriptionStatus.ACTIVE } }
            ];
            const mockProducers: Producer[] = [
                { id: 'prod-1', name: 'Metro Boomin', email: 'producer@stoodioz.com', password: 'password', bio: 'Grammy-nominated producer from Atlanta.', genres: ['Trap', 'Hip-Hop', 'R&B'], rating: 5.0, imageUrl: USER_SILHOUETTE_URL, followers: 15200, following: { stoodioz: [], engineers: [], artists: [], producers: [] }, followerIds: [], coordinates: { lat: 33.7490, lon: -84.3880 }, isAvailable: true, walletBalance: 12500, walletTransactions: [], instrumentals: [], subscription: { plan: SubscriptionPlan.PRODUCER_PRO, status: SubscriptionStatus.ACTIVE }, pullUpPrice: 500 }
            ];
            const mockStoodioz: Stoodio[] = [
                { id: 'studio-1', name: 'Echo Chamber Stoodioz', email: 'stoodio@stoodioz.com', password: 'password', description: 'A state-of-the-art recording facility.', location: 'Los Angeles, CA', hourlyRate: 120, engineerPayRate: 50, rating: 4.8, imageUrl: STOODIO_ICON_URL, amenities: ['Neve 8078 Console', 'Vocal Booth'], coordinates: { lat: 34.05, lon: -118.25 }, availability: [], photos: [], followers: 432, following: { artists: [], engineers: [], stoodioz: [], producers: [] }, followerIds: [], walletBalance: 12500, walletTransactions: [], rooms: [{ id: 'room-1a', name: 'Control Room A', description: 'Main mixing room.', hourlyRate: 120, photos: [] }], verificationStatus: VerificationStatus.VERIFIED, subscription: { plan: SubscriptionPlan.STOODIO_PRO, status: SubscriptionStatus.ACTIVE } }
            ];

            // Simulate network delay
            setTimeout(() => {
                setArtists(mockArtists);
                setEngineers(mockEngineers);
                setProducers(mockProducers);
                setStoodioz(mockStoodioz);
                setIsLoading(false);
            }, 1000);
        };

        fetchData();
    }, []); // Empty dependency array ensures this runs only once on mount


    // --- Navigation Handlers ---
    const handleNavigate = useCallback((view: AppView) => {
        setLoginError(null);
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(view);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        if (view === AppView.STOODIO_LIST || view === AppView.ARTIST_LIST || view === AppView.ENGINEER_LIST || view === AppView.PRODUCER_LIST || view === AppView.MAP_VIEW) {
            setSelectedStoodio(null);
            setSelectedArtist(null);
            setSelectedEngineer(null);
            setSelectedProducer(null);
        }
    }, [history, historyIndex]);

    const handleGoBack = useCallback(() => {
        if (canGoBack) setHistoryIndex(prev => prev - 1);
    }, [canGoBack]);

    const handleGoForward = useCallback(() => {
        if (canGoForward) setHistoryIndex(prev => prev - 1);
    }, [canGoForward]);

    const handleNavigateToStudio = useCallback((location: Location) => {
        const { lat, lon } = location;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }, []);

    const handleViewBooking = (bookingId: string) => {
        handleNavigate(AppView.MY_BOOKINGS);
    };

    // --- Auth Handlers ---
    const handleLogin = useCallback((email: string, password: string): void => {
        // In a real app, this would be an API call to your backend for authentication.
        // For this prepared version, we simulate logging in by searching through the fetched data.
        const allUsers: (Artist | Engineer | Stoodio | Producer)[] = [...artists, ...engineers, ...producers, ...stoodioz];
        const user = allUsers.find(u => u.email === email && u.password === password);

        if (user) {
            setCurrentUser(user);
            // Request notification permission on login for a better user experience
            if ('Notification' in window && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
            setHistory([AppView.THE_STAGE]);
            setHistoryIndex(0);
        } else {
            setLoginError("Login failed. Try 'artist@stoodioz.com', 'engineer@stoodioz.com', etc., with password 'password'.");
        }
    }, [artists, engineers, producers, stoodioz]);

    const handleLogout = useCallback(() => {
        setCurrentUser(null);
        setHistory([AppView.LANDING_PAGE]);
        setHistoryIndex(0);
    }, []);

    const handleSelectRoleToSetup = (role: UserRole) => {
        setSetupRole(role);
        if (role === UserRole.ARTIST) handleNavigate(AppView.ARTIST_SETUP);
        else if (role === UserRole.STOODIO) handleNavigate(AppView.STOODIO_SETUP);
        else if (role === UserRole.ENGINEER) handleNavigate(AppView.ENGINEER_SETUP);
        else if (role === UserRole.PRODUCER) handleNavigate(AppView.PRODUCER_SETUP);
    };

    const handleSelectPlan = (role: UserRole) => {
        if (role === UserRole.ARTIST) handleNavigate(AppView.ARTIST_SETUP);
        else if (role === UserRole.STOODIO) handleNavigate(AppView.STOODIO_SETUP);
        else if (role === UserRole.ENGINEER) handleNavigate(AppView.ENGINEER_SETUP);
        else if (role === UserRole.PRODUCER) handleNavigate(AppView.PRODUCER_SETUP);
    };
    
    const handleCompleteArtistSetup = (name: string, bio: string, email: string, password: string) => {
        const newArtist: Artist = {
            id: `artist-${Date.now()}`,
            name,
            bio,
            email,
            password,
            imageUrl: USER_SILHOUETTE_URL,
            followers: 0,
            following: { stoodioz: [], engineers: [], artists: [], producers: [] },
            followerIds: [],
            coordinates: { lat: 34.0522, lon: -118.2437 }, // Default to LA
            isSeekingSession: true,
            walletBalance: 2000,
            walletTransactions: [],
        };
        setArtists(prev => [...prev, newArtist]);
        setCurrentUser(newArtist);
        setHistory([AppView.THE_STAGE]);
        setHistoryIndex(0);
    };

    const handleCompleteEngineerSetup = (name: string, bio: string, email: string, password: string) => {
        const newEngineer: Engineer = {
            id: `eng-${Date.now()}`,
            name, bio, email, password,
            specialties: ['Mixing', 'Mastering'],
            rating: 5.0,
            sessionsCompleted: 0,
            imageUrl: USER_SILHOUETTE_URL,
            audioSampleUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-1-short.mp3',
            followers: 0,
            following: { artists: [], engineers: [], stoodioz: [], producers: [] },
            followerIds: [],
            coordinates: { lat: 40.7128, lon: -74.0060 }, // Default to NY
            isAvailable: true,
            walletBalance: 100,
            walletTransactions: [],
            notificationPreferences: { radius: 50, enabled: true },
            subscription: { plan: SubscriptionPlan.FREE, status: SubscriptionStatus.ACTIVE },
        };
        setEngineers(prev => [...prev, newEngineer]);
        setCurrentUser(newEngineer);
        setHistory([AppView.THE_STAGE]);
        setHistoryIndex(0);
    };
    
    const handleCompleteProducerSetup = (name: string, bio: string, email: string, password: string) => {
        const newProducer: Producer = {
            id: `prod-${Date.now()}`,
            name, bio, email, password,
            genres: ['Hip-Hop', 'Trap', 'R&B'],
            rating: 5.0,
            imageUrl: USER_SILHOUETTE_URL,
            followers: 0,
            following: { artists: [], engineers: [], stoodioz: [], producers: [] },
            followerIds: [],
            coordinates: { lat: 33.7490, lon: -84.3880 }, // Default to Atlanta
            isAvailable: true,
            walletBalance: 50,
            walletTransactions: [],
            instrumentals: [],
            subscription: { plan: SubscriptionPlan.FREE, status: SubscriptionStatus.ACTIVE },
        };
        setProducers(prev => [...prev, newProducer]);
        setCurrentUser(newProducer);
        setHistory([AppView.THE_STAGE]);
        setHistoryIndex(0);
    };

    const handleCompleteStoodioSetup = (name: string, description: string, email: string, password: string) => {
        const newStoodio: Stoodio = {
            id: `studio-${Date.now()}`,
            name, description, email, password,
            location: 'Miami, FL',
            hourlyRate: 80,
            engineerPayRate: 40,
            rating: 5.0,
            imageUrl: STOODIO_ICON_URL,
            amenities: ['Vocal Booth', 'Lounge Area'],
            coordinates: { lat: 25.7617, lon: -80.1918 }, // Default to Miami
            availability: [],
            photos: [],
            followers: 0,
            following: { artists: [], engineers: [], stoodioz: [], producers: [] },
            followerIds: [],
            walletBalance: 0,
            walletTransactions: [],
            rooms: [
                { id: `room-${Date.now()}`, name: 'Main Control Room', description: 'The primary recording and mixing space.', hourlyRate: 80, photos: [] }
            ],
            verificationStatus: VerificationStatus.UNVERIFIED,
            subscription: { plan: SubscriptionPlan.FREE, status: SubscriptionStatus.ACTIVE },
        };
        setStoodioz(prev => [...prev, newStoodio]);
        setCurrentUser(newStoodio);
        setHistory([AppView.THE_STAGE]);
        setHistoryIndex(0);
    };

    // --- Main App Logic Handlers ---

    const handleViewStoodioDetails = useCallback((stoodio: Stoodio) => {
        setSelectedStoodio(stoodio);
        handleNavigate(AppView.STOODIO_DETAIL);
    }, [handleNavigate]);

    const handleViewArtistProfile = useCallback((artist: Artist) => {
        setSelectedArtist(artist);
        handleNavigate(AppView.ARTIST_PROFILE);
    }, [handleNavigate]);

    const handleViewEngineerProfile = useCallback((engineer: Engineer) => {
        setSelectedEngineer(engineer);
        handleNavigate(AppView.ENGINEER_PROFILE);
    }, [handleNavigate]);
    
    const handleViewProducerProfile = useCallback((producer: Producer) => {
        setSelectedProducer(producer);
        handleNavigate(AppView.PRODUCER_PROFILE);
    }, [handleNavigate]);

    const handleOpenBookingModal = useCallback((date: string, time: string, room: Room) => {
        if (!selectedStoodio) return;
        setBookingTime({ date, time, room });
        handleNavigate(AppView.BOOKING_MODAL);
    }, [selectedStoodio, handleNavigate]);

    const handleInitiateBookingWithEngineer = useCallback((engineer: Engineer, date: string, time: string) => {
        setBookingIntent({ engineer, date, time });
        handleNavigate(AppView.STOODIO_LIST);
        setNotifications(prev => [...prev, {
            id: `notif-${Date.now()}`,
            userId: currentUser!.id,
            message: `Now, select a studio for your session with ${engineer.name}.`,
            timestamp: new Date().toISOString(),
            type: NotificationType.GENERAL,
            read: false,
        }]);
    }, [handleNavigate, currentUser]);

    const handleInitiateBookingWithProducer = useCallback((producer: Producer) => {
        setBookingIntent({ producer, pullUpFee: producer.pullUpPrice });
        handleNavigate(AppView.STOODIO_LIST);
        setNotifications(prev => [...prev, {
            id: `notif-${Date.now()}`,
            userId: currentUser!.id,
            message: `Now, select a studio for your session with ${producer.name}.`,
            timestamp: new Date().toISOString(),
            type: NotificationType.GENERAL,
            read: false,
        }]);
    }, [handleNavigate, currentUser]);

    const createSessionChat = useCallback((booking: Booking) => {
        if (booking.status !== BookingStatus.CONFIRMED) return;

        const participants = [
            booking.artist,
            booking.engineer,
            booking.stoodio,
            booking.producer
        ].filter((p): p is Artist | Engineer | Stoodio | Producer => p !== null && p !== undefined);

        if (participants.length > 1) {
            const sessionTimeInfo = booking.mixingDetails
                ? `Remote mix confirmed on ${booking.date}.`
                : `Session confirmed for ${booking.date} at ${booking.startTime}.`;
            
            const systemMessage: Message = {
                id: `msg-system-${Date.now()}`,
                senderId: 'system',
                type: 'system',
                text: `${sessionTimeInfo} Participants: ${participants.map(p => p.name).join(', ')}.`,
                timestamp: new Date().toISOString(),
            };

            const chatTitle = booking.stoodio ? `Session: ${booking.stoodio.name}` : `Remote Mix: ${booking.engineer?.name}`;
            const chatImage = booking.stoodio ? booking.stoodio.imageUrl : booking.engineer?.imageUrl;

            const newConversation: Conversation = {
                id: `convo-${booking.id}`,
                participants,
                messages: [systemMessage],
                unreadCount: 0,
                bookingId: booking.id,
                title: chatTitle,
                imageUrl: chatImage,
            };
            
            setConversations(prev => [newConversation, ...prev]);
            
            participants.forEach(p => {
                if (p.id !== currentUser?.id) {
                     setNotifications(prev => [...prev, {
                        id: `notif-chat-${p.id}-${Date.now()}`,
                        userId: p.id,
                        message: `You've been added to a group chat for your upcoming session.`,
                        timestamp: new Date().toISOString(),
                        type: NotificationType.GENERAL,
                        read: false,
                        link: { view: AppView.INBOX }
                    }]);
                }
            });
        }
    }, [setConversations, setNotifications, currentUser]);

    const handleConfirmBooking = useCallback(async (bookingRequest: BookingRequest) => {
        if (!selectedStoodio || !userRole || !currentUser || ![UserRole.ARTIST, UserRole.ENGINEER, UserRole.STOODIO, UserRole.PRODUCER].includes(userRole)) return;
        
        if (userRole === UserRole.STOODIO) {
            if (currentUser.id !== selectedStoodio.id) {
                 setNotifications(prev => [...prev, {
                    id: `notif-error-${Date.now()}`,
                    userId: currentUser!.id,
                    message: "Error: Studio owners can only book sessions at their own studio.",
                    timestamp: new Date().toISOString(),
                    type: NotificationType.GENERAL,
                    read: false
                }]);
                return;
            }
        }
        
        if (userRole === UserRole.ENGINEER || userRole === UserRole.STOODIO) {
            const userWithSub = currentUser as Engineer | Stoodio;
            if (!userWithSub.subscription || userWithSub.subscription.plan === SubscriptionPlan.FREE) {
                handleNavigate(AppView.SUBSCRIPTION_PLANS);
                setNotifications(prev => [...prev, {
                    id: `notif-sub-${Date.now()}`,
                    userId: currentUser.id,
                    message: "Please upgrade your plan to book sessions.",
                    timestamp: new Date().toISOString(),
                    type: NotificationType.GENERAL,
                    read: false,
                }]);
                if (currentView === AppView.BOOKING_MODAL) {
                    handleGoBack();
                }
                return;
            }
        }

        setIsLoading(true);

        const isProducerBooking = !!bookingRequest.producerId;
        let status = BookingStatus.PENDING;
        let engineer: Engineer | null = null;

        if (isProducerBooking) {
            status = BookingStatus.CONFIRMED;
            if (bookingRequest.requestType === BookingRequestType.FIND_AVAILABLE) {
                engineer = engineers.find(e => e.isAvailable) || null;
            } else if (bookingRequest.requestType === BookingRequestType.SPECIFIC_ENGINEER && bookingRequest.requestedEngineerId) {
                engineer = engineers.find(e => e.id === bookingRequest.requestedEngineerId) || null;
            }
        } else {
            if (bookingRequest.requestType === BookingRequestType.BRING_YOUR_OWN) {
                status = BookingStatus.CONFIRMED;
            } else if (bookingRequest.requestType === BookingRequestType.SPECIFIC_ENGINEER) {
                status = BookingStatus.PENDING_APPROVAL;
            } else {
                // For "Find Available", we will confirm it client-side immediately with the first available engineer for simplicity
                status = BookingStatus.CONFIRMED;
                engineer = engineers.find(e => e.isAvailable) || null;
            }
        }

        const newBooking: Booking = {
            id: `BKG-${Date.now()}`,
            ...bookingRequest,
            stoodio: selectedStoodio,
            engineer: engineer,
            producer: bookingRequest.producerId ? producers.find(p => p.id === bookingRequest.producerId) || null : null,
            artist: userRole === UserRole.ARTIST ? (currentUser as Artist) : null,
            status: status,
            requestedEngineerId: bookingRequest.requestedEngineerId || null,
            bookedById: currentUser.id,
            bookedByRole: userRole,
            instrumentalsPurchased: bookingRequest.instrumentalsToPurchase || [],
            pullUpFee: bookingRequest.pullUpFee || 0,
        };

        setBookings(prev => [...prev, newBooking]);
        setLatestBooking(newBooking);
        
        if (status === BookingStatus.CONFIRMED) {
            createSessionChat(newBooking);
             if (engineer) {
                 setNotifications(prev => [...prev, {
                    id: `notif-found-${Date.now()}`,
                    userId: currentUser.id,
                    message: `Great news! ${engineer.name} is confirmed for your session at ${selectedStoodio.name}.`,
                    timestamp: new Date().toISOString(),
                    type: NotificationType.BOOKING_CONFIRMED,
                    read: false,
                    link: { view: AppView.MY_BOOKINGS }
                }]);
            }
        }
        
        setTimeout(() => {
            try {
                handleNavigate(AppView.CONFIRMATION);
            } finally {
                setIsLoading(false);
                setSelectedStoodio(null);
                setBookingTime(null);
                setBookingIntent(null);
            }
        }, 500); 

    }, [selectedStoodio, currentUser, userRole, handleNavigate, engineers, producers, currentView, handleGoBack, createSessionChat]);
    
    const handlePostJob = useCallback((jobRequest: JobPostData) => {
        if (!currentUser || userRole !== UserRole.STOODIO) return;

        const stoodio = currentUser as Stoodio;
        if (!stoodio.subscription || stoodio.subscription.plan === SubscriptionPlan.FREE) {
            handleNavigate(AppView.SUBSCRIPTION_PLANS);
            setNotifications(prev => [...prev, {
                id: `notif-sub-${Date.now()}`,
                userId: currentUser.id,
                message: "A Stoodio Pro plan is required to post jobs.",
                timestamp: new Date().toISOString(),
                type: NotificationType.GENERAL,
                read: false,
            }]);
            return;
        }
        
        const engineerPayout = jobRequest.engineerPayRate * jobRequest.duration;
        const mainRoom = stoodio.rooms[0] || { id: 'default-room', name: 'Main Room', hourlyRate: stoodio.hourlyRate, description: '', photos: [] };
    
        const newJob: Booking = {
            id: `JOB-${Date.now()}`,
            room: mainRoom,
            date: jobRequest.date,
            startTime: jobRequest.startTime,
            duration: jobRequest.duration,
            requiredSkills: jobRequest.requiredSkills,
            stoodio: stoodio,
            artist: null,
            engineer: null,
            producer: null,
            status: BookingStatus.PENDING,
            postedBy: UserRole.STOODIO,
            requestType: BookingRequestType.FIND_AVAILABLE,
            requestedEngineerId: null,
            totalCost: engineerPayout,
            engineerPayRate: jobRequest.engineerPayRate,
            bookedById: currentUser.id,
            bookedByRole: userRole,
        };
        setBookings(prev => [...prev, newJob]);
    
        setNotifications(prev => [...prev, {
            id: `notif-${Date.now()}`, 
            userId: currentUser!.id,
            message: `Your job posting for ${stoodio.name} has been listed.`, 
            timestamp: new Date().toISOString(),
            type: NotificationType.GENERAL,
            read: false
        }]);
    
    }, [currentUser, userRole, handleNavigate]);

    const handleConfirmCancellation = useCallback((bookingId: string) => {
        const bookingToCancel = bookings.find(b => b.id === bookingId);
        if (!bookingToCancel || !bookingToCancel.stoodio || currentUser?.id !== bookingToCancel.bookedById) return;

        const bookingStartTime = new Date(`${bookingToCancel.date}T${bookingToCancel.startTime}`);
        const hoursUntilSession = differenceInHours(bookingStartTime, new Date());

        let refundPercentage = 0;
        if (hoursUntilSession > 48) {
            refundPercentage = 1.0;
        } else if (hoursUntilSession > 24) {
            refundPercentage = 0.5;
        }

        const refundAmount = bookingToCancel.totalCost * refundPercentage;

        if (refundAmount > 0) {
            const refundTx: Omit<Transaction, 'id'> = { 
                description: `Refund for cancelled session at ${bookingToCancel.stoodio.name}`, 
                amount: refundAmount, 
                date: new Date().toISOString(), 
                category: TransactionCategory.REFUND,
                status: TransactionStatus.COMPLETED,
                relatedBookingId: bookingToCancel.id
            };

            if (bookingToCancel.bookedByRole === UserRole.ARTIST) {
                const currentArtist = artists.find(a => a.id === bookingToCancel.bookedById);
                if (currentArtist) {
                    const newTx: Transaction = { ...refundTx, id: `txn-cancel-${Date.now()}` };
                    const updatedArtist = { 
                        ...currentArtist,
                        walletBalance: currentArtist.walletBalance + refundAmount, 
                        walletTransactions: [newTx, ...currentArtist.walletTransactions] 
                    };
                    setArtists(prev => prev.map(a => a.id === updatedArtist.id ? updatedArtist : a));
                    if(currentUser?.id === updatedArtist.id) setCurrentUser(updatedArtist);
                }
            } else if (bookingToCancel.bookedByRole === UserRole.ENGINEER) {
                 const currentEngineer = engineers.find(e => e.id === bookingToCancel.bookedById);
                if (currentEngineer) {
                    const newTx: Transaction = { ...refundTx, id: `txn-cancel-${Date.now()}` };
                    const updatedEngineer = { 
                        ...currentEngineer,
                        walletBalance: currentEngineer.walletBalance + refundAmount, 
                        walletTransactions: [newTx, ...currentEngineer.walletTransactions] 
                    };
                    setEngineers(prev => prev.map(e => e.id === updatedEngineer.id ? updatedEngineer : e));
                    if(currentUser?.id === updatedEngineer.id) setCurrentUser(updatedEngineer);
                }
            } else if (bookingToCancel.bookedByRole === UserRole.STOODIO) {
                const currentStoodio = stoodioz.find(s => s.id === bookingToCancel.bookedById);
                if (currentStoodio) {
                    const newTx: Transaction = { ...refundTx, id: `txn-cancel-${Date.now()}` };
                    const updatedStoodio = {
                        ...currentStoodio,
                        walletBalance: currentStoodio.walletBalance + refundAmount,
                        walletTransactions: [newTx, ...currentStoodio.walletTransactions]
                    };
                    setStoodioz(prev => prev.map(s => s.id === updatedStoodio.id ? updatedStoodio : s));
                    if(currentUser?.id === updatedStoodio.id) setCurrentUser(updatedStoodio);
                }
            }
        }
        
        const updatedBooking = { ...bookingToCancel, status: BookingStatus.CANCELLED };
        setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));

        setBookingToCancel(null);

    }, [bookings, currentUser, artists, engineers, stoodioz]);


    const handleUpdateStoodio = (updatedProfile: Partial<Stoodio>) => {
        if (userRole !== UserRole.STOODIO) return;
        const updatedStoodio = { ...currentUser as Stoodio, ...updatedProfile };
        setCurrentUser(updatedStoodio);
        setStoodioz(prev => prev.map(s => s.id === updatedStoodio.id ? updatedStoodio : s));
    };

    const handleVerificationSubmit = (stoodioId: string, data: { googleBusinessProfileUrl: string; websiteUrl: string }) => {
        if (userRole !== UserRole.STOODIO) return;

        const updateStoodioState = (id: string, updates: Partial<Stoodio>) => {
            setStoodioz(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
            if (currentUser?.id === id) {
                setCurrentUser(prev => ({ ...prev, ...updates }) as Stoodio);
            }
        };

        updateStoodioState(stoodioId, {
            verificationStatus: VerificationStatus.PENDING,
            googleBusinessProfileUrl: data.googleBusinessProfileUrl,
            websiteUrl: data.websiteUrl,
        });

        setTimeout(() => {
            updateStoodioState(stoodioId, { verificationStatus: VerificationStatus.VERIFIED });
            
            setNotifications(prev => [...prev, {
                id: `notif-verified-${Date.now()}`,
                userId: stoodioId,
                message: "Congratulations! Your stoodio has been verified.",
                timestamp: new Date().toISOString(),
                type: NotificationType.GENERAL,
                read: false,
            }]);
        }, 4000);
    };
    
    const handleUpdateEngineer = (updatedProfile: Partial<Engineer>) => {
        if (userRole !== UserRole.ENGINEER) return;
        const updatedEngineer = { ...currentUser as Engineer, ...updatedProfile };
        setCurrentUser(updatedEngineer);
        setEngineers(prev => prev.map(e => e.id === updatedEngineer.id ? updatedEngineer : e));
    };
    
    const handleUpdateProducer = (updatedProfile: Partial<Producer>) => {
        if (userRole !== UserRole.PRODUCER) return;
        const updatedProducer = { ...currentUser as Producer, ...updatedProfile };
        setCurrentUser(updatedProducer);
        setProducers(prev => prev.map(p => p.id === updatedProducer.id ? updatedProducer : p));
    };

    const handleUpdateArtistProfile = (updatedProfile: Partial<Artist>) => {
        if (userRole !== UserRole.ARTIST) return;
        const updatedArtist = { ...currentUser as Artist, ...updatedProfile };
        setCurrentUser(updatedArtist);
        setArtists(prev => prev.map(a => a.id === updatedArtist.id ? updatedArtist : a));
    };

    const handleCloseModal = useCallback(() => {
        if (currentView === AppView.BOOKING_MODAL) {
            setBookingIntent(null);
            handleGoBack();
        }
    }, [currentView, handleGoBack]);
    
    const handleAcceptBooking = useCallback((bookingId: string) => {
        if (userRole !== UserRole.ENGINEER || !currentUser) return;
    
        const engineer = currentUser as Engineer;
        if (!engineer.subscription || engineer.subscription.plan === SubscriptionPlan.FREE) {
            handleNavigate(AppView.SUBSCRIPTION_PLANS);
            setNotifications(prev => [...prev, {
                id: `notif-sub-${Date.now()}`,
                userId: currentUser.id,
                message: "Upgrade to Engineer Plus to accept jobs.",
                timestamp: new Date().toISOString(),
                type: NotificationType.GENERAL,
                read: false,
            }]);
            return;
        }

        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex === -1) return;
    
        const booking = bookings[bookingIndex];
    
        const canAcceptOpenJob = booking.status === BookingStatus.PENDING;
        const canAcceptDirectRequest = booking.status === BookingStatus.PENDING_APPROVAL && booking.requestedEngineerId === engineer.id;
    
        if (canAcceptOpenJob || canAcceptDirectRequest) {
            const updatedBooking = {
                ...booking,
                status: BookingStatus.CONFIRMED,
                engineer: engineer,
            };
    
            setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));
            createSessionChat(updatedBooking);
    
            if (updatedBooking.artist) {
                const notification: AppNotification = {
                    id: `notif-${Date.now()}`,
                    userId: updatedBooking.artist!.id,
                    message: `Your session at ${updatedBooking.stoodio?.name || 'a remote session'} is confirmed with engineer ${engineer.name}!`,
                    timestamp: new Date().toISOString(),
                    type: NotificationType.BOOKING_CONFIRMED,
                    read: false,
                };
                setNotifications(prev => [...prev, notification]);
            }
        } else {
             const notification: AppNotification = {
                id: `notif-${Date.now()}`,
                userId: currentUser!.id,
                message: `Sorry, that session is no longer available.`,
                timestamp: new Date().toISOString(),
                type: NotificationType.GENERAL,
                read: false,
            };
            setNotifications(prev => [...prev, notification]);
        }
    }, [bookings, currentUser, userRole, handleNavigate, createSessionChat]);
    
    const handleDenyBooking = useCallback((bookingId: string) => {
        if (userRole !== UserRole.ENGINEER || !currentUser) return;
        const engineer = currentUser as Engineer;
    
        const bookingIndex = bookings.findIndex(b => b.id === bookingId && b.status === BookingStatus.PENDING_APPROVAL && b.requestedEngineerId === engineer.id);
        if (bookingIndex === -1) return; 
    
        const booking = bookings[bookingIndex];
        
        const updatedBooking = {
            ...booking,
            status: BookingStatus.PENDING,
            requestedEngineerId: null,
        };
    
        setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));
    
        if (updatedBooking.artist) {
            const notification: AppNotification = {
                id: `notif-${Date.now()}`,
                userId: updatedBooking.artist!.id,
                message: `${engineer.name} was unavailable for your session. We are now searching for other available engineers.`,
                timestamp: new Date().toISOString(),
                type: NotificationType.BOOKING_DENIED,
                read: false,
            };
            setNotifications(prev => [...prev, notification]);
        }
    }, [bookings, currentUser, userRole]);
    
    const handleToggleFollow = useCallback((type: 'stoodio' | 'engineer' | 'artist' | 'producer', id: string) => {
        if (!currentUser) return;
    
        const updateUserFollowing = (user: any, updateFn: (updatedUser: any) => void) => {
            let updatedFollowing = { ...user.following };
            const list = `${type}s` as keyof typeof updatedFollowing;
            const isFollowing = updatedFollowing[list]?.includes(id);

            updatedFollowing[list] = isFollowing
                ? (updatedFollowing[list] || []).filter((followedId: string) => followedId !== id)
                : [...(updatedFollowing[list] || []), id];
            
            updateFn({ following: updatedFollowing });
        };

        if (userRole === UserRole.ARTIST) {
            updateUserFollowing(currentUser, handleUpdateArtistProfile);
        } else if (userRole === UserRole.STOODIO) {
            updateUserFollowing(currentUser, handleUpdateStoodio);
        } else if (userRole === UserRole.ENGINEER) {
            updateUserFollowing(currentUser, handleUpdateEngineer);
        } else if (userRole === UserRole.PRODUCER) {
            updateUserFollowing(currentUser, handleUpdateProducer);
        }
    }, [userRole, currentUser, handleUpdateArtistProfile, handleUpdateStoodio, handleUpdateEngineer, handleUpdateProducer]);

    const handleCreatePost = useCallback((postData: { text: string; imageUrl?: string; videoUrl?: string; videoThumbnailUrl?: string; link?: LinkAttachment }) => {
        if (!currentUser || !userRole) return;
    
        const newPost: Post = {
            id: `post-${Date.now()}`,
            authorId: currentUser.id,
            authorType: userRole,
            text: postData.text,
            imageUrl: postData.imageUrl,
            videoUrl: postData.videoUrl,
            videoThumbnailUrl: postData.videoThumbnailUrl,
            link: postData.link,
            timestamp: new Date().toISOString(),
            likes: [],
            comments: [],
        };
        
        const updateUserPosts = (user: any, setUserList: React.Dispatch<React.SetStateAction<any[]>>) => {
            const updatedUser = { ...user, posts: [newPost, ...(user.posts || [])] };
            setCurrentUser(updatedUser);
            setUserList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        };
        
        if (userRole === UserRole.ARTIST) updateUserPosts(currentUser, setArtists);
        else if (userRole === UserRole.ENGINEER) updateUserPosts(currentUser, setEngineers);
        else if (userRole === UserRole.STOODIO) updateUserPosts(currentUser, setStoodioz);
        else if (userRole === UserRole.PRODUCER) updateUserPosts(currentUser, setProducers);

    }, [currentUser, userRole]);
    
    const handleLikePost = useCallback((postId: string) => {
        if (!currentUser) return;
        const userId = currentUser.id;
    
        const updateLikes = (posts: Post[] | undefined) =>
            posts?.map(p => {
                if (p.id === postId) {
                    const newLikes = p.likes.includes(userId)
                        ? p.likes.filter(id => id !== userId)
                        : [...p.likes, userId];
                    return { ...p, likes: newLikes };
                }
                return p;
            });
    
        setArtists(prev => prev.map(a => ({ ...a, posts: updateLikes(a.posts) })));
        setEngineers(prev => prev.map(e => ({ ...e, posts: updateLikes(e.posts) })));
        setStoodioz(prev => prev.map(s => ({ ...s, posts: updateLikes(s.posts) })));
        setProducers(prev => prev.map(p => ({ ...p, posts: updateLikes(p.posts) })));
    }, [currentUser]);
    
    const handleCommentOnPost = useCallback((postId: string, text: string) => {
        if (!currentUser) return;
    
        const newComment: Comment = {
            id: `comment-${Date.now()}`,
            authorId: currentUser.id,
            authorName: currentUser.name,
            authorImageUrl: currentUser.imageUrl,
            text,
            timestamp: new Date().toISOString(),
        };
    
        const updateComments = (posts: Post[] | undefined) =>
            posts?.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p);
        
        setArtists(prev => prev.map(a => ({ ...a, posts: updateComments(a.posts) })));
        setEngineers(prev => prev.map(e => ({ ...e, posts: updateComments(e.posts) })));
        setStoodioz(prev => prev.map(s => ({ ...s, posts: updateComments(s.posts) })));
        setProducers(prev => prev.map(p => ({ ...p, posts: updateComments(p.posts) })));
    }, [currentUser]);

    const handleStartSession = useCallback((booking: Booking) => {
        if (userRole !== UserRole.ENGINEER) return;
        setActiveSession(booking);
        handleNavigate(AppView.ACTIVE_SESSION);
    }, [userRole, handleNavigate]);

    const handleEndSession = useCallback((bookingId: string) => {
        let updatedBooking: Booking | null = null;
        setBookings(prev => prev.map(b => {
            if (b.id === bookingId) {
                updatedBooking = { ...b, status: BookingStatus.COMPLETED };
                return updatedBooking;
            }
            return b;
        }));

        if (updatedBooking && updatedBooking.stoodio) {
            const booking = updatedBooking;
            const bookerName = artists.find(a => a.id === booking.bookedById)?.name || engineers.find(e => e.id === booking.bookedById)?.name || stoodioz.find(s => s.id === booking.bookedById)?.name;
            const now = new Date().toISOString();

            // Payer Logic
            const paymentTx: Transaction = { id: `txn-pay-${Date.now()}`, description: `Session at ${booking.stoodio.name}`, amount: -booking.totalCost, date: now, category: TransactionCategory.SESSION_PAYMENT, status: TransactionStatus.COMPLETED, relatedBookingId: booking.id, relatedUserName: booking.stoodio.name };
            if (booking.bookedByRole === UserRole.ARTIST) {
                handleUpdateArtistProfile({ walletBalance: (currentUser as Artist).walletBalance - booking.totalCost, walletTransactions: [paymentTx, ...(currentUser as Artist).walletTransactions] });
            } // Simplified for demo, add engineer/studio logic if they can book

            // Payee Logic
            const stoodioPayout = booking.room!.hourlyRate * booking.duration;
            const stoodioPayoutTx: Transaction = { id: `txn-payout-s-${Date.now()}`, description: `Payout from ${bookerName || 'session'}`, amount: stoodioPayout, date: now, category: TransactionCategory.SESSION_PAYOUT, status: TransactionStatus.PENDING, relatedBookingId: booking.id, relatedUserName: bookerName };
            setStoodioz(prev => prev.map(s => s.id === booking.stoodio!.id ? { ...s, walletBalance: s.walletBalance + stoodioPayout, walletTransactions: [stoodioPayoutTx, ...s.walletTransactions] } : s));

            if (booking.engineer) {
                const engineerPayout = booking.engineerPayRate * booking.duration;
                const engineerPayoutTx: Transaction = { id: `txn-payout-e-${Date.now()}`, description: `Payout from ${bookerName || 'session'}`, amount: engineerPayout, date: now, category: TransactionCategory.SESSION_PAYOUT, status: TransactionStatus.PENDING, relatedBookingId: booking.id, relatedUserName: bookerName };
                setEngineers(prev => prev.map(e => e.id === booking.engineer!.id ? { ...e, walletBalance: e.walletBalance + engineerPayout, walletTransactions: [engineerPayoutTx, ...e.walletTransactions] } : e));
                
                setTimeout(() => {
                    setEngineers(prev => prev.map(e => e.id === booking.engineer!.id ? { ...e, walletTransactions: e.walletTransactions.map(tx => tx.id === engineerPayoutTx.id ? {...tx, status: TransactionStatus.COMPLETED} : tx) } : e));
                }, 3000);
            }
            
            setTimeout(() => {
                setStoodioz(prev => prev.map(s => s.id === booking.stoodio!.id ? { ...s, walletTransactions: s.walletTransactions.map(tx => tx.id === stoodioPayoutTx.id ? {...tx, status: TransactionStatus.COMPLETED} : tx) } : s));
            }, 3000);
        }

        setActiveSession(null);
        handleNavigate(AppView.ENGINEER_DASHBOARD);
    }, [handleNavigate, artists, engineers, stoodioz, handleUpdateArtistProfile, currentUser]);

    const handleConfirmTip = useCallback((bookingId: string, tipAmount: number) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking || !booking.engineer || !currentUser) return;
        
        const bookerName = currentUser.name;
        const now = new Date().toISOString();

        const updatedBooking = { ...booking, tip: tipAmount };
        setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));

        // Payer Logic
        const tipPaymentTx: Transaction = { id: `txn-tip-pay-${Date.now()}`, description: `Tip for ${booking.engineer?.name}`, amount: -tipAmount, date: now, category: TransactionCategory.TIP_PAYMENT, status: TransactionStatus.COMPLETED, relatedBookingId: booking.id, relatedUserName: booking.engineer.name };
        handleUpdateArtistProfile({ walletBalance: (currentUser as Artist).walletBalance - tipAmount, walletTransactions: [tipPaymentTx, ...(currentUser as Artist).walletTransactions] });
        
        // Payee Logic
        const tipPayoutTx: Transaction = { id: `txn-tip-payout-${Date.now()}`, description: `Tip from ${bookerName}`, amount: tipAmount, date: now, category: TransactionCategory.TIP_PAYOUT, status: TransactionStatus.COMPLETED, relatedBookingId: booking.id, relatedUserName: bookerName };
        setEngineers(prev => prev.map(e => e.id === booking.engineer!.id ? {...e, walletBalance: e.walletBalance + tipAmount, walletTransactions: [tipPayoutTx, ...e.walletTransactions]} : e));

        setTipModalBooking(null);
    }, [bookings, currentUser, handleUpdateArtistProfile]);
    
    const handleAddFunds = (amount: number) => {
        if (!currentUser) return;
        const newTx: Transaction = {
            id: `txn-add-funds-${Date.now()}`,
            description: 'Added funds to wallet',
            amount,
            date: new Date().toISOString(),
            category: TransactionCategory.ADD_FUNDS,
            status: TransactionStatus.COMPLETED,
        };
        const updatedUser = {
            ...currentUser,
            walletBalance: currentUser.walletBalance + amount,
            walletTransactions: [newTx, ...currentUser.walletTransactions],
        };

        if (userRole === UserRole.ARTIST) setArtists(prev => prev.map(a => a.id === currentUser.id ? updatedUser as Artist : a));
        else if (userRole === UserRole.ENGINEER) setEngineers(prev => prev.map(e => e.id === currentUser.id ? updatedUser as Engineer : e));
        else if (userRole === UserRole.STOODIO) setStoodioz(prev => prev.map(s => s.id === currentUser.id ? updatedUser as Stoodio : s));
        else if (userRole === UserRole.PRODUCER) setProducers(prev => prev.map(p => p.id === currentUser.id ? updatedUser as Producer : p));
        
        setCurrentUser(updatedUser);
        setIsAddFundsOpen(false);
    };

    const handleRequestPayout = (amount: number) => {
        if (!currentUser || userRole === UserRole.ARTIST) return;
         const newTx: Transaction = {
            id: `txn-payout-${Date.now()}`,
            description: 'Payout to bank account',
            amount: -amount,
            date: new Date().toISOString(),
            category: TransactionCategory.WITHDRAWAL,
            status: TransactionStatus.PENDING,
        };
        const updatedUser = {
            ...currentUser,
            walletBalance: currentUser.walletBalance - amount,
            walletTransactions: [newTx, ...currentUser.walletTransactions],
        };

        if (userRole === UserRole.ENGINEER) setEngineers(prev => prev.map(e => e.id === currentUser.id ? updatedUser as Engineer : e));
        else if (userRole === UserRole.STOODIO) setStoodioz(prev => prev.map(s => s.id === currentUser.id ? updatedUser as Stoodio : s));
        else if (userRole === UserRole.PRODUCER) setProducers(prev => prev.map(p => p.id === currentUser.id ? updatedUser as Producer : p));
        
        setCurrentUser(updatedUser);
        setIsPayoutOpen(false);

        setTimeout(() => {
            const completeTx = (user: Stoodio | Engineer | Producer) => ({
                ...user,
                walletTransactions: user.walletTransactions.map(tx => tx.id === newTx.id ? { ...tx, status: TransactionStatus.COMPLETED } : tx)
            });

            if (userRole === UserRole.ENGINEER) setEngineers(prev => prev.map(e => e.id === currentUser.id ? completeTx(e) as Engineer : e));
            else if (userRole === UserRole.STOODIO) setStoodioz(prev => prev.map(s => s.id === currentUser.id ? completeTx(s) as Stoodio : s));
            else if (userRole === UserRole.PRODUCER) setProducers(prev => prev.map(p => p.id === currentUser.id ? completeTx(p) as Producer : p));
            
            if (currentUser?.id === updatedUser.id) {
                setCurrentUser(prev => completeTx(prev as Engineer | Stoodio | Producer));
            }
        }, 5000);
    };

    const handleOpenVibeMatcher = useCallback(() => setIsVibeMatcherOpen(true), []);
    const handleCloseVibeMatcher = useCallback(() => setIsVibeMatcherOpen(false), []);

    const handleVibeMatch = useCallback(async (vibeDescription: string) => {
        setIsVibeMatcherLoading(true);
        setIsVibeMatcherOpen(false);
        try {
            // This is now a placeholder for calling your backend Cloud Function.
            // In a real app, you would use the Firebase SDK to call the 'vibeMatcher' function.
            // e.g., const functions = getFunctions(); const vibeMatcher = httpsCallable(functions, 'vibeMatcher');
            console.log("Calling backend vibe matcher with:", vibeDescription);
            console.log("Context being sent:", {
                stoodioz: stoodioz.map(s => ({ id: s.id, name: s.name, description: s.description, amenities: s.amenities })),
                engineers: engineers.map(e => ({ id: e.id, name: e.name, bio: e.bio, specialties: e.specialties })),
                producers: producers.map(p => ({ id: p.id, name: p.name, bio: p.bio, genres: p.genres }))
            });

            // Simulate the API call delay and response structure.
            await new Promise(resolve => setTimeout(resolve, 2000));
            const mockBackendResponse = {
                vibeDescription: `Refined: ${vibeDescription}`,
                tags: ['mock', 'backend', 'response'],
                recommendations: [
                    { type: 'stoodio', entityId: 'studio-1', reason: 'Matches the described vibe perfectly.' },
                    { type: 'engineer', entityId: 'eng-1', reason: 'Specializes in this genre.' }
                ]
            };
            
            const results = {
                ...mockBackendResponse,
                recommendations: mockBackendResponse.recommendations.map((rec: any) => {
                    let entity;
                    if (rec.type === 'stoodio') entity = stoodioz.find(s => s.id === rec.entityId);
                    else if (rec.type === 'engineer') entity = engineers.find(e => e.id === rec.entityId);
                    else if (rec.type === 'producer') entity = producers.find(p => p.id === rec.entityId);
                    return entity ? { ...rec, entity } : null;
                }).filter(Boolean)
            };

            setVibeMatchResults(results as VibeMatchResult);
            handleNavigate(AppView.VIBE_MATCHER_RESULTS);
        } catch (error) {
            console.error("Vibe Match failed", error);
            // You can add a notification here to inform the user of the error.
        } finally {
            setIsVibeMatcherLoading(false);
        }
    }, [stoodioz, engineers, producers, handleNavigate]);

    const handleMarkAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const handleMarkAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const handleDismissNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleFetchSmartReplies = useCallback(async (messages: Message[]) => {
        if (!currentUser) return;
        setIsSmartRepliesLoading(true);
        try {
            const replies = await generateSmartReplies(messages, currentUser.id);
            setSmartReplies(replies);
        } catch (error) {
            console.error("Failed to fetch smart replies:", error);
            setSmartReplies([]);
        } finally {
            setIsSmartRepliesLoading(false);
        }
    }, [currentUser]);

    const handleSendMessage = useCallback((conversationId: string, messageContent: Omit<Message, 'id' | 'senderId' | 'timestamp'>) => {
        if (!currentUser) return;

        const newMessage: Message = {
            ...messageContent,
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            timestamp: new Date().toISOString(),
        };

        let updatedConversation: Conversation | null = null;

        setConversations(prev => prev.map(convo => {
            if (convo.id === conversationId) {
                updatedConversation = {
                    ...convo,
                    messages: [...convo.messages, newMessage],
                    unreadCount: 0,
                };
                return updatedConversation;
            }
            return convo;
        }));

        if (updatedConversation) {
            handleFetchSmartReplies(updatedConversation.messages);
            
            setTimeout(() => {
                const participant = updatedConversation?.participants.find(p => p.id !== currentUser.id);
                if (participant) {
                     const replyMessage: Message = {
                        id: `msg-${Date.now() + 1}`,
                        senderId: participant.id,
                        text: 'This is a simulated reply.',
                        timestamp: new Date(Date.now() + 1000).toISOString(),
                        type: 'text'
                    };
                     setConversations(prev => prev.map(c => c.id === conversationId ? {...c, messages: [...c.messages, replyMessage]} : c));
                }
            }, 2000);

        }
    }, [currentUser, handleFetchSmartReplies]);
    
    const handleStartConversation = useCallback((participant: Artist | Engineer | Stoodio | Producer) => {
        if (!currentUser) return;

        // A 1-on-1 conversation is identified by having exactly two participants: the current user and the other person.
        const existingConvo = conversations.find(c => {
            const participantIds = new Set(c.participants.map(p => p.id));
            return participantIds.size === 2 && participantIds.has(currentUser.id) && participantIds.has(participant.id);
        });

        if (existingConvo) {
            setSelectedConversationId(existingConvo.id);
            handleNavigate(AppView.INBOX);
        } else {
            // Create a new 1-on-1 conversation
            const newConversation: Conversation = {
                id: `convo-${currentUser.id}-${participant.id}-${Date.now()}`,
                participants: [currentUser, participant],
                messages: [],
                unreadCount: 0,
                title: participant.name,
                imageUrl: participant.imageUrl,
            };

            setConversations(prev => [newConversation, ...prev]);
            setSelectedConversationId(newConversation.id);
            handleNavigate(AppView.INBOX);
        }
    }, [currentUser, conversations, handleNavigate]);

    const handleConfirmRemoteMix = useCallback(async (bookingRequest: BookingRequest) => {
        if (!currentUser || !bookingRequest.requestedEngineerId) return;
        setIsLoading(true);
        const engineer = engineers.find(e => e.id === bookingRequest.requestedEngineerId);
        if (!engineer) {
            setIsLoading(false);
            return;
        }

        const newBooking: Booking = {
            id: `BKG-MIX-${Date.now()}`,
            date: bookingRequest.date,
            startTime: 'N/A',
            duration: 0,
            totalCost: bookingRequest.totalCost,
            engineerPayRate: bookingRequest.totalCost,
            requestType: BookingRequestType.SPECIFIC_ENGINEER,
            status: BookingStatus.PENDING_APPROVAL,
            stoodio: undefined,
            room: undefined,
            artist: userRole === UserRole.ARTIST ? (currentUser as Artist) : null,
            engineer: null,
            producer: userRole === UserRole.PRODUCER ? (currentUser as Producer) : null,
            requestedEngineerId: engineer.id,
            bookedById: currentUser.id,
            bookedByRole: userRole!,
            mixingDetails: bookingRequest.mixingDetails,
        };

        setBookings(prev => [newBooking, ...prev]);
        setNotifications(prev => [...prev, {
            id: `notif-mix-${Date.now()}`,
            userId: engineer.id,
            message: `${currentUser.name} has requested a remote mixing session with you.`,
            timestamp: new Date().toISOString(),
            type: NotificationType.BOOKING_REQUEST,
            read: false,
            link: { view: AppView.ENGINEER_DASHBOARD }
        }]);

        setLatestBooking(newBooking);
        setIsMixingModalOpen(false);
        handleNavigate(AppView.CONFIRMATION);
        setIsLoading(false);
    }, [currentUser, userRole, engineers, handleNavigate]);

    const handleInitiateInStudioMix = useCallback((engineer: Engineer, mixingDetails: MixingDetails) => {
        setBookingIntent({ engineer, mixingDetails });
        setIsMixingModalOpen(false);
        handleNavigate(AppView.STOODIO_LIST);
        setNotifications(prev => [...prev, {
            id: `notif-${Date.now()}`,
            userId: currentUser!.id,
            message: `Now, select a studio for your mixing session with ${engineer.name}.`,
            timestamp: new Date().toISOString(),
            type: NotificationType.GENERAL,
            read: false,
        }]);
    }, [handleNavigate, currentUser]);


    const renderAppContent = () => {
        const handleGuestInteraction = () => handleNavigate(AppView.LOGIN);

        switch (currentView) {
            // --- Unauthenticated Views ---
            case AppView.LANDING_PAGE:
                return <LandingPage onNavigate={handleNavigate} onSelectStoodio={handleViewStoodioDetails} stoodioz={stoodioz} engineers={engineers} artists={artists} producers={producers} bookings={bookings} vibeMatchResults={vibeMatchResults} onSelectProducer={handleViewProducerProfile} />;
            case AppView.LOGIN:
                return <Login onLogin={handleLogin} error={loginError} onNavigate={handleNavigate} />;
            case AppView.CHOOSE_PROFILE:
                return <ChooseProfile onSelectRole={handleSelectRoleToSetup} />;
            case AppView.ARTIST_SETUP:
                return <ArtistSetup onCompleteSetup={handleCompleteArtistSetup} onNavigate={handleNavigate} />;
            case AppView.ENGINEER_SETUP:
                return <EngineerSetup onCompleteSetup={handleCompleteEngineerSetup} onNavigate={handleNavigate} />;
            case AppView.PRODUCER_SETUP:
                return <ProducerSetup onCompleteSetup={handleCompleteProducerSetup} onNavigate={handleNavigate} />;
            case AppView.STOODIO_SETUP:
                return <StoodioSetup onCompleteSetup={handleCompleteStoodioSetup} onNavigate={handleNavigate} />;
            case AppView.PRIVACY_POLICY:
                return <PrivacyPolicy onBack={handleGoBack} />;
            case AppView.SUBSCRIPTION_PLANS:
                return <SubscriptionPlans onSelect={handleSelectPlan} />;

            // --- Shared (Auth & Guest) Views ---
            case AppView.STOODIO_LIST:
                return <StoodioList stoodioz={stoodioz} onSelectStoodio={handleViewStoodioDetails} />;
            case AppView.BOOKING_MODAL:
            case AppView.STOODIO_DETAIL:
                return selectedStoodio ? <StoodioDetail stoodio={selectedStoodio} onBook={currentUser ? handleOpenBookingModal : handleGuestInteraction} onBack={handleGoBack} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} currentUser={currentUser} userRole={userRole} reviews={reviews} bookings={bookings.filter(b => b.stoodio?.id === selectedStoodio.id)} allArtists={artists} allEngineers={engineers} allStoodioz={stoodioz} allProducers={producers} onSelectArtist={handleViewArtistProfile} onSelectEngineer={handleViewEngineerProfile} onSelectStoodio={handleViewStoodioDetails} onSelectProducer={handleViewProducerProfile} onStartConversation={currentUser ? handleStartConversation : handleGuestInteraction} onLikePost={handleLikePost} onCommentOnPost={handleCommentOnPost} /> : <StoodioList stoodioz={stoodioz} onSelectStoodio={handleViewStoodioDetails} />;
            case AppView.ENGINEER_LIST:
                return <EngineerList engineers={engineers} onSelectEngineer={handleViewEngineerProfile} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} currentUser={currentUser} userRole={userRole} />;
            case AppView.ENGINEER_PROFILE:
                return selectedEngineer ? <EngineerProfile engineer={selectedEngineer} onBack={handleGoBack} reviews={reviews} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} isFollowing={currentUser && 'following' in currentUser ? currentUser.following.engineers.includes(selectedEngineer.id) : false} userRole={userRole} bookings={bookings} allArtists={artists} allEngineers={engineers} allStoodioz={stoodioz} allProducers={producers} onSelectArtist={handleViewArtistProfile} onSelectEngineer={handleViewEngineerProfile} onSelectStoodio={handleViewStoodioDetails} onSelectProducer={handleViewProducerProfile} onStartNavigation={handleNavigateToStudio} onStartConversation={currentUser ? handleStartConversation : handleGuestInteraction} onLikePost={handleLikePost} onCommentOnPost={handleCommentOnPost} currentUser={currentUser} onInitiateBooking={handleInitiateBookingWithEngineer} onOpenMixingModal={() => setIsMixingModalOpen(true)} /> : <EngineerList engineers={engineers} onSelectEngineer={handleViewEngineerProfile} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} currentUser={currentUser} userRole={userRole} />;
            case AppView.PRODUCER_LIST:
                return <ProducerList producers={producers} onSelectProducer={handleViewProducerProfile} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} currentUser={currentUser} userRole={userRole} />;
            case AppView.PRODUCER_PROFILE:
                return selectedProducer ? <ProducerProfile producer={selectedProducer} onBack={handleGoBack} reviews={reviews} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} isFollowing={currentUser && 'following' in currentUser ? currentUser.following.producers.includes(selectedProducer.id) : false} userRole={userRole} allArtists={artists} allEngineers={engineers} allStoodioz={stoodioz} allProducers={producers} onSelectArtist={handleViewArtistProfile} onSelectEngineer={handleViewEngineerProfile} onSelectStoodio={handleViewStoodioDetails} onSelectProducer={handleViewProducerProfile} onStartConversation={currentUser ? handleStartConversation : handleGuestInteraction} onLikePost={handleLikePost} onCommentOnPost={handleCommentOnPost} currentUser={currentUser} onInitiateBookingWithProducer={handleInitiateBookingWithProducer} /> : <ProducerList producers={producers} onSelectProducer={handleViewProducerProfile} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} currentUser={currentUser} userRole={userRole} />;
            case AppView.ARTIST_LIST:
                 return <ArtistList artists={artists} onSelectArtist={handleViewArtistProfile} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} currentUser={currentUser} userRole={userRole}/>;
            case AppView.ARTIST_PROFILE:
                return selectedArtist ? <ArtistProfile artist={selectedArtist} onBack={handleGoBack} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} isFollowing={currentUser && 'following' in currentUser ? currentUser.following.artists.includes(selectedArtist.id) : false} userRole={userRole} onStartNavigation={()=>{}} onStartConversation={currentUser ? handleStartConversation : handleGuestInteraction} allArtists={artists} allEngineers={engineers} allStoodioz={stoodioz} allProducers={producers} onSelectArtist={handleViewArtistProfile} onSelectEngineer={handleViewEngineerProfile} onSelectStoodio={handleViewStoodioDetails} onSelectProducer={handleViewProducerProfile} onLikePost={handleLikePost} onCommentOnPost={handleCommentOnPost} currentUser={currentUser} /> : <ArtistList artists={artists} onSelectArtist={handleViewArtistProfile} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} currentUser={currentUser} userRole={userRole}/>;
            case AppView.MAP_VIEW:
                return <MapView stoodioz={stoodioz} engineers={engineers} artists={artists} producers={producers} onSelectStoodio={handleViewStoodioDetails} onSelectEngineer={handleViewEngineerProfile} onSelectArtist={handleViewArtistProfile} onSelectProducer={handleViewProducerProfile} bookings={bookings} vibeMatchResults={vibeMatchResults} onInitiateBooking={currentUser ? handleInitiateBookingWithEngineer : undefined} />;
            
            // --- Authenticated Views ---
            case AppView.THE_STAGE:
                if (currentUser) return <TheStage currentUser={currentUser} allArtists={artists} allEngineers={engineers} allStoodioz={stoodioz} allProducers={producers} onPost={handleCreatePost} onLikePost={handleLikePost} onCommentOnPost={handleCommentOnPost} onToggleFollow={handleToggleFollow} onSelectArtist={handleViewArtistProfile} onSelectEngineer={handleViewEngineerProfile} onSelectStoodio={handleViewStoodioDetails} onSelectProducer={handleViewProducerProfile} onNavigate={handleNavigate} />;
                return <Login onLogin={handleLogin} error={null} onNavigate={handleNavigate} />;
            case AppView.CONFIRMATION:
                if (latestBooking) return <BookingConfirmation booking={latestBooking} onDone={() => handleNavigate(AppView.MY_BOOKINGS)} engineers={engineers}/>;
                return <StoodioList stoodioz={stoodioz} onSelectStoodio={handleViewStoodioDetails} />;
            case AppView.MY_BOOKINGS:
                const userBookings = bookings.filter(b => b.bookedById === currentUser?.id || b.artist?.id === currentUser?.id || b.engineer?.id === currentUser?.id || b.stoodio?.id === currentUser?.id);
                return <MyBookings bookings={userBookings} engineers={engineers} onOpenTipModal={setTipModalBooking} onNavigateToStudio={handleNavigateToStudio} onOpenCancelModal={setBookingToCancel} userRole={userRole} />;

            case AppView.STOODIO_DASHBOARD:
                if (userRole === UserRole.STOODIO) return <StoodioDashboard stoodio={currentUser as Stoodio} bookings={bookings.filter(b => b.stoodio?.id === currentUser?.id)} onUpdateStoodio={handleUpdateStoodio} onPost={handleCreatePost} onLikePost={handleLikePost} onCommentOnPost={handleCommentOnPost} currentUser={currentUser} onPostJob={handlePostJob} allArtists={artists} allEngineers={engineers} allStoodioz={stoodioz} allProducers={producers} onToggleFollow={handleToggleFollow} onSelectStoodio={handleViewStoodioDetails} onSelectArtist={handleViewArtistProfile} onSelectEngineer={handleViewEngineerProfile} onSelectProducer={handleViewProducerProfile} onVerificationSubmit={handleVerificationSubmit} onNavigate={handleNavigate} onOpenAddFundsModal={() => setIsAddFundsOpen(true)} onOpenPayoutModal={() => setIsPayoutOpen(true)} onViewBooking={handleViewBooking} />;
                return <Login onLogin={handleLogin} error={null} onNavigate={handleNavigate} />;

            case AppView.ENGINEER_DASHBOARD:
                if (userRole === UserRole.ENGINEER) {
                    const engineerBookings = bookings.filter(b => b.engineer?.id === currentUser?.id || b.status === BookingStatus.PENDING || (b.status === BookingStatus.PENDING_APPROVAL && b.requestedEngineerId === currentUser?.id));
                    return <EngineerDashboard engineer={currentUser as Engineer} reviews={reviews.filter(r => r.engineerId === currentUser?.id)} bookings={engineerBookings} onUpdateEngineer={handleUpdateEngineer} onAcceptBooking={handleAcceptBooking} onDenyBooking={handleDenyBooking} onStartSession={handleStartSession} currentUser={currentUser} allArtists={artists} allEngineers={engineers} allStoodioz={stoodioz} allProducers={producers} onSelectArtist={handleViewArtistProfile} onSelectEngineer={handleViewEngineerProfile} onSelectStoodio={handleViewStoodioDetails} onSelectProducer={handleViewProducerProfile} onToggleFollow={handleToggleFollow} onNavigateToStudio={handleNavigateToStudio} onStartConversation={handleStartConversation} onPost={handleCreatePost} onLikePost={handleLikePost} onCommentOnPost={handleCommentOnPost} onNavigate={handleNavigate} onOpenAddFundsModal={() => setIsAddFundsOpen(true)} onOpenPayoutModal={() => setIsPayoutOpen(true)} onViewBooking={handleViewBooking} />;
                }
                return <Login onLogin={handleLogin} error={null} onNavigate={handleNavigate} />;

            case AppView.PRODUCER_DASHBOARD:
                if (userRole === UserRole.PRODUCER) return <ProducerDashboard producer={currentUser as Producer} onUpdateProducer={handleUpdateProducer} currentUser={currentUser} allArtists={artists} allEngineers={engineers} allStoodioz={stoodioz} allProducers={producers} onSelectArtist={handleViewArtistProfile} onSelectEngineer={handleViewEngineerProfile} onSelectStoodio={handleViewStoodioDetails} onSelectProducer={handleViewProducerProfile} onToggleFollow={handleToggleFollow} onStartConversation={handleStartConversation} onPost={handleCreatePost} onLikePost={handleLikePost} onCommentOnPost={handleCommentOnPost} onNavigate={handleNavigate} onOpenAddFundsModal={() => setIsAddFundsOpen(true)} onOpenPayoutModal={() => setIsPayoutOpen(true)} onViewBooking={handleViewBooking} onOpenVibeMatcher={handleOpenVibeMatcher} />;
                return <Login onLogin={handleLogin} error={null} onNavigate={handleNavigate} />;

            case AppView.ARTIST_DASHBOARD:
                if (userRole === UserRole.ARTIST) return <ArtistDashboard artist={currentUser as Artist} bookings={bookings.filter(b => b.artist?.id === currentUser?.id)} conversations={conversations} onNavigate={handleNavigate} onUpdateProfile={handleUpdateArtistProfile} allStoodioz={stoodioz} allEngineers={engineers} allArtists={artists} allProducers={producers} onToggleFollow={handleToggleFollow} onSelectStoodio={handleViewStoodioDetails} onSelectEngineer={handleViewEngineerProfile} onSelectArtist={handleViewArtistProfile} onSelectProducer={handleViewProducerProfile} onPost={handleCreatePost} onLikePost={handleLikePost} onCommentOnPost={handleCommentOnPost} currentUser={currentUser} onOpenVibeMatcher={handleOpenVibeMatcher} onOpenAddFundsModal={() => setIsAddFundsOpen(true)} onViewBooking={handleViewBooking} />;
                 return <Login onLogin={handleLogin} error={null} onNavigate={handleNavigate} />;

            case AppView.INBOX:
                 if (currentUser) return <Inbox conversations={conversations} onSendMessage={handleSendMessage} selectedConversationId={selectedConversationId} onSelectConversation={setSelectedConversationId} currentUser={currentUser} bookings={bookings} onNavigate={handleNavigate} smartReplies={smartReplies} isSmartRepliesLoading={isSmartRepliesLoading} onFetchSmartReplies={handleFetchSmartReplies} />;
                 return <Login onLogin={handleLogin} error={null} onNavigate={handleNavigate} />;
            
            case AppView.ACTIVE_SESSION:
                 if (activeSession) return <ActiveSession session={activeSession} onEndSession={handleEndSession} onSelectArtist={handleViewArtistProfile} />;
                 return <Login onLogin={handleLogin} error={null} onNavigate={handleNavigate} />;

            case AppView.VIBE_MATCHER_RESULTS:
                if (vibeMatchResults) return <VibeMatcherResults results={vibeMatchResults} onSelectStoodio={handleViewStoodioDetails} onSelectEngineer={handleViewEngineerProfile} onSelectProducer={handleViewProducerProfile} onBack={handleGoBack} />;
                return <Login onLogin={handleLogin} error={null} onNavigate={handleNavigate} />;

            default:
                return <LandingPage onNavigate={handleNavigate} onSelectStoodio={handleViewStoodioDetails} stoodioz={stoodioz} engineers={engineers} artists={artists} producers={producers} bookings={bookings} vibeMatchResults={vibeMatchResults} onSelectProducer={handleViewProducerProfile} />;
        }
    };

    return (
        <div className="main-container animate-fade-in">
            <Header
                onNavigate={handleNavigate}
                userRole={userRole}
                notifications={notifications}
                unreadCount={unreadCount}
                onGoBack={handleGoBack}
                onGoForward={handleGoForward}
                canGoBack={canGoBack}
                canGoForward={canGoForward}
                onLogout={handleLogout}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                allArtists={artists}
                allEngineers={engineers}
                allProducers={producers}
                allStoodioz={stoodioz}
                onSelectArtist={handleViewArtistProfile}
                onSelectEngineer={handleViewEngineerProfile}
                onSelectProducer={handleViewProducerProfile}
                onSelectStoodio={handleViewStoodioDetails}
            />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={<LoadingSpinner />}>
                    {isLoading && currentView === AppView.LANDING_PAGE ? <LoadingSpinner /> : renderAppContent()}
                </Suspense>

                {currentView === AppView.BOOKING_MODAL && selectedStoodio && bookingTime && (
                    <BookingModal 
                        stoodio={selectedStoodio} 
                        engineers={engineers}
                        producers={producers}
                        currentUser={currentUser}
                        onClose={handleGoBack}
                        onConfirm={handleConfirmBooking}
                        isLoading={isLoading}
                        initialDate={bookingTime.date}
                        initialTime={bookingTime.time}
                        initialRoom={bookingTime.room}
                        bookingIntent={bookingIntent}
                    />
                )}
                {tipModalBooking && (
                    <TipModal 
                        booking={tipModalBooking}
                        onClose={() => setTipModalBooking(null)}
                        onConfirmTip={handleConfirmTip}
                    />
                )}
                {bookingToCancel && (
                    <BookingCancellationModal
                        booking={bookingToCancel}
                        onClose={() => setBookingToCancel(null)}
                        onConfirm={handleConfirmCancellation}
                    />
                )}
                {isVibeMatcherOpen && (
                    <VibeMatcherModal
                        onClose={handleCloseVibeMatcher}
                        onAnalyze={handleVibeMatch}
                        isLoading={isVibeMatcherLoading}
                    />
                )}
                {isAddFundsOpen && (
                    <AddFundsModal
                        onClose={() => setIsAddFundsOpen(false)}
                        onConfirm={handleAddFunds}
                    />
                )}
                {isPayoutOpen && currentUser && (
                    <RequestPayoutModal
                        onClose={() => setIsPayoutOpen(false)}
                        onConfirm={handleRequestPayout}
                        currentBalance={currentUser.walletBalance}
                    />
                )}
                {isMixingModalOpen && selectedEngineer && (
                    <MixingRequestModal
                        engineer={selectedEngineer}
                        onClose={() => setIsMixingModalOpen(false)}
                        onConfirm={handleConfirmRemoteMix}
                        onInitiateInStudio={handleInitiateInStudioMix}
                        isLoading={isLoading}
                    />
                )}
                
            </main>
             <NotificationToasts 
                notifications={notifications.filter(n => !n.read).slice(0, 3)} 
                onDismiss={handleDismissNotification}
            />
        </div>
    );
};

export default App;