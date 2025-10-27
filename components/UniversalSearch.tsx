import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Artist, Engineer, Stoodio, Producer } from '../types';
import { SearchIcon, MicrophoneIcon, SoundWaveIcon, HouseIcon, MusicNoteIcon } from './icons';

interface UniversalSearchProps {
    allArtists: Artist[];
    allEngineers: Engineer[];
    allProducers: Producer[];
    allStoodioz: Stoodio[];
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectProducer: (producer: Producer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
}

const getMatchReason = (item: Artist | Engineer | Stoodio | Producer, term: string): string | null => {
    const lowerTerm = term.toLowerCase();
    
    // Don't show a reason if the name already matches
    if (item.name.toLowerCase().includes(lowerTerm)) return null;

    if ('specialties' in item) { // Engineer
        const match = item.specialties.find(s => s.toLowerCase().includes(lowerTerm));
        if (match) return `Specialty: ${match}`;
    }
    if ('genres' in item) { // Producer
        const match = item.genres.find(g => g.toLowerCase().includes(lowerTerm));
        if (match) return `Genre: ${match}`;
    }
    if ('amenities' in item) { // Stoodio
        const match = item.amenities.find(a => a.toLowerCase().includes(lowerTerm));
        if (match) return `Amenity: ${match}`;
    }
    return null;
};


const ResultItem: React.FC<{
    item: Artist | Engineer | Stoodio | Producer;
    icon: React.ReactNode;
    onClick: () => void;
    searchTerm: string;
}> = ({ item, icon, onClick, searchTerm }) => {
    const reason = getMatchReason(item, searchTerm);
    return (
        <button onClick={onClick} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-700 text-left">
            <div className="flex-shrink-0">{icon}</div>
            <div className="flex-grow overflow-hidden">
                <p className="text-sm text-slate-200 truncate">{item.name}</p>
                {reason && <p className="text-xs text-slate-400 truncate">{reason}</p>}
            </div>
        </button>
    );
};


const UniversalSearch: React.FC<UniversalSearchProps> = ({ allArtists, allEngineers, allProducers, allStoodioz, onSelectArtist, onSelectEngineer, onSelectProducer, onSelectStoodio }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isActive, setIsActive] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const filteredResults = useMemo(() => {
        if (searchTerm.length < 2) {
            return null;
        }
        const lowerCaseTerm = searchTerm.toLowerCase();
        
        const artists = allArtists.filter(a => a.name.toLowerCase().includes(lowerCaseTerm));
        
        const engineers = allEngineers.filter(e => 
            e.name.toLowerCase().includes(lowerCaseTerm) || 
            e.specialties.some(s => s.toLowerCase().includes(lowerCaseTerm))
        );
        
        const producers = allProducers.filter(p => 
            p.name.toLowerCase().includes(lowerCaseTerm) || 
            p.genres.some(g => g.toLowerCase().includes(lowerCaseTerm))
        );
        
        const stoodioz = allStoodioz.filter(s => 
            s.name.toLowerCase().includes(lowerCaseTerm) || 
            s.amenities.some(a => a.toLowerCase().includes(lowerCaseTerm))
        );
        
        if (artists.length === 0 && engineers.length === 0 && stoodioz.length === 0 && producers.length === 0) {
            return { artists: [], engineers: [], stoodioz: [], producers: [] }; // Return empty object to show "no results"
        }

        return { artists, engineers, stoodioz, producers };
    }, [searchTerm, allArtists, allEngineers, allProducers, allStoodioz]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsActive(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (item: Artist | Engineer | Stoodio | Producer, type: 'artist' | 'engineer' | 'stoodio' | 'producer') => {
        if (type === 'artist') onSelectArtist(item as Artist);
        else if (type === 'engineer') onSelectEngineer(item as Engineer);
        else if (type === 'producer') onSelectProducer(item as Producer);
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
                    placeholder="Search by name, tags, amenities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsActive(true)}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-800 border-2 border-zinc-700 rounded-full text-sm text-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    aria-label="Universal search"
                />
            </div>

            {isActive && searchTerm.length >= 2 && (
                <div className="absolute top-full mt-2 w-full cardSurface z-10 max-h-96 overflow-y-auto animate-fade-in-down p-2">
                    {filteredResults ? (
                        <>
                            {filteredResults.artists.length > 0 && (
                                <div className="p-2">
                                    <h3 className="px-3 py-1 text-xs font-semibold text-slate-400">Artists</h3>
                                    {filteredResults.artists.map(item => (
                                        <ResultItem
                                            key={item.id}
                                            item={item}
                                            icon={<MicrophoneIcon className="w-5 h-5 text-green-400 flex-shrink-0"/>}
                                            onClick={() => handleSelect(item, 'artist')}
                                            searchTerm={searchTerm}
                                        />
                                    ))}
                                </div>
                            )}
                             {filteredResults.producers.length > 0 && (
                                <div className="p-2">
                                    <h3 className="px-3 py-1 text-xs font-semibold text-slate-400">Producers</h3>
                                    {filteredResults.producers.map(item => (
                                        <ResultItem
                                            key={item.id}
                                            item={item}
                                            icon={<MusicNoteIcon className="w-5 h-5 text-purple-400 flex-shrink-0"/>}
                                            onClick={() => handleSelect(item, 'producer')}
                                            searchTerm={searchTerm}
                                        />
                                    ))}
                                </div>
                            )}
                            {filteredResults.engineers.length > 0 && (
                                <div className="p-2">
                                    <h3 className="px-3 py-1 text-xs font-semibold text-slate-400">Engineers</h3>
                                    {filteredResults.engineers.map(item => (
                                        <ResultItem
                                            key={item.id}
                                            item={item}
                                            icon={<SoundWaveIcon className="w-5 h-5 text-amber-400 flex-shrink-0"/>}
                                            onClick={() => handleSelect(item, 'engineer')}
                                            searchTerm={searchTerm}
                                        />
                                    ))}
                                </div>
                            )}
                            {filteredResults.stoodioz.length > 0 && (
                                <div className="p-2">
                                    <h3 className="px-3 py-1 text-xs font-semibold text-slate-400">Stoodioz</h3>
                                    {filteredResults.stoodioz.map(item => (
                                        <ResultItem
                                            key={item.id}
                                            item={item}
                                            icon={<HouseIcon className="w-5 h-5 text-orange-400 flex-shrink-0"/>}
                                            onClick={() => handleSelect(item, 'stoodio')}
                                            searchTerm={searchTerm}
                                        />
                                    ))}
                                </div>
                            )}
                            {filteredResults.artists.length === 0 && filteredResults.engineers.length === 0 && filteredResults.producers.length === 0 && filteredResults.stoodioz.length === 0 && (
                                <div className="p-4 text-center text-sm text-slate-400">No results found.</div>
                            )}
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default UniversalSearch;