import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, OverlayViewF } from '@react-google-maps/api';
import type { Stoodio, Artist, Engineer, Producer, Booking, Location } from '../types';
import { UserRole, BookingStatus } from '../types';
import { useAppState } from '../contexts/AppContext.tsx';
import { useNavigation } from '../hooks/useNavigation.ts';
import { HouseIcon, MicrophoneIcon, SoundWaveIcon, DiamondIcon, StarIcon } from './icons.tsx';
import MapJobPopup from './MapJobPopup.tsx';
import MapInfoPopup from './MapInfoPopup.tsx';

// --- TYPE DEFINITIONS ---
type MapUser = Artist | Engineer | Producer | Stoodio;
type MapJob = Booking & { itemType: 'JOB' };
type MapItem = (MapUser | MapJob) & { itemType: 'USER' | 'JOB' };
type RoleFilter = UserRole | 'JOBS';


// --- MAP CONFIGURATION ---
const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = { lat: 39.8283, lng: -98.5795 };

const mapOptions = {
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#18181b' }] }, // Darker background
    { elementType: 'labels.text.stroke', stylers: [{ color: '#18181b' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#737373' }] }, // Muted labels
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#f97316' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] }, // Hide points of interest
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

const libraries: ('places')[] = ['places'];

// --- HELPER & CHILD COMPONENTS ---

const getRole = (user: MapUser): UserRole => {
    if ('amenities' in user) return UserRole.STOODIO;
    if ('specialties' in user) return UserRole.ENGINEER;
    if ('instrumentals' in user) return UserRole.PRODUCER;
    return UserRole.ARTIST;
};

// Linear interpolation function for smooth animation
const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;


const MapHoverCard: React.FC<{ item: MapItem }> = ({ item }) => {
    let title = '', subtitle = '';
    if (item.itemType === 'USER') {
        const user = item as MapUser;
        title = user.name;
        const role = getRole(user);
        subtitle = role.charAt(0) + role.slice(1).toLowerCase();
        if ('rating_overall' in user) {
            subtitle += ` • ${user.rating_overall.toFixed(1)} ★`;
        }
    } else {
        const job = item as MapJob;
        title = `Engineer Needed`;
        subtitle = job.stoodio?.name || 'Unknown Studio';
    }

    return (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-60 p-3 cardSurface border-2 border-orange-500/50 animate-fade-in-up" style={{ animationDuration: '200ms'}}>
            <p className="font-bold text-orange-400 truncate">{title}</p>
            <p className="text-sm text-zinc-400 truncate">{subtitle}</p>
        </div>
    );
};

const MapMarker: React.FC<{ item: MapItem, onSelect: (item: MapItem) => void, inTransit?: boolean }> = ({ item, onSelect, inTransit }) => {
    const [isHovered, setIsHovered] = useState(false);
    let icon = null, classes = '';

    if (item.itemType === 'JOB') {
        icon = <StarIcon className="w-5 h-5 text-orange-400 marker-glow" />;
        classes = "w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center marker-pulse";
    } else {
        const user = item as MapUser;
        const role = getRole(user);
        switch(role) {
            case UserRole.ARTIST:
                icon = <MicrophoneIcon className="w-4 h-4 text-white" />;
                classes = `w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center marker-glow ${inTransit ? 'marker-pulse' : ''}`;
                break;
            case UserRole.PRODUCER:
                icon = <DiamondIcon className={`w-5 h-5 text-purple-400 marker-glow ${inTransit ? 'marker-pulse' : ''}`} />;
                break;
            case UserRole.ENGINEER:
                icon = <SoundWaveIcon className={`w-5 h-5 text-amber-400 marker-glow ${inTransit ? 'marker-pulse' : ''}`} />;
                break;
            case UserRole.STOODIO:
                icon = <HouseIcon className="w-5 h-5 text-red-400 marker-glow" />;
                break;
        }
    }

    return (
        <div 
            onMouseOver={() => setIsHovered(true)} 
            onMouseOut={() => setIsHovered(false)} 
            onClick={() => onSelect(item)}
            className="relative flex items-center justify-center cursor-pointer"
            style={{ transform: 'translate(-50%, -50%)' }} // Center the marker
        >
            <div className={classes}>{icon}</div>
            {isHovered && !inTransit && <MapHoverCard item={item} />}
        </div>
    );
}

const FilterButton: React.FC<{ icon: React.ReactNode, label: RoleFilter, isActive: boolean, onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-3 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors border-2 ${isActive ? 'bg-orange-500 border-orange-400 text-white' : 'bg-black/50 border-zinc-700 text-zinc-300 hover:border-orange-500/50'}`}
    >
        {icon}{label}
    </button>
);


// --- MAIN COMPONENT ---
interface MapViewProps {
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectProducer: (producer: Producer) => void;
}

const MapView: React.FC<MapViewProps> = ({ onSelectStoodio, onSelectEngineer, onSelectArtist, onSelectProducer }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY,
        libraries,
    });

    const { stoodioz, artists, engineers, producers, bookings } = useAppState();
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [activeFilters, setActiveFilters] = useState<Set<RoleFilter>>(new Set([...Object.values(UserRole), 'JOBS']));
    const [showAvailableOnly, setShowAvailableOnly] = useState(false);
    const [animatedPositions, setAnimatedPositions] = useState<Record<string, { lat: number, lon: number }>>({});
    const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
    const [selectedJob, setSelectedJob] = useState<Booking | null>(null);

    const { navigateToStudio } = useNavigation();
    const animationFrameRef = useRef<number | null>(null);
    const animationStartRef = useRef<number | null>(null);
    const SIMULATION_DURATION = 30000; // 30 seconds for a full journey simulation

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
                () => console.log("Geolocation permission denied.")
            );
        }
    }, []);

    const mapCenter = useMemo(() => userLocation || defaultCenter, [userLocation]);

    const openJobs = useMemo<MapJob[]>(() => {
        return bookings
            .filter(b => b.postedBy === UserRole.STOODIO && b.status === BookingStatus.PENDING && b.stoodio?.coordinates)
            .map(b => ({ ...b, itemType: 'JOB' }));
    }, [bookings]);

    const inTransitUsers = useMemo(() => {
        const now = new Date();
        return bookings
            .filter(b => {
                if (!b.startTime || b.startTime === 'N/A') return false;
                const startTime = new Date(`${b.date}T${b.startTime}`);
                const timeDiff = startTime.getTime() - now.getTime();
                return b.status === BookingStatus.CONFIRMED && timeDiff > 0 && timeDiff <= 60 * 60 * 1000;
            })
            .map(b => ({
                user: b.artist || b.engineer || b.producer,
                destination: b.stoodio
            }))
            .filter((item): item is { user: NonNullable<typeof item.user>, destination: NonNullable<typeof item.destination> } => 
                !!(item.user && item.user.coordinates && item.destination && item.destination.coordinates)
            )
            .map(item => ({
                user: item.user!,
                start: item.user!.coordinates,
                end: item.destination!.coordinates
            }));
    }, [bookings]);


    useEffect(() => {
        const animate = (timestamp: number) => {
            if (animationStartRef.current === null) {
                animationStartRef.current = timestamp;
            }

            const elapsed = timestamp - animationStartRef.current;
            const progress = Math.min(elapsed / SIMULATION_DURATION, 1);
            
            const newPositions: Record<string, { lat: number, lon: number }> = {};
            inTransitUsers.forEach(journey => {
                const newLat = lerp(journey.start.lat, journey.end.lat, progress);
                const newLon = lerp(journey.start.lon, journey.end.lon, progress);
                newPositions[journey.user.id] = { lat: newLat, lon: newLon };
            });

            setAnimatedPositions(newPositions);

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        if (inTransitUsers.length > 0) {
            animationFrameRef.current = requestAnimationFrame(animate);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            animationStartRef.current = null;
        };
    }, [inTransitUsers]);


    const mapItems = useMemo<MapItem[]>(() => {
        const allUsers: MapUser[] = [...stoodioz, ...artists, ...engineers, ...producers];
        const userItems: MapItem[] = allUsers
            .filter(u => u.showOnMap && u.coordinates)
            .filter(u => !showAvailableOnly || ('isAvailable' in u && u.isAvailable))
            .filter(u => activeFilters.has(getRole(u)))
            .map(u => ({ ...u, itemType: 'USER' }));

        const jobItems: MapItem[] = activeFilters.has('JOBS') ? openJobs : [];

        return [...userItems, ...jobItems];
    }, [stoodioz, artists, engineers, producers, openJobs, activeFilters, showAvailableOnly]);

    const handleFilterToggle = (filter: RoleFilter) => {
        setActiveFilters(prev => {
            const newFilters = new Set(prev);
            if (newFilters.has(filter)) {
                newFilters.delete(filter);
            } else {
                newFilters.add(filter);
            }
            return newFilters;
        });
    };

    const handleNavigateToProfile = useCallback((item: MapItem) => {
        setSelectedItem(null);
        setSelectedJob(null);
        if (item.itemType === 'USER') {
            const user = item as MapUser;
            if ('amenities' in user) onSelectStoodio(user as Stoodio);
            else if ('specialties' in user) onSelectEngineer(user as Engineer);
            else if ('instrumentals' in user) onSelectProducer(user as Producer);
            else onSelectArtist(user as Artist);
        }
    }, [onSelectStoodio, onSelectArtist, onSelectEngineer, onSelectProducer]);

    const handleMarkerClick = useCallback((item: MapItem) => {
        if (item.itemType === 'USER') {
            setSelectedItem(item);
            setSelectedJob(null);
        } else {
            setSelectedJob(item as MapJob);
            setSelectedItem(null);
        }
    }, []);

    if (loadError) return <div className="p-4 text-red-400">Error loading maps.</div>;
    if (!isLoaded) return <div className="flex justify-center items-center h-full"><div className="w-10 h-10 border-4 border-t-orange-500 border-zinc-700 rounded-full animate-spin"></div></div>;

    const inTransitIds = new Set(Object.keys(animatedPositions));
    const staticItems = mapItems.filter(item => !inTransitIds.has(item.id));
    const animatedItems = mapItems.filter(item => inTransitIds.has(item.id));

    return (
        <div className="flex gap-6" style={{ height: 'calc(100vh - 144px)' }}>
            <div className="hidden lg:block w-72 flex-shrink-0 h-full overflow-y-auto p-4 cardSurface space-y-4">
                <h3 className="font-bold text-zinc-100 text-lg px-1">Filter Marketplace</h3>
                <div className="flex flex-col gap-2">
                    <FilterButton icon={<MicrophoneIcon className="w-4 h-4 text-green-400"/>} label={UserRole.ARTIST} isActive={activeFilters.has(UserRole.ARTIST)} onClick={() => handleFilterToggle(UserRole.ARTIST)} />
                    <FilterButton icon={<SoundWaveIcon className="w-4 h-4 text-amber-400"/>} label={UserRole.ENGINEER} isActive={activeFilters.has(UserRole.ENGINEER)} onClick={() => handleFilterToggle(UserRole.ENGINEER)} />
                    <FilterButton icon={<DiamondIcon className="w-4 h-4 text-purple-400"/>} label={UserRole.PRODUCER} isActive={activeFilters.has(UserRole.PRODUCER)} onClick={() => handleFilterToggle(UserRole.PRODUCER)} />
                    <FilterButton icon={<HouseIcon className="w-4 h-4 text-red-400"/>} label={UserRole.STOODIO} isActive={activeFilters.has(UserRole.STOODIO)} onClick={() => handleFilterToggle(UserRole.STOODIO)} />
                    <FilterButton icon={<StarIcon className="w-4 h-4 text-orange-400"/>} label="JOBS" isActive={activeFilters.has('JOBS')} onClick={() => handleFilterToggle('JOBS')} />
                </div>
                 <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-zinc-800">
                    <span className="text-sm font-semibold text-zinc-300">Available Now</span>
                    <div className="relative">
                        <input type="checkbox" className="sr-only" checked={showAvailableOnly} onChange={e => setShowAvailableOnly(e.target.checked)} />
                        <div className={`block w-10 h-5 rounded-full transition-colors ${showAvailableOnly ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                        <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${showAvailableOnly ? 'translate-x-5' : ''}`}></div>
                    </div>
                </label>
            </div>
            
            <div className="flex-grow relative h-full rounded-lg overflow-hidden cardSurface">
                 <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={userLocation ? 11 : 4} options={mapOptions}>
                    {staticItems.map(item => (
                        <OverlayViewF
                            key={item.id}
                            position={{ lat: item.coordinates!.lat, lng: item.coordinates!.lon }}
                            mapPaneName={'overlayMouseTarget'}
                        >
                            <MapMarker item={item} onSelect={handleMarkerClick} />
                        </OverlayViewF>
                    ))}
                    {animatedItems.map(item => (
                        <OverlayViewF
                            key={`${item.id}-animated`}
                            position={{ lat: animatedPositions[item.id].lat, lng: animatedPositions[item.id].lon }}
                            mapPaneName={'overlayMouseTarget'}
                        >
                            <MapMarker item={item} onSelect={handleMarkerClick} inTransit={true} />
                        </OverlayViewF>
                    ))}

                    {selectedItem && selectedItem.itemType === 'USER' && selectedItem.coordinates && (
                        <OverlayViewF
                            position={{ lat: selectedItem.coordinates.lat, lng: selectedItem.coordinates.lon }}
                            mapPaneName={'floatPane'}
                        >
                        <MapInfoPopup 
                                user={selectedItem as MapUser} 
                                onClose={() => setSelectedItem(null)} 
                                onSelect={() => handleNavigateToProfile(selectedItem)} 
                                onNavigate={navigateToStudio}
                        />
                        </OverlayViewF>
                    )}

                    {selectedJob && selectedJob.stoodio?.coordinates && (
                        <OverlayViewF 
                            position={{ lat: selectedJob.stoodio.coordinates.lat, lng: selectedJob.stoodio.coordinates.lon }}
                            mapPaneName={'floatPane'}
                        >
                           <MapJobPopup job={selectedJob} onClose={() => setSelectedJob(null)} />
                        </OverlayViewF>
                    )}
                </GoogleMap>
                
                <div className="absolute bottom-4 left-4 p-3 cardSurface space-y-2">
                    <h3 className="font-bold text-zinc-100 px-1 text-sm">Legend</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500 marker-glow"></div> Artist</span>
                        <span className="flex items-center gap-1.5"><DiamondIcon className="w-3 h-3 text-purple-400 marker-glow"/> Producer</span>
                        <span className="flex items-center gap-1.5"><SoundWaveIcon className="w-3 h-3 text-amber-400 marker-glow"/> Engineer</span>
                        <span className="flex items-center gap-1.5"><HouseIcon className="w-3 h-3 text-red-400 marker-glow"/> Stoodio</span>
                        <span className="flex items-center gap-1.5"><StarIcon className="w-3 h-3 text-orange-400 marker-glow"/> Job</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapView;