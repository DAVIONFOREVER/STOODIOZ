
import React, { useMemo, useState } from 'react';
import { useAppState } from '../contexts/AppContext';
import type { Artist, Engineer, Stoodio, Producer } from '../types';
import RankedUserCard from './RankedUserCard';
import { UserRole, RankingTier } from '../types';

type User = Artist | Engineer | Stoodio | Producer;

const Leaderboard: React.FC = () => {
    const { artists, engineers, producers, stoodioz } = useAppState();
    const [filter, setFilter] = useState<UserRole | 'ALL'>('ALL');

    const allUsers = useMemo(() => [...artists, ...engineers, ...producers, ...stoodioz], [artists, engineers, producers, stoodioz]);

    const rankedUsers = useMemo(() => {
        const tierOrder = [
            RankingTier.Elite,
            RankingTier.Platinum,
            RankingTier.Gold,
            RankingTier.Silver,
            RankingTier.Bronze,
        ];

        return allUsers
            .filter(u => u.ranking_tier !== RankingTier.Provisional)
            .filter(u => {
                if (filter === 'ALL') return true;
                if (filter === UserRole.ARTIST) return !('specialties' in u) && !('amenities' in u) && !('instrumentals' in u);
                if (filter === UserRole.ENGINEER) return 'specialties' in u;
                if (filter === UserRole.PRODUCER) return 'instrumentals' in u;
                if (filter === UserRole.STOODIO) return 'amenities' in u;
                return false;
            })
            .sort((a, b) => {
                const tierA = tierOrder.indexOf(a.ranking_tier);
                const tierB = tierOrder.indexOf(b.ranking_tier);
                if (tierA !== tierB) {
                    return tierA - tierB;
                }
                return b.rating_overall - a.rating_overall;
            });
    }, [allUsers, filter]);

    const FilterButton: React.FC<{ role: UserRole | 'ALL', label: string }> = ({ role, label }) => (
        <button
            onClick={() => setFilter(role)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${filter === role ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-extrabold text-center mb-2 tracking-tight text-orange-500">Top Talent Leaderboard</h1>
            <p className="text-center text-lg text-slate-500 mb-8">Discover the highest-rated professionals on Stoodioz.</p>
            
            <div className="flex justify-center gap-2 mb-8">
                <FilterButton role="ALL" label="All" />
                <FilterButton role={UserRole.STOODIO} label="Stoodioz" />
                <FilterButton role={UserRole.ENGINEER} label="Engineers" />
                <FilterButton role={UserRole.PRODUCER} label="Producers" />
            </div>

            <div className="space-y-3">
                {rankedUsers.map((user, index) => (
                    <RankedUserCard key={user.id} user={user} rank={index + 1} />
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
