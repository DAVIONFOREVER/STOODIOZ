
import React, { useState, useMemo } from 'react';
import { useAppState } from '../contexts/AppContext';
import { CalendarIcon, StarIcon, CheckCircleIcon, UserGroupIcon, SearchIcon, CloseIcon, ChevronUpDownIcon } from './icons';
import type { Artist, Engineer, Producer, Stoodio, SessionFeedback, BaseUser } from '../types';
import { getProfileImageUrl } from '../constants';
import { UserRole, RankingTier } from '../types';
import RankingBadge from './RankingBadge';
import { format } from 'date-fns';

type AllUsers = Artist | Engineer | Producer | Stoodio;
type SortKey = 'tier' | 'sessions_completed' | 'location' | 'rating_overall' | 'on_time_rate' | 'repeat_hire_rate';

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="p-6 flex items-start gap-4 cardSurface">
        <div className="bg-orange-500/10 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-zinc-400 font-medium">{label}</p>
            <p className="text-3xl font-extrabold text-zinc-100 text-glow">{value}</p>
        </div>
    </div>
);

const UserDetailDrawer: React.FC<{ user: AllUsers; feedback: SessionFeedback[]; onClose: () => void }> = ({ user, feedback, onClose }) => {
    const userFeedback = feedback
        .filter(f => f.target_user_id === user.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

    const strengthTags = Array.isArray(user.strength_tags) ? user.strength_tags : [];
    // Safe access for location property which might not exist on all user types
    const location = (user as any).location || 'Remote';

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-lg h-full flex flex-col animate-slide-in-right cardSurface">
                <div className="p-6 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-zinc-100">Talent Details</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800"><CloseIcon className="w-6 h-6 text-zinc-400" /></button>
                </div>
                <div className="flex-grow overflow-y-auto p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        {/* FIX: Changed `imageUrl` to `image_url` to match the user type definition. */}
                        <img src={getProfileImageUrl(user)} alt={user.name} className="w-20 h-20 rounded-xl object-cover" />
                        <div>
                            <h3 className="text-2xl font-bold text-orange-400">{user.name}</h3>
                            <p className="text-zinc-400">{location}</p>
                            <div className="mt-2"><RankingBadge tier={user.ranking_tier || RankingTier.Provisional} isOnStreak={!!user.is_on_streak} /></div>
                        </div>
                    </div>

                    <div className="p-4 cardSurface">
                        <h4 className="font-bold text-zinc-100 mb-3">Performance Breakdown</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex flex-col"><span className="text-zinc-400">Overall Rating</span><span className="font-bold text-xl text-zinc-100">{(user.rating_overall ?? 0).toFixed(1)} / 5.0</span></div>
                            <div className="flex flex-col"><span className="text-zinc-400">Sessions</span><span className="font-bold text-xl text-zinc-100">{user.sessions_completed || 0}</span></div>
                            <div className="flex flex-col"><span className="text-zinc-400">On-Time Rate</span><span className="font-bold text-xl text-zinc-100">{user.on_time_rate || 0}%</span></div>
                            <div className="flex flex-col"><span className="text-zinc-400">Completion Rate</span><span className="font-bold text-xl text-zinc-100">{user.completion_rate || 0}%</span></div>
                            <div className="flex flex-col"><span className="text-zinc-400">Repeat Hire Rate</span><span className="font-bold text-xl text-zinc-100">{user.repeat_hire_rate || 0}%</span></div>
                            <div className="flex flex-col"><span className="text-zinc-400">Streak</span><span className={`font-bold text-xl ${user.is_on_streak ? 'text-orange-400' : 'text-zinc-100'}`}>{user.is_on_streak ? 'Active' : 'Inactive'}</span></div>
                        </div>
                    </div>
                    
                     <div className="p-4 cardSurface">
                        <h4 className="font-bold text-zinc-100 mb-2">Top Skills</h4>
                        <div className="flex flex-wrap gap-2">
                            {strengthTags.length > 0 ? (
                                strengthTags.map(tag => <span key={tag} className="bg-zinc-700 text-zinc-300 text-xs font-semibold px-2 py-1 rounded-full">{tag}</span>)
                            ) : (
                                <span className="text-zinc-500 text-sm">No skills listed.</span>
                            )}
                        </div>
                        <p className="text-xs text-center text-zinc-500 mt-3">{user.local_rank_text || ''}</p>
                    </div>

                    <div className="p-4 cardSurface">
                        <h4 className="font-bold text-zinc-100 mb-3">Recent Feedback Summary</h4>
                        <div className="space-y-3">
                            {userFeedback.length > 0 ? userFeedback.map(f => (
                                <div key={f.id} className="border-b border-zinc-700/50 pb-2 last:border-b-0">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400">{format(new Date(f.timestamp), 'MMM d, yyyy')}</span>
                                        <span className="font-bold text-yellow-400 flex items-center gap-1"><StarIcon className="w-4 h-4" />{f.star_rating.toFixed(1)}</span>
                                    </div>
                                    <p className="text-xs text-zinc-300 italic mt-1">"{f.pro_tags.join(', ')}"</p>
                                </div>
                            )) : <p className="text-sm text-zinc-500 text-center">No feedback yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
             <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right { animation: slide-in-right 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};


const AdminRankings: React.FC = () => {
    const { artists, engineers, producers, stoodioz } = useAppState();
    const session_feedback: SessionFeedback[] = []; // In a real app, this would come from useAppState

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<AllUsers | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'tier', direction: 'desc' });
    
    const allUsers = useMemo(() => [...artists, ...engineers, ...producers, ...stoodioz], [artists, engineers, producers, stoodioz]);
    
    const { totalSessions, avgRating, avgOnTimeRate } = useMemo(() => {
        const activeUsers = allUsers.filter(u => u.sessions_completed > 0);
        if (activeUsers.length === 0) return { totalSessions: 0, avgRating: '0.0', avgOnTimeRate: '0%' };
        
        const totalSessions = allUsers.reduce((sum, u) => sum + (u.sessions_completed || 0), 0);
        const totalRating = activeUsers.reduce((sum, u) => sum + (u.rating_overall || 0), 0);
        const totalOnTime = activeUsers.reduce((sum, u) => sum + (u.on_time_rate || 0), 0);

        return {
            totalSessions,
            avgRating: (totalRating / activeUsers.length).toFixed(1),
            avgOnTimeRate: `${Math.round(totalOnTime / activeUsers.length)}%`
        };
    }, [allUsers]);

    const tierOrder: { [key in RankingTier]: number } = {
        [RankingTier.Elite]: 5,
        [RankingTier.Platinum]: 4,
        [RankingTier.Gold]: 3,
        [RankingTier.Silver]: 2,
        [RankingTier.Bronze]: 1,
        [RankingTier.Provisional]: 0,
    };
    
    const filteredAndSortedUsers = useMemo(() => {
        let filtered = allUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return filtered.sort((a, b) => {
            let aValue: string | number = a[sortConfig.key as keyof BaseUser] as any;
            let bValue: string | number = b[sortConfig.key as keyof BaseUser] as any;

            if (sortConfig.key === 'tier') {
                aValue = tierOrder[a.ranking_tier || RankingTier.Provisional];
                bValue = tierOrder[b.ranking_tier || RankingTier.Provisional];
            }
             if (sortConfig.key === 'location') {
                aValue = 'location' in a ? (a as any).location : 'zzzz'; // sort remote to bottom
                bValue = 'location' in b ? (b as any).location : 'zzzz';
            }

            // Handle potential undefined values for sort keys
            if (aValue === undefined) aValue = 0;
            if (bValue === undefined) bValue = 0;

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allUsers, searchTerm, sortConfig]);

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const getRole = (user: AllUsers) => {
        if ('amenities' in user) return 'Stoodio';
        if ('specialties' in user) return 'Engineer';
        if ('instrumentals' in user) return 'Producer';
        return 'Artist';
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="text-center">
                <h1 className="text-5xl font-extrabold tracking-tight text-zinc-100">
                    Talent Rankings & Performance
                </h1>
                <p className="max-w-2xl mx-auto mt-4 text-lg text-zinc-400">
                    Monitor and manage user performance metrics across the platform.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Sessions Completed" value={totalSessions.toLocaleString()} icon={<CalendarIcon className="w-8 h-8 text-orange-400" />} />
                <StatCard label="Platform Avg. Rating" value={avgRating} icon={<StarIcon className="w-8 h-8 text-yellow-400" />} />
                <StatCard label="Avg. On-Time Rate" value={avgOnTimeRate} icon={<CheckCircleIcon className="w-8 h-8 text-green-400" />} />
                <StatCard label="Total Talent" value={allUsers.length.toLocaleString()} icon={<UserGroupIcon className="w-8 h-8 text-blue-400" />} />
            </div>

            <div className="cardSurface p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-zinc-100">All Talent</h2>
                    <div className="relative w-full max-w-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-zinc-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-full text-sm focus:ring-orange-500"
                            placeholder="Search by name..."
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-zinc-400">
                        <thead className="text-xs text-zinc-400 uppercase bg-zinc-800/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Talent</th>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('tier')}>
                                    <div className="flex items-center">Tier <ChevronUpDownIcon className="w-4 h-4 ml-1" /></div>
                                </th>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('sessions_completed')}>
                                    <div className="flex items-center">Sessions <ChevronUpDownIcon className="w-4 h-4 ml-1" /></div>
                                </th>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('rating_overall')}>
                                    <div className="flex items-center">Rating <ChevronUpDownIcon className="w-4 h-4 ml-1" /></div>
                                </th>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('on_time_rate')}>
                                    <div className="flex items-center">On-Time <ChevronUpDownIcon className="w-4 h-4 ml-1" /></div>
                                </th>
                                <th scope="col" className="px-6 py-3">Location</th>
                                <th scope="col" className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedUsers.map(user => {
                                const role = getRole(user);
                                return (
                                    <tr key={user.id} className="border-b border-zinc-700/50 hover:bg-zinc-800/30">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {/* FIX: Changed `imageUrl` to `image_url` to match the user type definition. */}
                                                <img src={getProfileImageUrl(user)} alt={user.name} className="w-10 h-10 rounded-lg object-cover" />
                                                <div>
                                                    <div className="font-semibold text-zinc-100">{user.name}</div>
                                                    <div className="text-xs text-zinc-500">{role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><RankingBadge tier={user.ranking_tier || RankingTier.Provisional} isOnStreak={user.is_on_streak} /></td>
                                        <td className="px-6 py-4 font-semibold text-zinc-200">{user.sessions_completed || 0}</td>
                                        <td className="px-6 py-4 font-semibold text-zinc-200">{(user.rating_overall || 0).toFixed(1)}</td>
                                        <td className="px-6 py-4 font-semibold text-zinc-200">{user.on_time_rate || 0}%</td>
                                        <td className="px-6 py-4">{'location' in user ? (user as any).location : 'N/A'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => setSelectedUser(user)} className="font-medium text-orange-400 hover:underline">Details</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedUser && (
                <UserDetailDrawer user={selectedUser} feedback={session_feedback} onClose={() => setSelectedUser(null)} />
            )}
        </div>
    );
};

export default AdminRankings;
