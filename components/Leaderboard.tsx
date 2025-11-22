import React, { useState, useMemo } from 'react';
import { useAppState } from '../contexts/AppContext';
import type { Artist, Engineer, Producer, Stoodio, BaseUser } from '../types';
import { UserRole, RankingTier } from '../types';
import RankedUserCard from './RankedUserCard';
import { useNavigation } from '../hooks/useNavigation';

type AllUsers = Artist | Engineer | Producer | Stoodio;
type RoleFilter = 'Engineers' | 'Producers' | 'Artists' | 'Studios';

const roleFilters: RoleFilter[] = ['Engineers', 'Producers', 'Artists', 'Studios'];

const Leaderboard: React.FC = () => {
    const { artists, engineers, producers, stoodioz } = useAppState();
    const { viewArtistProfile, viewEngineerProfile, viewProducerProfile, viewStoodioDetails } = useNavigation();

    const [activeRole, setActiveRole] = useState<RoleFilter>('Engineers');
    const [activeCity, setActiveCity] = useState<string>('All');

    const allUsers = useMemo(() => [...artists, ...engineers, ...producers, ...stoodioz], [artists, engineers, producers, stoodioz]);

    const cities = useMemo(() => {
        const citySet = new Set<string>();
        allUsers.forEach(user => {
            if ('location' in user && user.location) {
                citySet.add(user.location);
            }
        });
        return ['All', ...Array.from(citySet).sort()];
    }, [allUsers]);

    const tierOrder: { [key in RankingTier]: number } = {
        [RankingTier.Elite]: 5,
        [RankingTier.Platinum]: 4,
        [RankingTier.Gold]: 3,
        [RankingTier.Silver]: 2,
        [RankingTier.Bronze]: 1,
        [RankingTier.Provisional]: 0,
    };

    const rankedUsers = useMemo(() => {
        let filtered: AllUsers[] = [];
        switch (activeRole) {
            case 'Engineers': filtered = engineers; break;
            case 'Producers': filtered = producers; break;
            case 'Artists': filtered = artists; break;
            case 'Studios': filtered = stoodioz; break;
        }

        if (activeCity !== 'All') {
            filtered = filtered.filter(user => 'location' in user && user.location === activeCity);
        }

        return filtered.sort((a, b) => {
            const tierDiff = tierOrder[b.ranking_tier] - tierOrder[a.ranking_tier];
            if (tierDiff !== 0) return tierDiff;

            const sessionsDiff = b.sessions_completed - a.sessions_completed;
            if (sessionsDiff !== 0) return sessionsDiff;

            return b.rating_overall - a.rating_overall;
        });
    }, [activeRole, activeCity, artists, engineers, producers, stoodioz, tierOrder]);

    const handleProfileSelect = (profile: AllUsers) => {
        if ('specialties' in profile) viewEngineerProfile(profile as Engineer);
        else if ('instrumentals' in profile) viewProducerProfile(profile as Producer);
        else if ('amenities' in profile) viewStoodioDetails(profile as Stoodio);
        else viewArtistProfile(profile as Artist);
    };


    return (
        <div className="animate-fade-in space-y-8">
            <div className="text-center">
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-100">
                    Top Talent <span className="text-orange-400" style={{ textShadow: '0 0 15px #fb923c' }}>in Your City</span>
                </h1>
                <p className="max-w-2xl mx-auto mt-4 text-lg text-zinc-400">
                    Discover the most reliable and in-demand creators on the platform.
                </p>
            </div>

            <div className="sticky top-20 z-30 bg-black/80 backdrop-blur-sm py-4">
                <div className="flex justify-center flex-wrap gap-2 mb-4">
                    {roleFilters.map(role => (
                        <button
                            key={role}
                            onClick={() => setActiveRole(role)}
                            className={`px-4 py-2 text-sm font-bold rounded-full transition-colors ${activeRole === role ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
                 <div className="flex justify-center">
                    <select
                        value={activeCity}
                        onChange={e => setActiveCity(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-200 focus:ring-orange-500 focus:border-orange-500"
                    >
                        {cities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                </div>
            </div>

            {rankedUsers.length > 0 ? (
                <div className="space-y-8">
                    {/* Spotlight */}
                    <div className="animate-fade-in-up">
                        <p className="text-center text-orange-400 font-bold mb-2">Moving the city right now.</p>
                        <RankedUserCard profile={rankedUsers[0]} isSpotlight onSelectProfile={handleProfileSelect} />
                    </div>

                    {/* Rest of the list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rankedUsers.slice(1).map((user, index) => (
                             <div key={user.id} className="animate-fade-in-up" style={{ animationDelay: `${(index + 1) * 50}ms`}}>
                                <RankedUserCard profile={user} rank={index + 2} onSelectProfile={handleProfileSelect}/>
                             </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-zinc-700/50">
                    <p className="text-zinc-400 font-semibold">No talent found for this category or location.</p>
                    <p className="text-zinc-500 text-sm mt-2">Try adjusting your filters.</p>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
