import React, { useState, useEffect, useMemo } from 'react';
import { UsersIcon, CalendarIcon, PlusCircleIcon, TrashIcon, EyeIcon, LinkIcon, MagicWandIcon, RefreshIcon, MailIcon, CheckCircleIcon, UserPlusIcon } from './icons';
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
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <MailIcon className="w-3 h-3" /> Pending Invite
            </span>
        );
    }
    if (member.shadow_profile) {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <UsersIcon className="w-3 h-3" /> Unclaimed Profile
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            <CheckCircleIcon className="w-3 h-3" /> Claimed
        </span>
    );
};

const RosterCard: React.FC<{ member: RosterMember; onRemove: (id: string) => void }> = ({ member, onRemove }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-orange-500/30 transition-all duration-200 group flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-grow min-w-0">
            <img 
                src={member.image_url || USER_SILHOUETTE_URL} 
                alt={member.name} 
                className="w-12 h-12 rounded-full object-cover border border-zinc-700" 
            />
            <div className="min-w-0">
                <h4 className="text-zinc-100 font-bold truncate">{member.name}</h4>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="font-medium text-orange-400">{member.role_in_label || 'Talent'}</span>
                    <span>•</span>
                    <StatusBadge member={member} />
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
             {member.shadow_profile && (
                <button 
                    className="p-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors"
                    title="Copy Claim Link"
                    onClick={() => {
                        // In a real app, we'd invoke the claim link generator here
                        alert("Claim link generated (Mock)");
                    }}
                >
                    <LinkIcon className="w-4 h-4" />
                </button>
            )}
            <button 
                onClick={() => onRemove(member.roster_id)}
                className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
                title="Remove from Roster"
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    </div>
);

const LabelArtists: React.FC<LabelArtistsProps> = ({ reloadSignal, onAddMember }) => {
    const { currentUser, userRole } = useAppState();
    const dispatch = useAppDispatch();
    
    const [roster, setRoster] = useState<RosterMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRoster = async () => {
        if (!currentUser || userRole !== 'LABEL') return;
        setLoading(true);
        try {
            const data = await apiService.fetchLabelRoster(currentUser.id);
            setRoster(data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch roster:", err);
            setError("Failed to load roster.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoster();
    }, [currentUser, reloadSignal]);

    const handleRemove = async (rosterId: string) => {
        if (!currentUser) return;
        if (window.confirm("Remove this member from your roster?")) {
            try {
                await apiService.removeArtistFromLabelRoster(currentUser.id, rosterId);
                setRoster(prev => prev.filter(m => m.roster_id !== rosterId));
            } catch (e) {
                alert("Failed to remove member");
            }
        }
    };

    const openAria = () => {
        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
        dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: "Help me manage my roster and find new talent." } });
    };

    const pendingMembers = useMemo(() => roster.filter(m => m.is_pending), [roster]);
    const shadowMembers = useMemo(() => roster.filter(m => m.shadow_profile && !m.is_pending), [roster]);
    const activeMembers = useMemo(() => roster.filter(m => !m.is_pending && !m.shadow_profile), [roster]);

    if (!currentUser || userRole !== 'LABEL') return null;

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (roster.length === 0) {
        return (
            <div className="max-w-3xl mx-auto text-center py-20 space-y-6 animate-fade-in">
                <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto border-4 border-zinc-700">
                    <UsersIcon className="w-12 h-12 text-zinc-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-zinc-100">Your roster is empty</h2>
                    <p className="text-zinc-400">Add artists, writers, producers, or anyone your label represents.</p>
                </div>
                
                <div className="flex justify-center gap-4">
                    {onAddMember && (
                        <button 
                            onClick={onAddMember}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-colors flex items-center gap-2 shadow-lg shadow-orange-500/20"
                        >
                            <PlusCircleIcon className="w-5 h-5" />
                            Add to Roster
                        </button>
                    )}
                </div>
                
                <p className="text-sm text-zinc-500 flex items-center justify-center gap-2 cursor-pointer hover:text-orange-400 transition-colors" onClick={openAria}>
                    <MagicWandIcon className="w-4 h-4" />
                    Aria can help you set up your roster.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            
            {/* Stats Header (Optional but good for Smart Roster feel) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Talent" value={roster.length.toString()} icon={<UsersIcon className="w-5 h-5" />} />
                <StatCard label="Pending" value={pendingMembers.length.toString()} icon={<MailIcon className="w-5 h-5" />} />
                <StatCard label="Unclaimed" value={shadowMembers.length.toString()} icon={<LinkIcon className="w-5 h-5" />} />
                <StatCard label="Active" value={activeMembers.length.toString()} icon={<CheckCircleIcon className="w-5 h-5" />} />
            </div>

            <div className="space-y-8">
                {/* Pending Invites */}
                {pendingMembers.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3 px-1">Pending Invites</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingMembers.map(member => (
                                <RosterCard key={member.roster_id} member={member} onRemove={handleRemove} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Shadow Profiles */}
                {shadowMembers.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3 px-1">Unclaimed Profiles</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {shadowMembers.map(member => (
                                <RosterCard key={member.roster_id} member={member} onRemove={handleRemove} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Confirmed Roster */}
                {activeMembers.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3 px-1">Confirmed Roster</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeMembers.map(member => (
                                <RosterCard key={member.roster_id} member={member} onRemove={handleRemove} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Aria Help Bar */}
            <div className="fixed bottom-6 right-6 z-30 hidden md:flex"> 
                <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm animate-slide-up">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <MagicWandIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-grow">
                        <p className="text-sm font-bold text-zinc-100">Manage your roster</p>
                        <p className="text-xs text-zinc-400">Ask Aria to analyze performance or suggest new talent.</p>
                    </div>
                    <button 
                        onClick={openAria}
                        className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-bold rounded-lg transition-colors"
                    >
                        Ask Aria
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LabelArtists;