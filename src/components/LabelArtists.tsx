import React, { useState, useEffect, useMemo } from 'react';
import { UsersIcon, CalendarIcon, TrashIcon, EyeIcon, LinkIcon, MagicWandIcon, MailIcon, CheckCircleIcon, PlusCircleIcon, UserPlusIcon } from './icons';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { RosterMember } from '../types';
import { USER_SILHOUETTE_URL } from '../constants';

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
        dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: "Help me manage my roster and specific artist strategies." } });
    };

    // Categories
    const pendingMembers = useMemo(() => roster.filter(m => m.is_pending), [roster]);
    const shadowMembers = useMemo(() => roster.filter(m => m.shadow_profile && !m.is_pending), [roster]);
    const activeMembers = useMemo(() => roster.filter(m => !m.is_pending && !m.shadow_profile), [roster]);

    // Metrics
    const stats = useMemo(() => {
        const total = roster.length;
        const claimed = activeMembers.length;
        const totalBookings = activeMembers.reduce((acc, curr) => acc + (curr.sessions_completed || 0), 0);
        const avgRating = activeMembers.length > 0 
            ? (activeMembers.reduce((acc, curr) => acc + (curr.rating_overall || 0), 0) / activeMembers.length).toFixed(1) 
            : "N/A";
        return { total, claimed, totalBookings, avgRating };
    }, [roster, activeMembers]);

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Talent" value={stats.total.toString()} icon={<UsersIcon className="w-6 h-6" />} />
                <StatCard label="Active Profiles" value={stats.claimed.toString()} icon={<CheckCircleIcon className="w-6 h-6" />} />
                <StatCard label="Total Bookings" value={stats.totalBookings.toString()} icon={<CalendarIcon className="w-6 h-6" />} />
                <StatCard label="Avg Rating" value={stats.avgRating} icon={<EyeIcon className="w-6 h-6" />} />
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
                                <RosterCard key={member.roster_id} member={member} onRemove={handleRemove} />
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
                                <RosterCard key={member.roster_id} member={member} onRemove={handleRemove} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Confirmed Section */}
                {activeMembers.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className="h-px bg-zinc-800 flex-grow"></div>
                            <h3 className="text-sm font-bold text-green-500 uppercase tracking-widest">Active Roster ({activeMembers.length})</h3>
                            <div className="h-px bg-zinc-800 flex-grow"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {activeMembers.map(member => (
                                <RosterCard key={member.roster_id} member={member} onRemove={handleRemove} />
                            ))}
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
                        <p className="text-sm font-bold text-zinc-100 truncate">Need roster advice?</p>
                        <p className="text-xs text-zinc-400 truncate">Ask Aria to analyze performance metrics.</p>
                    </div>
                    <button 
                        onClick={openAria}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold rounded-lg transition-all border border-zinc-700 hover:border-zinc-600 whitespace-nowrap"
                    >
                        Ask Aria
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LabelArtists;