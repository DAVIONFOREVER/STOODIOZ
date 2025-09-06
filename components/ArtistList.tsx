import React from 'react';
// FIX: Import UserRole as a value, not just a type, as it's used for enum value comparisons.
import { UserRole, type Artist, type Engineer, type Stoodio } from '../types';
import { UsersIcon, UserPlusIcon, UserCheckIcon } from './icons';

interface ArtistCardProps {
    artist: Artist;
    onSelectArtist: (artist: Artist) => void;
    onToggleFollow: (type: 'artist', id: string) => void;
    isFollowing: boolean;
    showFollowButton: boolean;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onSelectArtist, onToggleFollow, isFollowing, showFollowButton }) => {
    return (
        <div className="bg-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-orange-500/20 transition-all duration-300 flex flex-col group border border-zinc-700 hover:border-orange-500/50 p-6">
            <div className="flex items-start gap-4">
                <img 
                    className="w-24 h-24 rounded-xl object-cover cursor-pointer" 
                    src={artist.imageUrl} 
                    alt={artist.name} 
                    onClick={() => onSelectArtist(artist)}
                />
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <h2 
                            className="text-2xl font-bold mb-1 cursor-pointer hover:text-orange-400 text-slate-100"
                            onClick={() => onSelectArtist(artist)}
                        >
                            {artist.name}
                        </h2>
                        {showFollowButton && (
                            <button 
                                onClick={() => onToggleFollow('artist', artist.id)}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 ${isFollowing ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-slate-200 hover:bg-zinc-600'}`}
                            >
                                {isFollowing ? <UserCheckIcon className="w-4 h-4" /> : <UserPlusIcon className="w-4 h-4" />}
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                        )}
                    </div>
                    <div className="flex items-center text-slate-400 mb-2 text-sm">
                        <UsersIcon className="w-4 h-4 mr-2" />
                        <span>{artist.followers.toLocaleString()} followers</span>
                    </div>
                     <p className="text-slate-300 text-sm leading-relaxed">{artist.bio}</p>
                </div>
            </div>
        </div>
    );
};


interface ArtistListProps {
    artists: Artist[];
    onSelectArtist: (artist: Artist) => void;
    onToggleFollow: (type: 'artist', id: string) => void;
    currentUser: Artist | Stoodio | Engineer | null;
    userRole: UserRole | null;
}

const ArtistList: React.FC<ArtistListProps> = ({ artists, onSelectArtist, onToggleFollow, currentUser, userRole }) => {
    return (
        <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-2 tracking-tight text-orange-500">Find Artists</h1>
            <p className="text-center text-lg text-slate-500 mb-12">Connect with other creators on the platform.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {artists.map(artist => {
                    const isFollowing = !!(currentUser && 'following' in currentUser && (currentUser.following.artists || []).includes(artist.id));
                    const showFollowButton = userRole !== UserRole.STOODIO && userRole !== UserRole.ENGINEER;
                    return (
                        <ArtistCard 
                            key={artist.id} 
                            artist={artist} 
                            onSelectArtist={onSelectArtist}
                            onToggleFollow={onToggleFollow}
                            isFollowing={isFollowing}
                            showFollowButton={showFollowButton}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default ArtistList;