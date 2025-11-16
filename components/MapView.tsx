// FIX: Removed reference to @types/google.maps as it is not available in the environment.
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, OverlayViewF, DirectionsService, DirectionsRenderer, MarkerF } from '@react-google-maps/api';
import type { Stoodio, Artist, Engineer, Producer, Booking, Location } from '../types';
import { UserRole, BookingStatus } from '../types';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext.tsx';
import { useNavigation } from '../hooks/useNavigation.ts';
import { HouseIcon, MicrophoneIcon, SoundWaveIcon, MusicNoteIcon, DollarSignIcon, UsersIcon } from './icons.tsx';
import MapJobPopup from './MapJobPopup.tsx';
import MapInfoPopup from './MapInfoPopup.tsx';
import { getSupabase } from '../lib/supabase.ts';
import type { RealtimeChannel } from '@supabase/supabase-js';

// --- TYPE DEFINITIONS ---
type MapUser = Artist | Engineer | Producer | Stoodio;
type MapJob = Booking & { itemType: 'JOB' };
type MapItem = MapUser | MapJob;
type FilterType = 'ALL' | 'STOODIO' | 'ENGINEER' | 'PRODUCER' | 'ARTIST' | 'JOB';
type RealtimeLocationPayload = {
    event: 'location_update',
    payload: {
        userId: string,
        coordinates: Location
    }
}

// --- MAP CONFIGURATION ---
const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 10rem)',
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
}> = ({ item, onClick }) => {
    const getRoleInfo = () => {
        if ('itemType' in item && item.itemType === 'JOB') {
            return {
                icon: <DollarSignIcon className="w-5 h-5 text-green-400" />,
                bgColor: 'bg-green-900/50',
                borderColor: 'border-green-500',
            };
        }
        if ('amenities' in item) return { icon: <HouseIcon className="w-5 h-5 text-red-400" />, bgColor: 'bg-red-900/50', borderColor: 'border-red-500' };
        if ('specialties' in item) return { icon: <SoundWaveIcon className="w-5 h-5 text-orange-400" />, bgColor: 'bg-orange-900/50', borderColor: 'border-orange-500' };
        if ('instrumentals' in item) return { icon: <MusicNoteIcon className="w-5 h-5 text-purple-400" />, bgColor: 'bg-purple-900/50', borderColor: 'border-purple-500' };
        return { icon: <MicrophoneIcon className="w-5 h-5 text-blue-400" />, bgColor: 'bg-blue-900/50', borderColor: 'border-blue-500' };
    };

    const { icon, bgColor, borderColor } = getRoleInfo();

    return (
        <button
            onClick={() => onClick(item)}
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 marker-glow ${bgColor} ${borderColor} transition-transform duration-500 ease-in-out`}
            style={{
                transform: `translate(${(item.coordinates?.lng || 0)}px, ${(item.coordinates?.lat || 0)}px)`
            }}
        >
            {icon}
        </button>
    );
};

// --- MAIN COMPONENT ---
interface MapViewProps {
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectProducer: (producer: Producer) => void;
}

const MapView: React.FC<MapViewProps> = ({ onSelectStoodio, onSelectArtist, onSelectEngineer, onSelectProducer }) => {
    const { stoodioz, artists, engineers, producers, bookings, directionsIntent, currentUser } = useAppState();
    const dispatch = useAppDispatch();
    const { navigateToStudio } = useNavigation();

    // FIX: Replaced google.maps.Map with any.
    const [map, setMap] = useState<any | null>(null);
    const [userLocation, setUserLocation] = useState<Location | null>(null);
    const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    // FIX: Replaced google.maps.DirectionsResult with any.
    const [directions, setDirections] = useState<any | null>(null);
    const [directionsOrigin, setDirectionsOrigin] = useState<Location | null>(null);
    const [directionsDestination, setDirectionsDestination] = useState<Location | null>(null);
    const [navigatingUserPosition, setNavigatingUserPosition] = useState<Location | null>(null);
    const [realtimeLocations, setRealtimeLocations] = useState<Map<string, Location>>(new Map());
    const channelRef = useRef<RealtimeChannel | null>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY,
    });
    
    // Effect for user's own location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setUserLocation(newLocation);
                if (map && !directionsIntent) {
                    map.panTo({ lat: newLocation.lat, lng: newLocation.lng });
                }
            },
            () => console.log("Could not get user's location."),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [map, directionsIntent]);

    // Effect for Supabase real-time channel
    useEffect(() => {
        const supabase = getSupabase();
        if (!supabase) return;

        const channel = supabase.channel('public:locations');
        channelRef.current = channel;

        channel
            .on('broadcast', { event: 'location_update' }, (message) => {
                const { userId, coordinates } = message.payload;
                // FIX: Removed the check that ignored the current user's updates.
                // This allows the user to see their own public marker move in real-time.
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
            const booking = bookings.find(b => b.id === directionsIntent.bookingId);
            if (booking?.stoodio?.coordinates) {
                setDirectionsOrigin(userLocation);
                setDirectionsDestination(booking.stoodio.coordinates);
                setNavigatingUserPosition(userLocation); // Start navigation from current position
            }
        }
        
        // Cleanup function to clear the intent when leaving the map view
        return () => {
            if (directionsIntent) {
                dispatch({ type: ActionTypes.SET_DIRECTIONS_INTENT, payload: { bookingId: null } });
            }
        }
    }, [directionsIntent, userLocation, bookings, dispatch]);

    useEffect(() => {
        if (!directions) return;

        const route = directions.routes[0].overview_path;
        let step = 0;
        const interval = setInterval(() => {
            if (step < route.length) {
                setNavigatingUserPosition({ lat: route[step].lat(), lng: route[step].lng() });
                step++;
            } else {
                clearInterval(interval);
            }
        }, 1000); // Simulate movement every second

        return () => clearInterval(interval);
    }, [directions]);

    const mapItems = useMemo((): MapItem[] => {
        const jobs = bookings
            .filter(b => b.postedBy === UserRole.STOODIO && b.status === BookingStatus.PENDING)
            .map(b => ({ ...b, itemType: 'JOB' as const }));

        let items: MapUser[] = [];

        if (activeFilter === 'ALL' || activeFilter === 'STOODIO') items.push(...stoodioz);
        if (activeFilter === 'ALL' || activeFilter === 'ARTIST') items.push(...artists);
        if (activeFilter === 'ALL' || activeFilter === 'ENGINEER') items.push(...engineers);
        if (activeFilter === 'ALL' || activeFilter === 'PRODUCER') items.push(...producers);

        let visibleUsers = items.filter(u => u.showOnMap && u.coordinates);

        // FIX: Ensure the current user is always included in the visible list if their "Show on Map" is enabled, regardless of filters.
        if (currentUser && currentUser.showOnMap && currentUser.coordinates && !visibleUsers.some(u => u.id === currentUser.id)) {
            visibleUsers.push(currentUser);
        }

        const liveUpdatedUsers = visibleUsers.map(user => {
            if (realtimeLocations.has(user.id)) {
                return { ...user, coordinates: realtimeLocations.get(user.id)! };
            }
            return user;
        });
        
        let allItems: MapItem[] = liveUpdatedUsers;
        if (activeFilter === 'ALL' || activeFilter === 'JOB') allItems.push(...jobs.filter(j => j.coordinates));
        
        return allItems;
    }, [stoodioz, artists, engineers, producers, bookings, activeFilter, realtimeLocations, currentUser]);
    
    const handleMarkerClick = useCallback((item: MapItem) => {
        setSelectedItem(item);
        if (item.coordinates && map) {
            map.panTo({ lat: item.coordinates.lat, lng: item.coordinates.lng });
        }
    }, [map]);

    const handleSelectProfile = (user: MapUser) => {
        if ('amenities' in user) onSelectStoodio(user as Stoodio);
        else if ('specialties' in user) onSelectEngineer(user as Engineer);
        else if ('instrumentals' in user) onSelectProducer(user as Producer);
        else onSelectArtist(user as Artist);
    };
    
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
                center={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : defaultCenter}
                zoom={userLocation ? 12 : 4}
                options={mapOptions}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={() => setSelectedItem(null)}
            >
                {directionsOrigin && directionsDestination && (
                    <DirectionsService
                        options={{
                            destination: { lat: directionsDestination.lat, lng: directionsDestination.lng },
                            origin: { lat: directionsOrigin.lat, lng: directionsOrigin.lng },
                            travelMode: 'DRIVING' as any
                        }}
                        callback={directionsCallback}
                    />
                )}

                {directions && <DirectionsRenderer options={{ directions, suppressMarkers: true, polylineOptions: { strokeColor: '#f97316', strokeWeight: 6 } }} />}

                {navigatingUserPosition ? (
                    <MarkerF 
                        position={{ lat: navigatingUserPosition.lat, lng: navigatingUserPosition.lng }}
                        title="Your Location"
                        icon={{
                            // FIX: Cast window to any to access google.maps properties.
                            path: (window as any).google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: '#3b82f6',
                            fillOpacity: 1,
                            strokeColor: 'white',
                            strokeWeight: 2,
                        }}
                    />
                // FIX: Only show the private "blue dot" marker if the user is NOT showing their public profile on the map.
                ) : userLocation && (!currentUser || !currentUser.showOnMap) && (
                    <OverlayViewF position={{ lat: userLocation.lat, lng: userLocation.lng }} mapPaneName={OverlayViewF.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={getPixelPositionOffset}>
                        <UserMarker />
                    </OverlayViewF>
                )}


                {mapItems.map(item => (
                    item.coordinates && (
                         <OverlayViewF key={item.id} position={{ lat: item.coordinates.lat, lng: item.coordinates.lng }} mapPaneName={OverlayViewF.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={() => getPixelPositionOffset(40,40)}>
                            <MapMarker item={item} onClick={handleMarkerClick} />
                        </OverlayViewF>
                    )
                ))}
                
                {selectedItem && selectedItem.coordinates && (
                    <OverlayViewF position={{ lat: selectedItem.coordinates.lat, lng: selectedItem.coordinates.lng }} mapPaneName={OverlayViewF.FLOAT_PANE} getPixelPositionOffset={() => ({ x: 0, y: 0 })}>
                        {'itemType' in selectedItem && selectedItem.itemType === 'JOB' ? (
                             <MapJobPopup job={selectedItem as Booking & { itemType: 'JOB' }} onClose={() => setSelectedItem(null)} />
                        ) : (
                             <MapInfoPopup user={selectedItem as MapUser} onClose={() => setSelectedItem(null)} onSelect={handleSelectProfile} onNavigate={navigateToStudio}/>
                        )}
                    </OverlayViewF>
                )}
            </GoogleMap>
             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 p-1 bg-zinc-900/80 backdrop-blur-sm rounded-full shadow-lg flex items-center gap-1">
                <TabButton label="All" active={activeFilter === 'ALL'} onClick={() => setActiveFilter('ALL')} icon={<UsersIcon className="w-4 h-4" />} />
                <TabButton label="Studios" active={activeFilter === 'STOODIO'} onClick={() => setActiveFilter('STOODIO')} icon={<HouseIcon className="w-4 h-4" />} />
                <TabButton label="Engineers" active={activeFilter === 'ENGINEER'} onClick={() => setActiveFilter('ENGINEER')} icon={<SoundWaveIcon className="w-4 h-4" />} />
                <TabButton label="Producers" active={activeFilter === 'PRODUCER'} onClick={() => setActiveFilter('PRODUCER')} icon={<MusicNoteIcon className="w-4 h-4" />} />
                <TabButton label="Artists" active={activeFilter === 'ARTIST'} onClick={() => setActiveFilter('ARTIST')} icon={<MicrophoneIcon className="w-4 h-4" />} />
                <TabButton label="Jobs" active={activeFilter === 'JOB'} onClick={() => setActiveFilter('JOB')} icon={<DollarSignIcon className="w-4 h-4" />} />
            </div>
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
        </div>
    );
};

export default MapView;