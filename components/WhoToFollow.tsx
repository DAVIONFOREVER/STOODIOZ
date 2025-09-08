
import React from 'react';
import type { Artist, Engineer, Stoodio } from '../types';
import { UserPlusIcon } from './icons';

interface WhoToFollowProps {
    suggestions: (Artist | Engineer | Stoodio)[];
    onToggleFollow: (type: 'stoodio' | 'engineer' | 'artist', id: string) => void;
    onSelectUser: (user: Artist | Engineer | Stoodio) => void;
}

const WhoToFollow: React.FC<WhoToFollowProps> = ({ suggestions, onToggleFollow, onSelectUser }) => {
    
    const getRole = (user: Artist | Engineer | Stoodio): 'artist' | 'engineer' | 'stoodio' => {
        if ('amenities' in user) return 'stoodio';
        if ('specialties' in user) return 'engineer';
        return 'artist';
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-lg">
            <h3 className="font-bold text-slate-900 px-3 mb-2">Who to Follow</h3>
            <div className="space-y-2">
                {suggestions.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100">
                        <button onClick={() => onSelectUser(user)} className="flex items-center gap-3 text-left">
                            <img loading="lazy" src={user.imageUrl} alt={user.name} className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                                <p className="font-semibold text-sm text-slate-800">{user.name}</p>
                                <p className="text-xs text-slate-500 capitalize">{getRole(user)}</p>
                            </div>
                        </button>
                        <button 
                            onClick={() => onToggleFollow(getRole(user), user.id)}
                            className="bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold p-2 rounded-full transition-colors"
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
