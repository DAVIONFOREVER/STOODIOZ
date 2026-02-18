

import React from 'react';
import type { Producer } from '../types';
import { UserPlusIcon, UserCheckIcon, StarIcon } from './icons';
import { getProfileImageUrl, getDisplayName } from '../constants';

interface ProducerCardProps {
    producer: Producer;
    onSelectProducer: (producer: Producer) => void;
    onToggleFollow: (type: 'producer', id: string) => void;
    isFollowing: boolean;
    isSelf: boolean;
    isLoggedIn: boolean;
}

const ProducerCard: React.FC<ProducerCardProps> = ({ producer, onSelectProducer, onToggleFollow, isFollowing, isSelf, isLoggedIn }) => {
     const handleFollowClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isSelf) {
            onToggleFollow('producer', producer.id);
        }
    };
    
    return (
        <div 
            className="cardSurface p-6 group relative overflow-hidden bg-gradient-to-br from-zinc-950/80 via-zinc-900/70 to-zinc-950/90 shadow-[0_20px_60px_rgba(0,0,0,0.35)] border border-zinc-800/70 hover:-translate-y-1 transition-transform"
        >
            <div className="relative">
                <button onClick={() => onSelectProducer(producer)} className="w-full text-center">
                    <img loading="lazy" src={getProfileImageUrl(producer)} alt={getDisplayName(producer)} className="w-24 h-24 rounded-full object-cover mx-auto ring-2 ring-zinc-700/80 shadow-lg shadow-orange-500/20" />
                    <h3 className="text-xl font-bold text-slate-100 mt-4 group-hover:text-orange-400 text-glow">{getDisplayName(producer)}</h3>
                     <div className="flex items-center justify-center gap-1 text-yellow-400 mt-1">
                        <StarIcon className="w-4 h-4" />
                        <span className="font-bold text-sm text-slate-200">{(producer.rating_overall ?? 0).toFixed(1)}</span>
                    </div>
                </button>
                <p className="text-slate-400 text-xs text-center mt-2 h-9 overflow-hidden">{producer.genres?.join(' • ')}</p>
                <div className="mt-4">
                    {isLoggedIn && !isSelf && (
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
        </div>
    );
};

export default ProducerCard;