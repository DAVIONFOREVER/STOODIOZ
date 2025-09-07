import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { differenceInHours } from 'date-fns';
import type { Stoodio, Booking, BookingRequest, Engineer, Location, Review, Conversation, Message, Artist, AppNotification, Post, LinkAttachment, Comment, Transaction, VibeMatchResult, Room } from './types';
import { AppView, UserRole, BookingStatus, BookingRequestType, NotificationType, VerificationStatus } from './types';
import { STOODIOZ, ENGINEERS, REVIEWS, CONVERSATIONS, MOCK_ARTISTS, SERVICE_FEE_PERCENTAGE } from './constants';
import { getVibeMatchResults } from './services/geminiService';
import { webSocketService } from './services/webSocketService';
import { calculateDistance } from './utils/location';
import Header from './components/Header';
import StoodioList from './components/StudioList';
import StoodioDetail from './components/StoodioDetail';
import BookingModal from './components/BookingModal';
import BookingConfirmation from './components/BookingConfirmation';
import MyBookings from './components/MyBookings';
import StoodioDashboard from './components/StoodioDashboard';
import EngineerDashboard from './components/EngineerDashboard';
import Inbox from './components/Inbox';
import ActiveSession from './components/ActiveSession';
import TipModal from './components/TipModal';
import ArtistList from './components/ArtistList';
import ArtistProfile from './components/ArtistProfile';
import ArtistDashboard from './components/ArtistDashboard';
import EngineerList from './components/EngineerList';
import EngineerProfile from './components/EngineerProfile';
import MapView from './components/MapView';
import NotificationToasts from './components/NotificationToasts';
import LandingPage from './components/LandingPage';
import ChooseProfile from './components/ChooseProfile';
import ArtistSetup from './components/ArtistSetup';
import EngineerSetup from './components/EngineerSetup';
import StoodioSetup from './components/StoodioSetup';
import Login from './components/Login';
import PrivacyPolicy from './components/PrivacyPolicy';
import TheStage from './components/TheStage';
import VibeMatcherModal from './components/VibeMatcherModal';
import VibeMatcherResults from './components/VibeMatcherResults';
import BookingCancellationModal from './components/BookingCancellationModal';

type JobPostData = Pick<BookingRequest, 'date' | 'startTime' | 'duration' | 'requiredSkills' | 'engineerPayRate'>;

const App: React.FC = () => {
    // --- App State ---
    const [history, setHistory] = useState<AppView[]>([AppView.LANDING_PAGE]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);
    const [stoodioz, setStoodioz] = useState<Stoodio[]>(STOODIOZ);
    const [engineers, setEngineers] = useState<Engineer[]>(ENGINEERS);
    const [artists, setArtists] = useState<Artist[]>(MOCK_ARTISTS);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reviews] = useState<Review[]>(REVIEWS);
    const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    
    // --- Auth State ---
    const [currentUser, setCurrentUser] = useState<Artist | Engineer | Stoodio | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [setupRole, setSetupRole] = useState<UserRole | null>(null);

    // --- UI State ---
    const [selectedStoodio, setSelectedStoodio] = useState<Stoodio | null>(null);
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    const [selectedEngineer, setSelectedEngineer] = useState<Engineer | null>(null);
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
    const [bookingIntent, setBookingIntent] = useState<{ engineer: Engineer; date: string; time: string; } | null>(null);


    // --- Derived State ---
    const currentView = history[historyIndex];
    const canGoBack = historyIndex > 0;
    const canGoForward = historyIndex < history.length - 1;
    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const userRole: UserRole | null = useMemo(() => {
        if (!currentUser) return null;
        if ('specialties' in currentUser) return UserRole.ENGINEER;
        if ('amenities' in currentUser) return UserRole.STOODIO;
        return UserRole.ARTIST;
    }, [currentUser]);

    // --- "Uber-like" Real-time Job Notification Logic ---
    useEffect(() => {
        const showPushNotification = (title: string, options: NotificationOptions) => {
            if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, options);
                });
            }
        };

        const handleNewBooking = (newBooking: Booking) => {
            // This logic runs for all users, but we only notify relevant engineers.
            if (userRole === UserRole.ENGINEER && currentUser) {
                const engineer = currentUser as Engineer;
                const prefs = engineer.notificationPreferences;
                
                // Only proceed if the engineer has alerts enabled
                if (!prefs || !prefs.enabled) return;

                const distance = calculateDistance(engineer.coordinates, newBooking.stoodio.coordinates);

                // Check if the job is within the engineer's preferred radius
                if (distance <= prefs.radius) {
                    const message = `New ${newBooking.duration}hr session available at ${newBooking.stoodio.name}. Payout: $${(newBooking.engineerPayRate * newBooking.duration).toFixed(2)}.`;
                    
                    // 1. Create an in-app notification
                    setNotifications(prev => [...prev, {
                        id: `notif-${Date.now()}`,
                        userId: engineer.id,
                        message: `Job Alert: ${message}`,
                        timestamp: new Date().toISOString(),
                        type: NotificationType.BOOKING_REQUEST,
                        read: false,
                        link: { view: AppView.ENGINEER_DASHBOARD }
                    }]);
                    
                    // 2. Trigger a system push notification
                    showPushNotification('New Session Available!', {
                        body: message,
                        icon: '/logo192.png', // Assuming a logo exists in public folder
                        tag: newBooking.id, // Tag prevents multiple notifications for the same booking
                    });
                }
            }
        };
        
        // Subscribe to the mock websocket service
        const unsubscribe = webSocketService.on('new-booking', handleNewBooking);

        // Clean up the subscription on component unmount
        return () => unsubscribe();

    }, [currentUser, userRole]);


    // --- Navigation Handlers ---
    const handleNavigate = useCallback((view: AppView) => {
        setLoginError(null);
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(view);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        if (view === AppView.STOODIO_LIST || view === AppView.ARTIST_LIST || view === AppView.ENGINEER_LIST || view === AppView.MAP_VIEW) {
            setSelectedStoodio(null);
            setSelectedArtist(null);
            setSelectedEngineer(null);
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

    // --- Auth Handlers ---
    const handleLogin = useCallback((email: string, password: string): void => {
        const allUsers: (Artist | Engineer | Stoodio)[] = [...artists, ...engineers, ...stoodioz];
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
            setLoginError("Invalid email or password.");
        }
    }, [artists, engineers, stoodioz]);

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
    };
    
    const handleCompleteArtistSetup = (name: string, bio: string, email: string, password: string) => {
        const newArtist: Artist = {
            id: `artist-${Date.now()}`,
            name,
            bio,
            email,
            password,
            imageUrl: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/100`,
            followers: 0,
            following: { stoodioz: [], engineers: [], artists: [] },
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
            imageUrl: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/200`,
            audioSampleUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-1-short.mp3',
            followers: 0,
            following: { artists: [], engineers: [], stoodioz: [] },
            followerIds: [],
            coordinates: { lat: 40.7128, lon: -74.0060 }, // Default to NY
            isAvailable: true,
            walletBalance: 100,
            walletTransactions: [],
            notificationPreferences: { radius: 50, enabled: true },
        };
        setEngineers(prev => [...prev, newEngineer]);
        setCurrentUser(newEngineer);
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
            imageUrl: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/600/400`,
            amenities: ['Vocal Booth', 'Lounge Area'],
            coordinates: { lat: 25.7617, lon: -80.1918 }, // Default to Miami
            availability: [],
            photos: [],
            followers: 0,
            following: { artists: [], engineers: [], stoodioz: [] },
            followerIds: [],
            walletBalance: 0,
            walletTransactions: [],
            rooms: [
                { id: `room-${Date.now()}`, name: 'Main Control Room', description: 'The primary recording and mixing space.', hourlyRate: 80, photos: [] }
            ],
            verificationStatus: VerificationStatus.UNVERIFIED,
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

    const handleConfirmBooking = useCallback(async (bookingRequest: BookingRequest) => {
        if (!selectedStoodio || !userRole || !currentUser || (userRole !== UserRole.ARTIST && userRole !== UserRole.ENGINEER)) return;
        setIsLoading(true);
        setTimeout(() => {
            try {
                const getInitialStatus = () => {
                    if (bookingRequest.requestType === BookingRequestType.BRING_YOUR_OWN) return BookingStatus.CONFIRMED;
                    if (bookingRequest.requestType === BookingRequestType.SPECIFIC_ENGINEER) return BookingStatus.PENDING_APPROVAL;
                    return BookingStatus.PENDING; // This is now an open job for first-come, first-served
                };

                const newBooking: Booking = {
                    id: `BKG-${Date.now()}`,
                    ...bookingRequest,
                    stoodio: selectedStoodio,
                    engineer: null,
                    artist: userRole === UserRole.ARTIST ? (currentUser as Artist) : null,
                    status: getInitialStatus(),
                    requestedEngineerId: bookingRequest.requestedEngineerId || null,
                    bookedById: currentUser.id,
                    bookedByRole: userRole,
                };

                setBookings(prev => [...prev, newBooking]);
                setLatestBooking(newBooking);
                
                // Emit the new booking for real-time alerts
                if (newBooking.requestType !== BookingRequestType.BRING_YOUR_OWN) {
                    webSocketService.emit('new-booking', newBooking);
                }

                handleNavigate(AppView.CONFIRMATION);
            } finally {
                setIsLoading(false);
                setSelectedStoodio(null);
                setBookingTime(null);
                setBookingIntent(null);
            }
        }, 1500);
    }, [selectedStoodio, currentUser, userRole, handleNavigate]);
    
    const handlePostJob = useCallback((jobRequest: JobPostData) => {
        if (!currentUser || userRole !== UserRole.STOODIO) return;
        const stoodio = currentUser as Stoodio;
        
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

        // Emit the new job for real-time alerts
        webSocketService.emit('new-booking', newJob);
    
        setNotifications(prev => [...prev, {
            id: `notif-${Date.now()}`, 
            userId: currentUser!.id,
            message: `Your job posting for ${stoodio.name} has been listed.`, 
            timestamp: new Date().toISOString(),
            type: NotificationType.GENERAL,
            read: false
        }]);
    
    }, [currentUser, userRole]);

    const handleConfirmCancellation = useCallback((bookingId: string) => {
        const bookingToCancel = bookings.find(b => b.id === bookingId);
        if (!bookingToCancel || currentUser?.id !== bookingToCancel.bookedById) return;

        const bookingStartTime = new Date(`${bookingToCancel.date}T${bookingToCancel.startTime}`);
        const hoursUntilSession = differenceInHours(bookingStartTime, new Date());

        let refundPercentage = 0;
        if (hoursUntilSession > 48) {
            refundPercentage = 1.0; // 100% refund
        } else if (hoursUntilSession > 24) {
            refundPercentage = 0.5; // 50% refund
        }

        const refundAmount = bookingToCancel.totalCost * refundPercentage;

        if (refundAmount > 0) {
            if (bookingToCancel.bookedByRole === UserRole.ARTIST) {
                const currentArtist = artists.find(a => a.id === bookingToCancel.bookedById);
                if (currentArtist) {
                    const newTx: Transaction = { 
                        id: `txn-cancel-${Date.now()}`, 
                        description: `Refund for cancelled session at ${bookingToCancel.stoodio.name}`, 
                        amount: refundAmount, 
                        date: new Date().toISOString(), 
                        type: 'credit' 
                    };
                    const updatedArtist = { 
                        ...currentArtist,
                        walletBalance: currentArtist.walletBalance + refundAmount, 
                        walletTransactions: [newTx, ...currentArtist.walletTransactions] 
                    };
                    setArtists(prev => prev.map(a => a.id === updatedArtist.id ? updatedArtist : a));
                    if(currentUser?.id === updatedArtist.id) {
                        setCurrentUser(updatedArtist);
                    }
                }
            } else if (bookingToCancel.bookedByRole === UserRole.ENGINEER) {
                 const currentEngineer = engineers.find(e => e.id === bookingToCancel.bookedById);
                if (currentEngineer) {
                    const newTx: Transaction = { 
                        id: `txn-cancel-${Date.now()}`, 
                        description: `Refund for cancelled session at ${bookingToCancel.stoodio.name}`, 
                        amount: refundAmount, 
                        date: new Date().toISOString(), 
                        type: 'credit' 
                    };
                    const updatedEngineer = { 
                        ...currentEngineer,
                        walletBalance: currentEngineer.walletBalance + refundAmount, 
                        walletTransactions: [newTx, ...currentEngineer.walletTransactions] 
                    };
                    setEngineers(prev => prev.map(e => e.id === updatedEngineer.id ? updatedEngineer : e));
                    if(currentUser?.id === updatedEngineer.id) {
                        setCurrentUser(updatedEngineer);
                    }
                }
            }
        }
        
        const updatedBooking = { ...bookingToCancel, status: BookingStatus.CANCELLED };
        setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));

        setBookingToCancel(null);

    }, [bookings, currentUser, artists, engineers]);


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

        // 1. Set status to Pending
        updateStoodioState(stoodioId, {
            verificationStatus: VerificationStatus.PENDING,
            googleBusinessProfileUrl: data.googleBusinessProfileUrl,
            websiteUrl: data.websiteUrl,
        });

        // 2. Simulate admin review and approval
        setTimeout(() => {
            updateStoodioState(stoodioId, { verificationStatus: VerificationStatus.VERIFIED });
            
            // 3. Send notification
            setNotifications(prev => [...prev, {
                id: `notif-verified-${Date.now()}`,
                userId: stoodioId,
                message: "Congratulations! Your stoodio has been verified.",
                timestamp: new Date().toISOString(),
                type: NotificationType.GENERAL,
                read: false,
            }]);
        }, 4000); // 4-second delay for simulation
    };
    
    const handleUpdateEngineer = (updatedProfile: Partial<Engineer>) => {
        if (userRole !== UserRole.ENGINEER) return;
        const updatedEngineer = { ...currentUser as Engineer, ...updatedProfile };
        setCurrentUser(updatedEngineer);
        setEngineers(prev => prev.map(e => e.id === updatedEngineer.id ? updatedEngineer : e));
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
    
            const newBookings = [...bookings];
            newBookings[bookingIndex] = updatedBooking;
            setBookings(newBookings);
    
            if (updatedBooking.artist) {
                const notification: AppNotification = {
                    id: `notif-${Date.now()}`,
                    userId: updatedBooking.artist!.id,
                    message: `Your session at ${updatedBooking.stoodio.name} is confirmed with engineer ${engineer.name}!`,
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
    }, [bookings, currentUser, userRole]);
    
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
    
        const newBookings = [...bookings];
        newBookings[bookingIndex] = updatedBooking;
        setBookings(newBookings);
    
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
    
    const handleToggleFollow = useCallback((type: 'stoodio' | 'engineer' | 'artist', id: string) => {
        if (!currentUser) return;
    
        if (userRole === UserRole.ARTIST) {
            const currentArtist = currentUser as Artist;
            if (type === 'artist' && id === currentArtist.id) return;
            let updatedFollowing: Artist['following'];
            
            if (type === 'stoodio') {
                const isFollowing = currentArtist.following.stoodioz.includes(id);
                updatedFollowing = { ...currentArtist.following, stoodioz: isFollowing ? currentArtist.following.stoodioz.filter(s => s !== id) : [...currentArtist.following.stoodioz, id] };
            } else if (type === 'engineer') {
                const isFollowing = currentArtist.following.engineers.includes(id);
                updatedFollowing = { ...currentArtist.following, engineers: isFollowing ? currentArtist.following.engineers.filter(e => e !== id) : [...currentArtist.following.engineers, id] };
            } else if (type === 'artist') {
                const isFollowing = currentArtist.following.artists.includes(id);
                updatedFollowing = { ...currentArtist.following, artists: isFollowing ? currentArtist.following.artists.filter(a => a !== id) : [...currentArtist.following.artists, id] };
            } else {
                return;
            }
            handleUpdateArtistProfile({ following: updatedFollowing });
        } else if (userRole === UserRole.STOODIO) {
            const managedStoodio = currentUser as Stoodio;
            let updatedFollowing: Stoodio['following'];
    
            if (type === 'artist') {
                const isFollowing = managedStoodio.following.artists.includes(id);
                updatedFollowing = { ...managedStoodio.following, artists: isFollowing ? managedStoodio.following.artists.filter(a => a !== id) : [...managedStoodio.following.artists, id] };
            } else if (type === 'engineer') {
                const isFollowing = managedStoodio.following.engineers.includes(id);
                updatedFollowing = { ...managedStoodio.following, engineers: isFollowing ? managedStoodio.following.engineers.filter(e => e !== id) : [...managedStoodio.following.engineers, id] };
            } else if (type === 'stoodio') {
                if (id === managedStoodio.id) return;
                const isFollowing = managedStoodio.following.stoodioz.includes(id);
                updatedFollowing = { ...managedStoodio.following, stoodioz: isFollowing ? managedStoodio.following.stoodioz.filter(s => s !== id) : [...managedStoodio.following.stoodioz, id] };
            } else {
                return;
            }
            handleUpdateStoodio({ following: updatedFollowing });
        } else if (userRole === UserRole.ENGINEER) {
            const currentEngineer = currentUser as Engineer;
            let updatedFollowing: Engineer['following'];
    
            if (type === 'artist') {
                const isFollowing = currentEngineer.following.artists.includes(id);
                updatedFollowing = { ...currentEngineer.following, artists: isFollowing ? currentEngineer.following.artists.filter(a => a !== id) : [...currentEngineer.following.artists, id] };
            } else if (type === 'engineer') {
                if (id === currentEngineer.id) return;
                const isFollowing = currentEngineer.following.engineers.includes(id);
                updatedFollowing = { ...currentEngineer.following, engineers: isFollowing ? currentEngineer.following.engineers.filter(e => e !== id) : [...currentEngineer.following.engineers, id] };
            } else if (type === 'stoodio') {
                const isFollowing = currentEngineer.following.stoodioz.includes(id);
                updatedFollowing = { ...currentEngineer.following, stoodioz: isFollowing ? currentEngineer.following.stoodioz.filter(s => s !== id) : [...currentEngineer.following.stoodioz, id] };
            } else {
                return;
            }
            handleUpdateEngineer({ following: updatedFollowing });
        }
    }, [userRole, currentUser, handleUpdateArtistProfile, handleUpdateStoodio, handleUpdateEngineer]);

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
        
        if (userRole === UserRole.ARTIST) {
            const updatedArtist = { ...currentUser as Artist, posts: [newPost, ...((currentUser as Artist).posts || [])] };
            setCurrentUser(updatedArtist);
            setArtists(prev => prev.map(a => a.id === updatedArtist.id ? updatedArtist : a));
        } else if (userRole === UserRole.ENGINEER) {
            const updatedEngineer = { ...currentUser as Engineer, posts: [newPost, ...((currentUser as Engineer).posts || [])] };
            setCurrentUser(updatedEngineer);
            setEngineers(prev => prev.map(e => e.id === updatedEngineer.id ? updatedEngineer : e));
        } else if (userRole === UserRole.STOODIO) {
            const updatedStoodio = { ...currentUser as Stoodio, posts: [newPost, ...((currentUser as Stoodio).posts || [])] };
            setCurrentUser(updatedStoodio);
            setStoodioz(prev => prev.map(s => s.id === updatedStoodio.id ? updatedStoodio : s));
        }
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

        if (updatedBooking) {
            const booking = updatedBooking;
            // Payer Logic
            if (booking.bookedByRole === UserRole.ARTIST) {
                const artist = artists.find(a => a.id === booking.bookedById);
                if (artist) {
                    const newTx: Transaction = { id: `txn-${Date.now()}`, description: `Session at ${booking.stoodio.name}`, amount: -booking.totalCost, date: new Date().toISOString(), type: 'debit' };
                    handleUpdateArtistProfile({ walletBalance: artist.walletBalance - booking.totalCost, walletTransactions: [newTx, ...artist.walletTransactions] });
                }
            } else if (booking.bookedByRole === UserRole.ENGINEER) {
                const bookerEngineer = engineers.find(e => e.id === booking.bookedById);
                if (bookerEngineer) {
                    const newTx: Transaction = { id: `txn-${Date.now()}`, description: `Session at ${booking.stoodio.name}`, amount: -booking.totalCost, date: new Date().toISOString(), type: 'debit' };
                    const updatedBooker = { ...bookerEngineer, walletBalance: bookerEngineer.walletBalance - booking.totalCost, walletTransactions: [newTx, ...bookerEngineer.walletTransactions] };
                    setEngineers(prev => prev.map(e => e.id === updatedBooker.id ? updatedBooker : e));
                    if (currentUser?.id === updatedBooker.id) setCurrentUser(updatedBooker);
                }
            }

            // Payee Logic
            const sessionEngineer = booking.engineer ? engineers.find(e => e.id === booking.engineer!.id) : null;
            const stoodio = stoodioz.find(s => s.id === booking.stoodio.id);
            const bookerName = artists.find(a => a.id === booking.bookedById)?.name || engineers.find(e => e.id === booking.bookedById)?.name;

            if (stoodio) {
                const stoodioPayout = booking.room.hourlyRate * booking.duration;
                const newTx: Transaction = { id: `txn-${Date.now()}`, description: `Payout for ${bookerName || 'session'}'s session`, amount: stoodioPayout, date: new Date().toISOString(), type: 'credit' };
                const updatedStoodio = { ...stoodio, walletBalance: stoodio.walletBalance + stoodioPayout, walletTransactions: [newTx, ...stoodio.walletTransactions] };
                setStoodioz(prev => prev.map(s => s.id === stoodio.id ? updatedStoodio : s));
            }
            if (sessionEngineer) {
                const engineerPayout = booking.engineerPayRate * booking.duration;
                const newTx: Transaction = { id: `txn-${Date.now()}`, description: `Payout for ${bookerName || 'session'}'s session`, amount: engineerPayout, date: new Date().toISOString(), type: 'credit' };
                const updatedEngineer = { ...sessionEngineer, walletBalance: sessionEngineer.walletBalance + engineerPayout, walletTransactions: [newTx, ...sessionEngineer.walletTransactions] };
                setEngineers(prev => prev.map(e => e.id === updatedEngineer.id ? updatedEngineer : e));
            }
        }

        setActiveSession(null);
        handleNavigate(AppView.ENGINEER_DASHBOARD);
    }, [handleNavigate, artists, engineers, stoodioz, handleUpdateArtistProfile, currentUser]);

    const handleConfirmTip = useCallback((bookingId: string, tipAmount: number) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking || !booking.engineer) return;

        const updatedBooking = { ...booking, tip: tipAmount };
        setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));

        // Payer Logic
        if (booking.bookedByRole === UserRole.ARTIST) {
            const artist = artists.find(a => a.id === booking.bookedById);
            if (artist) {
                const newTx: Transaction = { id: `txn-tip-${Date.now()}`, description: `Tip for ${booking.engineer?.name}`, amount: -tipAmount, date: new Date().toISOString(), type: 'debit' };
                handleUpdateArtistProfile({ walletBalance: artist.walletBalance - tipAmount, walletTransactions: [newTx, ...artist.walletTransactions] });
            }
        } else if (booking.bookedByRole === UserRole.ENGINEER) {
             const bookerEngineer = engineers.find(e => e.id === booking.bookedById);
             if (bookerEngineer) {
                const newTx: Transaction = { id: `txn-tip-${Date.now()}`, description: `Tip for ${booking.engineer?.name}`, amount: -tipAmount, date: new Date().toISOString(), type: 'debit' };
                const updatedBooker = {...bookerEngineer, walletBalance: bookerEngineer.walletBalance - tipAmount, walletTransactions: [newTx, ...bookerEngineer.walletTransactions]};
                setEngineers(prev => prev.map(e => e.id === updatedBooker.id ? updatedBooker : e));
                if (currentUser?.id === updatedBooker.id) setCurrentUser(updatedBooker);
             }
        }
        
        // Payee Logic
        const engineer = engineers.find(e => e.id === booking.engineer!.id);
        const bookerName = artists.find(a => a.id === booking.bookedById)?.name || engineers.find(e => e.id === booking.bookedById)?.name;
        if (engineer) {
            const newTx: Transaction = { id: `txn-tip-${Date.now()}`, description: `Tip from ${bookerName || 'a user'}`, amount: tipAmount, date: new Date().toISOString(), type: 'credit' };
            const updatedEngineer = { ...engineer, walletBalance: engineer.walletBalance + tipAmount, walletTransactions: [newTx, ...engineer.walletTransactions] };
            setEngineers(prev => prev.map(e => e.id === engineer.id ? updatedEngineer : e));
             if (currentUser?.id === engineer.id) {
                setCurrentUser(updatedEngineer);
            }
        }

        setTipModalBooking(null);
    }, [bookings, artists, engineers, currentUser, handleUpdateArtistProfile]);

    const handleOpenVibeMatcher = useCallback(() => setIsVibeMatcherOpen(true), []);
    const handleCloseVibeMatcher = useCallback(() => setIsVibeMatcherOpen(false), []);

    const handleVibeMatch = useCallback(async (songUrl: string) => {
        setIsVibeMatcherLoading(true);
        setIsVibeMatcherOpen(false);
        try {
            const results = await getVibeMatchResults(songUrl, stoodioz, engineers);
            setVibeMatchResults(results);
            handleNavigate(AppView.VIBE_MATCHER_RESULTS);
        } catch (error) {
            console.error("Vibe Match failed", error);
            // Optionally show a notification toast on failure
        } finally {
            setIsVibeMatcherLoading(false);
        }
    }, [stoodioz, engineers, handleNavigate]);

    const handleMarkAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const handleMarkAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const handleDismissNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const renderAppContent = () => {
        const handleGuestInteraction = () => handleNavigate(AppView.LOGIN);

        switch (currentView) {
            // --- Unauthenticated Views ---
            case AppView.LANDING_PAGE:
                return <LandingPage onNavigate={handleNavigate} onSelectStoodio={handleViewStoodioDetails} stoodioz={stoodioz} engineers={engineers} artists={artists} bookings={bookings} vibeMatchResults={vibeMatchResults} />;
            case AppView.LOGIN:
                return <Login onLogin={handleLogin} error={loginError} onNavigate={handleNavigate} />;
            case AppView.CHOOSE_PROFILE:
                return <ChooseProfile onSelectRole={handleSelectRoleToSetup} />;
            case AppView.ARTIST_SETUP:
                return <ArtistSetup onCompleteSetup={handleCompleteArtistSetup} onNavigate={handleNavigate} />;
            case AppView.ENGINEER_SETUP:
                return <EngineerSetup onCompleteSetup={handleCompleteEngineerSetup} onNavigate={handleNavigate} />;
            case AppView.STOODIO_SETUP:
                return <StoodioSetup onCompleteSetup={handleCompleteStoodioSetup} onNavigate={handleNavigate} />;
            case AppView.PRIVACY_POLICY:
                return <PrivacyPolicy onBack={handleGoBack} />;

            // --- Shared (Auth & Guest) Views ---
            case AppView.STOODIO_LIST:
                return <StoodioList stoodioz={stoodioz} onSelectStoodio={handleViewStoodioDetails} />;
            case AppView.BOOKING_MODAL:
            case AppView.STOODIO_DETAIL:
                return selectedStoodio ? <StoodioDetail stoodio={selectedStoodio} onBook={currentUser ? handleOpenBookingModal : handleGuestInteraction} onBack={handleGoBack} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} currentUser={currentUser} userRole={userRole} reviews={reviews} bookings={bookings.filter(b => b.stoodio.id === selectedStoodio.id)} allArtists={artists} allEngineers={engineers} allStoodioz={stoodioz} onSelectArtist={handleViewArtistProfile} onSelectEngineer={handleViewEngineerProfile} onSelectStoodio={handleViewStoodioDetails} onStartConversation={currentUser ? () => {} : handleGuestInteraction} onLikePost={handleLikePost} onCommentOnPost={handleCommentOnPost} /> : <StoodioList stoodioz={stoodioz} onSelectStoodio={handleViewStoodioDetails} />;
            case AppView.ENGINEER_LIST:
                return <EngineerList engineers={engineers} onSelectEngineer={handleViewEngineerProfile} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} currentUser={currentUser} userRole={userRole} />;
            case AppView.ENGINEER_PROFILE:
                return selectedEngineer ? <EngineerProfile engineer={selectedEngineer} onBack={handleGoBack} reviews={reviews} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} isFollowing={currentUser && 'following' in currentUser ? currentUser.following.engineers.includes(selectedEngineer.id) : false} userRole={userRole} bookings={bookings} allArtists={artists} allEngineers={engineers} allStoodioz={stoodioz} onSelectArtist={handleViewArtistProfile} onSelectEngineer={handleViewEngineerProfile} onSelectStoodio={handleViewStoodioDetails} onStartNavigation={handleNavigateToStudio} onStartConversation={()=>{}} onLikePost={handleLikePost} onCommentOnPost={handleCommentOnPost} currentUser={currentUser} onInitiateBooking={handleInitiateBookingWithEngineer} /> : <EngineerList engineers={engineers} onSelectEngineer={handleViewEngineerProfile} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} currentUser={currentUser} userRole={userRole} />;
            case AppView.ARTIST_LIST:
                 return <ArtistList artists={artists} onSelectArtist={handleViewArtistProfile} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} currentUser={currentUser} userRole={userRole}/>;
            case AppView.ARTIST_PROFILE:
                return selectedArtist ? <ArtistProfile artist={selectedArtist} onBack={handleGoBack} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} isFollowing={currentUser && 'following' in currentUser ? currentUser.following.artists.includes(selectedArtist.id) : false} userRole={userRole} onStartNavigation={()=>{}} onStartConversation={()=>{}} allArtists={artists} allEngineers={engineers} allStoodioz={stoodioz} onSelectArtist={handleViewArtistProfile} onSelectEngineer={handleViewEngineerProfile} onSelectStoodio={handleViewStoodioDetails} onLikePost={handleLikePost} onCommentOnPost={handleCommentOnPost} currentUser={currentUser} /> : <ArtistList artists={artists} onSelectArtist={handleViewArtistProfile} onToggleFollow={currentUser ? handleToggleFollow : handleGuestInteraction} currentUser={currentUser} userRole={userRole}/>;
            case AppView.MAP_VIEW:
                return <MapView stoodioz={stoodioz} engineers={engineers} artists={artists} onSelectStoodio={handleViewStoodioDetails} onSelectEngineer={handleViewEngineerProfile} onSelectArtist={handleViewArtistProfile} bookings={bookings} vibeMatchResults={vibeMatchResults}/>;
            
            // --- Authenticated Views ---
            case AppView.THE_STAGE:
                if (currentUser) return <TheStage currentUser={currentUser} allArtists={artists} allEngineers={engineers} allStoodioz={stoodioz} onPost={handleCreatePost} onLikePost={handleLikePost} onCommentOnPost={handleCommentOnPost} onToggleFollow={handleToggleFollow} onSelectArtist={handleViewArtistProfile} onSelectEngineer={handleViewEngineerProfile} onSelectStoodio={handleViewStoodioDetails} onNavigate={handleNavigate} />;
                return <Login onLogin={handleLogin} error={null} onNavigate={handleNavigate} />;
            case AppView.CONFIRMATION:
                if (latestBooking) return <BookingConfirmation booking={latestBooking} onDone={() => handleNavigate(AppView.MY_BOOKINGS)} engineers={engineers}/>;
                return <StoodioList stoodioz={stoodioz} onSelectStoodio={handleViewStoodioDetails} />;
            case AppView.MY_BOOKINGS:
                const userBookings = bookings.filter(b => b.bookedById === currentUser?.id);
                return <MyBookings bookings={userBookings} engineers={engineers} onOpenTipModal={setTipModalBooking} onNavigateToStudio={handleNavigateToStudio} onOpenCancelModal={setBookingToCancel} />;

            case AppView.STOODIO_DASHBOARD:
                if (userRole === UserRole.STOODIO) return <StoodioDashboard stoodio={currentUser as Stoodio} bookings={bookings.filter(b => b.stoodio.id === currentUser?.id)} onUpdateStoodio={handleUpdateStoodio} onPost={handleCreatePost} onLikePost={handleLikePost} onCommentOnPost={handleCommentOnPost} currentUser={currentUser} onPostJob={handlePostJob} allArtists={artists} allEngineers={engineers} allStoodioz={stoodioz} onToggleFollow={handleToggleFollow} onSelectStoodio={handleViewStoodioDetails} onSelectArtist={handleViewArtistProfile} onSelectEngineer={handleViewEngineerProfile} onVerificationSubmit={handleVerificationSubmit} />;
                return <Login onLogin={handleLogin} error={null} onNavigate={handleNavigate} />;

            case AppView.ENGINEER_DASHBOARD:
                if (userRole === UserRole.ENGINEER) {
                    const engineerBookings = bookings.filter(b => b.engineer?.id === currentUser?.id || b.status === BookingStatus.PENDING || (b.status === BookingStatus.PENDING_APPROVAL && b.requestedEngineerId === currentUser?.id));
                    return <EngineerDashboard engineer={currentUser as Engineer} reviews={reviews.filter(r => r.engineerId === currentUser?.id)} bookings={engineerBookings} onUpdateEngineer={handleUpdateEngineer} onAcceptBooking={handleAcceptBooking} onDenyBooking={handleDenyBooking} onStartSession={handleStartSession} currentUser={currentUser} allArtists={artists} allEngineers={engineers} allStoodioz={stoodioz} onSelectArtist={handleViewArtistProfile} onSelectEngineer={handleViewEngineerProfile} onSelectStoodio={handleViewStoodioDetails} onToggleFollow={handleToggleFollow} onNavigateToStudio={handleNavigateToStudio} onStartConversation={()=>{}} onPost={handleCreatePost} onLikePost={handleLikePost} onCommentOnPost={handleCommentOnPost} />;
                }
                return <Login onLogin={handleLogin} error={null} onNavigate={handleNavigate} />;

            case AppView.ARTIST_DASHBOARD:
                if (userRole === UserRole.ARTIST) return <ArtistDashboard artist={currentUser as Artist} bookings={bookings.filter(b => b.artist?.id === currentUser?.id)} conversations={conversations} onNavigate={handleNavigate} onUpdateProfile={handleUpdateArtistProfile} allStoodioz={stoodioz} allEngineers={engineers} allArtists={artists} onToggleFollow={handleToggleFollow} onSelectStoodio={handleViewStoodioDetails} onSelectEngineer={handleViewEngineerProfile} onSelectArtist={handleViewArtistProfile} onPost={handleCreatePost} onLikePost={handleLikePost} onCommentOnPost={handleCommentOnPost} currentUser={currentUser} onOpenVibeMatcher={handleOpenVibeMatcher} />;
                 return <Login onLogin={handleLogin} error={null} onNavigate={handleNavigate} />;

            case AppView.INBOX:
                 if (currentUser) return <Inbox conversations={conversations} onSendMessage={()=>{}} selectedConversationId={selectedConversationId} onSelectConversation={setSelectedConversationId} currentUser={currentUser} />;
                 return <Login onLogin={handleLogin} error={null} onNavigate={handleNavigate} />;
            
            case AppView.ACTIVE_SESSION:
                 if (activeSession) return <ActiveSession session={activeSession} onEndSession={handleEndSession} onSelectArtist={handleViewArtistProfile} />;
                 return <Login onLogin={handleLogin} error={null} onNavigate={handleNavigate} />;

            case AppView.VIBE_MATCHER_RESULTS:
                if (vibeMatchResults) return <VibeMatcherResults results={vibeMatchResults} onSelectStoodio={handleViewStoodioDetails} onSelectEngineer={handleViewEngineerProfile} onBack={handleGoBack} />;
                return <Login onLogin={handleLogin} error={null} onNavigate={handleNavigate} />;

            default:
                return <LandingPage onNavigate={handleNavigate} onSelectStoodio={handleViewStoodioDetails} stoodioz={stoodioz} engineers={engineers} artists={artists} bookings={bookings} vibeMatchResults={vibeMatchResults} />;
        }
    };

    return (
        <div className={`min-h-screen bg-slate-100 text-slate-700 transition-colors duration-500`}>
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
                allStoodioz={stoodioz}
                onSelectArtist={handleViewArtistProfile}
                onSelectEngineer={handleViewEngineerProfile}
                onSelectStoodio={handleViewStoodioDetails}
            />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderAppContent()}

                {/* --- Modals --- */}
                {currentView === AppView.BOOKING_MODAL && selectedStoodio && bookingTime && (
                    <BookingModal 
                        stoodio={selectedStoodio} 
                        engineers={engineers}
                        onClose={handleGoBack}
                        onConfirm={handleConfirmBooking}
                        isLoading={isLoading}
                        initialDate={bookingTime.date}
                        initialTime={bookingTime.time}
                        initialRoom={bookingTime.room}
                        initialEngineer={bookingIntent?.engineer}
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
                
            </main>
             <NotificationToasts 
                notifications={notifications.filter(n => !n.read).slice(0, 3)} 
                onDismiss={handleDismissNotification}
            />
        </div>
    );
};

export default App;