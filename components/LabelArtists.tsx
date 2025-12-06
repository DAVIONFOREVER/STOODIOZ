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
    // Fallback if not populated from API, though we aim to use API data
    const sessions = member.sessions_completed || 0;
    const posts = member.posts_created || 0;
    const uploads = member.uploads_count || 0;
    return (sessions * 3) + (uploads * 2) + (posts * 1);
};

const LabelArtists: React.FC<LabelArtistsProps> = ({ reloadSignal, onAddMember }) => {
    const { currentUser, userRole } = useAppState();
    const dispatch = useAppDispatch();
    
    const [roster, setRoster] = useState<RosterMember[]>([]); // Using any[] temporarily as API returns mixed Artist + pending invite types
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedArtist, setSelectedArtist] = useState<any | null>(null);

    // Fetch real roster on mount
    useEffect(() => {
        const fetchRosterData = async () => {
            if (!currentUser || userRole !== 'LABEL') return;
            setLoading(true);
            try {
                // FIX: Corrected function name from 'fetchLabelRoster' to 'fetchRoster' to match apiService.ts
                const data = await apiService.fetchRoster(currentUser.id);
                setRoster(data);
            } catch (err) {
                console.error("Failed to fetch roster:", err);
                setError("Failed to load roster.");
            } finally {
                setLoading(false);
            }
        };

        fetchRosterData();
    }, [currentUser, userRole]);

    // --- Analytics (calculated from real data) ---
    const stats = useMemo(() => {
        const totalArtists = roster.length;
        // FIX: Removed reference to non-existent property 'monthly_listeners'.
        const totalBookings = roster.reduce((acc, curr) => acc + (curr.sessions_completed || 0), 0);
        const avgEngagement = 'N/A'; 

        return {
            totalArtists,
            totalBookings,
            avgEngagement
        };
    }, [roster]);

    const handleRemoveArtist = async (rosterId: string, artistId?: string) => {
        if (!currentUser) return;
        if (window.confirm("Are you sure you want to remove this artist from your roster?")) {
            // FIX: Corrected function name from 'removeArtistFromLabelRoster' to 'removeArtistFromRoster'
            const success = await apiService.removeArtistFromRoster(currentUser.id, rosterId, artistId);
            if (success) {
                setRoster(prev => prev.filter(a => a.roster_id !== rosterId && a.id !== rosterId));
                if (selectedArtist?.id === artistId) setSelectedArtist(null);
            } else {
                alert("Failed to remove artist.");
            }
        }
    };

    if (!currentUser || userRole !== 'LABEL') {
        return (
            <div className="p-20 text-center">
                <p className="text-zinc-400">Label roster is only available for label accounts.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">Artist Roster</h1>
                    <p className="text-zinc-400 mt-1">Manage talent, track performance, and grow your label.</p>
                </div>
            </div>

            {/* SECTION A: Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard label="Total Artists" value={stats.totalArtists.toString()} icon={<UsersIcon className="w-6 h-6" />} />
                <StatCard label="Completed Sessions" value={stats.totalBookings.toString()} icon={<CalendarIcon className="w-6 h-6" />} />
                <StatCard label="Avg. Engagement" value={stats.avgEngagement} icon={<HeartIcon className="w-6 h-6" />} />
            </div>

            {/* SECTION B: Artist Grid */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-zinc-500">Loading roster...</p>
                </div>
            ) : error ? (
                <div className="text-center py-20 text-red-400">{error}</div>
            ) : roster.length === 0 ? (
                <div className="text-center py-20 bg-zinc-800/30 rounded-2xl border border-zinc-700/50">
                    <UsersIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-400 text-lg font-semibold">No artists on your roster yet.</p>
                    <p className="text-zinc-500 mt-1">Add artists using the 'Add to Roster' button above.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roster.map((artist) => (
                        <div key={artist.roster_id || artist.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-6">
                                <img src={artist.image_url} alt={artist.name} className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700 group-hover:border-orange-500 transition-colors" />
                                <div>
                                    <h3 className="text-xl font-bold text-zinc-100">{artist.name}</h3>
                                    {artist.is_pending ? (
                                        <span className="inline-block bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full border border-yellow-500/30 mt-1">
                                            Invite Pending
                                        </span>
                                    ) : (
                                        <span className="inline-block bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-full border border-zinc-700 mt-1">
                                            {artist.role_in_label || 'Artist'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-zinc-800/50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Rating</p>
                                    <p className="text-lg font-bold text-zinc-200">{artist.rating_overall ? artist.rating_overall.toFixed(1) : 'N/A'}</p>
                                </div>
                                <div className="bg-zinc-800/50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Sessions</p>
                                    <p className="text-lg font-bold text-orange-400">{artist.sessions_completed || 0}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {!artist.is_pending && (
                                    <button 
                                        onClick={() => setSelectedArtist(artist)}
                                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                    >
                                        <EyeIcon className="w-4 h-4" /> View
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleRemoveArtist(artist.roster_id, artist.is_pending ? undefined : artist.id)}
                                    className="flex-none bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors"
                                    title="Remove from Roster"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
                            <p className="text-orange-400 font-medium mb-4">{selectedArtist.role_in_label || 'Artist'}</p>
                            
                            <p className="text-zinc-400 mb-6 leading-relaxed">
                                {selectedArtist.bio || "No bio available."}
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700">
                                    <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Rating</p>
                                    <p className="text-2xl font-bold text-zinc-100">{selectedArtist.rating_overall ? selectedArtist.rating_overall.toFixed(1) : 'N/A'}</p>
                                </div>
                                <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700">
                                    <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Total Sessions</p>
                                    <p className="text-2xl font-bold text-green-400">{selectedArtist.sessions_completed || 0}</p>
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