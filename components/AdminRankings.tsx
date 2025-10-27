
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { RankingTier } from '../types';
import RankedUserCard from './RankedUserCard';

const AdminRankings: React.FC = () => {
    const { artists, engineers, producers, stoodioz } = useAppState();

    const allUsers = [...artists, ...engineers, ...producers, ...stoodioz];

    const rankedUsers = allUsers
        .filter(u => u.ranking_tier !== RankingTier.Provisional)
        .sort((a, b) => {
            const tierOrder = Object.values(RankingTier);
            return tierOrder.indexOf(b.ranking_tier) - tierOrder.indexOf(a.ranking_tier);
        });

    return (
        <div>
            <h1 className="text-5xl font-extrabold text-center mb-2 tracking-tight text-orange-500">
                Admin Rankings
            </h1>
            <p className="text-center text-lg text-slate-500 mb-12">
                Overview of all ranked users on the platform.
            </p>
            <div className="space-y-4">
                {rankedUsers.map(user => (
                    <RankedUserCard key={user.id} user={user} rank={0} />
                ))}
            </div>
        </div>
    );
};

export default AdminRankings;
