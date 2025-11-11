
import React from 'react';
import type { Producer } from '../types';
import { UserPlusIcon, UserCheckIcon, StarIcon } from './icons';

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
            className="cardSurface p-6 group relative overflow-hidden"
        >
            <div className="relative">
                <button onClick={() => onSelectProducer(producer)} className="w-full text-center">
                    <img loading="lazy" src={producer.imageUrl} alt={producer.name} className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-zinc-700 group-hover:border-orange-500 transition-colors" />
                    <h3 className="text-xl font-bold text-slate-100 mt-4 group-hover:text-orange-400 text-glow">{producer.name}</h3>
                     <div className="flex items-center justify-center gap-1 text-yellow-400 mt-1">
                        <StarIcon className="w-4 h-4" />
                        {/* FIX: Changed `producer.rating` to `producer.rating_overall` to match the property name in the `BaseUser` type. */}
                        <span className="font-bold text-sm text-slate-200">{producer.rating_overall.toFixed(1)}</span>
                    </div>
                </button>
                <p className="text-slate-400 text-xs text-center mt-2 h-9 overflow-hidden">{producer.genres.join(' • ')}</p>
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