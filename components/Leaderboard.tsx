
import React, { useState, useMemo } from 'react';
import { useAppState } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import RankedUserCard from './RankedUserCard';
import type { Artist, Engineer, Producer, Stoodio } from '../types';
import { UserRole, RankingTier } from '../types';

type AllUsers = Artist | Engineer | Producer | Stoodio;
type FilterRole = 'ALL' | UserRole;

const Leaderboard: React.FC = () => {
    const { artists, engineers, producers, stoodioz } = useAppState();
    const { viewArtistProfile, viewEngineerProfile, viewProducerProfile, viewStoodioDetails } = useNavigation();

    const [filterRole, setFilterRole] = useState<FilterRole>('ALL');

    const allUsers = useMemo<AllUsers[]>(() => [...artists, ...engineers, ...producers, ...stoodioz], [artists, engineers, producers, stoodioz]);

    const getRole = (user: AllUsers): UserRole => {
        if ('amenities' in user) return UserRole.STOODIO;
        if ('specialties' in user) return UserRole.ENGINEER;
        if ('instrumentals' in user) return UserRole.PRODUCER;
        return UserRole.ARTIST;
    };

    const tierOrder: { [key in RankingTier]: number } = {
        [RankingTier.Elite]: 5,
        [RankingTier.Platinum]: 4,
        [RankingTier.Gold]: 3,
        [RankingTier.Silver]: 2,
        [RankingTier.Bronze]: 1,
        [RankingTier.Provisional]: 0,
    };
    
    const rankedUsers = useMemo(() => {
        return allUsers
            .filter(user => {
                if (filterRole === 'ALL') return true;
                return getRole(user) === filterRole;
            })
            .sort((a, b) => {
                // Primary sort: Ranking Tier
                const tierDiff = tierOrder[b.ranking_tier] - tierOrder[a.ranking_tier];
                if (tierDiff !== 0) return tierDiff;

                // Secondary sort: Streak
                const streakDiff = (b.is_on_streak ? 1 : 0) - (a.is_on_streak ? 1 : 0);
                if (streakDiff !== 0) return streakDiff;

                // Tertiary sort: Sessions Completed
                const sessionsDiff = b.sessions_completed - a.sessions_completed;
                if (sessionsDiff !== 0) return sessionsDiff;

                // Final sort: Overall Rating
                return b.rating_overall - a.rating_overall;
            });
    }, [allUsers, filterRole]);
    
    const handleSelectProfile = (profile: AllUsers) => {
        const role = getRole(profile);
        if (role === UserRole.ARTIST) viewArtistProfile(profile as Artist);
        else if (role === UserRole.ENGINEER) viewEngineerProfile(profile as Engineer);
        else if (role === UserRole.PRODUCER) viewProducerProfile(profile as Producer);
        else if (role === UserRole.STOODIO) viewStoodioDetails(profile as Stoodio);
    };

    const spotlightUser = rankedUsers[0];
    const otherUsers = rankedUsers.slice(1);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="text-center mb-12">
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-orange-400">
                    Leaderboard
                </h1>
                <p className="max-w-2xl mx-auto mt-4 text-lg text-zinc-400">
                    Recognizing the top-performing talent on Stoodioz. Rankings are based on session history, client feedback, and community engagement.
                </p>
                <div className="mt-6 flex items-center justify-center bg-zinc-800/50 rounded-lg p-1 border border-zinc-700 max-w-lg mx-auto">
                    {(['ALL', ...Object.values(UserRole)] as FilterRole[]).map(role => (
                        <button 
                            key={role}
                            onClick={() => setFilterRole(role)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md w-full transition-colors ${filterRole === role ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-zinc-700'}`}
                        >
                            {role === 'ALL' ? 'All' : `${role[0]}${role.slice(1).toLowerCase()}s`}
                        </button>
                    ))}
                </div>
            </div>

            {spotlightUser && (
                <div className="mb-12">
                    <RankedUserCard profile={spotlightUser} isSpotlight onSelectProfile={handleSelectProfile} rank={1} />
                </div>
            )}
            
            <div className="space-y-4">
                {otherUsers.map((profile, index) => (
                    <RankedUserCard key={profile.id} profile={profile} rank={index + 2} onSelectProfile={handleSelectProfile} />
                ))}
            </div>

             {rankedUsers.length === 0 && (
                <p className="text-center text-zinc-500 mt-8">No users found for this category.</p>
            )}
        </div>
    );
};

export default Leaderboard;
