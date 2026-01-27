
import React from 'react';
import type { Artist, Engineer, Stoodio, Producer, Label } from '../types';
import { UserPlusIcon } from './icons';
import { getProfileImageUrl } from '../constants';

interface WhoToFollowProps {
    suggestions: (Artist | Engineer | Stoodio | Producer | Label)[];
    onToggleFollow: (type: 'stoodio' | 'engineer' | 'artist' | 'producer' | 'label', id: string) => void;
    onSelectUser: (user: Artist | Engineer | Stoodio | Producer | Label) => void;
}

const WhoToFollow: React.FC<WhoToFollowProps> = ({ suggestions, onToggleFollow, onSelectUser }) => {
    
    const getRole = (user: Artist | Engineer | Stoodio | Producer | Label): 'artist' | 'engineer' | 'stoodio' | 'producer' | 'label' => {
        const rawRole = ((user as any).role || (user as any).profiles?.role || (user as any).profile?.role || '').toString().toLowerCase();
        if (rawRole === 'artist') return 'artist';
        if (rawRole === 'engineer') return 'engineer';
        if (rawRole === 'producer') return 'producer';
        if (rawRole === 'stoodio') return 'stoodio';
        if (rawRole === 'label') return 'label';
        if ('amenities' in user) return 'stoodio';
        if ('specialties' in user) return 'engineer';
        if ('instrumentals' in user) return 'producer';
        if ('company_name' in user && !('amenities' in user)) return 'label';
        return 'artist';
    };

    return (
        <div className="p-4 cardSurface">
            <h3 className="font-bold text-slate-100 px-3 mb-2">Who to Follow</h3>
            <div className="space-y-2">
                {suggestions.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-700/50">
                        <button onClick={() => onSelectUser(user)} className="flex items-center gap-3 text-left">
                            {/* FIX: Changed `imageUrl` to `image_url` to match the user type definition. */}
                            <img
                                loading="lazy"
                                src={getProfileImageUrl(user as { email?: string; image_url?: string })}
                                alt={user.name}
                                className="w-10 h-10 rounded-lg object-cover"
                            />
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
                            <UserPlusIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WhoToFollow;
