
import React, { useState, useEffect } from 'react';
import { useAppState } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useMessaging } from '../hooks/useMessaging';
import * as apiService from '../services/apiService';
import { ChevronLeftIcon, PhotoIcon, LinkIcon, UsersIcon, UserPlusIcon, MessageIcon, ChartBarIcon, MapIcon } from './icons';
import type { Label, RosterMember } from '../types';
import { USER_SILHOUETTE_URL } from '../constants';

const LabelProfile: React.FC = () => {
    const { selectedLabel, currentUser } = useAppState();
    const { goBack, viewArtistProfile } = useNavigation();
    const { startConversation } = useMessaging(useNavigation().navigate);
    
    // Determine which label to show: selectedLabel (if viewing others) or currentUser (if viewing self as label)
    const label = (currentUser?.role === 'LABEL' && !selectedLabel) 
        ? (currentUser as Label) 
        : selectedLabel;

    const [roster, setRoster] = useState<RosterMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!label) return;
        const fetchRoster = async () => {
            setLoading(true);
            try {
                const data = await apiService.fetchLabelRoster(label.id);
                // Only show public/claimed members on public profile usually
                setRoster(data.filter(m => !m.is_pending && !m.shadow_profile)); 
            } catch (error) {
                console.error("Error fetching roster:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRoster();
    }, [label]);

    if (!label) return (
        <div className="p-20 text-center text-zinc-500">
            <p>Label profile not found.</p>
            <button onClick={goBack} className="mt-4 text-orange-400 hover:underline">Go Back</button>
        </div>
    );

    const isSelf = currentUser?.id === label.id;
    const visibility = label.section_visibility || {
        mission: true, roster: true, metrics: true, services: true, partnerships: true, opportunities: true
    };
    
    // Only show if public enabled (or self viewing)
    if (!label.is_public_profile_enabled && !isSelf) {
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
            <button onClick={goBack} className="flex items-center gap-2 text-zinc-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back
            </button>

            {/* Header / Banner */}
            <div className="relative rounded-2xl overflow-hidden cardSurface mb-8">
                <div className="h-48 bg-gradient-to-r from-zinc-800 to-zinc-900 flex items-center justify-center relative">
                     <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-500 via-zinc-900 to-black"></div>
                    <div className="text-zinc-700 font-bold text-4xl opacity-20 uppercase tracking-widest z-10 truncate px-4">{label.company_name || label.name}</div>
                </div>
                
                <div className="px-8 pb-8 -mt-16 flex flex-col md:flex-row items-end md:items-end gap-6 relative z-10">
                    <div className="w-32 h-32 rounded-full border-4 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xl">
                        {label.image_url ? (
                            <img src={label.image_url} alt={label.name} className="w-full h-full object-cover" />
                        ) : (
                            <PhotoIcon className="w-12 h-12 text-zinc-600" />
                        )}
                    </div>
                    <div className="flex-grow mb-2 text-center md:text-left">
                        <h1 className="text-4xl font-extrabold text-zinc-100">{label.name}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 mt-2 text-sm text-zinc-400">
                             {label.parent_company && <span>part of <strong className="text-zinc-300">{label.parent_company}</strong></span>}
                             {label.years_active && <span>• Est. {new Date().getFullYear() - label.years_active}</span>}
                             {label.primary_regions && label.primary_regions.length > 0 && <span>• {label.primary_regions[0]}</span>}
                        </div>
                         {label.primary_genres && (
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                                {label.primary_genres.map(g => (
                                    <span key={g} className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">{g}</span>
                                ))}
                            </div>
                        )}
                    </div>
                    {!isSelf && (
                        <div className="flex gap-3 mb-2 w-full md:w-auto">
                            <button className="flex-1 md:flex-none px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                                <UserPlusIcon className="w-5 h-5" /> Follow
                            </button>
                            <button 
                                onClick={() => startConversation(label)}
                                className="flex-1 md:flex-none px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <MessageIcon className="w-5 h-5" /> Message
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Mission */}
                    {visibility.mission && label.mission_statement && (
                         <div className="cardSurface p-6 bg-gradient-to-br from-zinc-800 to-zinc-900 border-orange-500/20">
                            <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Our Mission</h3>
                            <p className="text-zinc-200 font-medium italic leading-relaxed">"{label.mission_statement}"</p>
                        </div>
                    )}

                    {/* Stats / Metrics */}
                    {visibility.metrics && label.public_metrics && (
                        <div className="cardSurface p-6">
                            <h3 className="text-lg font-bold text-zinc-100 mb-4 flex items-center gap-2"><ChartBarIcon className="w-5 h-5 text-purple-400"/> Key Results</h3>
                            <div className="space-y-4">
                                {label.public_metrics.total_streams && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-400 text-sm">Total Streams</span>
                                        <span className="font-mono text-zinc-100 font-bold">{(label.public_metrics.total_streams / 1000000).toFixed(1)}M+</span>
                                    </div>
                                )}
                                {label.public_metrics.charted_records && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-400 text-sm">Charted Records</span>
                                        <span className="font-mono text-zinc-100 font-bold">{label.public_metrics.charted_records}</span>
                                    </div>
                                )}
                                {label.public_metrics.certifications && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-400 text-sm">Certifications</span>
                                        <span className="font-mono text-yellow-400 font-bold">{label.public_metrics.certifications}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Info Card */}
                    <div className="cardSurface p-6">
                        <h3 className="text-lg font-bold text-zinc-100 mb-4 border-b border-zinc-700 pb-2">About</h3>
                        {label.bio && (
                            <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap mb-6">
                                {label.bio}
                            </p>
                        )}
                        
                        <div className="space-y-3">
                            {label.website && (
                                <a href={label.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-zinc-400 hover:text-orange-400 transition-colors text-sm group">
                                    <div className="p-2 bg-zinc-800 rounded-full group-hover:bg-orange-500/10"><LinkIcon className="w-4 h-4" /></div>
                                    <span className="truncate">{label.website.replace(/^https?:\/\//, '')}</span>
                                </a>
                            )}
                             <div className="flex items-center gap-3 text-zinc-400 text-sm">
                                <div className="p-2 bg-zinc-800 rounded-full"><UsersIcon className="w-4 h-4" /></div>
                                <span>{roster.length} Artists Signed</span>
                            </div>
                        </div>
                    </div>

                    {/* Services */}
                    {visibility.services && label.services_offered && label.services_offered.length > 0 && (
                         <div className="cardSurface p-6">
                            <h3 className="text-lg font-bold text-zinc-100 mb-4">Services</h3>
                            <div className="flex flex-wrap gap-2">
                                {label.services_offered.map(service => (
                                    <span key={service} className="text-xs font-semibold bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-700">
                                        {service}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                     {/* Affiliations */}
                     {visibility.partnerships && label.affiliations && label.affiliations.length > 0 && (
                         <div className="cardSurface p-6">
                            <h3 className="text-lg font-bold text-zinc-100 mb-4">Partners</h3>
                            <div className="flex flex-wrap gap-2">
                                {label.affiliations.map(partner => (
                                    <span key={partner} className="text-sm text-zinc-400 font-medium">
                                        {partner} •
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Roster & Opportunities */}
                <div className="lg:col-span-2 space-y-8">
                     
                     {/* Opportunities Banner */}
                     {visibility.opportunities && label.opportunities && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-wrap gap-6 items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2"><MapIcon className="w-5 h-5 text-green-400"/> Open Opportunities</h3>
                                <p className="text-sm text-zinc-400">This label is currently looking for:</p>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                {label.opportunities.accepting_demos && <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/20">Demos</span>}
                                {label.opportunities.hiring_producers && <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-full border border-purple-500/20">Producers</span>}
                                {label.opportunities.hiring_engineers && <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full border border-blue-500/20">Engineers</span>}
                                {label.opportunities.scouting && <span className="px-3 py-1 bg-orange-500/10 text-orange-400 text-xs font-bold rounded-full border border-orange-500/20">New Talent</span>}
                            </div>
                        </div>
                     )}

                    {/* Roster */}
                    {visibility.roster && (
                        <div className="cardSurface p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                                    Active Roster
                                </h3>
                                <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-full">{roster.length}</span>
                            </div>

                            {loading ? (
                                <div className="py-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div></div>
                            ) : roster.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {roster.map(artist => {
                                        const meta = label.roster_display_settings?.[artist.id] || { display: true, status: 'Established', highlight_metric: '' };
                                        
                                        // Skip if set to hidden in metadata
                                        if (meta.display === false) return null;

                                        return (
                                            <div 
                                                key={artist.id} 
                                                onClick={() => !isSelf && viewArtistProfile(artist as any)} // Only navigate if viewing as visitor
                                                className={`bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl p-4 flex items-center gap-4 transition-all group ${!isSelf ? 'cursor-pointer' : ''}`}
                                            >
                                                <img 
                                                    src={artist.image_url || USER_SILHOUETTE_URL} 
                                                    alt={artist.name} 
                                                    className="w-16 h-16 rounded-full object-cover border-2 border-zinc-600 group-hover:border-orange-500 transition-colors" 
                                                />
                                                <div>
                                                    <h4 className="font-bold text-lg text-zinc-100 group-hover:text-orange-400 transition-colors">{artist.name}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-wide">{meta.status}</span>
                                                        {meta.highlight_metric && <span className="text-xs bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded">{meta.highlight_metric}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800">
                                    <UsersIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No active roster members visible.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabelProfile;
