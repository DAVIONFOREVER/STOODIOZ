import React, { useMemo } from 'react';
import type { Artist } from '../types';
import ArtistCard from './ArtistCard.tsx';
import { useAppState } from '../contexts/AppContext.tsx';

interface ArtistListProps {
    onSelectArtist: (artist: Artist) => void;
    onToggleFollow: (type: 'artist', id: string) => void;
}

const ArtistList: React.FC<ArtistListProps> = ({ onSelectArtist, onToggleFollow }) => {
    const { artists, currentUser } = useAppState();

    const displayArtists = useMemo(() => {
        // Filter out the AI assistant from the main collaboration list for a cleaner UX.
        return artists.filter(artist => artist.id !== 'artist-aria-cantata');
    }, [artists]);

    return (
        <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-2 tracking-tight text-orange-500">
                Find Artists
            </h1>
            <p className="text-center text-lg text-slate-500 mb-12">Connect and collaborate with talented artists.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
                {displayArtists.map(artist => {
                    const isFollowing = currentUser && 'following' in currentUser ? (currentUser.following.artists || []).includes(artist.id) : false;
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
        </div>
    );
};

export default ArtistList;