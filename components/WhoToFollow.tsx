
import React from 'react';
import type { Artist, Engineer, Stoodio, Producer } from '../types';
import { UserPlusIcon } from './icons';

interface WhoToFollowProps {
    suggestions: (Artist | Engineer | Stoodio | Producer)[];
    onToggleFollow: (type: 'stoodio' | 'engineer' | 'artist' | 'producer', id: string) => void;
    onSelectUser: (user: Artist | Engineer | Stoodio | Producer) => void;
}

const WhoToFollow: React.FC<WhoToFollowProps> = ({ suggestions, onToggleFollow, onSelectUser }) => {
    
    const getRole = (user: Artist | Engineer | Stoodio | Producer): 'artist' | 'engineer' | 'stoodio' | 'producer' => {
        if ('amenities' in user) return 'stoodio';
        if ('specialties' in user) return 'engineer';
        if ('instrumentals' in user) return 'producer';
        return 'artist';
    };

    return (
        <div className="p-4 cardSurface">
            <h3 className="font-bold text-slate-100 px-3 mb-2">Who to Follow</h3>
            <div className="space-y-2">
                {suggestions.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-700/50">
                        <button onClick={() => onSelectUser(user)} className="flex items-center gap-3 text-left">
                            <img loading="lazy" src={user.imageUrl} alt={user.name} className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                                <p className="font-semibold text-sm text-slate-200">{user.name}</p>
                                <p className="text-xs text-slate-400 capitalize">{getRole(user)}</p>
                            </div>
                        </button>
                        <button 
                            onClick={() => onToggleFollow(getRole(user), user.id)}
                            className="bg-zinc-700 text-slate-300 hover:bg-zinc-600 font-semibold p-2 rounded-full transition-colors"
                            aria-label={`Follow ${user.name}`}
                        >
                           <UserPlusIcon className="w-5 h-5"/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WhoToFollow;
      