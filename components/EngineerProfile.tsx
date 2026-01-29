
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
// FIX: Import missing types
import type { Engineer, Review, Artist, Stoodio, Producer, Post } from '../types';
import { UserRole } from '../types';
import { ChevronLeftIcon, UserPlusIcon, UserCheckIcon, MessageIcon, StarIcon, CogIcon, CalendarIcon, LinkIcon, UsersIcon, HouseIcon, SoundWaveIcon, MicrophoneIcon, MusicNoteIcon, PhotoIcon, PlayIcon } from './icons.tsx';
import PostFeed from './PostFeed.tsx';
import VerifiedBadge from './VerifiedBadge';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext.tsx';
import { useNavigation } from '../hooks/useNavigation.ts';
import { useSocial } from '../hooks/useSocial.ts';
import { useMessaging } from '../hooks/useMessaging.ts';
import { useBookings } from '../hooks/useBookings.ts';
import { useMasterclass } from '../hooks/useMasterclass.ts';
import MixingSamplePlayer from './MixingSamplePlayer.tsx';
import MasterclassCard from './MasterclassCard.tsx';
import { fetchUserPosts, fetchFullEngineer } from '../services/apiService';
import { getProfileImageUrl, getDisplayName } from '../constants';

const ProfileCard: React.FC<{
    profile: Stoodio | Engineer | Artist | Producer;
    type: 'stoodio' | 'engineer' | 'artist' | 'producer';
    onClick: () => void;
}> = ({ profile, type, onClick }) => {
    let icon;
    let details;
    if (type === 'stoodio') {
        icon = <HouseIcon className="w-4 h-4" />;
        details = (profile as Stoodio).location;
    } else if (type === 'engineer') {
        icon = <SoundWaveIcon className="w-4 h-4" />;
        details = (profile as Engineer).specialties?.join(', ');
    } else if (type === 'producer') {
        icon = <MusicNoteIcon className="w-4 h-4" />;
        details = (profile as Producer).genres?.join(', ');
    } else { // artist
        icon = <MicrophoneIcon className="w-4 h-4" />;
        details = (profile as Artist).bio;
    }

    return (
        <button onClick={onClick} className="w-full flex items-center gap-3 p-2 text-left cardSurface">
            {/* FIX: Corrected property name from 'imageUrl' to 'image_url' */}
            <img src={getProfileImageUrl(profile)} alt={getDisplayName(profile)} className="w-12 h-12 rounded-md object-cover" />
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm text-slate-200 truncate">{getDisplayName(profile)}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">{icon}{details}</p>
            </div>
        </button>
    );
};


const EngineerProfile: React.FC = () => {
    const { selectedEngineer, currentUser, reviews, artists, engineers, stoodioz, producers } = useAppState();
    const dispatch = useAppDispatch();
    const { goBack, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile } = useNavigation();
    const { toggleFollow, likePost, commentOnPost } = useSocial();
    const { startConversation } = useMessaging(useNavigation().navigate);
    const { initiateBookingWithEngineer } = useBookings(useNavigation().navigate);
    const { openPurchaseMasterclassModal, openWatchMasterclassModal } = useMasterclass();

    const [engineer, setEngineer] = useState<Engineer | null>(selectedEngineer || null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const lastLoadedIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (selectedEngineer) setEngineer(selectedEngineer);
    }, [selectedEngineer]);

    useEffect(() => {
        let isMounted = true;
        const resolveEngineer = async () => {
            const savedId = localStorage.getItem('selected_entity_id');
            const savedType = localStorage.getItem('selected_entity_type');
            const targetId = selectedEngineer?.id || selectedEngineer?.profile_id || (savedType === 'engineer' ? savedId : null);

            if (!targetId) {
                if (isMounted) {
                    setLoadError('No profile selected.');
                    setIsLoadingDetails(false);
                }
                return;
            }

            if (lastLoadedIdRef.current === targetId) return;
            lastLoadedIdRef.current = targetId;

            setIsLoadingDetails(true);
            setLoadError(null);

            try {
                const fullData = await fetchFullEngineer(targetId);
                if (!isMounted) return;
                if (fullData) setEngineer(fullData as Engineer);
                else {
                    setEngineer(null);
                    setLoadError('Profile not found.');
                }
            } catch (e) {
                console.error('Failed to load engineer details', e);
                if (isMounted) {
                    setEngineer(null);
                    setLoadError('Unable to load this profile right now.');
                }
            } finally {
                if (isMounted) setIsLoadingDetails(false);
            }
        };

        resolveEngineer();
        return () => {
            isMounted = false;
        };
    }, [selectedEngineer?.id]);

    useEffect(() => {
        if (!isLoadingDetails) return;
        const t = setTimeout(() => {
            lastLoadedIdRef.current = null;
            setIsLoadingDetails(false);
            setLoadError('Request timed out. Please try again.');
        }, 18_000);
        return () => clearTimeout(t);
    }, [isLoadingDetails]);

    useEffect(() => {
        if (engineer?.id) {
            fetchUserPosts(engineer.id).then(setPosts);
        }
    }, [engineer?.id]);

    const mediaItems = useMemo(() => {
        return posts.filter(p => p.image_url || p.video_url).map(p => ({
            id: p.id,
            url: p.image_url || p.video_thumbnail_url || '',
            type: p.video_url ? 'video' : 'image'
        }));
    }, [posts]);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('12:00');

    // All hooks must be called before any early returns
    const allUsers = useMemo(() => [...artists, ...engineers, ...stoodioz, ...producers], [artists, engineers, stoodioz, producers]);
    const isFollowing = useMemo(() => {
        if (!currentUser || !engineer) return false;
        return (currentUser.following?.engineers || []).includes(engineer.id);
    }, [currentUser, engineer]);
    const engineerReviews = useMemo(() => {
        if (!engineer) return [];
        return (reviews ?? []).filter(r => r.engineer_id === engineer.id);
    }, [reviews, engineer]);
    const followers = useMemo(() => {
        if (!engineer) return [];
        return allUsers.filter(u => (engineer.follower_ids || []).includes(u.id));
    }, [allUsers, engineer]);

    const followedArtists = useMemo(() => {
        if (!engineer) return [];
        return artists.filter(a => (engineer.following?.artists || []).includes(a.id));
    }, [artists, engineer]);
    const followedEngineers = useMemo(() => {
        if (!engineer) return [];
        return engineers.filter(e => (engineer.following?.engineers || []).includes(e.id));
    }, [engineers, engineer]);
    const followedStoodioz = useMemo(() => {
        if (!engineer) return [];
        return stoodioz.filter(s => (engineer.following?.stoodioz || []).includes(s.id));
    }, [stoodioz, engineer]);
    const followedProducers = useMemo(() => {
        if (!engineer) return [];
        return producers.filter(p => (engineer.following?.producers || []).includes(p.id));
    }, [producers, engineer]);
    const followingCount = useMemo(() => {
        return followedArtists.length + followedEngineers.length + followedStoodioz.length + followedProducers.length;
    }, [followedArtists, followedEngineers, followedStoodioz, followedProducers]);

    const handleBookClick = useCallback(() => {
        if (engineer) {
            initiateBookingWithEngineer(engineer, date, time);
        }
    }, [engineer, date, time, initiateBookingWithEngineer]);

    const onOpenMixingModal = useCallback(() => {
        dispatch({ type: ActionTypes.SET_MIXING_MODAL_OPEN, payload: { isOpen: true } });
    }, [dispatch]);

    const canRequestMix = useMemo(() => {
        return engineer?.mixing_services?.is_enabled && currentUser && currentUser.id !== engineer?.id;
    }, [engineer, currentUser]);


    return (
        <div className="max-w-7xl mx-auto pb-32 animate-fade-in">
            <button onClick={goBack} className="absolute top-10 left-10 z-20 flex items-center gap-3 text-zinc-400 hover:text-orange-400 transition-all font-black uppercase tracking-[0.25em] text-[10px] mb-6">
                <ChevronLeftIcon className="w-4 h-4" /> System Back
            </button>
            
            {/* Cover Section with Aria-style Profile Photo Layout */}
            <div
                className="relative min-h-[50dvh] rounded-[40px] overflow-hidden border border-white/5 mb-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                style={{ 
                    backgroundImage: `url(${(engineer as any).cover_image_url || 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=1200&auto=format&fit=crop'})`, 
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
                                src={getProfileImageUrl(engineer)} 
                                alt={getDisplayName(engineer)} 
                                className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-[8px] border-zinc-950 shadow-[0_0_60px_rgba(0,0,0,0.8)]" 
                            />
                            {/* Sound wave badge in bottom-right corner (like Aria's magic wand) */}
                            <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-2xl shadow-2xl ring-4 ring-zinc-950">
                                <SoundWaveIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4" style={{ textShadow: '0 0 30px rgba(249,115,22,0.5)' }}>
                        {getDisplayName(engineer, 'Engineer')}
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-orange-400 bg-orange-500/10 px-6 py-2 rounded-full border border-orange-500/20 backdrop-blur-md">
                            Engineer
                        </span>
                        {(engineer as any).label_verified && <VerifiedBadge labelVerified={true} />}
                        <div className="flex items-center gap-1 text-yellow-400">
                            <StarIcon className="w-5 h-5" />
                            <span className="font-bold text-white">{(engineer.rating_overall ?? 0).toFixed(1)}</span>
                            <span className="text-zinc-300 text-sm">({engineerReviews.length} reviews)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons Section */}
            <div className="flex justify-center mb-12 px-4">
                {currentUser && currentUser.id !== engineer.id && (
                    <div className="flex flex-col sm:flex-row gap-3">
                        {canRequestMix && (
                            <button onClick={onOpenMixingModal} className="px-6 py-3 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all font-bold flex items-center gap-2 shadow-xl">
                                <SoundWaveIcon className="w-5 h-5"/> Request Mix
                            </button>
                        )}
                        <button 
                            onClick={() => currentUser && startConversation(engineer)}
                            disabled={!currentUser || currentUser.id === engineer.id}
                            className="px-6 py-3 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-all font-bold flex items-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <MessageIcon className="w-5 h-5" />
                            Message
                        </button>
                        <button 
                            onClick={() => currentUser && toggleFollow('engineer', engineer.id)}
                            disabled={!currentUser || currentUser.id === engineer.id}
                            className={`px-6 py-3 rounded-xl font-bold transition-all shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isFollowing ? 'bg-orange-500 text-white' : 'bg-white text-black hover:bg-orange-500 hover:text-white'}`}
                        >
                            {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>
                )}
            </div>

            {/* Bio and Specialties Section */}
            <div className="cardSurface p-8 mb-8">
                {engineer.bio && (
                    <p className="text-zinc-300 leading-relaxed mb-6 text-center">{engineer.bio}</p>
                )}
                <div className="border-t border-zinc-700 pt-6">
                    <h3 className="text-xl font-bold mb-4 text-orange-400 flex items-center gap-2 justify-center"><CogIcon className="w-6 h-6"/>Specialties</h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {(engineer.specialties || []).map(spec => (
                            <span key={spec} className="bg-zinc-800 text-zinc-200 text-sm font-medium px-4 py-2 rounded-full border border-zinc-700">
                                {spec}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Masterclass Section */}
            {engineer.masterclass?.is_enabled && (
                    <MasterclassCard 
                        masterclass={engineer.masterclass}
                        owner={engineer}
                        onPurchase={openPurchaseMasterclassModal}
                        onWatch={openWatchMasterclassModal}
                    />
                )}
                
                <div>
                    {/* FIX: Corrected property name from 'mixingSamples' to 'mixing_samples' */}
                    <MixingSamplePlayer 
                        mixingSamples={engineer.mixing_samples || []} 
                        engineerId={engineer.id}
                    />
                </div>

                 {/* Recent Media Gallery */}
                 {mediaItems.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold mb-4 text-slate-100 flex items-center gap-2">
                            <PhotoIcon className="w-6 h-6 text-orange-400" /> Recent Media
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {mediaItems.slice(0, 8).map(item => (
                                <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 group cursor-pointer">
                                    <img src={item.url} alt="Media" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    {item.type === 'video' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                                            <PlayIcon className="w-8 h-8 text-white drop-shadow-lg" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                 <div className="p-8 cardSurface">
                    <h3 className="text-2xl font-bold mb-4 text-slate-100 flex items-center gap-2"><CalendarIcon className="w-6 h-6"/>Book an In-Studio Session</h3>
                    <div className="grid sm:grid-cols-3 gap-4 items-end">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full bg-zinc-700 border-zinc-600 rounded-lg p-2.5 text-white" />
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-sm font-medium text-slate-400 mb-1">Time</label>
                             <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-zinc-700 border-zinc-600 rounded-lg p-2.5 text-white" />
                        </div>
                        <button onClick={handleBookClick} disabled={!currentUser} className="w-full sm:col-span-1 bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-all disabled:bg-slate-500 disabled:cursor-not-allowed shadow-lg">
                            Find a Stoodio
                        </button>
                    </div>
                </div>

                 {engineer.links && engineer.links.length > 0 && (
                    <div>
                        <h3 className="text-2xl font-bold mb-4 text-slate-100 flex items-center gap-2"><LinkIcon className="w-6 h-6" /> Links</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {engineer.links.map(link => (
                                <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.url} className="p-3 transition-colors flex items-center gap-3 cardSurface">
                                    <LinkIcon className="w-5 h-5 text-slate-400 flex-shrink-0"/>
                                    <div className="overflow-hidden">
                                        <p className="font-semibold text-sm text-slate-200 truncate">{link.title}</p>
                                        <p className="text-xs text-slate-400 truncate">{link.url}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-100 flex items-center gap-2"><UsersIcon className="w-6 h-6" /> Followers ({followers.length})</h3>
                    {followers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {followers.map(f => {
                                const type = 'amenities' in f ? 'stoodio' : 'specialties' in f ? 'engineer' : 'instrumentals' in f ? 'producer' : 'artist';
                                const onClick = () => {
                                    if (type === 'artist') viewArtistProfile(f as Artist);
                                    else if (type === 'engineer') viewEngineerProfile(f as Engineer);
                                    else if (type === 'stoodio') viewStoodioDetails(f as Stoodio);
                                    else if (type === 'producer') viewProducerProfile(f as Producer);
                                };
                                return <ProfileCard key={f.id} profile={f} type={type} onClick={onClick} />;
                            })}
                        </div>
                    ) : <p className="text-slate-400">No followers yet.</p>}
                </div>

                <div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-100 flex items-center gap-2"><UserCheckIcon className="w-6 h-6" /> Following ({followingCount})</h3>
                    {followingCount > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {followedArtists.map(p => <ProfileCard key={p.id} profile={p} type="artist" onClick={() => viewArtistProfile(p)} />)}
                            {followedEngineers.map(p => <ProfileCard key={p.id} profile={p} type="engineer" onClick={() => viewEngineerProfile(p)} />)}
                            {followedStoodioz.map(p => <ProfileCard key={p.id} profile={p} type="stoodio" onClick={() => viewStoodioDetails(p)} />)}
                            {followedProducers.map(p => <ProfileCard key={p.id} profile={p} type="producer" onClick={() => viewProducerProfile(p)} />)}
                        </div>
                    ) : <p className="text-slate-400">Not following anyone yet.</p>}
                </div>
                
                <div>
                     <h3 className="text-2xl font-bold mb-4 text-slate-100">Posts</h3>
                     <PostFeed 
                        posts={posts}
                        authors={new Map([[engineer.id, engineer]])}
                        onLikePost={likePost}
                        onCommentOnPost={commentOnPost}
                        onSelectAuthor={() => viewEngineerProfile(engineer)}
                     />
                </div>
        </div>
    );
};

export default EngineerProfile;
