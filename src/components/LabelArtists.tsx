
import React, { useState, useEffect, useMemo } from 'react';
import { UsersIcon, ChartBarIcon, CalendarIcon, HeartIcon, PlusCircleIcon, TrashIcon, EyeIcon, CloseIcon, MicrophoneIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import * as labelService from '../services/labelService';
import type { Artist } from '../types';

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

const LabelArtists: React.FC = () => {
    const { currentUser, userRole } = useAppState();
    const [roster, setRoster] = useState<any[]>([]); // Using any[] to support RosterMember type
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedArtist, setSelectedArtist] = useState<any | null>(null);

    // Fetch real roster on mount
    useEffect(() => {
        const fetchRoster = async () => {
            if (!currentUser || userRole !== 'LABEL') return;
            setLoading(true);
            try {
                // Use the new labelService
                const data = await labelService.fetchLabelRoster(currentUser.id);
                setRoster(data);
            } catch (err) {
                console.error("Failed to fetch roster:", err);
                setError("Failed to load roster.");
            } finally {
                setLoading(false);
            }
        };

        fetchRoster();
    }, [currentUser, userRole]);

    // --- Analytics (calculated from real data) ---
    const stats = useMemo(() => {
        const totalArtists = roster.length;
        const totalBookings = roster.reduce((acc, curr) => acc + (curr.sessions_completed || 0), 0);
        
        return {
            totalArtists,
            totalBookings
        };
    }, [roster]);

    const handleRemoveArtist = async (rosterId: string, artistId?: string) => {
        if (!currentUser) return;
        if (window.confirm("Are you sure you want to remove this member from your roster?")) {
            const success = await apiService.removeArtistFromLabelRoster(currentUser.id, rosterId, artistId);
            if (success) {
                setRoster(prev => prev.filter(a => a.roster_id !== rosterId && a.id !== rosterId));
                if (selectedArtist?.id === artistId) setSelectedArtist(null);
            } else {
                alert("Failed to remove member.");
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Members" value={stats.totalArtists.toString()} icon={<UsersIcon className="w-6 h-6" />} />
                <StatCard label="Completed Sessions" value={stats.totalBookings.toString()} icon={<CalendarIcon className="w-6 h-6" />} />
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
                    <p className="text-zinc-500 mt-1">Add members using the 'Import Roster' button above.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roster.map((member) => (
                        <div key={member.roster_id || member.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-6">
                                <img src={member.image_url} alt={member.name} className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700 group-hover:border-orange-500 transition-colors" />
                                <div>
                                    <h3 className="text-xl font-bold text-zinc-100">{member.name}</h3>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        <span className="inline-block bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-full border border-zinc-700">
                                            {member.role_in_label || 'Member'}
                                        </span>
                                        {member.shadow_profile && (
                                            <span className="inline-block bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded-full border border-purple-500/30">
                                                Unclaimed
                                            </span>
                                        )}
                                        {!member.shadow_profile && !member.is_pending && (
                                            <span className="inline-block bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/30">
                                                Signed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-zinc-800/50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Rating</p>
                                    <p className="text-lg font-bold text-zinc-200">{member.rating_overall ? member.rating_overall.toFixed(1) : 'N/A'}</p>
                                </div>
                                <div className="bg-zinc-800/50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Sessions</p>
                                    <p className="text-lg font-bold text-orange-400">{member.sessions_completed || 0}</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex gap-3">
                                    {!member.is_pending && (
                                        <button 
                                            onClick={() => setSelectedArtist(member)}
                                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <EyeIcon className="w-4 h-4" /> View
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleRemoveArtist(member.roster_id, member.is_pending ? undefined : member.id)}
                                        className="flex-none bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors"
                                        title="Remove Member"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                {!member.shadow_profile && !member.is_pending && (
                                    <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-orange-400 font-semibold py-2 rounded-lg transition-colors text-sm border border-zinc-700">
                                        Assign Contract
                                    </button>
                                )}
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
                            <p className="text-orange-400 font-medium mb-4">{selectedArtist.role_in_label || 'Member'}</p>
                            
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
                                    <span>Profile</span>
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
