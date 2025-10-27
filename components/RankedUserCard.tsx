import React from 'react';
import type { Artist, Engineer, Producer, Stoodio } from '../types';
import RankingBadge from './RankingBadge';
import { StarIcon, CalendarIcon } from './icons';

type AllUsers = Artist | Engineer | Producer | Stoodio;

interface RankedUserCardProps {
    profile: AllUsers;
    rank?: number;
    isSpotlight?: boolean;
    onSelectProfile: (profile: AllUsers) => void;
}

const RankedUserCard: React.FC<RankedUserCardProps> = ({ profile, rank, isSpotlight = false, onSelectProfile }) => {

    if (isSpotlight) {
        return (
            <button 
                onClick={() => onSelectProfile(profile)}
                className="w-full bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 border-2 border-orange-500/50 shadow-2xl shadow-orange-500/10 flex flex-col md:flex-row items-center gap-6 text-left transition-transform hover:scale-[1.02]"
            >
                <div className="relative flex-shrink-0">
                    <img src={profile.imageUrl} alt={profile.name} className="w-32 h-32 rounded-full object-cover border-4 border-zinc-700" />
                    <div className="absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-extrabold text-xl shadow-lg">#1</div>
                </div>
                <div>
                    <h3 className="text-3xl font-bold text-orange-400">{profile.name}</h3>
                    <div className="my-2"><RankingBadge tier={profile.ranking_tier} isOnStreak={profile.is_on_streak} /></div>
                    <p className="text-zinc-400 text-sm mb-4 max-w-lg">{'bio' in profile ? profile.bio : 'description' in profile ? profile.description : ''}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                        <span className="flex items-center gap-1.5 font-semibold text-zinc-200"><StarIcon className="w-4 h-4 text-yellow-400" /> {profile.rating_overall.toFixed(1)} Rating</span>
                        <span className="flex items-center gap-1.5 font-semibold text-zinc-200"><CalendarIcon className="w-4 h-4 text-orange-400" /> {profile.sessions_completed} Sessions</span>
                        <span className="font-semibold text-zinc-200">Re-Hire Rate: {profile.repeat_hire_rate}%</span>
                    </div>
                </div>
            </button>
        );
    }

    return (
        <button 
            onClick={() => onSelectProfile(profile)}
            className="w-full bg-zinc-900/50 p-4 rounded-xl border border-zinc-700/50 flex items-center gap-4 text-left transition-colors hover:bg-zinc-800"
        >
            <div className="text-xl font-bold text-zinc-500 w-8 text-center">{rank}</div>
            <img src={profile.imageUrl} alt={profile.name} className="w-16 h-16 rounded-lg object-cover" />
            <div className="flex-grow">
                <p className="font-bold text-zinc-100">{profile.name}</p>
                <div className="my-1"><RankingBadge tier={profile.ranking_tier} isOnStreak={profile.is_on_streak} short /></div>
                 <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1"><StarIcon className="w-3 h-3 text-yellow-400" /> {profile.rating_overall.toFixed(1)}</span>
                    <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3 text-orange-400" /> {profile.sessions_completed}</span>
                </div>
            </div>
        </button>
    );
};

export default RankedUserCard;
