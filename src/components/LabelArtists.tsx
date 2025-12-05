
import React, { useState, useEffect, useMemo } from 'react';
import { UsersIcon, ChartBarIcon, CalendarIcon, HeartIcon, PlusCircleIcon, TrashIcon, EyeIcon, CloseIcon, MicrophoneIcon, LinkIcon, MailIcon, CheckCircleIcon, UserPlusIcon, MagicWandIcon, FireIcon, ShieldCheckIcon, PhotoIcon, MusicNoteIcon } from './icons';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { RosterMember } from '../types';
import { USER_SILHOUETTE_URL } from '../constants';
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

const calculateOutputScore = (member: any) => {
    const sessions = member.sessions_completed || 0;
    const posts = member.posts_created || 0;
    const uploads = member.uploads_count || 0;
    return (sessions * 3) + (posts * 1) + (uploads * 2);
};

const RosterCard: React.FC<{ member: RosterMember; onRemove: (id: string) => void }> = ({ member, onRemove }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-orange-500/30 transition-all duration-200 group flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-grow min-w-0">
            <img 
                src={member.image_url || USER_SILHOUETTE_URL} 
                alt={member.name} 
                className="w-14 h-14 rounded-full object-cover border-2 border-zinc-700 group-hover:border-orange-500/50 transition-colors" 
            />
            <div className="min-w-0 space-y-1">
                <h4 className="text-zinc-100 font-bold text-lg truncate">{member.name}</h4>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-orange-400 font-medium">{member.role_in_label || 'Talent'}</span>
                    <span className="text-zinc-600 hidden sm:inline">•</span>
                    <StatusBadge member={member} />
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
             {(member.shadow_profile || member.is_pending) && (
                <button 
                    className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                    title="Resend Invite / Copy Link"
                    onClick={() => alert("Invite link copied to clipboard!")}
                >
                    <LinkIcon className="w-5 h-5" />
                </button>
            )}
            <button 
                onClick={() => onRemove(member.roster_id)}
                className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
                title="Remove from Roster"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    </div>
);

const LabelArtists: React.FC<LabelArtistsProps> = ({ reloadSignal, onAddMember }) => {
    const { currentUser, userRole } = useAppState();
    const dispatch = useAppDispatch();
    
    const [roster, setRoster] = useState<RosterMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArtist, setSelectedArtist] = useState<any | null>(null);

    const fetchRoster = async () => {
        if (!currentUser || userRole !== 'LABEL') return;
        setLoading(true);
        try {
            const data = await apiService.fetchLabelRoster(currentUser.id);
            setRoster(data);
        } catch (err) {
            console.error("Failed to fetch roster:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoster();
    }, [currentUser, reloadSignal]);

    const handleRemove = async (rosterId: string) => {
        if (!currentUser) return;
        if (window.confirm("Are you sure you want to remove this member from your roster?")) {
            try {
                await apiService.removeArtistFromLabelRoster(currentUser.id, rosterId);
                setRoster(prev => prev.filter(m => m.roster_id !== rosterId));
            } catch (e) {
                console.error(e);
                alert("Failed to remove member");
            }
        }
    };

    const openAria = () => {
        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
        dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: "Analyze my roster's output score and suggest improvements." } });
    };

    // Categories
    const pendingMembers = useMemo(() => roster.filter(m => m.is_pending), [roster]);
    const shadowMembers = useMemo(() => roster.filter(m => m.shadow_profile && !m.is_pending), [roster]);
    const activeMembers = useMemo(() => roster.filter(m => !m.is_pending && !m.shadow_profile), [roster]);

    // Metrics
    const stats = useMemo(() => {
        const totalArtists = activeMembers.length;
        const totalSessions = activeMembers.reduce((acc, curr: any) => acc + (curr.sessions_completed || 0), 0);
        
        let totalOutputScore = 0;
        activeMembers.forEach((m: any) => {
            totalOutputScore += calculateOutputScore(m);
        });

        const avgOutputScore = totalArtists > 0 ? Math.round(totalOutputScore / totalArtists) : 0;
        const avgEngagement = activeMembers.length > 0 
            ? (activeMembers.reduce((acc, curr: any) => acc + (curr.engagement_score || 0), 0) / activeMembers.length).toFixed(2)
            : "N/A";

        return { 
            totalArtists, 
            totalSessions, 
            avgOutputScore, 
            avgEngagement 
        };
    }, [activeMembers]);

    if (!currentUser || userRole !== 'LABEL') return null;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                <p className="text-zinc-500 font-medium">Loading your talent...</p>
            </div>
        );
    }

    if (roster.length === 0) {
        return (
            <div className="max-w-2xl mx-auto text-center py-24 space-y-8 animate-fade-in">
                <div className="relative">
                    <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full opacity-50"></div>
                    <div className="relative w-32 h-32 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border-4 border-zinc-800 shadow-2xl">
                        <UsersIcon className="w-16 h-16 text-zinc-600" />
                    </div>
                </div>
                
                <div className="space-y-3">
                    <h2 className="text-4xl font-extrabold text-zinc-100 tracking-tight">Your roster is empty</h2>
                    <p className="text-lg text-zinc-400 max-w-md mx-auto">
                        Add artists, writers, producers, or engineers to start managing their careers and bookings.
                    </p>
                </div>
                
                <div className="flex flex-col items-center gap-6">
                    {onAddMember && (
                        <button 
                            onClick={onAddMember}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-orange-500/20 flex items-center gap-3 text-lg"
                        >
                            <PlusCircleIcon className="w-6 h-6" />
                            Add to Roster
                        </button>
                    )}
                    
                    <button 
                        onClick={openAria}
                        className="text-zinc-500 hover:text-orange-400 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <MagicWandIcon className="w-4 h-4" />
                        Aria can help you scout talent
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in pb-24">
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Artists" value={stats.totalArtists.toString()} icon={<UsersIcon className="w-6 h-6" />} />
                <StatCard label="Total Sessions" value={stats.totalSessions.toString()} icon={<CalendarIcon className="w-6 h-6" />} />
                <StatCard label="Avg Output Score" value={stats.avgOutputScore.toString()} icon={<FireIcon className="w-6 h-6" />} />
                <StatCard label="Avg. Engagement" value={stats.avgEngagement} icon={<HeartIcon className="w-6 h-6" />} />
            </div>

            {/* Main Roster Views */}
            <div className="space-y-10">
                
                {/* Pending Section */}
                {pendingMembers.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className="h-px bg-zinc-800 flex-grow"></div>
                            <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest">Pending Invites ({pendingMembers.length})</h3>
                            <div className="h-px bg-zinc-800 flex-grow"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {pendingMembers.map(member => (
                                <RosterCard key={member.roster_id} member={member} onRemove={(id) => handleRemove(id)} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Shadow Section */}
                {shadowMembers.length > 0 && (
                    <section className="space-y-4">
                         <div className="flex items-center gap-3 px-2">
                            <div className="h-px bg-zinc-800 flex-grow"></div>
                            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest">Unclaimed Profiles ({shadowMembers.length})</h3>
                            <div className="h-px bg-zinc-800 flex-grow"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {shadowMembers.map(member => (
                                <RosterCard key={member.roster_id} member={member} onRemove={(id) => handleRemove(id)} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Confirmed Section (Active Roster) */}
                {activeMembers.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className="h-px bg-zinc-800 flex-grow"></div>
                            <h3 className="text-sm font-bold text-green-500 uppercase tracking-widest">Active Roster ({activeMembers.length})</h3>
                            <div className="h-px bg-zinc-800 flex-grow"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeMembers.map((artist) => {
                                const outputScore = calculateOutputScore(artist);
                                const anyArtist = artist as any; // Cast to access extended metrics
                                return (
                                    <div key={artist.roster_id || artist.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-300 group">
                                        <div className="flex items-center gap-4 mb-6">
                                            <img src={artist.image_url} alt={artist.name} className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700 group-hover:border-orange-500 transition-colors" />
                                            <div>
                                                <h3 className="text-xl font-bold text-zinc-100">{artist.name}</h3>
                                                <span className="inline-block bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-full border border-zinc-700 mt-1">
                                                    {artist.role_in_label || 'Artist'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* KPI Grid */}
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-zinc-800/50 p-2.5 rounded-lg text-center border border-zinc-700/50">
                                                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Sessions</p>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                                                    <p className="text-lg font-bold text-zinc-200">{anyArtist.sessions_completed || 0}</p>
                                                </div>
                                            </div>
                                            <div className="bg-zinc-800/50 p-2.5 rounded-lg text-center border border-zinc-700/50">
                                                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Mixes</p>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <ChartBarIcon className="w-3.5 h-3.5 text-purple-400" />
                                                    <p className="text-lg font-bold text-zinc-200">{anyArtist.mixes_delivered || 0}</p>
                                                </div>
                                            </div>
                                            <div className="bg-zinc-800/50 p-2.5 rounded-lg text-center border border-zinc-700/50">
                                                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Ranking</p>
                                                <div className="flex justify-center">
                                                    <RankingBadge tier={anyArtist.ranking_tier} isOnStreak={anyArtist.is_on_streak} short />
                                                </div>
                                            </div>
                                            <div className="bg-zinc-800/50 p-2.5 rounded-lg text-center border border-zinc-700/50">
                                                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Output Score</p>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <FireIcon className="w-3.5 h-3.5 text-orange-500" />
                                                    <p className="text-lg font-bold text-orange-400">{outputScore}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-3 items-center text-xs text-zinc-500 px-1 mb-4 justify-between">
                                            <span className="flex items-center gap-1"><PhotoIcon className="w-3 h-3" /> {anyArtist.posts_created || 0} Posts</span>
                                            <span className="flex items-center gap-1"><MusicNoteIcon className="w-3 h-3" /> {anyArtist.uploads_count || 0} Uploads</span>
                                        </div>

                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setSelectedArtist(artist)}
                                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                            >
                                                <EyeIcon className="w-4 h-4" /> View
                                            </button>
                                            <button 
                                                onClick={() => handleRemove(artist.roster_id)}
                                                className="flex-none bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors"
                                                title="Remove Artist"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>

            {/* Aria Help Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4"> 
                <div className="bg-zinc-900/90 backdrop-blur-md border border-orange-500/20 p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-up ring-1 ring-white/5">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
                        <MagicWandIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-grow min-w-0">
                        <p className="text-sm font-bold text-zinc-100 truncate">Need performance insights?</p>
                        <p className="text-xs text-zinc-400 truncate">Ask Aria to analyze output scores.</p>
                    </div>
                    <button 
                        onClick={openAria}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold rounded-lg transition-all border border-zinc-700 hover:border-zinc-600 whitespace-nowrap"
                    >
                        Ask Aria
                    </button>
                </div>
            </div>

            {/* SECTION D: View Artist Modal */}
            {selectedArtist && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden relative">
                        <button 
                            onClick={() => setSelectedArtist(null)} 
                            className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full text-zinc-200 hover:bg-black/70 backdrop-blur-md"
                        >
                            <CloseIcon className="w-6 h-6" />
                        </button>
                        
                        <div className="h-40 bg-gradient-to-br from-orange-600 to-purple-700 relative">
                            <img src={selectedArtist.image_url} className="w-full h-full object-cover opacity-50 mix-blend-overlay" alt="cover" />
                        </div>
                        
                        <div className="px-8 pb-8 -mt-16 relative">
                            <img src={selectedArtist.image_url} alt={selectedArtist.name} className="w-32 h-32 rounded-2xl object-cover border-4 border-zinc-900 shadow-xl mb-4" />
                            
                            <h2 className="text-3xl font-extrabold text-zinc-100">{selectedArtist.name}</h2>
                            <div className="flex items-center gap-3 mb-4">
                                <p className="text-orange-400 font-medium">{selectedArtist.role_in_label || 'Artist'}</p>
                                <RankingBadge tier={selectedArtist.ranking_tier} isOnStreak={selectedArtist.is_on_streak} short />
                            </div>
                            
                            <p className="text-zinc-400 mb-6 leading-relaxed">
                                {selectedArtist.bio || "No bio available."}
                            </p>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 text-center">
                                    <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Sessions</p>
                                    <p className="text-2xl font-bold text-zinc-100">{(selectedArtist as any).sessions_completed || 0}</p>
                                </div>
                                <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 text-center">
                                    <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Output</p>
                                    <p className="text-2xl font-bold text-orange-400">{calculateOutputScore(selectedArtist)}</p>
                                </div>
                                <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 text-center">
                                    <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Engagement</p>
                                    <p className="text-2xl font-bold text-blue-400">{(selectedArtist as any).engagement_score || 0}</p>
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-zinc-800 flex items-center justify-between text-zinc-500 text-sm">
                                <div className="flex items-center gap-2">
                                    <MicrophoneIcon className="w-4 h-4" />
                                    <span>Artist Profile</span>
                                </div>
                                <span>ID: {selectedArtist.id}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabelArtists;
