
import React from 'react';
import { RankingTier } from '../types';
import { ShieldCheckIcon, FireIcon } from './icons';

interface RankingBadgeProps {
    tier: RankingTier;
    isOnStreak?: boolean;
    short?: boolean;
}

const tierStyles: { [key in RankingTier]: { bg: string; text: string; shadow: string } } = {
    [RankingTier.Provisional]: { bg: 'bg-zinc-600/50', text: 'text-zinc-300', shadow: 'shadow-zinc-500/10' },
    [RankingTier.Bronze]: { bg: 'bg-yellow-800/50', text: 'text-yellow-400', shadow: 'shadow-yellow-500/20' },
    [RankingTier.Silver]: { bg: 'bg-slate-500/50', text: 'text-slate-200', shadow: 'shadow-slate-500/20' },
    [RankingTier.Gold]: { bg: 'bg-amber-500/50', text: 'text-amber-300', shadow: 'shadow-amber-500/30' },
    [RankingTier.Platinum]: { bg: 'bg-cyan-500/50', text: 'text-cyan-200', shadow: 'shadow-cyan-500/30' },
    [RankingTier.Elite]: { bg: 'bg-purple-500/50', text: 'text-purple-200', shadow: 'shadow-purple-500/40' },
};

const RankingBadge: React.FC<RankingBadgeProps> = ({ tier, isOnStreak = false, short = false }) => {
    const styles = tierStyles[tier] || tierStyles.Provisional;

    return (
        <div 
            className={`flex items-center justify-center gap-1.5 rounded-full text-xs font-bold border border-white/10 ${styles.bg} ${styles.text} ${styles.shadow} ${short ? 'px-2 py-0.5' : 'px-2.5 py-1'}`}
        >
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            <span>{tier}</span>
            {isOnStreak && (
                <div className="text-orange-400" title="Flawless 5-Session Streak">
                    <FireIcon className="w-3.5 h-3.5" />
                </div>
            )}
        </div>
    );
};

export default RankingBadge;
