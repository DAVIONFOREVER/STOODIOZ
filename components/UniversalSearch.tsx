
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Label } from '../types';
import { SearchIcon, MicrophoneIcon, SoundWaveIcon, HouseIcon, MusicNoteIcon, UsersIcon } from './icons';
import { useAppState } from '../contexts/AppContext';

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

const getMatchReason = (item: any, term: string): string | null => {
    const lowerTerm = term.toLowerCase();
    if (item.name.toLowerCase().includes(lowerTerm)) return null;
    if (item.specialties && item.specialties.find((s: string) => s.toLowerCase().includes(lowerTerm))) return `Specialty: ${item.specialties.find((s: string) => s.toLowerCase().includes(lowerTerm))}`;
    if (item.genres && item.genres.find((g: string) => g.toLowerCase().includes(lowerTerm))) return `Genre: ${item.genres.find((g: string) => g.toLowerCase().includes(lowerTerm))}`;
    if (item.amenities && item.amenities.find((a: string) => a.toLowerCase().includes(lowerTerm))) return `Amenity: ${item.amenities.find((a: string) => a.toLowerCase().includes(lowerTerm))}`;
    return null;
};

const ResultItem: React.FC<{
    item: any;
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
    const { labels } = useAppState();
    const [searchTerm, setSearchTerm] = useState('');
    const [isActive, setIsActive] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const filteredResults = useMemo(() => {
        if (searchTerm.length < 2) return null;
        const lowerCaseTerm = searchTerm.toLowerCase();
        
        return {
            artists: allArtists.filter(a => a.name.toLowerCase().includes(lowerCaseTerm)),
            engineers: allEngineers.filter(e => e.name.toLowerCase().includes(lowerCaseTerm) || e.specialties?.some(s => s.toLowerCase().includes(lowerCaseTerm))),
            producers: allProducers.filter(p => p.name.toLowerCase().includes(lowerCaseTerm) || p.genres?.some(g => g.toLowerCase().includes(lowerCaseTerm))),
            stoodioz: allStoodioz.filter(s => s.name.toLowerCase().includes(lowerCaseTerm) || s.amenities?.some(a => a.toLowerCase().includes(lowerCaseTerm))),
            labels: (labels || []).filter(l => l.name.toLowerCase().includes(lowerCaseTerm) || l.company_name?.toLowerCase().includes(lowerCaseTerm))
        };
    }, [searchTerm, allArtists, allEngineers, allProducers, allStoodioz, labels]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsActive(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                />
            </div>

            {isActive && filteredResults && (
                <div className="absolute top-full mt-2 w-full bg-zinc-800 rounded-xl shadow-lg border border-zinc-700 z-10 max-h-96 overflow-y-auto">
                    {filteredResults.labels.length > 0 && (
                        <div className="p-2 border-b border-zinc-700/50">
                            <h3 className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase">Labels</h3>
                            {filteredResults.labels.map(item => (
                                <ResultItem key={item.id} item={item} icon={<UsersIcon className="w-5 h-5 text-blue-400"/>} onClick={() => { onSelectArtist(item as any); setSearchTerm(''); setIsActive(false); }} searchTerm={searchTerm} />
                            ))}
                        </div>
                    )}
                    {filteredResults.artists.length > 0 && (
                        <div className="p-2">
                            <h3 className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase">Artists</h3>
                            {filteredResults.artists.map(item => (
                                <ResultItem key={item.id} item={item} icon={<MicrophoneIcon className="w-5 h-5 text-green-400"/>} onClick={() => { onSelectArtist(item); setSearchTerm(''); setIsActive(false); }} searchTerm={searchTerm} />
                            ))}
                        </div>
                    )}
                    {filteredResults.engineers.length > 0 && (
                        <div className="p-2">
                            <h3 className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase">Engineers</h3>
                            {filteredResults.engineers.map(item => (
                                <ResultItem key={item.id} item={item} icon={<SoundWaveIcon className="w-5 h-5 text-amber-400"/>} onClick={() => { onSelectEngineer(item); setSearchTerm(''); setIsActive(false); }} searchTerm={searchTerm} />
                            ))}
                        </div>
                    )}
                    {filteredResults.stoodioz.length > 0 && (
                        <div className="p-2">
                            <h3 className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase">Stoodioz</h3>
                            {filteredResults.stoodioz.map(item => (
                                <ResultItem key={item.id} item={item} icon={<HouseIcon className="w-5 h-5 text-red-400"/>} onClick={() => { onSelectStoodio(item); setSearchTerm(''); setIsActive(false); }} searchTerm={searchTerm} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UniversalSearch;
