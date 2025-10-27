import React from 'react';
import type { Artist, Engineer, Stoodio, Producer } from '../types';

interface FollowingProps {
    artists: Artist[];
    engineers: Engineer[];
    studios: Stoodio[];
    producers: Producer[];
    onToggleFollow: (type: 'artist' | 'engineer' | 'stoodio' | 'producer', id: string) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStudio: (studio: Stoodio) => void;
    onSelectProducer: (producer: Producer) => void;
}

const FollowingCard: React.FC<{
    user: Artist | Engineer | Stoodio | Producer;
    type: 'artist' | 'engineer' | 'stoodio' | 'producer';
    onSelect: () => void;
    onToggleFollow: () => void;
}> = ({ user, type, onSelect, onToggleFollow }) => {
    return (
        <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center justify-between border border-zinc-700/50">
            <button onClick={onSelect} className="flex items-center gap-3 text-left">
                <img src={user.imageUrl} alt={user.name} className="w-10 h-10 rounded-lg object-cover" />
                <div>
                    <p className="font-semibold text-sm text-zinc-200">{user.name}</p>
                    <p className="text-xs text-zinc-400 capitalize">{type}</p>
                </div>
            </button>
            <button onClick={onToggleFollow} className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 font-semibold text-xs py-1.5 px-3 rounded-full transition-colors">
                Unfollow
            </button>
        </div>
    );
};


const Following: React.FC<FollowingProps> = (props) => {
    const { artists, engineers, studios, producers, onToggleFollow, onSelectArtist, onSelectEngineer, onSelectStudio, onSelectProducer } = props;

    const allFollowing = [
        ...artists.map(u => ({ user: u, type: 'artist' as const })),
        ...engineers.map(u => ({ user: u, type: 'engineer' as const })),
        ...studios.map(u => ({ user: u, type: 'stoodio' as const })),
        ...producers.map(u => ({ user: u, type: 'producer' as const })),
    ];

    return (
        <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
             <h1 className="text-2xl font-bold text-zinc-100 mb-4">Following</h1>
             {allFollowing.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allFollowing.map(({ user, type }) => (
                         <FollowingCard
                            key={user.id}
                            user={user}
                            type={type}
                            onSelect={() => {
                                if (type === 'artist') onSelectArtist(user as Artist);
                                if (type === 'engineer') onSelectEngineer(user as Engineer);
                                if (type === 'stoodio') onSelectStudio(user as Stoodio);
                                if (type === 'producer') onSelectProducer(user as Producer);
                            }}
                            onToggleFollow={() => onToggleFollow(type, user.id)}
                        />
                    ))}
                </div>
             ) : (
                <p className="text-center py-8 text-zinc-500">You are not following anyone yet.</p>
             )}
        </div>
    );
};

export default Following;
