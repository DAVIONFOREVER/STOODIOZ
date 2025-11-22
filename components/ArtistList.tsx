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

    const sortedArtists = useMemo(() => {
        const aria = artists.find(a => a.id === 'artist-aria-cantata');
        const otherArtists = artists.filter(a => a.id !== 'artist-aria-cantata');
        return [aria, ...otherArtists].filter((a): a is Artist => !!a);
    }, [artists]);

    return (
        <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-2 tracking-tight text-orange-500">
                Find Artists
            </h1>
            <p className="text-center text-lg text-slate-500 mb-12">Connect and collaborate with talented artists.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
                {sortedArtists.map(artist => {
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