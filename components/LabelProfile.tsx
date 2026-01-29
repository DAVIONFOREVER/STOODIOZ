
import React, { useState, useEffect } from 'react';
import { useAppState } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useMessaging } from '../hooks/useMessaging';
import { useSocial } from '../hooks/useSocial';
import * as apiService from '../services/apiService';
import { ChevronLeftIcon, PhotoIcon, LinkIcon, UsersIcon, UserPlusIcon, UserCheckIcon, MessageIcon, ChartBarIcon, MapIcon, MusicNoteIcon, DollarSignIcon, VerifiedIcon } from './icons';
import type { Label, RosterMember } from '../types';
import { getProfileImageUrl } from '../constants';
import appIcon from '../assets/stoodioz-app-icon.png';

const LabelProfile: React.FC = () => {
    const { selectedLabel, currentUser } = useAppState();
    const { goBack, viewArtistProfile } = useNavigation();
    const { startConversation } = useMessaging(useNavigation().navigate);
    const { toggleFollow } = useSocial();
    
    // Determine which label to show: selectedLabel (if viewing others) or currentUser (if viewing self as label)
    const label = (currentUser?.role === 'LABEL' && !selectedLabel) 
        ? (currentUser as Label) 
        : selectedLabel;
    const labelId = label?.id || (label as any)?.profile_id;

    const [roster, setRoster] = useState<RosterMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isOnRoster, setIsOnRoster] = useState(false);

    useEffect(() => {
        if (!label || !labelId) return;
        
        // Check following status
        if (currentUser && (currentUser.following?.labels || []).includes(labelId)) {
            setIsFollowing(true);
        } else if (currentUser) {
            setIsFollowing(false);
        }

        const fetchRoster = async () => {
            setLoading(true);
            try {
                const data = await apiService.fetchLabelRoster(labelId);
                // Only show public/claimed members on public profile usually, or all if viewing self
                setRoster(data.filter(m => !m.is_pending && !m.shadow_profile));
                
                // Check if current user is on the roster
                if (currentUser?.id) {
                    const userOnRoster = data.some(m => 
                        m.id === currentUser.id || 
                        (m as any).user_id === currentUser.id || 
                        (m as any).artist_profile_id === currentUser.id
                    );
                    setIsOnRoster(userOnRoster);
                }
            } catch (error) {
                console.error("Error fetching roster:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRoster();
    }, [label, labelId, currentUser]);

    if (!label) return (
        <div className="p-20 text-center text-zinc-500">
            <p>Label profile not found.</p>
            <button onClick={goBack} className="mt-4 text-orange-400 hover:underline">Go Back</button>
        </div>
    );

    const isSelf = currentUser?.id === label.id;
    const visibility = label.section_visibility || {
        mission: true, roster: true, metrics: false, services: true, partnerships: true, opportunities: true
    };
    const hasMetrics =
        !!label.public_metrics &&
        Object.values(label.public_metrics).some((v) => typeof v === 'number' && v > 0);
    
    // Visibility check: Only show if:
    // 1. User is viewing their own label profile, OR
    // 2. User is on the label's roster, OR
    // 3. Label has public profile enabled
    const canView = isSelf || isOnRoster || label.is_public_profile_enabled;
    
    if (!canView) {
        return (
            <div className="p-20 text-center cardSurface">
                <h2 className="text-2xl font-bold text-zinc-100">Private Profile</h2>
                <p className="text-zinc-500 mt-2">This label's profile is currently private. Only roster members can view this profile.</p>
                <button onClick={goBack} className="mt-6 text-orange-400 font-bold hover:underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-32 animate-fade-in">
            <button onClick={goBack} className="absolute top-10 left-10 z-20 flex items-center gap-3 text-zinc-400 hover:text-orange-400 transition-all font-black uppercase tracking-[0.25em] text-[10px] mb-6">
                <ChevronLeftIcon className="w-4 h-4" /> System Back
            </button>

            {/* Cover Section with Aria-style Profile Photo Layout */}
            <div
                className="relative min-h-[50dvh] rounded-[40px] overflow-hidden border border-white/5 mb-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                style={{ 
                    backgroundImage: `url(${label.cover_image_url || 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=1200&auto=format&fit=crop'})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center' 
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                <div className="absolute inset-0 bg-black/30"></div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
                    <div className="relative mb-8">
                        {/* Glowing background effect like Aria */}
                        <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-[80px] animate-pulse"></div>
                        {/* Floating profile photo with Aria-style effects */}
                        <div className="relative animate-aria-float">
                            <img 
                                src={getProfileImageUrl(label)} 
                                alt={label.name} 
                                className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-[8px] border-zinc-950 shadow-[0_0_60px_rgba(0,0,0,0.8)]" 
                            />
                            {/* Label badge in bottom-right corner (like Aria's magic wand) */}
                            <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-orange-500 to-purple-600 p-3 rounded-2xl shadow-2xl ring-4 ring-zinc-950">
                                <MusicNoteIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4" style={{ textShadow: '0 0 30px rgba(249,115,22,0.5)' }}>
                        {label.name}
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-orange-400 bg-orange-500/10 px-6 py-2 rounded-full border border-orange-500/20 backdrop-blur-md">
                            Record Label
                        </span>
                        {(label as any).label_verified && <VerifiedIcon className="w-6 h-6 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" />}
                        {label.parent_company && (
                            <span className="text-xs text-zinc-300">part of <strong>{label.parent_company}</strong></span>
                        )}
                        {label.years_active && (
                            <span className="text-xs text-zinc-300">Est. {new Date().getFullYear() - label.years_active}</span>
                        )}
                    </div>
                    {label.primary_genres && label.primary_genres.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {label.primary_genres.map(g => (
                                <span key={g} className="text-xs font-bold px-3 py-1 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/20">
                                    {g}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons Section */}
            <div className="flex justify-center mb-12 px-4">
                {!isSelf && (
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={() => toggleFollow('label', labelId)}
                            className={`px-6 py-3 rounded-xl font-bold transition-all shadow-xl flex items-center gap-2 ${isFollowing ? 'bg-purple-500 text-white' : 'bg-white text-black hover:bg-purple-500 hover:text-white'}`}
                        >
                            {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                        <button 
                            onClick={() => startConversation(label)}
                            className="px-6 py-3 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-all font-bold flex items-center gap-2 shadow-xl"
                        >
                            <MessageIcon className="w-5 h-5" />
                            Message
                        </button>
                    </div>
                )}
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
                    {visibility.metrics && hasMetrics && label.public_metrics && (
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

                     {/* Paid Submissions Section */}
                     {label.opportunities?.accepting_demos && (
                        <div className="aria-glass rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all duration-500">
                                <DollarSignIcon className="w-12 h-12 text-green-400" />
                            </div>
                            <div className="mb-4 flex items-center gap-2 relative z-10">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Paid Submissions</h3>
                            </div>
                            <div className="relative z-10">
                                <p className="text-slate-300 mb-4 leading-relaxed">
                                    {label.mission_statement || 'We accept paid demo submissions from artists looking to join our roster.'}
                                </p>
                                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/20 border border-white/5">
                                    <div>
                                        <p className="text-sm text-zinc-400 mb-1">Submission Fee</p>
                                        <p className="text-2xl font-black text-green-400">
                                            ${Number((label as any).submission_fee || 0).toFixed(2)}
                                            {Number((label as any).submission_fee || 0) === 0 && (
                                                <span className="text-sm text-zinc-400 ml-2">(Free)</span>
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!currentUser) {
                                                alert('Please log in to submit a demo');
                                                return;
                                            }
                                            // TODO: Implement demo submission flow
                                            alert('Demo submission feature coming soon!');
                                        }}
                                        className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-sm hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Submit Demo
                                    </button>
                                </div>
                                {(label as any).submission_guidelines && (
                                    <div className="mt-4 p-4 rounded-lg bg-zinc-900/30 border border-zinc-800">
                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Submission Guidelines</p>
                                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">{(label as any).submission_guidelines}</p>
                                    </div>
                                )}
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
                                <div className="py-12 flex justify-center"><img src={appIcon} alt="Loading" className="h-8 w-8 animate-spin" /></div>
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
                                                    src={getProfileImageUrl(artist)} 
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
