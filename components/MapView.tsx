import React, { useState, useMemo } from 'react';
import type { Stoodio, Engineer, Artist, Location, Booking, VibeMatchResult } from '../types';
import { BookingStatus } from '../types';
import { HouseIcon, SoundWaveIcon, MicrophoneIcon, ChevronUpIcon, ChevronDownIcon, BriefcaseIcon, MagicWandIcon } from './icons';
import MapBookingPopup from './MapBookingPopup';

interface MapViewProps {
    stoodioz: Stoodio[];
    engineers: Engineer[];
    artists: Artist[];
    bookings: Booking[];
    vibeMatchResults: VibeMatchResult | null;
    onSelectStoodio?: (stoodio: Stoodio) => void;
    onSelectEngineer?: (engineer: Engineer) => void;
    onSelectArtist?: (artist: Artist) => void;
    onInitiateBooking?: (engineer: Engineer, date: string, time: string) => void;
}

type PinType = 'stoodio' | 'engineer' | 'artist' | 'job' | 'vibe-match-stoodio' | 'vibe-match-engineer';

const MAP_BOUNDS = { minLat: 24.39, maxLat: 49.38, minLon: -125.0, maxLon: -66.94 };

/**
 * Adds a random offset to coordinates to obscure the exact location.
 */
const fuzzCoordinates = (coords: Location): Location => {
    const latOffset = (Math.random() - 0.5) * 0.2; // ~7 miles
    const lonOffset = (Math.random() - 0.5) * 0.25; // ~7 miles
    return {
        lat: coords.lat + latOffset,
        lon: coords.lon + lonOffset,
    };
};

const convertCoordsToPercent = (coords: Location): { top: string; left: string } => {
    const { lat, lon } = coords;
    const { minLat, maxLat, minLon, maxLon } = MAP_BOUNDS;

    const topPercent = ((maxLat - lat) / (maxLat - minLat)) * 100;
    const leftPercent = ((lon - minLon) / (maxLon - minLon)) * 100;

    return {
        top: `${Math.max(0, Math.min(100, topPercent))}%`,
        left: `${Math.max(0, Math.min(100, leftPercent))}%`,
    };
};

const MapPin: React.FC<{
    type: PinType;
    entity: Stoodio | Engineer | Artist | Booking;
    position: { top: string; left: string };
    onSelect?: (entity: any, type: PinType) => void;
}> = ({ type, entity, position, onSelect }) => {
    const iconMap: Record<PinType, { icon: React.ReactNode; color: string; zIndex: number }> = {
        stoodio: { icon: <HouseIcon className="w-4 h-4 text-white" />, color: 'bg-orange-500', zIndex: 10 },
        engineer: { icon: <SoundWaveIcon className="w-4 h-4 text-white" />, color: 'bg-amber-500', zIndex: 10 },
        artist: { icon: <MicrophoneIcon className="w-4 h-4 text-white" />, color: 'bg-green-500', zIndex: 10 },
        job: { icon: <BriefcaseIcon className="w-4 h-4 text-white" />, color: 'bg-indigo-500', zIndex: 15 },
        'vibe-match-stoodio': { icon: <MagicWandIcon className="w-5 h-5 text-white" />, color: 'bg-pink-500', zIndex: 20 },
        'vibe-match-engineer': { icon: <MagicWandIcon className="w-5 h-5 text-white" />, color: 'bg-cyan-500', zIndex: 20 },
    };

    const { icon, color, zIndex } = iconMap[type];
    const pinSize = type.startsWith('vibe-match') ? 'p-3' : 'p-2';
    const commonClasses = `absolute transform -translate-x-1/2 -translate-y-1/2 ${pinSize} rounded-full shadow-lg transition-transform duration-200`;
    const style = { ...position, zIndex };

    const entityName = 'name' in entity ? entity.name : `Job at ${(entity as Booking).stoodio.name}`;

    return (
        <button
            style={style}
            onClick={() => onSelect?.(entity, type)}
            className={`${commonClasses} ${color} hover:scale-125 hover:z-30`}
            aria-label={`View details for ${entityName}`}
        >
            {icon}
        </button>
    );
};

const MapView: React.FC<MapViewProps> = ({ stoodioz, engineers, artists, bookings, vibeMatchResults, onSelectStoodio, onSelectEngineer, onSelectArtist, onInitiateBooking }) => {
    const [showStoodioz, setShowStoodioz] = useState(true);
    const [showEngineers, setShowEngineers] = useState(true);
    const [showArtists, setShowArtists] = useState(true);
    const [showJobs, setShowJobs] = useState(true);
    const [showVibeMatches, setShowVibeMatches] = useState(true);
    const [isFiltersOpen, setIsFiltersOpen] = useState(true);
    const [selectedMapEngineer, setSelectedMapEngineer] = useState<Engineer | null>(null);

    const activeAndFutureJobs = useMemo(() => {
        return bookings.filter(b => 
            [BookingStatus.CONFIRMED, BookingStatus.PENDING, BookingStatus.PENDING_APPROVAL].includes(b.status)
        );
    }, [bookings]);
    
    const handleSelect = (entity: any, type: PinType) => {
        switch (type) {
            case 'stoodio':
            case 'vibe-match-stoodio':
                onSelectStoodio?.(entity as Stoodio);
                break;
            case 'engineer':
            case 'vibe-match-engineer':
                const engineer = entity as Engineer;
                if (onInitiateBooking) {
                    setSelectedMapEngineer(engineer);
                } else {
                    onSelectEngineer?.(engineer);
                }
                break;
            case 'artist':
                onSelectArtist?.(entity as Artist);
                break;
            case 'job':
                onSelectStoodio?.((entity as Booking).stoodio);
                break;
        }
    };

    const handleInitiateBookingFromPopup = (engineer: Engineer, date: string, time: string) => {
        onInitiateBooking?.(engineer, date, time);
        setSelectedMapEngineer(null);
    };

    return (
        <div className="relative w-full h-full">
            <div className="w-full h-full bg-zinc-800 rounded-2xl shadow-inner overflow-hidden border border-zinc-700">
                <img loading="lazy" src="https://images.unsplash.com/photo-1568224348083-22ac64165d62?q=80&w=2574" alt="World Map" className="w-full h-full object-cover opacity-20" />
                
                {showStoodioz && stoodioz.filter(s => s.showOnMap).map(s => (
                    <MapPin key={`stoodio-${s.id}`} type="stoodio" entity={s} position={convertCoordsToPercent(s.coordinates)} onSelect={handleSelect} />
                ))}
                {showEngineers && engineers.filter(e => e.showOnMap).map(e => {
                    const positionCoords = e.displayExactLocation ? e.coordinates : fuzzCoordinates(e.coordinates);
                    return (
                        <MapPin key={`eng-${e.id}`} type="engineer" entity={e} position={convertCoordsToPercent(positionCoords)} onSelect={handleSelect} />
                    );
                })}
                {showArtists && artists.filter(a => a.showOnMap).map(a => (
                    <MapPin key={`art-${a.id}`} type="artist" entity={a} position={convertCoordsToPercent(a.coordinates)} onSelect={handleSelect} />
                ))}
                {showJobs && activeAndFutureJobs.map(job => (
                    <MapPin key={`job-${job.id}`} type="job" entity={job} position={convertCoordsToPercent(job.stoodio.coordinates)} onSelect={handleSelect} />
                ))}
                {showVibeMatches && vibeMatchResults?.recommendations.map((rec, index) => {
                    const type = rec.type === 'stoodio' ? 'vibe-match-stoodio' : 'vibe-match-engineer';
                    return (
                        <MapPin key={`vibe-${rec.entity.id}-${index}`} type={type} entity={rec.entity} position={convertCoordsToPercent(rec.entity.coordinates)} onSelect={handleSelect} />
                    );
                })}
            </div>
            
            {selectedMapEngineer && onInitiateBooking && (
                <MapBookingPopup
                    engineer={selectedMapEngineer}
                    onClose={() => setSelectedMapEngineer(null)}
                    onInitiateBooking={handleInitiateBookingFromPopup}
                />
            )}

            {/* Filter Panel */}
            <div className="absolute top-4 left-4 z-20 w-64">
                 <div className="bg-zinc-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-zinc-700">
                    <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="w-full flex justify-between items-center p-3 font-bold text-slate-100">
                        <span>Map Filters</span>
                        {isFiltersOpen ? <ChevronUpIcon className="w-5 h-5"/> : <ChevronDownIcon className="w-5 h-5"/>}
                    </button>
                    {isFiltersOpen && (
                        <div className="p-4 border-t border-zinc-700 space-y-3">
                            <label className="flex items-center gap-3 text-slate-200 cursor-pointer">
                                <input type="checkbox" checked={showStoodioz} onChange={() => setShowStoodioz(!showStoodioz)} className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-orange-500 focus:ring-orange-500" />
                                <HouseIcon className="w-5 h-5 text-orange-500"/>
                                <span>Stoodioz</span>
                            </label>
                             <label className="flex items-center gap-3 text-slate-200 cursor-pointer">
                                <input type="checkbox" checked={showEngineers} onChange={() => setShowEngineers(!showEngineers)} className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-amber-500 focus:ring-amber-500" />
                                <SoundWaveIcon className="w-5 h-5 text-amber-500"/>
                                <span>Engineers</span>
                            </label>
                             <label className="flex items-center gap-3 text-slate-200 cursor-pointer">
                                <input type="checkbox" checked={showArtists} onChange={() => setShowArtists(!showArtists)} className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-green-500 focus:ring-green-500" />
                                <MicrophoneIcon className="w-5 h-5 text-green-500"/>
                                <span>Artists</span>
                            </label>
                            <label className="flex items-center gap-3 text-slate-200 cursor-pointer">
                                <input type="checkbox" checked={showJobs} onChange={() => setShowJobs(!showJobs)} className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-indigo-500 focus:ring-indigo-500" />
                                <BriefcaseIcon className="w-5 h-5 text-indigo-500"/>
                                <span>Active Jobs</span>
                            </label>
                            {vibeMatchResults && (
                                <label className="flex items-center gap-3 text-slate-200 cursor-pointer">
                                    <input type="checkbox" checked={showVibeMatches} onChange={() => setShowVibeMatches(!showVibeMatches)} className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-pink-500 focus:ring-pink-500" />
                                    <MagicWandIcon className="w-5 h-5 text-pink-500"/>
                                    <span>Vibe Match Results</span>
                                </label>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapView;