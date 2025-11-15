import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, OverlayViewF } from '@react-google-maps/api';
import type { Stoodio, Artist, Engineer, Producer, Booking, Location } from '../types';
import { UserRole, BookingStatus } from '../types';
import { useAppState } from '../contexts/AppContext.tsx';
import { useNavigation } from '../hooks/useNavigation.ts';
import { HouseIcon, MicrophoneIcon, SoundWaveIcon, MusicNoteIcon, DollarSignIcon } from './icons.tsx';
import MapJobPopup from './MapJobPopup.tsx';
import MapInfoPopup from './MapInfoPopup.tsx';

// FIX: Add minimal google.maps type declarations to resolve TypeScript errors
// when @types/google.maps is not installed. This avoids using 'any' and provides
// type safety for the methods being used.
declare global {
  namespace google {
    namespace maps {
      class Map {
        constructor(mapDiv: Element | null, opts?: any);
        panTo(latLng: { lat: number; lng: number }): void;
      }
    }
  }
}

// --- TYPE DEFINITIONS ---
type MapUser = Artist | Engineer | Producer | Stoodio;
type MapJob = Booking & { itemType: 'JOB' };
type MapItem = MapUser | MapJob;

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

// --- MARKER COMPONENTS ---

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
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 marker-glow ${bgColor} ${borderColor}`}
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
    const { stoodioz, artists, engineers, producers, bookings } = useAppState();
    const { navigateToStudio } = useNavigation();

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [center, setCenter] = useState(defaultCenter);
    const [userLocation, setUserLocation] = useState<Location | null>(null);
    const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
    
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY,
    });
    
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                };
                setUserLocation(newLocation);
                if (map) {
                    map.panTo({ lat: newLocation.lat, lng: newLocation.lon });
                } else {
                    setCenter({ lat: newLocation.lat, lng: newLocation.lon });
                }
            },
            () => {
                console.log("Could not get user's location. Using default.");
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }, [map]);

    const mapItems = useMemo((): MapItem[] => {
        const jobs = bookings
            .filter(b => b.postedBy === UserRole.STOODIO && b.status === BookingStatus.PENDING)
            .map(b => ({ ...b, itemType: 'JOB' as const }));

        return [
            ...stoodioz.filter(s => s.showOnMap && s.coordinates),
            ...artists.filter(a => a.showOnMap && a.coordinates),
            ...engineers.filter(e => e.showOnMap && e.displayExactLocation && e.coordinates),
            ...producers.filter(p => p.showOnMap && p.coordinates),
            ...jobs.filter(j => j.coordinates),
        ] as MapItem[];
    }, [stoodioz, artists, engineers, producers, bookings]);
    
    const handleMarkerClick = useCallback((item: MapItem) => {
        setSelectedItem(item);
    }, []);

    const handleSelectProfile = (user: MapUser) => {
        if ('amenities' in user) onSelectStoodio(user as Stoodio);
        else if ('specialties' in user) onSelectEngineer(user as Engineer);
        else if ('instrumentals' in user) onSelectProducer(user as Producer);
        else onSelectArtist(user as Artist);
    };
    
    const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
        setMap(mapInstance);
    }, []);

    const onUnmount = useCallback(function callback(mapInstance: google.maps.Map) {
        setMap(null);
    }, []);

    if (!isLoaded) return <div className="flex items-center justify-center" style={{ height: mapContainerStyle.height }}>Loading Map...</div>;
    
    return (
        <div className="relative rounded-2xl overflow-hidden" style={{ height: mapContainerStyle.height }}>
            <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={{ lat: center.lat, lng: center.lng }}
                zoom={userLocation ? 12 : 4}
                options={mapOptions}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={() => setSelectedItem(null)}
            >
                {userLocation && (
                    <OverlayViewF
                        position={{ lat: userLocation.lat, lng: userLocation.lon }}
                        mapPaneName={OverlayViewF.OVERLAY_MOUSE_TARGET}
                        getPixelPositionOffset={() => getPixelPositionOffset(24, 24)}
                    >
                        <UserMarker />
                    </OverlayViewF>
                )}

                {mapItems.map(item => (
                    item.coordinates && (
                         <OverlayViewF
                            key={item.id}
                            position={{ lat: item.coordinates.lat, lng: item.coordinates.lon }}
                            mapPaneName={OverlayViewF.OVERLAY_MOUSE_TARGET}
                            getPixelPositionOffset={() => getPixelPositionOffset(40, 40)}
                        >
                            <MapMarker item={item} onClick={handleMarkerClick} />
                        </OverlayViewF>
                    )
                ))}
                
                {selectedItem && selectedItem.coordinates && (
                    <OverlayViewF
                        position={{ lat: selectedItem.coordinates.lat, lng: selectedItem.coordinates.lon }}
                        mapPaneName={OverlayViewF.FLOAT_PANE}
                        getPixelPositionOffset={() => ({ x: 0, y: 0 })}
                    >
                        {'itemType' in selectedItem && selectedItem.itemType === 'JOB' ? (
                             <MapJobPopup job={selectedItem as Booking & { itemType: 'JOB' }} onClose={() => setSelectedItem(null)} />
                        ) : (
                             <MapInfoPopup 
                                user={selectedItem as MapUser} 
                                onClose={() => setSelectedItem(null)} 
                                onSelect={handleSelectProfile} 
                                onNavigate={navigateToStudio}
                            />
                        )}
                    </OverlayViewF>
                )}
            </GoogleMap>
        </div>
    );
};

export default MapView;