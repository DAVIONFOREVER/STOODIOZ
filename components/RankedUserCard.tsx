import React from 'react';
import type { Artist, Engineer, Stoodio, Producer } from '../types';
import { UserRole } from '../types';
import { useNavigation } from '../hooks/useNavigation';
import RankingBadge from './RankingBadge';
import { StarIcon, CalendarIcon } from './icons';

type User = Artist | Engineer | Stoodio | Producer;

interface RankedUserCardProps {
    user: User;
    rank: number;
}

const getRole = (user: User): string => {
    if ('amenities' in user) return 'Stoodio';
    if ('specialties' in user) return 'Engineer';
    if ('instrumentals' in user) return 'Producer';
    return 'Artist';
};

const RankedUserCard: React.FC<RankedUserCardProps> = ({ user, rank }) => {
    const { viewArtistProfile, viewEngineerProfile, viewProducerProfile, viewStoodioDetails } = useNavigation();
    
    const handleSelectUser = () => {
        const role = getRole(user);
        switch (role) {
            case 'Stoodio': viewStoodioDetails(user as Stoodio); break;
            case 'Engineer': viewEngineerProfile(user as Engineer); break;
            case 'Producer': viewProducerProfile(user as Producer); break;
            case 'Artist': viewArtistProfile(user as Artist); break;
        }
    };
    
    const rankColors: { [key: number]: string } = {
        1: 'text-amber-400',
        2: 'text-slate-300',
        3: 'text-yellow-600',
    };

    return (
        <button
            onClick={handleSelectUser}
            className="w-full flex items-center gap-4 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50 hover:bg-zinc-800 hover:border-orange-500/30 transition-all duration-200"
        >
            <div className={`text-2xl font-bold w-10 text-center flex-shrink-0 ${rankColors[rank] || 'text-zinc-400'}`}>
                {rank > 0 ? `#${rank}` : '-'}
            </div>
            
            <img src={user.imageUrl} alt={user.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            
            <div className="flex-grow text-left overflow-hidden">
                <p className="font-bold text-zinc-100 truncate">{user.name}</p>
                <p className="text-xs text-zinc-400">{getRole(user)}</p>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-yellow-400">
                    <StarIcon className="w-4 h-4" />
                    <span className="font-bold">{user.rating_overall.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1 text-zinc-400">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{user.sessions_completed} sessions</span>
                </div>
            </div>
            
            <div className="flex-shrink-0">
                <RankingBadge tier={user.ranking_tier} isOnStreak={user.is_on_streak} short />
            </div>
        </button>
    );
};

export default RankedUserCard;
