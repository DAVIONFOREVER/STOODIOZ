
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Label } from '../types';
import { SearchIcon, MicrophoneIcon, SoundWaveIcon, HouseIcon, MusicNoteIcon, UsersIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import { getProfileImageUrl, ARIA_EMAIL } from '../constants';

/** Secret phrase unlocks hidden game. In memory of Little Milton Campbell. */
const SECRET_PHRASE = 'the blues is alright';

interface UniversalSearchProps {
    allArtists: Artist[];
    allEngineers: Engineer[];
    allProducers: Producer[];
    allStoodioz: Stoodio[];
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectProducer: (producer: Producer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSecretUnlock?: () => void;
}

const safeLower = (value?: string | null) => (value ? value.toLowerCase() : '');

const getMatchReason = (item: any, term: string): string | null => {
    const lowerTerm = safeLower(term);
    const name = safeLower(item.name);
    if (name.includes(lowerTerm)) return null;
    const username = safeLower(item.username);
    const email = safeLower(item.email);
    const stageName = safeLower(item.stage_name);
    const fullName = safeLower(item.full_name);
    const displayName = safeLower(item.display_name);
    const companyName = safeLower(item.company_name);
    const isAria = email === 'aria@stoodioz.ai';
    const locationText = isAria ? '' : safeLower(item.location_text);
    const location = isAria ? '' : safeLower(item.location);

    if (username.includes(lowerTerm)) return `Username: ${item.username}`;
    if (displayName.includes(lowerTerm)) return `Display: ${item.display_name}`;
    if (stageName.includes(lowerTerm)) return `Stage: ${item.stage_name}`;
    if (fullName.includes(lowerTerm)) return `Name: ${item.full_name}`;
    if (companyName.includes(lowerTerm)) return `Company: ${item.company_name}`;
    if (email.includes(lowerTerm)) return `Email: ${item.email}`;
    if (!isAria && locationText.includes(lowerTerm)) return `Location: ${item.location_text}`;
    if (!isAria && location.includes(lowerTerm)) return `Location: ${item.location}`;

    if (item.specialties && item.specialties.find((s: string) => safeLower(s).includes(lowerTerm))) {
        return `Specialty: ${item.specialties.find((s: string) => safeLower(s).includes(lowerTerm))}`;
    }
    if (item.genres && item.genres.find((g: string) => safeLower(g).includes(lowerTerm))) {
        return `Genre: ${item.genres.find((g: string) => safeLower(g).includes(lowerTerm))}`;
    }
    if (item.amenities && item.amenities.find((a: string) => safeLower(a).includes(lowerTerm))) {
        return `Amenity: ${item.amenities.find((a: string) => safeLower(a).includes(lowerTerm))}`;
    }
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
            <img src={getProfileImageUrl(item)} alt={item.name} className="w-10 h-10 rounded-lg object-cover object-top flex-shrink-0" />
            <div className="flex-shrink-0">{icon}</div>
            <div className="flex-grow overflow-hidden">
                <p className="text-sm text-slate-200 truncate">{item.name}</p>
                {reason && <p className="text-xs text-slate-400 truncate">{reason}</p>}
            </div>
        </button>
    );
};

const UniversalSearch: React.FC<UniversalSearchProps> = ({ allArtists, allEngineers, allProducers, allStoodioz, onSelectArtist, onSelectEngineer, onSelectProducer, onSelectStoodio, onSecretUnlock }) => {
    const { labels } = useAppState();
    const [searchTerm, setSearchTerm] = useState('');
    const [isActive, setIsActive] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const onSecretUnlockRef = useRef(onSecretUnlock);
    onSecretUnlockRef.current = onSecretUnlock;

    const normalizedPhrase = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
    const isSecretPhrase = (value: string) => normalizedPhrase(value) === SECRET_PHRASE;

    const triggerSecretUnlock = () => {
        if (!onSecretUnlockRef.current) return;
        onSecretUnlockRef.current();
        // Defer clear so navigation state commits before we re-render and "refresh" the bar
        setTimeout(() => {
            setSearchTerm('');
            setIsActive(false);
        }, 0);
    };

    useEffect(() => {
        if (isSecretPhrase(searchTerm) && onSecretUnlockRef.current) triggerSecretUnlock();
    }, [searchTerm]);

    const matchesAnyField = (item: any, term: string) => {
        const lowerTerm = safeLower(term);
        const fields = [
            item.name,
            item.username,
            item.email,
            item.location_text,
            item.location,
            item.company_name,
            item.stage_name,
            item.full_name,
            item.display_name,
        ];
        if (fields.some((f) => safeLower(f).includes(lowerTerm))) return true;
        const arrays = [item.specialties, item.genres, item.amenities];
        return arrays.some((arr: string[] | undefined) => (arr || []).some((v) => safeLower(v).includes(lowerTerm)));
    };

    const filteredResults = useMemo(() => {
        if (searchTerm.length < 2) return null;
        return {
            artists: (allArtists ?? []).filter((a) => matchesAnyField(a, searchTerm)),
            engineers: (allEngineers ?? []).filter((e) => matchesAnyField(e, searchTerm)),
            producers: (allProducers ?? []).filter((p) => matchesAnyField(p, searchTerm)),
            stoodioz: (allStoodioz ?? []).filter((s) => matchesAnyField(s, searchTerm)),
            labels: (labels ?? []).filter((l) => matchesAnyField(l, searchTerm)),
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
                    onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        if (isSecretPhrase(searchTerm)) {
                            triggerSecretUnlock();
                            return;
                        }
                        // Optional: select first result when there are results
                        if (filteredResults) {
                            const a = filteredResults.artists[0];
                            const e = filteredResults.engineers[0];
                            const p = filteredResults.producers[0];
                            const s = filteredResults.stoodioz[0];
                            const l = filteredResults.labels?.[0];
                            if (a) { onSelectArtist(a); setSearchTerm(''); setIsActive(false); }
                            else if (e) { onSelectEngineer(e); setSearchTerm(''); setIsActive(false); }
                            else if (p) { onSelectProducer(p); setSearchTerm(''); setIsActive(false); }
                            else if (s) { onSelectStoodio(s); setSearchTerm(''); setIsActive(false); }
                            else if (l) { onSelectArtist(l as Artist); setSearchTerm(''); setIsActive(false); }
                        }
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-800 border-2 border-zinc-700 rounded-full text-sm text-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
            </div>

            {isActive && searchTerm.trim().length >= 2 && (
                <div className="absolute top-full mt-2 w-full bg-zinc-800 rounded-xl shadow-lg border border-zinc-700 z-10 max-h-96 overflow-y-auto">
                    {(!filteredResults || (filteredResults.artists.length === 0 && filteredResults.engineers.length === 0 && filteredResults.producers.length === 0 && filteredResults.stoodioz.length === 0 && filteredResults.labels.length === 0)) ? (
                        <div className="p-4 text-center text-zinc-400 text-sm">No results for &quot;{searchTerm.trim()}&quot;</div>
                    ) : null}
                    {filteredResults && filteredResults.labels.length > 0 && (
                        <div className="p-2 border-b border-zinc-700/50">
                            <h3 className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase">Labels</h3>
                            {filteredResults.labels.map(item => (
                                <ResultItem key={item.id} item={item} icon={<UsersIcon className="w-5 h-5 text-blue-400"/>} onClick={() => { onSelectArtist(item as any); setSearchTerm(''); setIsActive(false); }} searchTerm={searchTerm} />
                            ))}
                        </div>
                    )}
                    {filteredResults && filteredResults.artists.length > 0 && (
                        <div className="p-2">
                            <h3 className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase">Artists</h3>
                            {filteredResults.artists.map(item => (
                                <ResultItem key={item.id} item={item} icon={<MicrophoneIcon className="w-5 h-5 text-green-400"/>} onClick={() => { onSelectArtist(item); setSearchTerm(''); setIsActive(false); }} searchTerm={searchTerm} />
                            ))}
                        </div>
                    )}
                    {filteredResults && filteredResults.engineers.length > 0 && (
                        <div className="p-2">
                            <h3 className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase">Engineers</h3>
                            {filteredResults.engineers.map(item => (
                                <ResultItem key={item.id} item={item} icon={<SoundWaveIcon className="w-5 h-5 text-amber-400"/>} onClick={() => { onSelectEngineer(item); setSearchTerm(''); setIsActive(false); }} searchTerm={searchTerm} />
                            ))}
                        </div>
                    )}
                    {filteredResults && filteredResults.producers.length > 0 && (
                        <div className="p-2">
                            <h3 className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase">Producers</h3>
                            {filteredResults.producers.map(item => (
                                <ResultItem key={item.id} item={item} icon={<MusicNoteIcon className="w-5 h-5 text-purple-400"/>} onClick={() => { onSelectProducer(item); setSearchTerm(''); setIsActive(false); }} searchTerm={searchTerm} />
                            ))}
                        </div>
                    )}
                    {filteredResults && filteredResults.stoodioz.length > 0 && (
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
