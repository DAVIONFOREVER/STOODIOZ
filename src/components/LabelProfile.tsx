
import React, { useState, useEffect, useMemo } from 'react';
import { useAppState } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useMessaging } from '../hooks/useMessaging';
import { useSocial } from '../hooks/useSocial';
import * as apiService from '../services/apiService';
import { ChevronLeftIcon, PhotoIcon, LinkIcon, UsersIcon, UserPlusIcon, UserCheckIcon, MessageIcon, ChartBarIcon, MapIcon } from './icons';
import type { Label, RosterMember } from '../types';
import { USER_SILHOUETTE_URL } from '../constants';
import { AppView } from '../types';

const LabelProfile: React.FC = () => {
    const { selectedLabel, currentUser, userRole, artists, engineers, stoodioz, producers } = useAppState();
    const { navigate, goBack, viewArtistProfile } = useNavigation();
    const { startConversation } = useMessaging(useNavigation().navigate);
    const { toggleFollow } = useSocial();
    
    // DETERMINISTIC DATA RESOLUTION:
    // If a label was specifically clicked, show that.
    // Otherwise, if the logged-in user is a label, show their own profile.
    const labelData = useMemo(() => {
        if (selectedLabel) return selectedLabel;
        if (userRole === 'LABEL' && currentUser) return currentUser as Label;
        return null;
    }, [selectedLabel, userRole, currentUser]);

    const [roster, setRoster] = useState<RosterMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        if (!labelData) return;
        
        if (currentUser && 'following' in currentUser) {
            setIsFollowing((currentUser.following.labels || []).includes(labelData.id));
        }

        const fetchRoster = async () => {
            setLoading(true);
            try {
                const data = await apiService.fetchLabelRoster(labelData.id);
                // If it's the owner viewing, show everything. Otherwise only active public members.
                const isOwner = currentUser?.id === labelData.id;
                setRoster(isOwner ? data : data.filter(m => !m.is_pending && !m.shadow_profile)); 
            } catch (error) {
                console.error("Error fetching roster:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRoster();
    }, [labelData, currentUser]);

    if (!labelData) return (
        <div className="p-20 text-center text-zinc-500 cardSurface">
            <p className="text-xl font-bold mb-4">No Label Selected</p>
            <p className="mb-6">We couldn't find the profile you're looking for.</p>
            <button onClick={() => navigate(AppView.THE_STAGE)} className="text-orange-400 font-bold hover:underline">
                Return to The Stage
            </button>
        </div>
    );

    const isSelf = currentUser?.id === labelData.id;
    const visibility = labelData.section_visibility || {
        mission: true, roster: true, metrics: true, services: true, partnerships: true, opportunities: true
    };
    
    // Privacy check
    if (!labelData.is_public_profile_enabled && !isSelf) {
        return (
            <div className="p-20 text-center cardSurface">
                <h2 className="text-2xl font-bold text-zinc-100">Private Profile</h2>
                <p className="text-zinc-500 mt-2">This label's profile is currently private.</p>
                <button onClick={goBack} className="mt-6 text-orange-400 font-bold hover:underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-20 animate-fade-in">
            <button 
                onClick={() => isSelf ? navigate(AppView.LABEL_DASHBOARD) : goBack()} 
                className="flex items-center gap-2 text-zinc-400 hover:text-orange-400 mb-6 transition-colors font-semibold"
            >
                <ChevronLeftIcon className="w-5 h-5" />
                {isSelf ? 'Back to Dashboard' : 'Back'}
            </button>

            {/* Profile Header */}
            <div className="relative rounded-2xl overflow-hidden cardSurface mb-8">
                <div className="h-48 bg-zinc-900 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black"></div>
                    <div className="text-zinc-700 font-bold text-4xl opacity-10 uppercase tracking-widest z-10 truncate px-4">
                        {labelData.company_name || labelData.name}
                    </div>
                </div>
                
                <div className="px-8 pb-8 -mt-16 flex flex-col md:flex-row items-end md:items-end gap-6 relative z-10">
                    <div className="w-32 h-32 rounded-full border-4 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xl">
                        {labelData.image_url ? (
                            <img src={labelData.image_url} alt={labelData.name} className="w-full h-full object-cover" />
                        ) : (
                            <PhotoIcon className="w-12 h-12 text-zinc-600" />
                        )}
                    </div>
                    <div className="flex-grow mb-2 text-center md:text-left">
                        <h1 className="text-4xl font-extrabold text-zinc-100">{labelData.name}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 mt-2 text-sm text-zinc-400">
                             {labelData.company_name && <span className="font-bold text-zinc-300">{labelData.company_name}</span>}
                             {labelData.website && <span>• {labelData.website.replace(/^https?:\/\//, '')}</span>}
                        </div>
                    </div>
                    {!isSelf && (
                        <div className="flex gap-3 mb-2 w-full md:w-auto">
                            <button 
                                onClick={() => toggleFollow('label', labelData.id)}
                                className={`flex-1 md:flex-none px-6 py-2 font-bold rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2 ${isFollowing ? 'bg-zinc-700 text-zinc-300' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'}`}
                            >
                                {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                            <button 
                                onClick={() => startConversation(labelData)}
                                className="flex-1 md:flex-none px-6 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <MessageIcon className="w-5 h-5" /> Message
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col */}
                <div className="lg:col-span-1 space-y-6">
                    {visibility.mission && labelData.mission_statement && (
                        <div className="cardSurface p-6 border-l-4 border-orange-500">
                            <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Mission</h3>
                            <p className="text-zinc-200 italic leading-relaxed">"{labelData.mission_statement}"</p>
                        </div>
                    )}

                    <div className="cardSurface p-6">
                        <h3 className="text-lg font-bold text-zinc-100 mb-4">About</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                            {labelData.bio || "No information provided yet."}
                        </p>
                    </div>

                    {visibility.metrics && labelData.public_metrics && (
                        <div className="cardSurface p-6">
                            <h3 className="text-lg font-bold text-zinc-100 mb-4 flex items-center gap-2"><ChartBarIcon className="w-5 h-5 text-orange-400"/> Stats</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Streams</span>
                                    <span className="text-zinc-200 font-bold">{(labelData.public_metrics.total_streams || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Charted Records</span>
                                    <span className="text-zinc-200 font-bold">{labelData.public_metrics.charted_records || 0}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Roster */}
                <div className="lg:col-span-2 space-y-8">
                    {visibility.roster && (
                        <div className="cardSurface p-6">
                            <h3 className="text-xl font-bold text-zinc-100 mb-6">Active Roster</h3>
                            {loading ? (
                                <div className="py-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div></div>
                            ) : roster.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {roster.map(artist => (
                                        <div 
                                            key={artist.id} 
                                            onClick={() => !isSelf && viewArtistProfile(artist as any)}
                                            className={`bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl p-4 flex items-center gap-4 transition-all group ${!isSelf ? 'cursor-pointer' : ''}`}
                                        >
                                            <img src={artist.image_url || USER_SILHOUETTE_URL} alt={artist.name} className="w-14 h-14 rounded-full object-cover border-2 border-zinc-700 group-hover:border-orange-500 transition-all" />
                                            <div>
                                                <h4 className="font-bold text-zinc-100 group-hover:text-orange-400 transition-colors">{artist.name}</h4>
                                                <p className="text-zinc-500 text-xs mt-0.5 uppercase tracking-wide">{artist.role_in_label || 'Artist'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-12 text-zinc-500 italic">No public roster data available.</p>
                            )}
                        </div>
                    )}
                    
                    {visibility.opportunities && labelData.opportunities && (
                        <div className="cardSurface p-6 bg-orange-500/5 border-orange-500/10">
                            <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2"><MapIcon className="w-5 h-5"/> Opportunities</h3>
                            <div className="flex flex-wrap gap-2">
                                {labelData.opportunities.accepting_demos && <span className="px-3 py-1 bg-zinc-800 text-green-400 text-xs font-bold rounded-full border border-green-500/20">Accepting Demos</span>}
                                {labelData.opportunities.scouting && <span className="px-3 py-1 bg-zinc-800 text-orange-400 text-xs font-bold rounded-full border border-orange-500/20">Scouting Talent</span>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabelProfile;
