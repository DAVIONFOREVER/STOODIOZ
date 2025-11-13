
import React from 'react';
import type { Artist } from '../types';
import { UserPlusIcon, UserCheckIcon } from './icons';

interface ArtistCardProps {
    artist: Artist;
    onSelectArtist: (artist: Artist) => void;
    onToggleFollow: (type: 'artist', id: string) => void;
    isFollowing: boolean;
    isSelf: boolean;
    isLoggedIn: boolean;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onSelectArtist, onToggleFollow, isFollowing, isSelf, isLoggedIn }) => {
    const handleFollowClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isSelf) {
            onToggleFollow('artist', artist.id);
        }
    };

    return (
        <div className="text-center p-6 group cardSurface">
            <button onClick={() => onSelectArtist(artist)} className="w-full">
                <img loading="lazy" src={artist.imageUrl} alt={artist.name} className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-zinc-700 group-hover:border-orange-500 transition-colors" />
                <h3 className="text-xl font-bold text-slate-100 mt-4 group-hover:text-orange-400">{artist.name}</h3>
            </button>
            <p className="text-slate-400 text-sm mt-1 h-10 overflow-hidden">{artist.bio}</p>
            <div className="mt-4">
                {isLoggedIn && !isSelf && (
                    <button
                        onClick={handleFollowClick}
                        disabled={artist.id === 'artist-aria-cantata'}
                        className={`w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${isFollowing ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' : 'bg-zinc-700 hover:bg-zinc-600 text-slate-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isFollowing ? <UserCheckIcon className="w-4 h-4"/> : <UserPlusIcon className="w-4 h-4"/>}
                        {isFollowing ? 'Following' : 'Follow'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ArtistCard;