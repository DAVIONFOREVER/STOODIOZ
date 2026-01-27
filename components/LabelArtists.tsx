import React, { useState, useEffect, useMemo } from 'react';
import { UsersIcon, ChartBarIcon, CalendarIcon, HeartIcon, PlusCircleIcon, TrashIcon, EyeIcon, CloseIcon, MicrophoneIcon, LinkIcon, MailIcon, CheckCircleIcon, UserPlusIcon, MagicWandIcon, FireIcon, ShieldCheckIcon, PhotoIcon, MusicNoteIcon } from './icons';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { RosterMember } from '../types';
import { getProfileImageUrl, USER_SILHOUETTE_URL } from '../constants';
import RankingBadge from './RankingBadge';

interface LabelArtistsProps {
    reloadSignal?: number;
    onAddMember?: () => void;
}


const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-zinc-800 border border-zinc-700/50 p-6 rounded-xl flex items-center gap-4 shadow-lg">
        <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400">
            {icon}
        </div>
        <div>
            <p className="text-zinc-400 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-zinc-100">{value}</p>
        </div>
    </div>
);

const StatusBadge: React.FC<{ member: RosterMember }> = ({ member }) => {
    if (member.is_pending) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <MailIcon className="w-3.5 h-3.5" /> Invite Pending
            </span>
        );
    }
    if (member.shadow_profile) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <UserPlusIcon className="w-3.5 h-3.5" /> Unclaimed
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
            <CheckCircleIcon className="w-3.5 h-3.5" /> Claimed
        </span>
    );
};

const LabelArtists: React.FC<LabelArtistsProps> = ({ reloadSignal }) => {
    const { currentUser, userRole } = useAppState();
    const dispatch = useAppDispatch();
    
    const [roster, setRoster] = useState<RosterMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArtist, setSelectedArtist] = useState<any | null>(null);

    useEffect(() => {
        if (!currentUser || userRole !== 'LABEL') return;
        const fetchRoster = async () => {
            setLoading(true);
            try {
                const rosterData = await apiService.fetchLabelRoster(currentUser.id);
                setRoster(rosterData);
            } catch (err) {
                console.error("Failed to fetch roster:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRoster();
    }, [currentUser, reloadSignal]);

    const handleRemove = async (rosterId: string) => {
        if (!currentUser) return;
        if (window.confirm("Are you sure you want to remove this member from your roster?")) {
             setRoster(prev => prev.filter(m => m.roster_id !== rosterId));
        }
    };

    const stats = useMemo(() => {
        const totalArtists = roster.length;
        const totalSessions = roster.reduce((acc, curr: any) => acc + (curr.sessions_completed || 0), 0);
        const totalOutput = totalArtists > 0 ? Math.round(roster.reduce((acc, curr: any) => acc + (curr.output_score || 0), 0) / totalArtists) : 0;
        return { totalArtists, totalSessions, totalOutput };
    }, [roster]);

    if (loading) return <div className="py-20 text-center text-zinc-500">Scanning division talent...</div>;

    return (
        <div className="space-y-10 animate-fade-in pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard label="Active Roster" value={stats.totalArtists.toString()} icon={<UsersIcon className="w-6 h-6" />} />
                <StatCard label="Aggregated Sessions" value={stats.totalSessions.toString()} icon={<CalendarIcon className="w-6 h-6" />} />
                <StatCard label="Avg Output Score" value={stats.totalOutput.toString()} icon={<FireIcon className="w-6 h-6" />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roster.map((member) => (
                    <div key={member.roster_id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-300 group">
                        <div className="flex items-center gap-4 mb-6">
                            <img src={member.image_url || USER_SILHOUETTE_URL} alt={member.name} className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700 group-hover:border-orange-500 transition-colors" />
                            <div>
                                <h3 className="text-xl font-bold text-zinc-100">{member.name}</h3>
                                <StatusBadge member={member} />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-zinc-800/50 p-2.5 rounded-lg text-center border border-zinc-700/50">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Sessions</p>
                                <p className="text-lg font-bold text-zinc-200">{(member as any).sessions_completed || 0}</p>
                            </div>
                            <div className="bg-zinc-800/50 p-2.5 rounded-lg text-center border border-zinc-700/50">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Output</p>
                                <p className="text-lg font-bold text-orange-400">{(member as any).output_score || 0}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setSelectedArtist(member)}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs"
                            >
                                <EyeIcon className="w-4 h-4" /> View Console
                            </button>
                            <button 
                                onClick={() => handleRemove(member)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                title="Drop from roster (removes verified badge)"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
                
                {roster.length === 0 && (
                    <div className="col-span-full py-20 text-center cardSurface border-dashed opacity-40">
                        <UsersIcon className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-lg font-bold">Roster empty.</p>
                        <p className="text-sm">Start scouting or import a CSV to populate your talent pipeline.</p>
                    </div>
                )}
            </div>

            {selectedArtist && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden relative">
                        <button onClick={() => setSelectedArtist(null)} className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full text-zinc-200 hover:bg-black/70">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                        <div className="h-32 bg-gradient-to-br from-orange-600/40 to-purple-700/40" />
                        <div className="px-8 pb-8 -mt-12">
                            <img src={getProfileImageUrl(selectedArtist)} alt={selectedArtist.name} className="w-24 h-24 rounded-2xl object-cover border-4 border-zinc-900 mb-4 shadow-xl" />
                            <h2 className="text-3xl font-extrabold text-zinc-100">{selectedArtist.name}</h2>
                            <p className="text-orange-400 font-bold text-sm uppercase tracking-widest mt-1">{selectedArtist.role_in_label}</p>
                            <p className="text-zinc-400 mt-4 leading-relaxed">{selectedArtist.bio || "Active Sony Music talent."}</p>
                            <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-end">
                                <button onClick={() => setSelectedArtist(null)} className="px-6 py-2 bg-zinc-800 rounded-lg font-bold text-sm">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabelArtists;