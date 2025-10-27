import React from 'react';
import type { Producer } from '../types';
import { UserPlusIcon, UserCheckIcon } from './icons';

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
        if (!isSelf && isLoggedIn) {
            onToggleFollow('producer', producer.id);
        }
    };

    return (
        <div className="bg-black/50 backdrop-blur-md rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.1)] border border-orange-500/20 text-center p-6 group transition-all duration-300 hover:border-orange-500/40 hover:shadow-[0_0_30px_rgba(249,115,22,0.25)] hover:-translate-y-1">
            <button onClick={() => onSelectProducer(producer)} className="w-full">
                <img loading="lazy" src={producer.imageUrl} alt={producer.name} className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-zinc-700 group-hover:border-orange-500 transition-colors" />
                <h3 className="text-xl font-bold text-slate-100 mt-4 group-hover:text-orange-400">{producer.name}</h3>
            </button>
            <p className="text-slate-400 text-sm mt-1 h-10 overflow-hidden">{producer.genres.join(', ')}</p>
            <div className="mt-4 h-9">
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
    );
};

export default ProducerCard;
