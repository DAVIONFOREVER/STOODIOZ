import React, { useState, useMemo } from 'react';
import type { Stoodio, Location } from '../types';
import { VerificationStatus } from '../types';
import { calculateDistance, getCoordsFromZip } from '../utils/location';
import StoodioCard from './StudioCard';
import { LocationIcon } from './icons';

interface StoodioListProps {
    stoodioz: Stoodio[];
    onSelectStoodio: (stoodio: Stoodio) => void;
}

const StoodioList: React.FC<StoodioListProps> = ({ stoodioz, onSelectStoodio }) => {
    const [radius, setRadius] = useState<number>(50);
    const [zipCode, setZipCode] = useState<string>('');
    const [searchLocation, setSearchLocation] = useState<Location | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showVerifiedOnly, setShowVerifiedOnly] = useState<boolean>(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!/^\d{5}$/.test(zipCode)) {
            setError('Please enter a valid 5-digit zip code.');
            setSearchLocation(null);
            return;
        }
        const coords = getCoordsFromZip(zipCode);
        if (coords) {
            setSearchLocation(coords);
        } else {
            setError(`Could not find location for zip code ${zipCode}.`);
            setSearchLocation(null);
        }
    };

    const filteredStoodioz = useMemo(() => {
        let results = stoodioz;

        if (showVerifiedOnly) {
            results = results.filter(s => s.verificationStatus === VerificationStatus.VERIFIED);
        }

        if (!searchLocation) {
            return results.slice().sort((a, b) => a.name.localeCompare(b.name));
        }

        return results
            .map(stoodio => ({
                ...stoodio,
                distance: calculateDistance(searchLocation, stoodio.coordinates),
            }))
            .filter(stoodio => stoodio.distance <= radius)
            .sort((a, b) => a.distance - b.distance);
    }, [stoodioz, searchLocation, radius, showVerifiedOnly]);

    return (
        <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-2 tracking-tight text-orange-500">
                Find Stoodioz
            </h1>
            <p className="text-center text-lg text-slate-500 mb-8">Discover and book top-tier recording stoodioz.</p>

            <div className="max-w-2xl mx-auto mb-12 p-4 bg-zinc-800/50 rounded-2xl shadow-lg border border-zinc-700">
                <form onSubmit={handleSearch} className="grid sm:grid-cols-3 gap-4 items-center">
                    <div className="sm:col-span-2">
                        <label htmlFor="zip-code" className="sr-only">Zip Code</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                               <LocationIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                id="zip-code"
                                value={zipCode}
                                onChange={(e) => setZipCode(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                                placeholder="Enter your 5-digit zip code"
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20">
                        Search
                    </button>
                </form>
                 {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}

                <div className="mt-4 border-t border-zinc-700 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    {searchLocation && (
                        <div className="w-full sm:w-2/3">
                            <label htmlFor="radius-slider" className="block text-center text-sm font-medium text-slate-300 mb-2">
                                Search Radius: <span className="font-bold text-orange-400">{radius} miles</span>
                            </label>
                            <input
                                id="radius-slider"
                                type="range"
                                min="5"
                                max="100"
                                step="5"
                                value={radius}
                                onChange={(e) => setRadius(Number(e.target.value))}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                        </div>
                    )}
                    <div className={`flex items-center ${!searchLocation ? 'w-full justify-center' : 'sm:w-1/3 sm:justify-end'}`}>
                         <label className="flex items-center cursor-pointer">
                            <span className="text-sm font-medium text-slate-300 mr-3">Show Verified Only</span>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={showVerifiedOnly} 
                                    onChange={(e) => setShowVerifiedOnly(e.target.checked)} 
                                />
                                <div className={`block w-12 h-6 rounded-full transition-colors ${showVerifiedOnly ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showVerifiedOnly ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredStoodioz.map(stoodio => (
                    <StoodioCard 
                        key={stoodio.id} 
                        stoodio={stoodio} 
                        onSelectStoodio={onSelectStoodio} 
                        distance={'distance' in stoodio ? stoodio.distance as number : undefined}
                    />
                ))}
            </div>
             {searchLocation && filteredStoodioz.length === 0 && (
                <p className="text-center text-slate-500 mt-8">No stoodioz found. Try increasing the search radius or changing filters.</p>
            )}
        </div>
    );
};

export default StoodioList;