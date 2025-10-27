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
        if (!isSelf) {
            onToggleFollow('engineer', engineer.id);
        }
    };

    return (
        <div 
            className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl shadow-lg shadow-[0_0_12px_rgba(249,115,22,0.2)] border border-zinc-700 p-6 group transition-all duration-400 ease-in-out hover:border-orange-500/50 hover:-translate-y-1 hover:shadow-[0_0_24px_rgba(249,115,22,0.4),_0_20px_40px_-15px_rgba(249,115,22,0.2)] hover:rotate-1 shimmer glass-overlay relative overflow-hidden"
            style={{ '--shimmer-delay': (Math.random() * 8 + 2) } as React.CSSProperties}
        >
            <div className="relative">
                <button onClick={() => onSelectEngineer(engineer)} className="w-full text-center">
                    <img loading="lazy" src={engineer.imageUrl} alt={engineer.name} className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-zinc-700 group-hover:border-orange-500 transition-colors" />
                    <h3 className="text-xl font-bold text-slate-100 mt-4 group-hover:text-orange-400 text-glow">{engineer.name}</h3>
                    <div className="flex items-center justify-center gap-1 text-yellow-400 mt-1">
                        <StarIcon className="w-4 h-4" />
                        <span className="font-bold text-sm text-slate-200">{engineer.rating_overall.toFixed(1)}</span>
                    </div>
                </button>
                <p className="text-slate-400 text-xs text-center mt-2 h-9 overflow-hidden">{engineer.specialties.join(' • ')}</p>
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

export default EngineerCard;
