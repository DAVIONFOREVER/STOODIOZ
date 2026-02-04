
import React, { useMemo, useState } from 'react';
import type { Artist } from '../types';
import ArtistCard from './ArtistCard.tsx';
import { useAppState } from '../contexts/AppContext.tsx';
import { ARIA_EMAIL, ARIA_PROFILE_IMAGE_URL } from '../constants.ts';

interface ArtistListProps {
    onSelectArtist: (artist: Artist) => void;
    onToggleFollow: (type: 'artist', id: string) => void;
}

const ArtistList: React.FC<ArtistListProps> = ({ onSelectArtist, onToggleFollow }) => {
    const { artists, currentUser } = useAppState();
    const [query, setQuery] = useState('');

    const sortedArtists = useMemo(() => {
        const list = artists ?? [];
        const aria = list.find(a => a.email === ARIA_EMAIL);
        const ariaFallbackId = (() => {
            try {
                return localStorage.getItem('aria_profile_id') || 'aria';
            } catch {
                return 'aria';
            }
        })();
        const fallbackAria: Artist = {
            id: ariaFallbackId,
            profile_id: ariaFallbackId,
            name: 'Aria Cantata',
            image_url: ARIA_PROFILE_IMAGE_URL,
            email: ARIA_EMAIL,
        } as Artist;
        const otherArtists = list.filter(a => a.email !== ARIA_EMAIL);
        return [aria ?? fallbackAria, ...otherArtists].filter((a): a is Artist => !!a);
    }, [artists]);

    const filteredArtists = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return sortedArtists;
        return sortedArtists.filter((artist) => {
            const name = artist.name?.toLowerCase() || '';
            const email = (artist as any).email?.toLowerCase() || '';
            const isAria = email === ARIA_EMAIL;
            const locationText = isAria ? '' : ((artist as any).location_text?.toLowerCase() || '');
            const location = isAria ? '' : ((artist as any).location?.toLowerCase() || '');
            return name.includes(term) || (!isAria && (locationText.includes(term) || location.includes(term))) || email.includes(term);
        });
    }, [query, sortedArtists]);

    return (
        <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-2 tracking-tight text-orange-500">
                Find Artists
            </h1>
            <p className="text-center text-lg text-slate-500 mb-12">Connect and collaborate with talented artists.</p>
            <div className="max-w-2xl mx-auto mb-10">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search artists by name, location, email..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                />
            </div>
            {filteredArtists.length === 0 ? (
                <div className="text-center text-zinc-400">
                    <p>No artists found.</p>
                    <p className="text-xs text-zinc-500 mt-2">If this should have results, check Supabase RLS policies for public reads.</p>
                </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredArtists.map(artist => {
                    const list = currentUser?.following?.artists || [];
                    const isFollowing = currentUser ? list.includes(artist.id) || list.includes((artist as any).profile_id) : false;
                    return (
                        <ArtistCard
                            key={artist.id}
                            artist={artist}
                            onSelectArtist={onSelectArtist}
                            onToggleFollow={currentUser ? onToggleFollow : () => {}}
                            isFollowing={isFollowing}
                            isSelf={currentUser?.id === artist.id}
                            isLoggedIn={!!currentUser}
                        />
                    );
                })}
            </div>
            )}
        </div>
    );
};

export default ArtistList;
