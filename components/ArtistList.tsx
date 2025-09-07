import React from 'react';
import type { Artist, UserRole } from '../types';
import ArtistCard from './ArtistCard';

interface ArtistListProps {
    artists: Artist[];
    onSelectArtist: (artist: Artist) => void;
    onToggleFollow: (type: 'artist', id: string) => void;
    currentUser: Artist | any | null;
    userRole: UserRole | null;
}

const ArtistList: React.FC<ArtistListProps> = ({ artists, onSelectArtist, onToggleFollow, currentUser }) => {
    return (
        <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-2 tracking-tight text-orange-500">
                Find Artists
            </h1>
            <p className="text-center text-lg text-slate-500 mb-12">Connect and collaborate with talented artists.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {artists.map(artist => {
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
