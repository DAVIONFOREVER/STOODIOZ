import React, { useState, useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import type { Stoodio, Artist, Engineer, Producer } from '../types';
import { useAppState } from '../contexts/AppContext';
import MapInfoPopup from './MapInfoPopup';
import { useNavigation } from '../hooks/useNavigation';

type MapUser = Artist | Engineer | Producer | Stoodio;

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 10rem)',
  borderRadius: '1rem',
};

const center = {
  lat: 39.8283,
  lng: -98.5795,
};

// Dark "Aubergine" map style from Google Maps Platform
const mapOptions = {
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#263c3f' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6b9a76' }],
    },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }],
    },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#746855' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1f2835' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f3d19c' }],
    },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#515c6d' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#17263c' }],
    },
  ],
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};

const libraries: ('places')[] = ['places'];

interface MapViewProps {
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectProducer: (producer: Producer) => void;
    onInitiateBooking: (engineer: Engineer, date: string, time: string) => void;
}

const MapView: React.FC<MapViewProps> = ({ onSelectStoodio, onSelectEngineer, onSelectArtist, onSelectProducer }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: (process as any).env.API_KEY || (import.meta as any).env.VITE_API_KEY,
        libraries,
    });

    const { stoodioz, artists, engineers, producers } = useAppState();
    const { navigateToStudio } = useNavigation();
    const [selected, setSelected] = useState<MapUser | null>(null);

    const mapUsers = useMemo<MapUser[]>(() => {
        const allUsers: MapUser[] = [
            ...stoodioz,
            ...artists,
            ...engineers,
            ...producers,
        ];
        return allUsers.filter(u => u.showOnMap && u.coordinates);
    }, [stoodioz, artists, engineers, producers]);

    const handleMarkerClick = useCallback((user: MapUser) => {
        setSelected(user);
    }, []);

    const handleInfoWindowClose = useCallback(() => {
        setSelected(null);
    }, []);
    
    const handleSelectFromPopup = useCallback((user: MapUser) => {
        setSelected(null); // Close the popup on selection
        if ('amenities' in user) onSelectStoodio(user);
        else if ('specialties' in user) onSelectEngineer(user);
        else if ('instrumentals' in user) onSelectProducer(user);
        else onSelectArtist(user as Artist);
    }, [onSelectStoodio, onSelectArtist, onSelectEngineer, onSelectProducer]);

    const renderMap = () => (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={4}
            options={mapOptions}
        >
            <>
                {mapUsers.map(user => (
                    <Marker
                        key={user.id}
                        position={{ lat: user.coordinates.lat, lng: user.coordinates.lon }}
                        onClick={() => handleMarkerClick(user)}
                        icon={{
                            // FIX: Resolve TypeScript error `Property 'google' does not exist on type 'Window'` by casting `window` to `any`.
                            path: (window as any).google.maps.SymbolPath.CIRCLE,
                            fillColor: '#f97316',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 1.5,
                            scale: 7,
                        }}
                        title={user.name}
                    />
                ))}

                {selected && (
                    <InfoWindow
                        position={{ lat: selected.coordinates.lat, lng: selected.coordinates.lon }}
                        onCloseClick={handleInfoWindowClose}
                        // FIX: Resolve TypeScript error `Property 'google' does not exist on type 'Window'` by casting `window` to `any`.
                        options={{ pixelOffset: new (window as any).google.maps.Size(0, -30) }}
                    >
                        <MapInfoPopup 
                            user={selected} 
                            onClose={handleInfoWindowClose}
                            onSelect={handleSelectFromPopup}
                            onNavigate={navigateToStudio}
                        />
                    </InfoWindow>
                )}
            </>
        </GoogleMap>
    );

    if (loadError) {
        return <div className="text-red-400 p-4 bg-red-900/50 rounded-lg">Error loading maps. Please check your API key and internet connection.</div>;
    }

    return isLoaded ? renderMap() : (
         <div className="flex justify-center items-center" style={mapContainerStyle}>
            <svg className="animate-spin h-10 w-10 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );
};

export default MapView;