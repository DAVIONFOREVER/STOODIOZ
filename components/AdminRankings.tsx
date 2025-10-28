import React, { useState, useMemo } from 'react';
import { useAppState } from '../contexts/AppContext';
import { CalendarIcon, StarIcon, CheckCircleIcon, UserGroupIcon, SearchIcon, CloseIcon, ChevronUpDownIcon } from './icons';
import type { Artist, Engineer, Producer, Stoodio, SessionFeedback, BaseUser } from '../types';
import { UserRole, RankingTier } from '../types';
import RankingBadge from './RankingBadge';
import { format } from 'date-fns';

type AllUsers = Artist | Engineer | Producer | Stoodio;
type SortKey = 'name' | 'tier' | 'sessions_completed' | 'location' | 'rating_overall' | 'on_time_rate' | 'repeat_hire_rate';

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
                        <img src={user.imageUrl} alt={user.name} className="w-20 h-20 rounded-xl object-cover" />
                        <div>
                            <h3 className="text-2xl font-bold text-orange-400">{user.name}</h3>
                            <p className="text-zinc-400">{'location' in user ? user.location : 'Remote'}</p>
                            <div className="mt-2"><RankingBadge tier={user.ranking_tier} isOnStreak={user.is_on_streak} /></div>
                        </div>
                    </div>

                    <div className="p-4 cardSurface">
                        <h4 className="font-bold text-zinc-100 mb-3">Performance Breakdown</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex flex-col"><span className="text-zinc-400">Overall Rating</span><span className="font-bold text-xl text-zinc-100">{user.rating_overall.toFixed(1)} / 5.0</span></div>
                            <div className="flex flex-col"><span className="text-zinc-400">Sessions</span><span className="font-bold text-xl text-zinc-100">{user.sessions_completed}</span></div>
                            <div className="flex flex-col"><span className="text-zinc-400">On-Time Rate</span><span className="font-bold text-xl text-zinc-100">{user.on_time_rate}%</span></div>
                            <div className="flex flex-col"><span className="text-zinc-400">Completion Rate</span><span className="font-bold text-xl text-zinc-100">{user.completion_rate}%</span></div>
                            <div className="flex flex-col"><span className="text-zinc-400">Repeat Hire Rate</span><span className="font-bold text-xl text-zinc-100">{user.repeat_hire_rate}%</span></div>
                            <div className="flex flex-col"><span className="text-zinc-400">Streak</span><span className={`font-bold text-xl ${user.is_on_streak ? 'text-orange-400' : 'text-zinc-100'}`}>{user.is_on_streak ? 'Active' : 'Inactive'}</span></div>
                        </div>
                    </div>
                    
                     <div className="p-4 cardSurface">
                        <h4 className="font-bold text-zinc-100 mb-2">Top Skills</h4>
                        <div className="flex flex-wrap gap-2">
                            {user.strength_tags.map(tag => <span key={tag} className="bg-zinc-700 text-zinc-300 text-xs font-semibold px-2 py-1 rounded-full">{tag}</span>)}
                        </div>
                        <p className="text-xs text-center text-zinc-500 mt-3">{user.local_rank_text}</p>
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
        
        const totalSessions = allUsers.reduce((sum, u) => sum + u.sessions_completed, 0);
        const totalRating = activeUsers.reduce((sum, u) => sum + u.rating_overall, 0);
        const totalOnTime = activeUsers.reduce((sum, u) => sum + u.on_time_rate, 0);

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
            if (sortConfig.key === 'name') {
                return a.name.localeCompare(b.name) * (sortConfig.direction === 'asc' ? 1 : -1);
            }
            
            let aValue: string | number = a[sortConfig.key as keyof BaseUser] as any;
            let bValue: string | number = b[sortConfig.key as keyof BaseUser] as any;

            if (sortConfig.key === 'tier') {
                aValue = tierOrder[a.ranking_tier];
                bValue = tierOrder[b.ranking_tier];
            }
             if (sortConfig.key === 'location') {
                aValue = 'location' in a ? a.location : 'zzzz'; // sort remote to bottom
                bValue = 'location' in b ? b.location : 'zzzz';
            }

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
    }


    return (
        <div className="space-y-8">
            <h1 className="text-5xl font-extrabold tracking-tight text-orange-400">Admin Rankings</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Sessions Completed" value={totalSessions.toLocaleString()} icon={<CalendarIcon className="w-8 h-8 text-orange-400" />} />
                <StatCard label="Global Avg Rating" value={avgRating} icon={<StarIcon className="w-8 h-8 text-yellow-400" />} />
                <StatCard label="Global On-Time Rate" value={avgOnTimeRate} icon={<CheckCircleIcon className="w-8 h-8 text-green-400" />} />
                <StatCard label="Total Talent Profiles" value={allUsers.length.toLocaleString()} icon={<UserGroupIcon className="w-8 h-8 text-blue-400" />} />
            </div>

            <div className="cardSurface">
                <div className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-zinc-700/50">
                    <div className="relative w-full md:w-1/3">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input 
                            type="text" 
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-zinc-200 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                    {/* Placeholder for role filter */}
                    <select className="w-full md:w-auto bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-200 focus:ring-orange-500 focus:border-orange-500">
                        <option>All Roles</option>
                        <option>Artist</option>
                        <option>Engineer</option>
                        <option>Producer</option>
                        <option>Stoodio</option>
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-800/50">
                            <tr>
                                {[{label: 'Name', key: 'name'}, {label: 'Role'}, {label: 'Location', key: 'location'}, {label: 'Tier', key: 'tier'}, {label: 'Sessions', key: 'sessions_completed'}, {label: 'Rating', key: 'rating_overall'}, {label: 'On-Time', key: 'on_time_rate'}, {label: 'Re-Hire', key: 'repeat_hire_rate'}, {label: 'Streak'}].map(h => (
                                    <th key={h.label} className="px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider">
                                        {h.key ? <button onClick={() => handleSort(h.key as SortKey)} className="flex items-center gap-1.5 hover:text-white">{h.label} <ChevronUpDownIcon className="w-4 h-4" /></button> : h.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredAndSortedUsers.map(user => (
                                <tr key={user.id} onClick={() => setSelectedUser(user)} className="hover:bg-zinc-800/70 cursor-pointer">
                                    <td className="px-4 py-3 font-medium text-zinc-200">{user.name}</td>
                                    <td className="px-4 py-3 text-zinc-400">{getRole(user)}</td>
                                    <td className="px-4 py-3 text-zinc-400">{'location' in user ? user.location : 'N/A'}</td>
                                    <td className="px-4 py-3"><RankingBadge tier={user.ranking_tier} short /></td>
                                    <td className="px-4 py-3 text-zinc-200 font-semibold">{user.sessions_completed}</td>
                                    <td className="px-4 py-3 text-zinc-200">{user.rating_overall.toFixed(1)}</td>
                                    <td className="px-4 py-3 text-zinc-200">{user.on_time_rate}%</td>
                                    <td className="px-4 py-3 text-zinc-200">{user.repeat_hire_rate}%</td>
                                    <td className="px-4 py-3 text-orange-400 font-semibold">{user.is_on_streak ? 'Active' : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedUser && <UserDetailDrawer user={selectedUser} feedback={session_feedback} onClose={() => setSelectedUser(null)} />}
        </div>
    );
};

export default AdminRankings;
