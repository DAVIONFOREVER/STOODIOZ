
// FIX: Removed reference to @types/google.maps as it is not available in the environment.
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, OverlayViewF, DirectionsService, DirectionsRenderer, MarkerF } from '@react-google-maps/api';
import type { Stoodio, Artist, Engineer, Producer, Booking, Location, Label } from '../types';
import { UserRole, BookingStatus } from '../types';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext.tsx';
import { useNavigation } from '../hooks/useNavigation.ts';
import { useBookings } from '../hooks/useBookings.ts';
import { HouseIcon, MicrophoneIcon, SoundWaveIcon, MusicNoteIcon, DollarSignIcon, UsersIcon, CalendarIcon, ClockIcon, CloseIcon } from './icons.tsx';
import MapJobPopup from './MapJobPopup.tsx';
import MapInfoPopup from './MapInfoPopup.tsx';
import { getSupabase } from '../lib/supabase.ts';
import { RankingTier } from '../types';
import * as apiService from '../services/apiService.ts';
import { getActiveStoodioBookings, getStoodioRoomAvailability } from '../utils/booking.ts';

// --- TYPE DEFINITIONS ---
type MapUser = Artist | Engineer | Producer | Stoodio | Label;
type MapJob = Booking & { itemType: 'JOB'; coordinates: Location }; // Added explicit coordinates
type StoodioMapMeta = {
    activeBookings: number;
    hasActiveSession: boolean;
    roomsTotal: number | null;
    roomsAvailable: number | null;
    nextBookingStart?: string | null;
};
interface UnregisteredStudio {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  coordinates: Location;
  email?: string;
  phone?: string;
  website_url?: string;
  google_place_id?: string;
  rating?: number;
  is_registered: boolean;
  itemType: 'UNREGISTERED_STUDIO';
}
type MapItem = MapUser | MapJob | UnregisteredStudio;
type FilterType = 'ALL' | 'STOODIO' | 'ENGINEER' | 'PRODUCER' | 'ARTIST' | 'JOB';

// --- MAP CONFIGURATION ---
const mapContainerStyle = {
  width: '100%',
  height: 'calc(100dvh - 10rem)',
};

const defaultCenter = { lat: 39.8283, lng: -98.5795 };

const mapOptions = {
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#18181b' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#18181b' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#737373' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#f97316' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#27272a' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#18181b' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#52525b' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f97316' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#444444' }] },
    { featureType: 'road.highway', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#09090b' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#52525b' }] },
  ],
  disableDefaultUI: true,
  zoomControl: true,
};

// --- MARKER & UI COMPONENTS ---

const TabButton: React.FC<{ label: string; active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ label, active, onClick, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 whitespace-nowrap ${
            active 
            ? 'bg-orange-500 text-white shadow-lg ring-2 ring-orange-500' 
            : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:ring-2 hover:ring-orange-500/50'
        }`}
    >
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);


const getPixelPositionOffset = (width: number, height: number) => ({
  x: -(width / 2),
  y: -height,
});

const UserMarker: React.FC = () => (
    <div className="w-6 h-6 rounded-full bg-blue-500 border-4 border-white marker-pulse" title="Your Location"></div>
);

const MapMarker: React.FC<{
    item: MapItem;
    onClick: (item: MapItem) => void;
    onBook?: (item: MapItem) => void;
    onViewProfile?: (item: MapItem) => void;
    onInvite?: (item: MapItem) => void;
}> = ({ item, onClick, onBook, onViewProfile, onInvite }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const isJob = 'itemType' in item && (item as any).itemType === 'JOB';
    const isUnregisteredStudio = 'itemType' in item && (item as any).itemType === 'UNREGISTERED_STUDIO';
    const isStoodio = !isJob && !isUnregisteredStudio && 'amenities' in item;
    const mapMeta = (item as any).mapMeta as StoodioMapMeta | undefined;

    const getRoleInfo = () => {
        if (isJob) {
            return {
                roleLabel: 'Job',
                icon: <DollarSignIcon className="w-5 h-5 text-green-400" />,
                bgColor: 'bg-green-900/50',
                borderColor: 'border-green-500',
                textColor: 'text-green-200',
            };
        }
        if (isUnregisteredStudio) {
            return {
                roleLabel: 'Studio (Not Registered)',
                icon: <HouseIcon className="w-5 h-5 text-zinc-400" />,
                bgColor: 'bg-zinc-800/50',
                borderColor: 'border-zinc-500',
                textColor: 'text-zinc-300',
            };
        }
        if ('amenities' in item)
            return { roleLabel: 'Studio', icon: <HouseIcon className="w-5 h-5 text-red-400" />, bgColor: 'bg-red-900/50', borderColor: 'border-red-500', textColor: 'text-red-200' };
        if ('specialties' in item)
            return { roleLabel: 'Engineer', icon: <SoundWaveIcon className="w-5 h-5 text-orange-400" />, bgColor: 'bg-orange-900/50', borderColor: 'border-orange-500', textColor: 'text-orange-200' };
        if ('instrumentals' in item)
            return { roleLabel: 'Producer', icon: <MusicNoteIcon className="w-5 h-5 text-purple-400" />, bgColor: 'bg-purple-900/50', borderColor: 'border-purple-500', textColor: 'text-purple-200' };
        if ('parent_company' in item || 'roster' in item)
            return { roleLabel: 'Label', icon: <MusicNoteIcon className="w-5 h-5 text-orange-400" />, bgColor: 'bg-orange-900/50', borderColor: 'border-orange-500', textColor: 'text-orange-200' };
        return { roleLabel: 'Artist', icon: <MicrophoneIcon className="w-5 h-5 text-blue-400" />, bgColor: 'bg-blue-900/50', borderColor: 'border-blue-500', textColor: 'text-blue-200' };
    };

    const { roleLabel, icon, bgColor, borderColor, textColor } = getRoleInfo();

    const displayName = isJob
        ? 'Open Job'
        : isUnregisteredStudio
        ? (item as UnregisteredStudio).name
        : ((item as any).stage_name || (item as any).name || (item as any).full_name || 'User');

    // Determine which action button to show
    const showBookButton = !isJob && !isUnregisteredStudio && (('amenities' in item) || ('specialties' in item));
    const showProfileButton = !isJob && !isUnregisteredStudio && ('instrumentals' in item);
    const showInviteButton = isUnregisteredStudio;

    return (
        <div
            className="flex flex-col items-center gap-1 select-none relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                onClick={() => onClick(item)}
                className="flex flex-col items-center gap-1"
                title={`${displayName} • ${roleLabel}`}
            >
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 marker-glow ${bgColor} ${borderColor} transition-transform duration-200 hover:scale-105`}
                >
                    {icon}
                </div>

                <div className="px-2 py-1 rounded-lg bg-zinc-950/80 border border-zinc-800 backdrop-blur text-[10px] leading-tight text-center max-w-[160px]">
                    <div className="text-slate-100 font-semibold truncate">{displayName}</div>
                    <div className={`${textColor} font-bold uppercase tracking-wide`}>{roleLabel}</div>
                    {isStoodio && mapMeta && (
                        <div className="mt-1 flex flex-col gap-0.5 text-[9px] text-zinc-400">
                            <span className={mapMeta.hasActiveSession ? 'text-green-400 font-semibold' : ''}>
                                {mapMeta.hasActiveSession ? 'In Session' : 'No Active Session'}
                            </span>
                            {mapMeta.roomsTotal !== null && (
                                <span>
                                    Rooms: {mapMeta.roomsAvailable ?? 0}/{mapMeta.roomsTotal}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </button>

            {/* Hover Action Button */}
            {isHovered && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 z-50">
                    {isStoodio && mapMeta && (
                        <div className="mb-2 px-3 py-1.5 rounded-md bg-black/80 border border-zinc-700 text-[10px] text-zinc-300 whitespace-nowrap">
                            {mapMeta.hasActiveSession ? 'In Session Now' : 'Available'} ·
                            {mapMeta.roomsTotal !== null ? ` ${mapMeta.roomsAvailable ?? 0}/${mapMeta.roomsTotal} rooms` : ' Rooms unknown'}
                        </div>
                    )}
                    {showBookButton && onBook && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onBook(item);
                            }}
                            className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-md shadow-lg hover:bg-orange-600 transition-colors whitespace-nowrap"
                        >
                            Book
                        </button>
                    )}
                    {showProfileButton && onViewProfile && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewProfile(item);
                            }}
                            className="px-3 py-1.5 bg-purple-500 text-white text-xs font-semibold rounded-md shadow-lg hover:bg-purple-600 transition-colors whitespace-nowrap"
                        >
                            View Profile
                        </button>
                    )}
                    {showInviteButton && onInvite && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onInvite(item);
                            }}
                            className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-md shadow-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
                        >
                            Invite
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---
interface MapViewProps {
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectProducer: (producer: Producer) => void;
    onSelectLabel?: (label: Label) => void;
}

const MapView: React.FC<MapViewProps> = ({ onSelectStoodio, onSelectArtist, onSelectEngineer, onSelectProducer, onSelectLabel }) => {
    const { stoodioz, artists, engineers, producers, labels, bookings, directionsIntent, currentUser } = useAppState();
    const dispatch = useAppDispatch();
    const { navigateToStudio, viewLabelProfile, navigate } = useNavigation();
    const { acceptJob } = useBookings(navigate);
    const [unregisteredStudios, setUnregisteredStudios] = useState<UnregisteredStudio[]>([]);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [selectedStudioForInvite, setSelectedStudioForInvite] = useState<UnregisteredStudio | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [isFetchingStudios, setIsFetchingStudios] = useState(false);
    const [fetchLocation, setFetchLocation] = useState('');
    const [showFetchModal, setShowFetchModal] = useState(false);

    // FIX: Replaced google.maps.Map with any.
    const [map, setMap] = useState<any | null>(null);
    const [userLocation, setUserLocation] = useState<Location | null>(null);
    const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    // FIX: Replaced google.maps.DirectionsResult with any.
    const [directions, setDirections] = useState<any | null>(null);
    const [directionsOrigin, setDirectionsOrigin] = useState<Location | null>(null);
    const [directionsDestination, setDirectionsDestination] = useState<Location | null>(null);
    const [realtimeLocations, setRealtimeLocations] = useState<Map<string, Location>>(new Map());
    const channelRef = useRef<any | null>(null);

    const googleMapsApiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey,
    });

    if (!googleMapsApiKey) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-400 space-y-2">
                <h2 className="text-lg font-semibold text-zinc-200">Google Maps API key missing</h2>
                <p className="text-sm">Set `VITE_GOOGLE_MAPS_API_KEY` in your `.env` file and restart the dev server.</p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-400 space-y-2">
                <h2 className="text-lg font-semibold text-zinc-200">Failed to load Google Maps</h2>
                <p className="text-sm">Check your API key referrer restrictions and reload.</p>
            </div>
        );
    }
    
    // Effect for user's own location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                };
                setUserLocation(newLocation);
                // Only pan on initial load, or if tracking
                if (map && !directionsIntent && !selectedItem) {
                    map.panTo({ lat: newLocation.lat, lng: newLocation.lon });
                }
            },
            () => console.log("Could not get user's location."),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [map, directionsIntent, selectedItem]);

    // Effect for Supabase real-time channel
    useEffect(() => {
        const supabase = getSupabase();
        if (!supabase) return;

        const channel = supabase.channel('public:locations');
        channelRef.current = channel;

        channel
            .on('broadcast', { event: 'location_update' }, (message) => {
                const { userId, coordinates } = message.payload;
                // Update map state with new location for any user ID
                setRealtimeLocations(prev => new Map(prev).set(userId, coordinates));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, []);


     useEffect(() => {
        if (directionsIntent && userLocation) {
            // Check if it's a direct destination (from navigateToStudio) or a booking
            if ((directionsIntent as any).destination) {
                // Direct navigation to a location
                setDirectionsOrigin(userLocation);
                setDirectionsDestination((directionsIntent as any).destination);
            } else {
                // Navigation from a booking
                const booking = bookings.find(b => b.id === directionsIntent.bookingId);
                if (booking?.stoodio?.coordinates) {
                    setDirectionsOrigin(userLocation);
                    setDirectionsDestination(booking.stoodio.coordinates);
                }
            }
        }
        
        // Cleanup function to clear the intent when leaving the map view
        return () => {
            if (directionsIntent) {
                dispatch({ type: ActionTypes.SET_DIRECTIONS_INTENT, payload: { bookingId: null } });
            }
        }
    }, [directionsIntent, userLocation, bookings, dispatch]);

    // Ranking tier order for job prioritization (higher number = higher priority)
    const tierOrder: { [key in RankingTier]: number } = {
        [RankingTier.Elite]: 5,
        [RankingTier.Platinum]: 4,
        [RankingTier.Gold]: 3,
        [RankingTier.Silver]: 2,
        [RankingTier.Bronze]: 1,
        [RankingTier.Provisional]: 0,
    };

    const mapItems = useMemo((): MapItem[] => {
        // Get all open jobs
        const allJobs = bookings
            .filter(b => b.posted_by === UserRole.STOODIO && b.status === BookingStatus.PENDING && b.stoodio?.coordinates)
            .map(b => ({
                ...b,
                itemType: 'JOB' as const,
                coordinates: b.stoodio!.coordinates
            }));

        // Sort jobs by ranking tier priority (if current user is an engineer)
        // Higher tier engineers see jobs first
        const sortedJobs = currentUser && (currentUser as any).specialties ? 
            allJobs.sort((a, b) => {
                const userTier = currentUser?.ranking_tier || RankingTier.Provisional;
                const tierValue = tierOrder[userTier];
                
                // Elite/Platinum/Gold see jobs immediately, sorted by date
                if (tierValue >= 3) {
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                }
                // Lower tiers see jobs after a delay (simulated by sorting)
                // In production, this would be handled by notifications/delays
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            }) :
            allJobs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const jobs = sortedJobs;

        let items: MapUser[] = [];

        // Apply filter logic - each filter shows ONLY its corresponding items
        if (activeFilter === 'ALL') {
            // Show all user types when "All" is selected
            items.push(...(stoodioz || []));
            items.push(...(artists || []));
            items.push(...(engineers || []));
            items.push(...(producers || []));
        } else if (activeFilter === 'STOODIO') {
            // Show only stoodios
            items.push(...(stoodioz || []));
        } else if (activeFilter === 'ARTIST') {
            // Show only artists
            items.push(...(artists || []));
        } else if (activeFilter === 'ENGINEER') {
            // Show only engineers
            items.push(...(engineers || []));
        } else if (activeFilter === 'PRODUCER') {
            // Show only producers
            items.push(...(producers || []));
        }
        // Labels are NOT shown on the map
        // Jobs are handled separately below

        const bookedStoodioIds = new Set(
            (bookings || [])
                .map((b: any) => b?.stoodio?.id || b?.stoodio_id)
                .filter(Boolean)
                .map((id) => String(id))
        );

        // Filter visible users based on DB flag, but always show stoodios with bookings
        let visibleUsers = items.filter(u => {
            if (!u.coordinates) return false;
            if ('amenities' in u) {
                return Boolean(u.show_on_map) || bookedStoodioIds.has(String(u.id));
            }
            return Boolean(u.show_on_map);
        });

        // Apply realtime updates overrides
        const liveUpdatedUsers = visibleUsers.map(user => {
            if (realtimeLocations.has(user.id)) {
                return { ...user, coordinates: realtimeLocations.get(user.id)! };
            }
            return user;
        });

        // Force Current User Visibility if enabled, bridging the gap between local state and DB broadcast
        if (currentUser && currentUser.show_on_map && userLocation) {
            const exists = liveUpdatedUsers.some(u => u.id === currentUser.id);
            if (!exists) {
                // Since MapUser now includes Label, we can safely push currentUser
                liveUpdatedUsers.push({
                    ...currentUser,
                    coordinates: userLocation 
                });
            } else {
                const userIndex = liveUpdatedUsers.findIndex(u => u.id === currentUser.id);
                if (userIndex !== -1) {
                    liveUpdatedUsers[userIndex] = { ...liveUpdatedUsers[userIndex], coordinates: userLocation };
                }
            }
        }
        
        const usersWithMeta = liveUpdatedUsers.map((user) => {
            if (!('amenities' in user)) return user;
            const activeBookings = getActiveStoodioBookings(bookings, user.id);
            const availability = getStoodioRoomAvailability(user as Stoodio, bookings);
            const nextBooking = (bookings || [])
                .filter((b: any) => (b?.stoodio?.id || b?.stoodio_id) === user.id && b?.status === BookingStatus.CONFIRMED)
                .map((b) => ({ booking: b, start: new Date(`${b.date}T${b.start_time}`) }))
                .filter((b) => Number.isFinite(b.start.getTime()) && b.start.getTime() > Date.now())
                .sort((a, b) => a.start.getTime() - b.start.getTime())[0];

            return {
                ...user,
                mapMeta: {
                    activeBookings: activeBookings.length,
                    hasActiveSession: activeBookings.length > 0,
                    roomsTotal: availability.totalRooms,
                    roomsAvailable: availability.availableRooms,
                    nextBookingStart: nextBooking ? nextBooking.start.toISOString() : null,
                } as StoodioMapMeta,
            };
        });

        let allItems: MapItem[] = usersWithMeta;
        // Only show jobs when "All" or "JOB" filter is active
        if (activeFilter === 'ALL' || activeFilter === 'JOB') {
            allItems.push(...jobs);
        }
        
        // Add unregistered studios when "All" or "STOODIO" filter is active
        if (activeFilter === 'ALL' || activeFilter === 'STOODIO') {
            allItems.push(...unregisteredStudios);
        }
        
        return allItems;
    }, [stoodioz, artists, engineers, producers, bookings, activeFilter, realtimeLocations, currentUser, userLocation, tierOrder, unregisteredStudios]);
    
    const handleMarkerClick = useCallback((item: MapItem) => {
        setSelectedItem(item);
        if (item.coordinates && map) {
            map.panTo({ lat: item.coordinates.lat, lng: item.coordinates.lon });
        }
    }, [map]);

    const handleSelectProfile = (user: MapUser) => {
        if ('amenities' in user) onSelectStoodio(user as Stoodio);
        else if ('specialties' in user) onSelectEngineer(user as Engineer);
        else if ('instrumentals' in user) onSelectProducer(user as Producer);
        else if ('parent_company' in user || 'roster' in user) {
            // It's a Label
            if (onSelectLabel) onSelectLabel(user as Label);
            else viewLabelProfile(user as Label);
        }
        else onSelectArtist(user as Artist); // Default fallback for Artist
    };

    const handleBook = useCallback((item: MapItem) => {
        if ('itemType' in item && (item as any).itemType === 'JOB') return;
        
        if ('amenities' in item) {
            // It's a Stoodio - navigate to stoodio detail page
            onSelectStoodio(item as Stoodio);
        } else if ('specialties' in item) {
            // It's an Engineer - navigate to engineer profile
            onSelectEngineer(item as Engineer);
        }
    }, [onSelectStoodio, onSelectEngineer]);

    const handleViewProfile = useCallback((item: MapItem) => {
        if ('itemType' in item && (item as any).itemType === 'JOB') return;
        
        if ('instrumentals' in item) {
            // It's a Producer - navigate to producer profile
            onSelectProducer(item as Producer);
        }
    }, [onSelectProducer]);

    const handleInvite = useCallback((item: MapItem) => {
        if ('itemType' in item && (item as any).itemType === 'UNREGISTERED_STUDIO') {
            setSelectedStudioForInvite(item as UnregisteredStudio);
            setInviteEmail((item as UnregisteredStudio).email || '');
            setInviteModalOpen(true);
        }
    }, []);

    const handleSendInvite = useCallback(async () => {
        if (!selectedStudioForInvite || !currentUser) return;
        if (!inviteEmail || !inviteEmail.includes('@')) {
            alert('Please enter a valid email address');
            return;
        }

        setIsInviting(true);
        try {
            const result = await apiService.inviteUnregisteredStudio(
                selectedStudioForInvite.id,
                inviteEmail,
                currentUser.id,
                currentUser.name || 'A Stoodioz user'
            );

            if (result.success) {
                alert(`Invite sent successfully to ${inviteEmail}!`);
                setInviteModalOpen(false);
                setSelectedStudioForInvite(null);
                setInviteEmail('');
                
                // Refresh unregistered studios to update invite count
                const studios = await apiService.fetchUnregisteredStudios();
                setUnregisteredStudios(studios.map(s => ({
                    ...s,
                    itemType: 'UNREGISTERED_STUDIO' as const,
                    coordinates: s.coordinates as Location,
                })));
            } else {
                alert('Failed to send invite. Please try again.');
            }
        } catch (error) {
            console.error('Error sending invite:', error);
            alert('Failed to send invite. Please try again.');
        } finally {
            setIsInviting(false);
        }
    }, [selectedStudioForInvite, inviteEmail, currentUser]);

    // Load existing unregistered studios (don't auto-fetch until edge function is deployed)
    useEffect(() => {
        const loadUnregisteredStudios = async () => {
            try {
                const studios = await apiService.fetchUnregisteredStudios();
                const validStudios = studios
                    .filter(s => !s.is_registered && s.coordinates)
                    .map(s => ({
                        ...s,
                        itemType: 'UNREGISTERED_STUDIO' as const,
                        coordinates: s.coordinates as Location,
                    }));
                
                setUnregisteredStudios(validStudios);
            } catch (error) {
                console.error('Error loading unregistered studios:', error);
                // Silently fail - table might not exist yet
            }
        };
        loadUnregisteredStudios();
    }, []);

    const handleFetchStudios = useCallback(async () => {
        if (!fetchLocation.trim()) {
            alert('Please enter a location (e.g., "Nashville, TN" or "Los Angeles, CA")');
            return;
        }

        setIsFetchingStudios(true);
        try {
            const result = await apiService.fetchRecordingStudiosFromGoogle(fetchLocation.trim());
            
            if (result.success) {
                const message = result.studiosFound > 0 
                    ? `Successfully fetched ${result.studiosFound} studios from ${fetchLocation}! ${result.studiosSaved || result.studiosFound} saved to database.`
                    : `No studios found for ${fetchLocation}. Try a different location.`;
                alert(message);
                setShowFetchModal(false);
                setFetchLocation('');
                
                // Reload unregistered studios
                const studios = await apiService.fetchUnregisteredStudios();
                setUnregisteredStudios(studios
                    .filter(s => !s.is_registered && s.coordinates)
                    .map(s => ({
                        ...s,
                        itemType: 'UNREGISTERED_STUDIO' as const,
                        coordinates: s.coordinates as Location,
                    })));
            } else {
                const errorMsg = (result as any).error || 'Failed to fetch studios';
                const details = (result as any).details || '';
                alert(`Error: ${errorMsg}${details ? '\n\n' + details : ''}`);
            }
        } catch (error: any) {
            console.error('Error fetching studios:', error);
            const errorMsg = error?.message || error?.error || 'Failed to fetch studios';
            const details = error?.details || 'Please check console for details.';
            alert(`Error: ${errorMsg}\n\n${details}`);
        } finally {
            setIsFetchingStudios(false);
        }
    }, [fetchLocation]);
    
    const onLoad = useCallback((mapInstance: any) => setMap(mapInstance), []);
    const onUnmount = useCallback((mapInstance: any) => setMap(null), []);
    
    const directionsCallback = (res: any | null, status: any) => {
        if (status === 'OK' && res) setDirections(res);
    }

    if (!isLoaded) return <div className="flex items-center justify-center" style={{ height: mapContainerStyle.height }}>Loading Map...</div>;
    
    return (
        <div className="relative rounded-2xl overflow-hidden border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.3)]" style={{ height: mapContainerStyle.height }}>
            <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={userLocation ? { lat: userLocation.lat, lng: userLocation.lon } : defaultCenter}
                zoom={userLocation ? 12 : 4}
                options={mapOptions}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={() => setSelectedItem(null)}
            >
                {directionsOrigin && directionsDestination && (
                    <DirectionsService
                        options={{
                            destination: { lat: directionsDestination.lat, lng: directionsDestination.lon },
                            origin: { lat: directionsOrigin.lat, lng: directionsOrigin.lon },
                            travelMode: 'DRIVING' as any
                        }}
                        callback={directionsCallback}
                    />
                )}

                {directions && <DirectionsRenderer options={{ directions, suppressMarkers: true, polylineOptions: { strokeColor: '#f97316', strokeWeight: 6 } }} />}

                {/* Show blue dot for self when not broadcasting publicly, or when navigating */}
                {userLocation && (
                    <OverlayViewF position={{ lat: userLocation.lat, lng: userLocation.lon }} mapPaneName="overlayMouseTarget" getPixelPositionOffset={getPixelPositionOffset}>
                        <UserMarker />
                    </OverlayViewF>
                )}

                {mapItems.map(item => (
                    item.coordinates && (
                         <OverlayViewF key={item.id} position={{ lat: item.coordinates.lat, lng: item.coordinates.lon }} mapPaneName="overlayMouseTarget" getPixelPositionOffset={() => getPixelPositionOffset(40,40)}>
                            <MapMarker 
                                item={item} 
                                onClick={handleMarkerClick}
                                onBook={handleBook}
                                onViewProfile={handleViewProfile}
                                onInvite={handleInvite}
                            />
                        </OverlayViewF>
                    )
                ))}
                
                {selectedItem && selectedItem.coordinates && (
                    <OverlayViewF position={{ lat: selectedItem.coordinates.lat, lng: selectedItem.coordinates.lon }} mapPaneName="floatPane" getPixelPositionOffset={() => ({ x: 0, y: 0 })}>
                        {'itemType' in selectedItem && selectedItem.itemType === 'JOB' ? (
                             <MapJobPopup job={selectedItem as Booking & { itemType: 'JOB' }} onClose={() => setSelectedItem(null)} />
                        ) : (
                             <MapInfoPopup user={selectedItem as MapUser} onClose={() => setSelectedItem(null)} onSelect={handleSelectProfile} onNavigate={navigateToStudio} mapMeta={(selectedItem as any).mapMeta}/>
                        )}
                    </OverlayViewF>
                )}
            </GoogleMap>
             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 p-1 bg-zinc-900/80 backdrop-blur-sm rounded-full shadow-lg flex items-center gap-1">
                <TabButton label="All" active={activeFilter === 'ALL'} onClick={() => setActiveFilter('ALL')} icon={<UsersIcon className="w-4 h-4" />} />
                <TabButton label="Stoodios" active={activeFilter === 'STOODIO'} onClick={() => setActiveFilter('STOODIO')} icon={<HouseIcon className="w-4 h-4" />} />
                <TabButton label="Engineers" active={activeFilter === 'ENGINEER'} onClick={() => setActiveFilter('ENGINEER')} icon={<SoundWaveIcon className="w-4 h-4" />} />
                <TabButton label="Producers" active={activeFilter === 'PRODUCER'} onClick={() => setActiveFilter('PRODUCER')} icon={<MusicNoteIcon className="w-4 h-4" />} />
                <TabButton label="Artists" active={activeFilter === 'ARTIST'} onClick={() => setActiveFilter('ARTIST')} icon={<MicrophoneIcon className="w-4 h-4" />} />
                <TabButton label="Jobs" active={activeFilter === 'JOB'} onClick={() => setActiveFilter('JOB')} icon={<DollarSignIcon className="w-4 h-4" />} />
            </div>

            {/* Fetch Studios Button - Only show if no unregistered studios loaded yet */}
            {unregisteredStudios.length === 0 && (
                <div className="absolute top-20 left-4 z-10">
                    <button
                        onClick={() => setShowFetchModal(true)}
                        className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg shadow-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                    >
                        <HouseIcon className="w-4 h-4" />
                        Fetch Recording Studios
                    </button>
                </div>
            )}
            
            {/* Job Board Panel - Shows when Jobs filter is active */}
            {activeFilter === 'JOB' && (
                <div className="absolute bottom-4 left-4 right-4 z-10 max-h-[60dvh] overflow-y-auto">
                    <div className="bg-zinc-900/95 backdrop-blur-sm rounded-xl border border-zinc-700/50 shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-100">Available Jobs</h2>
                                {currentUser && (currentUser as any).specialties && (
                                    <p className="text-xs text-zinc-400 mt-1">
                                        Your tier: <span className="text-orange-400 font-semibold">{currentUser?.ranking_tier || RankingTier.Provisional}</span>
                                        {tierOrder[currentUser?.ranking_tier || RankingTier.Provisional] >= 3 && (
                                            <span className="text-green-400 ml-2">✓ Priority Access</span>
                                        )}
                                    </p>
                                )}
                            </div>
                            <button 
                                onClick={() => setActiveFilter('ALL')}
                                className="text-zinc-400 hover:text-zinc-100 text-sm"
                            >
                                Close
                            </button>
                        </div>
                        {(() => {
                            // Get all open jobs
                            let openJobs = bookings
                                .filter(b => b.posted_by === UserRole.STOODIO && b.status === BookingStatus.PENDING);
                            
                            // Apply ranking-based prioritization
                            // Higher tier engineers (Gold, Platinum, Elite) see jobs first
                            if (currentUser && (currentUser as any).specialties) {
                                const userTier = currentUser?.ranking_tier || RankingTier.Provisional;
                                const tierValue = tierOrder[userTier];
                                
                                // Sort by date (earliest first) for all tiers
                                // In production, you could add delays for lower tiers here
                                openJobs = openJobs.sort((a, b) => {
                                    const dateA = new Date(a.date).getTime();
                                    const dateB = new Date(b.date).getTime();
                                    return dateA - dateB;
                                });
                                
                                // Show tier message
                                const tierMessages = {
                                    [RankingTier.Elite]: "Elite engineers see all jobs instantly.",
                                    [RankingTier.Platinum]: "Platinum engineers see all jobs instantly.",
                                    [RankingTier.Gold]: "Gold engineers see all jobs instantly.",
                                    [RankingTier.Silver]: "Silver engineers see jobs. Rank up to Gold for priority!",
                                    [RankingTier.Bronze]: "Bronze engineers see jobs. Rank up to Gold for priority!",
                                    [RankingTier.Provisional]: "Complete more sessions to rank up and get priority access!",
                                };
                                
                                // You could add a message display here if needed
                            } else {
                                // Non-engineers see jobs sorted by date
                                openJobs = openJobs.sort((a, b) => {
                                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                                });
                            }

                            if (openJobs.length === 0) {
                                return (
                                    <div className="text-center py-8 text-zinc-400">
                                        <p className="font-semibold">No open jobs right now.</p>
                                        <p className="text-sm mt-2">Check back soon!</p>
                                    </div>
                                );
                            }

                            // Show ranking info for engineers
                            const userTier = currentUser && (currentUser as any).specialties 
                                ? (currentUser?.ranking_tier || RankingTier.Provisional)
                                : null;
                            
                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {openJobs.map(job => {
                                        const payout = (job.engineer_pay_rate || 0) * (job.duration || 0);
                                        return (
                                            <div key={job.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:border-orange-500/50 transition-colors">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-orange-400 flex items-center gap-2">
                                                            <HouseIcon className="w-5 h-5" />
                                                            {job.stoodio?.name || 'Unknown Studio'}
                                                        </h3>
                                                        <p className="text-sm text-zinc-400 mt-1">{job.stoodio?.location || 'Location not set'}</p>
                                                    </div>
                                                    {job.stoodio?.coordinates && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedItem({ ...job, itemType: 'JOB' as const, coordinates: job.stoodio!.coordinates });
                                                                if (map && job.stoodio?.coordinates) {
                                                                    map.panTo({ lat: job.stoodio.coordinates.lat, lng: job.stoodio.coordinates.lon });
                                                                }
                                                            }}
                                                            className="text-zinc-400 hover:text-orange-400 text-xs"
                                                        >
                                                            View on Map
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="space-y-2 text-sm border-t border-zinc-700/50 pt-3 mb-4">
                                                    <div className="flex items-center gap-2 text-zinc-300">
                                                        <CalendarIcon className="w-4 h-4 text-zinc-400" />
                                                        <span>{new Date(job.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-zinc-300">
                                                        <ClockIcon className="w-4 h-4 text-zinc-400" />
                                                        <span>{job.start_time || 'TBD'} for {job.duration || 0} hours</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 font-bold text-green-400">
                                                        <DollarSignIcon className="w-4 h-4" />
                                                        <span>Payout: ${payout.toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                {currentUser && (currentUser as any).specialties ? (
                                                    <button 
                                                        onClick={() => {
                                                            acceptJob(job);
                                                            setActiveFilter('ALL');
                                                        }}
                                                        className="w-full bg-green-500 text-white font-semibold py-2 rounded-md hover:bg-green-600 transition-colors"
                                                    >
                                                        Accept Job
                                                    </button>
                                                ) : (
                                                    <p className="text-xs text-zinc-500 text-center py-2">Only engineers can accept jobs</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
             <div className="absolute bottom-4 left-4 z-10 bg-zinc-900/80 backdrop-blur-sm p-4 rounded-xl border border-zinc-700/50 shadow-lg">
                <h4 className="font-bold text-sm text-zinc-100 mb-2">Legend</h4>
                <ul className="space-y-1.5">
                    <li className="flex items-center gap-2">
                        <HouseIcon className="w-5 h-5 text-red-400" />
                        <span className="text-xs text-zinc-300">Stoodio</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <SoundWaveIcon className="w-5 h-5 text-orange-400" />
                        <span className="text-xs text-zinc-300">Engineer</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <MusicNoteIcon className="w-5 h-5 text-purple-400" />
                        <span className="text-xs text-zinc-300">Producer</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <MicrophoneIcon className="w-5 h-5 text-blue-400" />
                        <span className="text-xs text-zinc-300">Artist</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <DollarSignIcon className="w-5 h-5 text-green-400" />
                        <span className="text-xs text-zinc-300">Open Job</span>
                    </li>
                </ul>
            </div>

            {/* Invite Studio Modal */}
            {inviteModalOpen && selectedStudioForInvite && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-zinc-100">Invite Studio to Join</h2>
                            <button
                                onClick={() => {
                                    setInviteModalOpen(false);
                                    setSelectedStudioForInvite(null);
                                    setInviteEmail('');
                                }}
                                className="text-zinc-400 hover:text-zinc-100"
                            >
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <p className="text-zinc-300 font-semibold mb-2">{selectedStudioForInvite.name}</p>
                            {selectedStudioForInvite.address && (
                                <p className="text-zinc-400 text-sm">{selectedStudioForInvite.address}</p>
                            )}
                            {selectedStudioForInvite.city && selectedStudioForInvite.state && (
                                <p className="text-zinc-400 text-sm">{selectedStudioForInvite.city}, {selectedStudioForInvite.state}</p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label htmlFor="invite-email" className="block text-sm font-medium text-zinc-300 mb-2">
                                Studio Email Address
                            </label>
                            <input
                                id="invite-email"
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="studio@example.com"
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                disabled={isInviting}
                            />
                            <p className="text-xs text-zinc-500 mt-1">
                                We'll send them an invitation to join Stoodioz
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setInviteModalOpen(false);
                                    setSelectedStudioForInvite(null);
                                    setInviteEmail('');
                                }}
                                className="flex-1 px-4 py-2 bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 transition-colors"
                                disabled={isInviting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendInvite}
                                disabled={isInviting || !inviteEmail || !inviteEmail.includes('@')}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isInviting ? 'Sending...' : 'Send Invite'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fetch Studios Modal */}
            {showFetchModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-zinc-100">Fetch Recording Studios</h2>
                            <button
                                onClick={() => {
                                    setShowFetchModal(false);
                                    setFetchLocation('');
                                }}
                                className="text-zinc-400 hover:text-zinc-100"
                            >
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <p className="text-zinc-400 text-sm mb-4">
                            Enter a city and state to search for recording studios in that area. This will fetch studios from Google Places API and add them to the map.
                        </p>

                        <div className="mb-4">
                            <label htmlFor="fetch-location" className="block text-sm font-medium text-zinc-300 mb-2">
                                Location (City, State)
                            </label>
                            <input
                                id="fetch-location"
                                type="text"
                                value={fetchLocation}
                                onChange={(e) => setFetchLocation(e.target.value)}
                                placeholder="e.g., Nashville, TN or Los Angeles, CA"
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                disabled={isFetchingStudios}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !isFetchingStudios) {
                                        handleFetchStudios();
                                    }
                                }}
                            />
                            <p className="text-xs text-zinc-500 mt-1">
                                Examples: "Nashville, TN", "Los Angeles, CA", "Atlanta, GA", "New York, NY"
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowFetchModal(false);
                                    setFetchLocation('');
                                }}
                                className="flex-1 px-4 py-2 bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 transition-colors"
                                disabled={isFetchingStudios}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFetchStudios}
                                disabled={isFetchingStudios || !fetchLocation.trim()}
                                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isFetchingStudios ? 'Fetching...' : 'Fetch Studios'}
                            </button>
                        </div>

                        {isFetchingStudios && (
                            <p className="text-xs text-zinc-400 mt-3 text-center">
                                This may take 30-60 seconds. Please don't close this window.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapView;
