import React from 'react';
import type { Artist, Engineer, Stoodio, Producer } from '../types';

interface FollowersListProps {
    followers: (Artist | Engineer | Stoodio | Producer)[];
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStoodio: (studio: Stoodio) => void;
    onSelectProducer: (producer: Producer) => void;
}

const FollowerCard: React.FC<{
    user: Artist | Engineer | Stoodio | Producer;
    type: 'artist' | 'engineer' | 'stoodio' | 'producer';
    onSelect: () => void;
}> = ({ user, type, onSelect }) => {
    return (
        <button onClick={onSelect} className="bg-zinc-800/50 p-3 rounded-lg flex items-center gap-3 text-left w-full border border-zinc-700/50 hover:bg-zinc-800 transition-colors">
            <img src={user.imageUrl} alt={user.name} className="w-10 h-10 rounded-lg object-cover" />
            <div>
                <p className="font-semibold text-sm text-zinc-200">{user.name}</p>
                <p className="text-xs text-zinc-400 capitalize">{type}</p>
            </div>
        </button>
    );
};


const FollowersList: React.FC<FollowersListProps> = (props) => {
    const { followers, onSelectArtist, onSelectEngineer, onSelectStoodio, onSelectProducer } = props;

    const allFollowers = followers.map(user => {
        let type: 'artist' | 'engineer' | 'stoodio' | 'producer';
        if ('amenities' in user) type = 'stoodio';
        else if ('specialties' in user) type = 'engineer';
        else if ('instrumentals' in user) type = 'producer';
        else type = 'artist';
        return { user, type };
    });

    return (
        <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
             <h1 className="text-2xl font-bold text-zinc-100 mb-4">Followers</h1>
             {allFollowers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allFollowers.map(({ user, type }) => (
                         <FollowerCard
                            key={user.id}
                            user={user}
                            type={type}
                            onSelect={() => {
                                if (type === 'artist') onSelectArtist(user as Artist);
                                if (type === 'engineer') onSelectEngineer(user as Engineer);
                                if (type === 'stoodio') onSelectStoodio(user as Stoodio);
                                if (type === 'producer') onSelectProducer(user as Producer);
                            }}
                        />
                    ))}
                </div>
             ) : (
                <p className="text-center py-8 text-zinc-500">You don't have any followers yet.</p>
             )}
        </div>
    );
};

export default FollowersList;
