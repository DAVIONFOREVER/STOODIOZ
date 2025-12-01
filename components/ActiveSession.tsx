
import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, MarkerF } from '@react-google-maps/api';
import type { Artist, Location } from '../types';
import { LocationIcon, NavigationArrowIcon, ClockIcon, DollarSignIcon } from './icons.tsx';
import { useAppState } from '../contexts/AppContext.tsx';
import type { AppState } from '../contexts/AppContext.tsx';
import { getSupabase } from '../lib/supabase.ts';

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

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

const ActiveSessionMap: React.FC<{ session: NonNullable<AppState['activeSession']> }> = ({ session }) => {
    const env = (import.meta as any).env || {};
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script-session',
        googleMapsApiKey: env.VITE_GOOGLE_MAPS_API_KEY || '',
    });

    // FIX: Replaced google.maps.DirectionsResult with any.
    const [directions, setDirections] = useState<any | null>(null);
    const [engineerPosition, setEngineerPosition] = useState<Location | null>(null);
    const [progress, setProgress] = useState<'EN_ROUTE' | 'IN_SESSION'>('EN_ROUTE');

    const studioLocation = session.stoodio?.coordinates;
    const engineer = session.engineer;
    const artist = session.artist;
    
    // Initialize engineer position from profile if available, otherwise null (wait for update)
    useEffect(() => {
        if (engineer?.coordinates && !engineerPosition) {
             setEngineerPosition(engineer.coordinates);
        }
    }, [engineer]);

    // Listen for Realtime Location Updates from the Engineer
    useEffect(() => {
        if (!engineer) return;
        const supabase = getSupabase();
        if (!supabase) return;

        const channel = supabase.channel('public:locations');
        
        channel
            .on('broadcast', { event: 'location_update' }, (message) => {
                if (message.payload.userId === engineer.id) {
                    setEngineerPosition(message.payload.coordinates);
                    
                    // Calculate distance to auto-update status
                    // (Simplified check: if within ~0.001 deg lat/lon, assume arrived)
                    if (studioLocation && 
                        Math.abs(message.payload.coordinates.lat - studioLocation.lat) < 0.001 &&
                        Math.abs(message.payload.coordinates.lon - studioLocation.lon) < 0.001
                    ) {
                        setProgress('IN_SESSION');
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [engineer, studioLocation]);

    const directionsCallback = (
        // FIX: Replaced google.maps.DirectionsResult with any.
        response: any | null,
        // FIX: Replaced google.maps.DirectionsStatus with any.
        status: any
    ) => {
        if (status === 'OK' && response) {
            setDirections(response);
        } else {
            console.error(`Directions request failed due to ${status}`);
        }
    };

    if (!isLoaded || !studioLocation) {
        return <div className="w-full h-64 md:h-80 bg-zinc-900 flex items-center justify-center text-zinc-400">Loading Map...</div>;
    }

    return (
        <GoogleMap mapContainerStyle={mapContainerStyle} center={{ lat: studioLocation.lat, lng: studioLocation.lon }} zoom={12} options={mapOptions}>
            {engineerPosition && (
                <DirectionsService
                    options={{
                        destination: { lat: studioLocation.lat, lng: studioLocation.lon },
                        origin: { lat: engineerPosition.lat, lng: engineerPosition.lon },
                        // FIX: Replaced google.maps.TravelMode.DRIVING with string 'DRIVING' and cast to any.
                        travelMode: 'DRIVING' as any
                    }}
                    callback={directionsCallback}
                />
            )}
            
            {directions && <DirectionsRenderer options={{ directions, suppressMarkers: true, polylineOptions: { strokeColor: '#f97316', strokeWeight: 6 } }} />}
            
            <MarkerF position={{ lat: studioLocation.lat, lng: studioLocation.lon }} title={session.stoodio?.name} />

            {artist?.coordinates && <MarkerF position={{ lat: artist.coordinates.lat, lng: artist.coordinates.lon }} title={artist.name} />}
            
            {engineer && engineerPosition && (
                <MarkerF 
                    position={{ lat: engineerPosition.lat, lng: engineerPosition.lon }}
                    title={engineer.name}
                    icon={{
                        // FIX: Cast window to any to access google.maps properties.
                        path: (window as any).google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: '#fb923c',
                        fillOpacity: 1,
                        strokeColor: 'white',
                        strokeWeight: 2
                    }}
                />
            )}
        </GoogleMap>
    );
};


interface ActiveSessionProps {
    onEndSession: (bookingId: string) => void;
    onSelectArtist: (artist: Artist) => void;
}

const TimelineStep: React.FC<{ title: string; isComplete: boolean; isCurrent: boolean }> = ({ title, isComplete, isCurrent }) => {
    return (
        <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isComplete || isCurrent ? 'bg-orange-500' : 'bg-slate-600'}`}>
                {isComplete && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className={`ml-2 font-semibold ${isCurrent ? 'text-orange-400' : isComplete ? 'text-slate-200' : 'text-slate-400'}`}>{title}</span>
        </div>
    );
};

const ActiveSession: React.FC<ActiveSessionProps> = ({ onEndSession, onSelectArtist }) => {
    const { activeSession: session } = useAppState();
    const [progress, setProgress] = useState<'EN_ROUTE' | 'IN_SESSION'>('EN_ROUTE');
    
    if (!session) return null;

    // FIX: Corrected property 'engineerPayRate' to 'engineer_pay_rate' to match the 'Booking' type definition.
    const engineerPayout = session.engineer_pay_rate * session.duration;

    const handleStartSession = () => {
        setProgress('IN_SESSION');
    };
    
    const handleEndSession = () => {
        if (window.confirm("Are you sure you want to end the session? This will finalize the booking.")) {
            onEndSession(session.id);
        }
    };

    const formattedDate = new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    });

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-extrabold text-center mb-6 tracking-tight text-orange-500">Active Session</h1>
            {/* Timeline Header */}
            <div className="p-4 mb-6 cardSurface">
                <div className="flex justify-between items-center">
                    <TimelineStep title="On the Way" isComplete={progress === 'IN_SESSION'} isCurrent={progress === 'EN_ROUTE'} />
                    <div className="flex-grow h-0.5 bg-slate-600 mx-4"><div className={`h-full ${progress === 'IN_SESSION' ? 'bg-orange-500' : 'bg-slate-600'}`}></div></div>
                    <TimelineStep title="In Session" isComplete={false} isCurrent={progress === 'IN_SESSION'} />
                </div>
            </div>
            
            <div className="overflow-hidden cardSurface">
                {/* Map/Navigation View */}
                <div className="relative w-full h-64 md:h-80">
                    <ActiveSessionMap session={session} />
                    <div className="absolute top-4 left-4 bg-zinc-800/80 backdrop-blur-sm p-4 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-slate-100">{session.stoodio?.name}</h2>
                        <p className="text-slate-300 flex items-center gap-2 mt-1"><LocationIcon className="w-5 h-5" /> {session.stoodio?.location}</p>
                    </div>
                     <div className="absolute bottom-4 right-4 bg-zinc-800/80 backdrop-blur-sm p-3 rounded-lg shadow-lg text-center">
                        <p className="text-sm text-slate-400">Status</p>
                        <p className="text-xl font-bold text-orange-400">{progress === 'EN_ROUTE' ? 'Tracking Engineer...' : 'Session Live'}</p>
                    </div>
                </div>

                {/* Session Details & Artist Info */}
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row gap-6 justify-between">
                        {session.artist ? (
                            <div className="cursor-pointer group" onClick={() => onSelectArtist(session.artist!)}>
                                <p className="text-slate-400 font-semibold">SESSION FOR</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <img src={session.artist.image_url} alt={session.artist.name} className="w-12 h-12 rounded-xl object-cover"/>
                                    <div>
                                        <h3 className="text-xl font-bold group-hover:text-orange-400 transition-colors">{session.artist.name}</h3>
                                    </div>
                                </div>
                            </div>
                        ) : (
                             <div>
                                <p className="text-slate-400 font-semibold">SESSION TYPE</p>
                                <h3 className="text-xl font-bold mt-2">Studio Posted Job</h3>
                            </div>
                        )}
                        <div className="text-left sm:text-right">
                            <p className="text-slate-400 font-semibold">DATE & TIME</p>
                            <p className="text-lg font-bold mt-2">{formattedDate}</p>
                            <p className="text-slate-300">{session.start_time} for {session.duration} hours</p>
                        </div>
                    </div>
                    <div className="border-t border-zinc-700 my-6"></div>
                    <div className="bg-zinc-700/50 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <DollarSignIcon className="w-8 h-8 text-green-400" />
                            <div>
                                <p className="font-semibold">Your Payout</p>
                                <p className="text-xs text-slate-400">Paid upon session completion</p>
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-green-400">${engineerPayout.toFixed(2)}</p>
                    </div>
                </div>

                {/* Main Action Button */}
                <div className="p-4 bg-zinc-800/50 border-t border-zinc-700">
                    {progress === 'EN_ROUTE' && (
                        <button onClick={handleStartSession} className="w-full bg-orange-500 text-white font-bold text-lg py-4 px-6 rounded-xl hover:bg-orange-600 transition-all shadow-lg flex items-center justify-center gap-3">
                           <NavigationArrowIcon className="w-6 h-6" /> Start Session
                        </button>
                    )}
                    {progress === 'IN_SESSION' && (
                        <button onClick={handleEndSession} className="w-full bg-red-500 text-white font-bold text-lg py-4 px-6 rounded-xl hover:bg-red-600 transition-all shadow-lg flex items-center justify-center gap-3">
                            <ClockIcon className="w-6 h-6" /> End Session
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActiveSession;
