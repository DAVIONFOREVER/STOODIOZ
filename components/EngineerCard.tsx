import React from 'react';
import type { Engineer } from '../types';
import { UserPlusIcon, UserCheckIcon, StarIcon } from './icons';

interface EngineerCardProps {
    engineer: Engineer;
    onSelectEngineer: (engineer: Engineer) => void;
    onToggleFollow: (type: 'engineer', id: string) => void;
    isFollowing: boolean;
    isSelf: boolean;
    isLoggedIn: boolean;
}

const EngineerCard: React.FC<EngineerCardProps> = ({ engineer, onSelectEngineer, onToggleFollow, isFollowing, isSelf, isLoggedIn }) => {
    const handleFollowClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isSelf && isLoggedIn) {
            onToggleFollow('engineer', engineer.id);
        }
    };

    return (
        <div className="bg-black/50 backdrop-blur-md rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.1)] border border-orange-500/20 text-center p-6 group transition-all duration-300 hover:border-orange-500/40 hover:shadow-[0_0_30px_rgba(249,115,22,0.25)] hover:-translate-y-1">
            <button onClick={() => onSelectEngineer(engineer)} className="w-full">
                <img loading="lazy" src={engineer.imageUrl} alt={engineer.name} className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-zinc-700 group-hover:border-orange-500 transition-colors" />
                <h3 className="text-xl font-bold text-slate-100 mt-4 group-hover:text-orange-400">{engineer.name}</h3>
            </button>
            <p className="text-slate-400 text-sm mt-1 h-10 overflow-hidden">{engineer.specialties.join(', ')}</p>
             <div className="flex items-center justify-center gap-1 text-yellow-400 my-2">
                <StarIcon className="w-4 h-4" />
                <span className="font-bold text-slate-200">{engineer.rating_overall.toFixed(1)}</span>
            </div>
            <div className="mt-2 h-9">
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

export default EngineerCard;
