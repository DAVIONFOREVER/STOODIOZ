
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Stoodio, Artist, Engineer, Post, Room, Producer } from '../types';
import { UserRole, VerificationStatus, SmokingPolicy } from '../types';
import Calendar from './Calendar';
import PostFeed from './PostFeed';
import { ChevronLeftIcon, ChevronRightIcon, PhotoIcon, UserPlusIcon, UserCheckIcon, StarIcon, UsersIcon, MessageIcon, HouseIcon, SoundWaveIcon, MicrophoneIcon, VerifiedIcon, MusicNoteIcon, SmokingIcon, NoSmokingIcon, PlayIcon } from './icons';
import { useAppState } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useBookings } from '../hooks/useBookings';
import { useSocial } from '../hooks/useSocial';
import { useMessaging } from '../hooks/useMessaging';
import { AppView } from '../types';
import { fetchUserPosts, fetchFullStoodio, fetchReviewsForTarget } from '../services/apiService';
import { getProfileImageUrl, getDisplayName } from '../constants';
import appIcon from '../assets/stoodioz-app-icon.png';

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
        <button onClick={onClick} className="w-full flex items-center gap-3 p-2 rounded-lg text-left cardSurface">
            <img src={getProfileImageUrl(profile)} alt={getDisplayName(profile)} className="w-12 h-12 rounded-md object-cover" />
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm text-slate-200 truncate">{getDisplayName(profile)}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">{icon}{details}</p>
            </div>
        </button>
    );
};


const StoodioDetail: React.FC = () => {
    const { selectedStoodio, bookings, artists, engineers, stoodioz, producers, currentUser, userRole } = useAppState();
    
    const { goBack, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile, navigate, openReviewPage } = useNavigation();
    const { openBookingModal } = useBookings(navigate);
    const { toggleFollow, likePost, commentOnPost } = useSocial();
    const { startConversation } = useMessaging(navigate);
    
    const [stoodio, setStoodio] = useState<Stoodio | null>(selectedStoodio || null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [profileReviews, setProfileReviews] = useState<any[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const lastLoadedIdRef = useRef<string | null>(null);
    const galleryScrollRef = useRef<HTMLDivElement | null>(null);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [isGalleryPaused, setIsGalleryPaused] = useState(false);

    const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string, time: string } | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(stoodio?.rooms?.[0] || null);

    useEffect(() => {
        if (selectedStoodio) setStoodio(selectedStoodio);
    }, [selectedStoodio]);

    const readCachedStoodio = useCallback((id: string) => {
        try {
            const raw = localStorage.getItem(`stoodio_cache_${id}`);
            return raw ? (JSON.parse(raw) as Stoodio) : null;
        } catch {
            return null;
        }
    }, []);

    const writeCachedStoodio = useCallback((data: Stoodio) => {
        try {
            if (!data?.id) return;
            localStorage.setItem(`stoodio_cache_${data.id}`, JSON.stringify(data));
        } catch {
            // ignore storage failures
        }
    }, []);

    useEffect(() => {
        if (stoodio?.rooms?.length) {
            setSelectedRoom((prev) => prev || stoodio.rooms[0]);
        }
    }, [stoodio?.rooms]);

    useEffect(() => {
        let isMounted = true;
        const resolveStoodio = async () => {
            const isUuid = (value: string | null | undefined) =>
                typeof value === 'string' &&
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
            const savedId = localStorage.getItem('selected_entity_id');
            const savedType = localStorage.getItem('selected_entity_type');
            let targetId = selectedStoodio?.profile_id || (savedType === 'stoodio' ? savedId : null);
            if (!targetId && isUuid(selectedStoodio?.id)) {
                targetId = selectedStoodio?.id as string;
            }

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

            const cached = readCachedStoodio(targetId);
            if (cached && !stoodio) {
                setStoodio(cached);
            }

            try {
                const fullData = await fetchFullStoodio(targetId);
                if (!isMounted) return;
                if (fullData) {
                    setStoodio(fullData as Stoodio);
                    writeCachedStoodio(fullData as Stoodio);
                } else {
                    setStoodio(null);
                    setLoadError('Profile not found.');
                }
            } catch (e) {
                console.error('Failed to load stoodio details', e);
                if (!isMounted) return;
                // Fallback to cached directory data so the UI still renders
                const fallback = stoodioz.find((s) => s.id === targetId || s.profile_id === targetId) || selectedStoodio || null;
                if (fallback) {
                    setStoodio(fallback as Stoodio);
                    setLoadError('Live data timed out. Showing cached profile.');
                } else {
                    const cachedFallback = readCachedStoodio(targetId);
                    if (cachedFallback) {
                        setStoodio(cachedFallback);
                        setLoadError('Live data timed out. Showing cached profile.');
                    } else {
                        setStoodio(null);
                        setLoadError('Unable to load this profile right now.');
                    }
                }
            } finally {
                if (isMounted) setIsLoadingDetails(false);
            }
        };

        resolveStoodio();
        return () => {
            isMounted = false;
        };
    }, [selectedStoodio?.id, selectedStoodio?.profile_id]);

    useEffect(() => {
        if (!isLoadingDetails) return;
        const t = setTimeout(() => {
            lastLoadedIdRef.current = null;
            setIsLoadingDetails(false);
            setLoadError('Request timed out. Please try again.');
        }, 45_000);
        return () => clearTimeout(t);
    }, [isLoadingDetails]);

    useEffect(() => {
        let isMounted = true;
        const loadPosts = async () => {
            if (!stoodio?.id) return;
            try {
                const primary = await fetchUserPosts(stoodio.id);
                if (!isMounted) return;
                const roleId = (stoodio as any)?.role_id;
                if (primary.length === 0 && roleId && String(roleId) !== String(stoodio.id)) {
                    const fallback = await fetchUserPosts(String(roleId));
                    if (!isMounted) return;
                    setPosts(Array.isArray(fallback) ? fallback : []);
                } else {
                    setPosts(Array.isArray(primary) ? primary : []);
                }
            } catch (err) {
                console.error('Failed to load stoodio posts', err);
                if (isMounted) setPosts([]);
            }
        };
        loadPosts();
        return () => {
            isMounted = false;
        };
    }, [stoodio?.id, (stoodio as any)?.role_id]);

    useEffect(() => {
        let isMounted = true;
        const loadReviews = async () => {
            if (!stoodio?.id) return;
            try {
                const primary = await fetchReviewsForTarget(UserRole.STOODIO, stoodio.id);
                if (!isMounted) return;
                const roleId = (stoodio as any)?.role_id;
                if (primary.length === 0 && roleId && String(roleId) !== String(stoodio.id)) {
                    const fallback = await fetchReviewsForTarget(UserRole.STOODIO, String(roleId));
                    if (!isMounted) return;
                    setProfileReviews(Array.isArray(fallback) ? fallback : []);
                } else {
                    setProfileReviews(Array.isArray(primary) ? primary : []);
                }
            } catch (err) {
                console.error('Failed to load stoodio reviews', err);
                if (isMounted) setProfileReviews([]);
            }
        };
        loadReviews();
        return () => {
            isMounted = false;
        };
    }, [stoodio?.id, (stoodio as any)?.role_id]);

    const galleryImages = useMemo(() => {
        if (!stoodio) return [];
        const staticPhotos = (stoodio.photos || []).map((url, i) => ({ id: `static-${i}`, url, type: 'image' }));
        const postMedia = posts.filter(p => p.image_url || p.video_url).map(p => ({
            id: p.id,
            url: p.image_url || p.video_thumbnail_url || '',
            type: p.video_url ? 'video' : 'image'
        }));
        return [...staticPhotos, ...postMedia];
    }, [stoodio?.photos, posts]);

    const galleryCount = galleryImages.length;

    const getGalleryMetrics = useCallback(() => {
        const el = galleryScrollRef.current;
        if (!el) return null;
        const first = el.querySelector('[data-gallery-item]') as HTMLElement | null;
        if (!first) return null;
        const gap = parseFloat(getComputedStyle(el).columnGap || '16') || 16;
        return { itemWidth: first.getBoundingClientRect().width, gap };
    }, []);

    const scrollGalleryToIndex = useCallback((index: number) => {
        const el = galleryScrollRef.current;
        const metrics = getGalleryMetrics();
        if (!el || !metrics) return;
        const nextIndex = Math.max(0, Math.min(index, galleryCount - 1));
        const offset = (metrics.itemWidth + metrics.gap) * nextIndex;
        el.scrollTo({ left: offset, behavior: 'smooth' });
        setGalleryIndex(nextIndex);
    }, [galleryCount, getGalleryMetrics]);

    const scrollGalleryBy = useCallback((direction: -1 | 1) => {
        scrollGalleryToIndex(galleryIndex + direction);
    }, [galleryIndex, scrollGalleryToIndex]);

    const handleGalleryScroll = useCallback(() => {
        const el = galleryScrollRef.current;
        const metrics = getGalleryMetrics();
        if (!el || !metrics) return;
        const index = Math.round(el.scrollLeft / (metrics.itemWidth + metrics.gap));
        const clamped = Math.max(0, Math.min(index, galleryCount - 1));
        if (clamped !== galleryIndex) {
            setGalleryIndex(clamped);
        }
    }, [galleryCount, galleryIndex, getGalleryMetrics]);

    useEffect(() => {
        if (galleryCount <= 1 || isGalleryPaused) return;
        const t = setInterval(() => {
            const next = (galleryIndex + 1) % galleryCount;
            scrollGalleryToIndex(next);
        }, 5000);
        return () => clearInterval(t);
    }, [galleryCount, galleryIndex, isGalleryPaused, scrollGalleryToIndex]);

    const allUsers = useMemo(
        () => [...(artists ?? []), ...(engineers ?? []), ...(stoodioz ?? []), ...(producers ?? [])],
        [artists, engineers, stoodioz, producers]
    );
    const followers = useMemo(
        () => (!stoodio ? [] : allUsers.filter(u => (stoodio.follower_ids || []).includes(u.id))),
        [allUsers, stoodio?.follower_ids, stoodio]
    );
    
    if (isLoadingDetails) {
         return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <img src={appIcon} alt="Loading" className="h-10 w-10 animate-spin" />
                <p className="text-zinc-500 font-medium">Loading profile...</p>
            </div>
        );
    }

    if (!stoodio) {
         return (
            <div className="text-center text-zinc-400 space-y-3">
                <p>{loadError || 'Stoodio not found.'}</p>
                <p className="text-xs text-zinc-500 mt-2">If this should exist, check Supabase RLS policies.</p>
                <button onClick={goBack} className="mt-4 text-orange-400">Go Back</button>
            </div>
        );
    }

    const isFollowing = currentUser && currentUser.following && currentUser.following.stoodioz ? currentUser.following.stoodioz.includes(stoodio.id) : false;

    const stoodioReviews = (profileReviews ?? []).filter((r) => r.stoodio_id === stoodio.id);

    const curArtists = artists ?? [];
    const curEngineers = engineers ?? [];
    const curStoodioz = stoodioz ?? [];
    const curProducers = producers ?? [];

    const hostedArtists = Array.from(new Set(bookings.filter(b => b.stoodio?.id === stoodio.id && b.artist).map(b => b.artist!.id)))
        .map(id => curArtists.find(a => a.id === id))
        .filter((artist): artist is Artist => artist !== undefined)
        .slice(0, 5);

    const followedArtists = curArtists.filter(a => (stoodio.following?.artists || []).includes(a.id));
    const followedEngineers = curEngineers.filter(e => (stoodio.following?.engineers || []).includes(e.id));
    const followedStoodioz = curStoodioz.filter(s => (stoodio.following?.stoodioz || []).includes(s.id));
    const followedProducers = curProducers.filter(p => (stoodio.following?.producers || []).includes(p.id));

    const handleSelectTimeSlot = (date: string, time: string) => {
        if (selectedTimeSlot?.date === date && selectedTimeSlot?.time === time) {
             setSelectedTimeSlot(null); // Deselect if clicking the same slot
        } else {
            setSelectedTimeSlot({ date, time });
        }
    };
    
    const handleGuestInteraction = () => navigate(AppView.LOGIN);

    const onBook = (date: string, time: string, room: Room) => {
        if (currentUser) {
            openBookingModal(date, time, room);
        } else {
            handleGuestInteraction();
        }
    }

    const isBookingDisabled = !selectedTimeSlot || !selectedRoom || !currentUser || (userRole === UserRole.STOODIO && currentUser.id === stoodio.id);

    const getButtonText = (mobile: boolean = false) => {
        if (!currentUser) return 'Login to Book';
        if (userRole === UserRole.STOODIO && currentUser.id === stoodio.id) return 'Cannot Book Your Own Stoodio';
        if (!selectedRoom) return 'Select a Room';
        if (!selectedTimeSlot) return 'Select a Time Slot';
        return mobile ? `Book for ${selectedTimeSlot.time}` : `Book ${selectedRoom.name}: ${selectedTimeSlot.time}`;
    };
    
    return (
        <div className="max-w-7xl mx-auto pb-32 animate-fade-in px-3 sm:px-4">
            <button onClick={goBack} className="absolute top-4 left-4 sm:top-10 sm:left-10 z-20 flex items-center gap-2 sm:gap-3 text-zinc-400 hover:text-orange-400 transition-all font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[10px]">
                <ChevronLeftIcon className="w-4 h-4 flex-shrink-0" /> <span className="hidden xs:inline">System </span>Back
            </button>
            
            {/* Cover Section: responsive for portrait mobile */}
            <div
                className="relative min-h-[40dvh] sm:min-h-[50dvh] rounded-2xl sm:rounded-[40px] overflow-hidden border border-white/5 mb-8 sm:mb-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                style={{ 
                    backgroundImage: `url(${(stoodio as any).cover_image_url || stoodio.photos?.[0] || 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=1200&auto=format&fit=crop'})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center' 
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                <div className="absolute inset-0 bg-black/30"></div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 sm:p-6 md:p-8 z-10">
                    <div className="relative mb-4 sm:mb-6 md:mb-8">
                        <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-[80px] animate-pulse"></div>
                        <div className="relative animate-aria-float">
                            <img 
                                src={getProfileImageUrl(stoodio)} 
                                alt={stoodio.name} 
                                className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full object-cover border-4 sm:border-[6px] md:border-[8px] border-zinc-950 shadow-[0_0_60px_rgba(0,0,0,0.8)]" 
                            />
                            <div className="absolute -bottom-1 -right-1 sm:-bottom-3 sm:-right-3 bg-gradient-to-br from-orange-500 to-amber-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-2xl ring-2 sm:ring-4 ring-zinc-950">
                                <HouseIcon className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-black text-white tracking-tighter mb-2 sm:mb-4 break-words max-w-full px-1" style={{ textShadow: '0 0 30px rgba(249,115,22,0.5)' }}>
                        {stoodio.name}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-orange-400 bg-orange-500/10 px-3 py-1.5 sm:px-6 sm:py-2 rounded-full border border-orange-500/20 backdrop-blur-md whitespace-nowrap">
                            Stoodio
                        </span>
                        {stoodio.verification_status === VerificationStatus.VERIFIED && (
                            <VerifiedIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)] flex-shrink-0" />
                        )}
                        <span className="text-xs text-zinc-300 truncate max-w-[50%] sm:max-w-none">{stoodio.location}</span>
                        <span className="text-xs text-zinc-300 whitespace-nowrap">{(stoodio.followers || 0).toLocaleString()} followers</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons Section */}
            <div className="flex flex-wrap justify-center gap-3 mb-8 sm:mb-12">
                {currentUser && currentUser.id !== stoodio.id && (
                    <div className="flex flex-wrap justify-center gap-3">
                        <button 
                            onClick={() => currentUser ? startConversation(stoodio) : handleGuestInteraction()}
                            disabled={!currentUser || currentUser.id === stoodio.id}
                            className="px-6 py-3 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-all font-bold flex items-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <MessageIcon className="w-5 h-5" />
                            Message
                        </button>
                        <button 
                            onClick={() => currentUser ? toggleFollow('stoodio', stoodio.id) : handleGuestInteraction()}
                            disabled={!currentUser || currentUser.id === stoodio.id}
                            className={`px-6 py-3 rounded-xl font-bold transition-all shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isFollowing ? 'bg-orange-500 text-white' : 'bg-white text-black hover:bg-orange-500 hover:text-white'}`}
                        >
                            {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>
                )}
                {(!currentUser || currentUser.id !== stoodio.id) && (
                    <div className="mt-4">
                        <button
                            onClick={() => openReviewPage({ id: stoodio.id, role: UserRole.STOODIO, name: stoodio.name, image_url: getProfileImageUrl(stoodio) })}
                            className="px-6 py-3 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 transition-all font-bold flex items-center gap-2 shadow-xl"
                        >
                            Reviews
                        </button>
                    </div>
                )}
            </div>

            {/* Description Section */}
            {stoodio.description && (
                <div className="cardSurface p-4 sm:p-6 md:p-8 mb-8">
                    <p className="text-zinc-300 leading-relaxed text-center break-words">{stoodio.description}</p>
                </div>
            )}

            {/* Media Gallery (Top Scroll) */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-orange-400 flex items-center gap-2">
                        <PhotoIcon className="w-6 h-6" /> Media Gallery
                    </h3>
                    <span className="text-xs uppercase tracking-[0.35em] text-zinc-500">Swipe</span>
                </div>
                <div
                    className="relative"
                    onMouseEnter={() => setIsGalleryPaused(true)}
                    onMouseLeave={() => setIsGalleryPaused(false)}
                >
                    {galleryCount > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={() => scrollGalleryBy(-1)}
                                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-700/60 bg-zinc-900/80 p-2 text-zinc-200 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-orange-400/60 hover:text-orange-300"
                                aria-label="Scroll gallery left"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollGalleryBy(1)}
                                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-700/60 bg-zinc-900/80 p-2 text-zinc-200 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-orange-400/60 hover:text-orange-300"
                                aria-label="Scroll gallery right"
                            >
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </>
                    )}
                    <div
                        ref={galleryScrollRef}
                        onScroll={handleGalleryScroll}
                        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-zinc-700/70 scrollbar-track-transparent"
                    >
                        {galleryImages.map((item, index) => (
                            <div
                                key={item.id || index}
                                data-gallery-item
                                className="relative snap-start min-w-[240px] sm:min-w-[280px] lg:min-w-[320px] aspect-video rounded-2xl overflow-hidden bg-zinc-900/70 border border-zinc-700/70 shadow-[0_0_20px_rgba(249,115,22,0.12)]"
                            >
                                <img src={item.url} alt="Gallery" className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                                {item.type === 'video' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                        <PlayIcon className="w-10 h-10 text-white drop-shadow-lg" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {galleryImages.length === 0 && (
                            <div className="text-zinc-500 w-full text-center py-10">No media to display.</div>
                        )}
                    </div>
                </div>
                {galleryCount > 1 && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                        {galleryImages.map((_, index) => (
                            <button
                                key={`dot-${index}`}
                                type="button"
                                onClick={() => scrollGalleryToIndex(index)}
                                className={`h-1.5 rounded-full transition-all ${
                                    index === galleryIndex ? 'w-8 bg-orange-400' : 'w-3 bg-zinc-700 hover:bg-zinc-500'
                                }`}
                                aria-label={`Go to gallery item ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                {/* Left Column: Stoodio Info */}
                <div className="lg:col-span-3">
                    
                    <div className="flex gap-10">
                        <div>
                            <h3 className="text-2xl font-bold mb-4 text-orange-400">Amenities</h3>
                            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-slate-200 mb-10">
                                {(stoodio.amenities || []).map(amenity => (
                                    <li key={amenity} className="flex items-center">
                                        <svg className="w-5 h-5 mr-3 text-orange-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                        {amenity}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {selectedRoom && (
                            <div>
                                <h3 className="text-2xl font-bold mb-4 text-orange-400">Policies for {selectedRoom.name}</h3>
                                <ul className="grid grid-cols-1 gap-y-3 text-slate-200 mb-10">
                                    <li className="flex items-center">
                                        {(selectedRoom.smoking_policy === SmokingPolicy.SMOKING_ALLOWED)
                                            ? <SmokingIcon className="w-5 h-5 mr-3 text-green-400" />
                                            : <NoSmokingIcon className="w-5 h-5 mr-3 text-red-400" />
                                        }
                                        {(selectedRoom.smoking_policy === SmokingPolicy.SMOKING_ALLOWED) ? 'Smoking Allowed' : 'Non-Smoking'}
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Rooms & Spaces - permanently displayed on profile; also used for booking */}
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold mb-4 text-orange-400 flex items-center gap-2"><HouseIcon className="w-6 h-6" /> Rooms & Spaces</h3>
                        {(stoodio.rooms || []).length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(stoodio.rooms || []).map(room => (
                                    <div key={room.id} className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                                        {room.photos?.[0] ? (
                                            <img src={room.photos[0]} alt={room.name} className="w-full h-32 object-cover rounded-lg mb-2" />
                                        ) : (
                                            <div className="w-full h-32 bg-zinc-700 rounded-lg mb-2 flex items-center justify-center">
                                                <HouseIcon className="w-10 h-10 text-zinc-500" />
                                            </div>
                                        )}
                                        <h4 className="font-bold text-slate-100">{room.name}</h4>
                                        <p className="text-sm text-slate-400 line-clamp-2">{room.description}</p>
                                        <p className="text-sm font-semibold text-green-400 mt-1">${room.hourly_rate}/hr</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-400">No rooms listed yet.</p>
                        )}
                    </div>

                    {/* Posts & Updates */}
                    <div className="mb-10">
                        <h3 className="text-2xl font-bold mb-4 text-orange-400">Posts & Updates</h3>
                        <PostFeed posts={posts} authors={new Map([[stoodio.id, stoodio]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={viewStoodioDetails} />
                    </div>

                     {/* Recently Hosted Artists */}
                    <div className="mb-10">
                        <h3 className="text-2xl font-bold mb-4 text-orange-400 flex items-center gap-2"><UsersIcon className="w-6 h-6" /> Recently Hosted Artists</h3>
                        {hostedArtists.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {hostedArtists.map(artist => (
                                    <button key={artist.id} onClick={() => viewArtistProfile(artist)} className="flex items-center gap-3 bg-zinc-800 p-2 rounded-lg hover:bg-zinc-700 transition-colors">
                                        <img src={getProfileImageUrl(artist)} alt={artist.name} className="w-10 h-10 rounded-md object-cover" />
                                        <span className="font-semibold text-sm text-slate-200">{artist.name}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-400">Be the first to record here!</p>
                        )}
                    </div>

                     {/* Followers */}
                    <div className="mb-10">
                        <h3 className="text-2xl font-bold mb-4 text-orange-400 flex items-center gap-2"><UsersIcon className="w-6 h-6" /> Followers</h3>
                        {followers.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {followers.map(user => {
                                    const type = 'amenities' in user ? 'stoodio'
                                        : 'specialties' in user ? 'engineer'
                                        : 'instrumentals' in user ? 'producer'
                                        : 'artist';
                                    const onClick = () => {
                                        if (type === 'stoodio') viewStoodioDetails(user as Stoodio);
                                        else if (type === 'engineer') viewEngineerProfile(user as Engineer);
                                        else if (type === 'producer') viewProducerProfile(user as Producer)
                                        else viewArtistProfile(user as Artist);
                                    };
                                    return <ProfileCard key={user.id} profile={user} type={type} onClick={onClick} />;
                                })}
                            </div>
                        ) : (
                            <p className="text-slate-400">No followers yet.</p>
                        )}
                    </div>

                    {/* Following */}
                    <div className="mb-10">
                        <h3 className="text-2xl font-bold mb-4 text-orange-400 flex items-center gap-2"><UserCheckIcon className="w-6 h-6" /> Following</h3>
                        {[...followedArtists, ...followedEngineers, ...followedStoodioz, ...followedProducers].length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {followedArtists.map(p => <ProfileCard key={p.id} profile={p} type="artist" onClick={() => viewArtistProfile(p)} />)}
                                {followedEngineers.map(p => <ProfileCard key={p.id} profile={p} type="engineer" onClick={() => viewEngineerProfile(p)} />)}
                                {followedStoodioz.map(p => <ProfileCard key={p.id} profile={p} type="stoodio" onClick={() => viewStoodioDetails(p)} />)}
                                {followedProducers.map(p => <ProfileCard key={p.id} profile={p} type="producer" onClick={() => viewProducerProfile(p)} />)}
                            </div>
                        ) : (
                            <p className="text-slate-400">Not following anyone yet.</p>
                        )}
                    </div>

                    {/* Recent Reviews */}
                    <div className="mb-10">
                        <h3 className="text-2xl font-bold mb-4 text-orange-400">Recent Reviews</h3>
                        {stoodioReviews.length > 0 ? (
                            <ul className="space-y-5">
                                {stoodioReviews.map(review => {
                                    const artist = review.artist_id ? artists.find(a => a.id === review.artist_id) : null;
                                    return (
                                    <li key={review.id} className="border-b border-zinc-700 pb-4 last:border-b-0">
                                        <div className="flex justify-between items-center mb-1">
                                            {artist ? (
                                                <button onClick={() => viewArtistProfile(artist)} className="font-semibold text-slate-200 text-left hover:text-orange-400 transition-colors">
                                                    {review.reviewer_name}
                                                </button>
                                            ) : (
                                                <p className="font-semibold text-slate-200">{review.reviewer_name}</p>
                                            )}
                                            <div className="flex items-center gap-1 text-sm text-yellow-400">
                                                <StarIcon className="w-4 h-4" />
                                                <span className="font-bold">{review.rating.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-300">"{review.comment}"</p>
                                        <p className="text-xs text-slate-400 mt-2 text-right">{(review.created_at || review.date) ? new Date(review.created_at || review.date).toLocaleDateString() : ''}</p>
                                    </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-slate-400">No reviews yet for this stoodio.</p>
                        )}
                    </div>
                </div>

                {/* Right Column: Calendar and Booking */}
                <div className="lg:col-span-2">
                    <div className="p-6 sticky top-28 cardSurface">
                        <h2 className="text-3xl font-bold mb-4 text-center text-slate-100">Book a Room</h2>
                        <div className="space-y-4 mb-6">
                            {(stoodio.rooms || []).map(room => (
                                <button key={room.id} onClick={() => setSelectedRoom(room)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedRoom?.id === room.id ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/50'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg text-slate-100">{room.name}</span>
                                        <span className="font-bold text-lg text-orange-400">${room.hourly_rate}/hr</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">{room.description}</p>
                                </button>
                            ))}
                            {(stoodio.rooms || []).length === 0 && <p className="text-center text-zinc-500">No rooms available.</p>}
                        </div>

                        <Calendar 
                            blockedTimes={stoodio.availability || []}
                            bookings={bookings}
                            onSelectTimeSlot={handleSelectTimeSlot}
                            selectedTimeSlot={selectedTimeSlot}
                        />
                        <div className="hidden lg:block mt-6">
                            <button 
                                onClick={() => selectedTimeSlot && selectedRoom && onBook(selectedTimeSlot.date, selectedTimeSlot.time, selectedRoom)}
                                disabled={isBookingDisabled}
                                className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-orange-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed disabled:transform-none shadow-lg">
                                {getButtonText()}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky bottom bar for mobile */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-sm p-4 border-t border-zinc-700 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
                 <button 
                    onClick={() => selectedTimeSlot && selectedRoom && onBook(selectedTimeSlot.date, selectedTimeSlot.time, selectedRoom)}
                    disabled={isBookingDisabled}
                    className="w-full bg-orange-500 text-white font-bold py-4 px-6 rounded-xl hover:bg-orange-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed disabled:transform-none shadow-lg">
                    {getButtonText(true)}
                </button>
            </div>
        </div>
    );
};

export default StoodioDetail;
