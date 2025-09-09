import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Artist, Engineer, Stoodio } from '../types';
import { SearchIcon, MicrophoneIcon, SoundWaveIcon, HouseIcon } from './icons';

interface UniversalSearchProps {
    allArtists: Artist[];
    allEngineers: Engineer[];
    allStoodioz: Stoodio[];
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
}

const UniversalSearch: React.FC<UniversalSearchProps> = ({ allArtists, allEngineers, allStoodioz, onSelectArtist, onSelectEngineer, onSelectStoodio }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isActive, setIsActive] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const filteredResults = useMemo(() => {
        if (searchTerm.length < 2) {
            return null;
        }
        const lowerCaseTerm = searchTerm.toLowerCase();
        const artists = allArtists.filter(a => a.name.toLowerCase().includes(lowerCaseTerm));
        const engineers = allEngineers.filter(e => e.name.toLowerCase().includes(lowerCaseTerm));
        const stoodioz = allStoodioz.filter(s => s.name.toLowerCase().includes(lowerCaseTerm));
        
        if (artists.length === 0 && engineers.length === 0 && stoodioz.length === 0) {
            return { artists: [], engineers: [], stoodioz: [] }; // Return empty object to show "no results"
        }

        return { artists, engineers, stoodioz };
    }, [searchTerm, allArtists, allEngineers, allStoodioz]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsActive(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (item: Artist | Engineer | Stoodio, type: 'artist' | 'engineer' | 'stoodio') => {
        if (type === 'artist') onSelectArtist(item as Artist);
        else if (type === 'engineer') onSelectEngineer(item as Engineer);
        else if (type === 'stoodio') onSelectStoodio(item as Stoodio);
        setSearchTerm('');
        setIsActive(false);
    };

    return (
        <div className="relative w-full max-w-md" ref={searchRef}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search artists, engineers, stoodioz..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsActive(true)}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-800 border-2 border-zinc-700 rounded-full text-sm text-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    aria-label="Universal search"
                />
            </div>

            {isActive && searchTerm.length >= 2 && (
                <div className="absolute top-full mt-2 w-full bg-zinc-800 rounded-xl shadow-lg border border-zinc-700 z-10 max-h-96 overflow-y-auto animate-fade-in-down">
                    {filteredResults ? (
                        <>
                            {filteredResults.artists.length > 0 && (
                                <div className="p-2">
                                    <h3 className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase">Artists</h3>
                                    <ul>
                                        {filteredResults.artists.map(artist => (
                                            <li key={artist.id}>
                                                <button onClick={() => handleSelect(artist, 'artist')} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-700">
                                                    <img src={artist.imageUrl} alt={artist.name} className="w-8 h-8 rounded-md object-cover" />
                                                    <span className="text-slate-100">{artist.name}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                             {filteredResults.engineers.length > 0 && (
                                <div className="p-2">
                                    <h3 className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase">Engineers</h3>
                                    <ul>
                                        {filteredResults.engineers.map(engineer => (
                                            <li key={engineer.id}>
                                                <button onClick={() => handleSelect(engineer, 'engineer')} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-700">
                                                     <img src={engineer.imageUrl} alt={engineer.name} className="w-8 h-8 rounded-md object-cover" />
                                                    <span className="text-slate-100">{engineer.name}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                             {filteredResults.stoodioz.length > 0 && (
                                <div className="p-2">
                                    <h3 className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase">Stoodioz</h3>
                                    <ul>
                                        {filteredResults.stoodioz.map(stoodio => (
                                            <li key={stoodio.id}>
                                                <button onClick={() => handleSelect(stoodio, 'stoodio')} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-700">
                                                     <img src={stoodio.imageUrl} alt={stoodio.name} className="w-8 h-8 rounded-md object-cover" />
                                                    <span className="text-slate-100">{stoodio.name}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                             {filteredResults.artists.length === 0 && filteredResults.engineers.length === 0 && filteredResults.stoodioz.length === 0 && (
                                 <p className="p-4 text-center text-sm text-slate-500">No results found.</p>
                             )}
                        </>
                    ) : (
                        <p className="p-4 text-center text-sm text-slate-500">Keep typing to search...</p>
                    )}
                </div>
            )}
             <style>{`
                 @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down { animation: fade-in-down 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default UniversalSearch;