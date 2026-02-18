
import React from 'react';
import type { Artist } from '../types';
import { UserPlusIcon, UserCheckIcon } from './icons';
import { ARIA_EMAIL, getProfileImageUrl, getDisplayName } from '../constants';

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
        <div className="text-center p-6 group cardSurface overflow-hidden bg-gradient-to-br from-zinc-950/80 via-zinc-900/70 to-zinc-950/90 shadow-[0_20px_60px_rgba(0,0,0,0.35)] border border-zinc-800/70 hover:-translate-y-1 transition-transform">
            <button onClick={() => onSelectArtist(artist)} className="w-full">
                <img loading="lazy" src={getProfileImageUrl(artist)} alt={getDisplayName(artist)} className="w-24 h-24 rounded-full object-cover mx-auto ring-2 ring-zinc-700/80 shadow-lg shadow-orange-500/20" />
                <h3 className="text-xl font-bold text-slate-100 mt-4 group-hover:text-orange-400">{getDisplayName(artist)}</h3>
            </button>
            <p className="text-slate-400 text-sm mt-1 h-10 overflow-hidden">{artist.bio}</p>
            <div className="mt-4 h-9">
                {isLoggedIn && !isSelf && artist.email !== ARIA_EMAIL && (
                    <button
                        onClick={handleFollowClick}
                        className={`w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${isFollowing ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' : 'bg-zinc-700 hover:bg-zinc-600 text-slate-200'}`}
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
