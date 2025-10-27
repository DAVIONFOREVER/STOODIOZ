import React from 'react';
import type { Artist, Engineer, Producer, Stoodio } from '../types';
import { RankingTier } from '../types';
import RankingBadge from './RankingBadge';
import { StarIcon, FireIcon } from './icons';

type AllUsers = Artist | Engineer | Producer | Stoodio;

interface RankedUserCardProps {
    profile: AllUsers;
    isSpotlight?: boolean;
    rank?: number;
    onSelectProfile: (profile: AllUsers) => void;
}

const tierGlowColors: { [key in RankingTier]: string } = {
    [RankingTier.Elite]: 'shadow-[0_0_20px_4px_rgba(168,85,247,0.5)] ring-purple-500',
    [RankingTier.Platinum]: 'shadow-[0_0_20px_4px_rgba(6,182,212,0.5)] ring-cyan-500',
    [RankingTier.Gold]: 'shadow-[0_0_20px_4px_rgba(245,158,11,0.5)] ring-amber-500',
    [RankingTier.Silver]: 'shadow-[0_0_15px_3px_rgba(100,116,139,0.5)] ring-slate-500',
    [RankingTier.Bronze]: 'shadow-[0_0_15px_3px_rgba(146,64,14,0.5)] ring-yellow-800',
    [RankingTier.Provisional]: 'shadow-[0_0_10px_2px_rgba(82,82,91,0.5)] ring-zinc-600',
};

const RankedUserCard: React.FC<RankedUserCardProps> = ({ profile, isSpotlight = false, rank, onSelectProfile }) => {
    const glowClass = tierGlowColors[profile.ranking_tier] || tierGlowColors.Provisional;

    const cardBaseClasses = "bg-zinc-900/70 backdrop-blur-lg rounded-2xl border border-zinc-700/50 transition-all duration-300 hover:border-orange-500/50";
    const spotlightClasses = "p-6 relative text-center shadow-2xl";
    const standardClasses = "p-4 text-center hover:-translate-y-1";

    const avatarBaseClasses = "mx-auto object-cover rounded-full ring-2";
    const spotlightAvatar = "w-32 h-32";
    const standardAvatar = "w-20 h-20";

    const handleCardClick = () => {
        onSelectProfile(profile);
    }

    return (
        <button
            onClick={handleCardClick}
            className={`${cardBaseClasses} ${isSpotlight ? spotlightClasses : standardClasses}`}
        >
            {rank && !isSpotlight && (
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-white text-sm border-2 border-black">
                    {rank}
                </div>
            )}
            
            <img 
                src={profile.imageUrl}
                alt={profile.name}
                className={`${avatarBaseClasses} ${isSpotlight ? spotlightAvatar : standardAvatar} ${glowClass}`}
            />
            
            <h3 className={`font-bold text-zinc-100 ${isSpotlight ? 'text-3xl mt-4' : 'text-xl mt-3'}`}>
                {profile.name}
            </h3>

            <div className={`flex justify-center my-2 ${isSpotlight ? 'scale-110' : ''}`}>
                 <RankingBadge tier={profile.ranking_tier} isOnStreak={profile.is_on_streak} />
            </div>

            {profile.ranking_tier !== RankingTier.Provisional && profile.local_rank_text && (
                 <p className={`font-semibold text-orange-400 ${isSpotlight ? 'text-lg my-3' : 'text-sm my-2'}`}>
                    {profile.local_rank_text}
                </p>
            )}

            <div className={`flex justify-center items-center gap-4 text-zinc-400 font-semibold border-t border-zinc-700/50 pt-3 mt-3 ${isSpotlight ? 'text-base' : 'text-sm'}`}>
                <span>Sessions: <span className="text-zinc-200">{profile.sessions_completed}</span></span>
                <span className="flex items-center gap-1">
                    Rating: <span className="text-zinc-200">{profile.rating_overall.toFixed(1)}<StarIcon className="inline w-4 h-4 text-yellow-400 mb-0.5" /></span>
                </span>
                {profile.is_on_streak && <span title="Flawless 5-Session Streak"><FireIcon className="w-5 h-5 text-orange-400" /></span>}
            </div>

            {profile.strength_tags.length > 0 && (
                <div className="mt-3 text-xs text-zinc-300">
                    <span className="text-zinc-500">Known for: </span> 
                    {profile.strength_tags.slice(0, 2).join(', ')}
                </div>
            )}
        </button>
    );
};

export default RankedUserCard;
