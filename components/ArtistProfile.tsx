
import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Artist, Post, Engineer, Stoodio, Producer } from '../types';
import { AppView } from '../types';
import { 
    ChevronLeftIcon, UserPlusIcon, UserCheckIcon, MessageIcon,
    MicrophoneIcon, SoundWaveIcon, MusicNoteIcon, 
    PlayIcon, MagicWandIcon, VerifiedIcon, ChartBarIcon, LockClosedIcon, EditIcon, UsersIcon
} from './icons';
import PostFeed from './PostFeed';
import VerifiedBadge from './VerifiedBadge';
import ProfileCard from './ProfileCard';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useMessaging } from '../hooks/useMessaging';
import { useAria } from '../hooks/useAria';
import { fetchUserPosts, fetchFullArtist, fetchProfileByEmail } from '../services/apiService';
import { ARIA_EMAIL, ARIA_PROFILE_IMAGE_URL, ARIA_COVER_IMAGE_URL, getProfileImageUrl, getDisplayName } from '../constants';
import appIcon from '../assets/stoodioz-app-icon.png';
import AriaCantataAssistant from './AriaAssistant';
import AriaStudioBrain from './AriaStudioBrain';
import MixDoctor from './MixDoctor';
import ReleaseEngine from './ReleaseEngine';
import HookEnhancer from './HookEnhancer';
import { CloseIcon, PauseIcon } from './icons';

const TrackPlayer: React.FC<{
    title: string;
    artist: string;
    audioSrc: string;
    artSrc: string;
    about: string;
    showVisualizer?: boolean;
}> = ({ title, artist, audioSrc, artSrc, about, showVisualizer }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.75);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        audio.currentTime = percent * duration;
    };

    const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const newVolume = Math.max(0, Math.min(1, x / rect.width));
        setVolume(newVolume);
    };

    const formatTime = (seconds: number): string => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Album Art */}
            <div className="relative group">
                <div className="relative aspect-square rounded-3xl overflow-hidden border-2 border-orange-500/30 shadow-2xl shadow-orange-500/20">
                    <img 
                        src={artSrc} 
                        alt={`${title} - Album Art`} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                    {showVisualizer && (
                        <>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent aria-sing-pulse" />
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-1.5">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <span
                                        key={i}
                                        className="aria-eq-bar w-1.5 rounded-full bg-orange-400/80"
                                        style={{ height: 14 + i * 6, animationDelay: `${i * 0.12}s` }}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/50 to-transparent flex flex-col justify-end p-8">
                        <div className="space-y-4">
                            <h4 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-none" style={{ 
                                textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.7), 0 0 60px rgba(249, 115, 22, 0.3)',
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                {title}
                            </h4>
                            <p className="text-xl md:text-2xl lg:text-3xl font-black text-orange-500 uppercase tracking-[0.15em] leading-tight" style={{ 
                                textShadow: '0 2px 15px rgba(0,0,0,0.9), 0 0 30px rgba(249, 115, 22, 0.5), 0 0 50px rgba(249, 115, 22, 0.3)',
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                {artist}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Music Player */}
            <div className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-2xl border border-orange-500/20 backdrop-blur-sm">
                    <audio 
                        ref={audioRef}
                        src={audioSrc}
                        preload="metadata"
                    />
                    
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-orange-500/30">
                            <MusicNoteIcon className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <h5 className="text-lg font-black text-white">{title}</h5>
                            <p className="text-sm text-zinc-400">{artist}</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div 
                            className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2 cursor-pointer"
                            onClick={handleProgressClick}
                        >
                            <div 
                                className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-zinc-500">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        <button 
                            className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled
                            title="Previous"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                        <button 
                            onClick={togglePlay}
                            className="p-4 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg shadow-orange-500/30 transition-all"
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? (
                                <PauseIcon className="w-6 h-6" />
                            ) : (
                                <PlayIcon className="w-6 h-6" />
                            )}
                        </button>
                        <button 
                            className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled
                            title="Next"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-zinc-800">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M6.343 6.343L4.93 4.93A1 1 0 003.515 6.343L5.757 8.586a1 1 0 001.414-1.414zM17.657 17.657l1.414 1.414a1 1 0 001.414-1.414L18.485 15.414a1 1 0 00-1.414 1.414z" />
                            </svg>
                            <div 
                                className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden cursor-pointer"
                                onClick={handleVolumeChange}
                            >
                                <div 
                                    className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all"
                                    style={{ width: `${volume * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-xs text-zinc-500 w-8 text-right">{Math.round(volume * 100)}%</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 rounded-2xl border border-zinc-800 backdrop-blur-sm">
                    <h6 className="text-sm font-bold text-zinc-300 mb-3">About This Song</h6>
                    <p className="text-xs text-zinc-400 leading-relaxed">{about}</p>
                </div>
            </div>
        </div>
    );
};

const ARIA_GALLERY_IMAGES = [
    '/aria/0F91FD16-F2C6-4F90-8B50-925A73EF5BB3.PNG',
    '/aria/3A20BA94-2508-4905-8C5A-27F9C4A4A885 2.PNG',
    '/aria/447903D2-49A6-41A9-88FB-3A9E56BDC151.PNG',
    '/aria/49865374-4F6A-4EDD-84AB-6F7F6BD8F4E1.PNG',
    '/aria/4A4AC086-96E4-44D9-912A-0D9B9F128576.PNG',
    '/aria/69A845AD-5999-4E03-B4AF-F426837B7759.PNG',
    '/aria/7A0AC145-EA4D-4F2C-9BB1-81C0A188417D.PNG',
    '/aria/87A02BE3-D525-4319-9FE5-9C47EE022787 2.PNG',
    '/aria/8BE47D0C-1207-4285-BB6C-E3D792F4F547.PNG',
    '/aria/B5EC9F3D-6947-4113-9B19-8E4B1453F782.PNG',
    '/aria/B7D0B1E8-02F9-4B46-B97D-0E67A13008BD.PNG',
    '/aria/C0C49F08-6DD9-41F2-8905-6403B2451156.PNG',
    '/aria/D3880F26-561D-442A-9798-2F4B338D8E20.PNG',
    '/aria/D4262BE5-A0D7-49B6-9855-B81610AD2833.PNG',
    '/aria/DA503840-86BC-4114-A5B9-EBE56D21630A.PNG',
];

// Music Player Component
const MusicPlayerSection: React.FC = () => {
    const tracks = [
        {
            title: 'The Fine Print',
            artist: 'Aria Cantata',
            audioSrc: '/aria/the-fine-print.mp3',
            artSrc: '/aria/B7D0B1E8-02F9-4B46-B97D-0E67A13008BD.PNG',
            about: 'A second personal release from Aria. The track explores agency and clarity, continuing her evolving sound.',
            showVisualizer: true,
        },
        {
            title: 'You Me And My Pet',
            artist: 'Aria Cantata',
            audioSrc: '/aria/you-me-and-my-pet.mp3',
            artSrc: '/aria/D3880F26-561D-442A-9798-2F4B338D8E20.PNG',
            about: 'A personal track performed by Aria. This material is in final production and represents her evolving sound and creative direction.',
        },
    ];

    return (
        <div className="animate-fade-in space-y-8">
            {tracks.map((track, index) => (
                <div key={track.audioSrc} className="aria-glass p-10 rounded-[40px] aria-metal-stroke shadow-2xl relative overflow-hidden">
                    {index === 0 && (
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-8 flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></div>
                            Personal Music
                        </h3>
                    )}
                    <TrackPlayer {...track} />
                </div>
            ))}
        </div>
    );
};

const ActionCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    color: string;
}> = ({ icon, title, description, onClick, color }) => (
    <button 
        onClick={onClick}
        className="aria-command-card p-6 flex flex-col items-start text-left group"
    >
        <div className={`p-3 rounded-xl mb-4 transition-all duration-300 group-hover:scale-110 ${color}`}>
            {icon}
        </div>
        <h4 className="font-bold text-zinc-100 group-hover:text-orange-400 transition-colors">{title}</h4>
        <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{description}</p>
    </button>
);

const TabButton: React.FC<{ label: string; active: boolean; onClick: () => void; isAdmin?: boolean }> = ({ label, active, onClick, isAdmin }) => (
    <button
        onClick={onClick}
        className={`px-6 py-2.5 text-xs font-black uppercase tracking-[0.2em] transition-all rounded-full ${
            active 
            ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]' 
            : 'text-zinc-500 hover:text-zinc-300'
        } ${isAdmin ? 'border border-orange-500/30' : ''}`}
    >
        {label}
    </button>
);

const ArtistProfile: React.FC = () => {
    const { 
        selectedArtist, artists, engineers, stoodioz, producers, currentUser, ariaHistory, initialAriaCantataPrompt
    } = useAppState();
    const dispatch = useAppDispatch();
    const { goBack, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile, navigate, navigateToStudio } = useNavigation();
    const { toggleFollow, likePost, commentOnPost } = useSocial();
    const { startConversation } = useMessaging(navigate);

    const { executeCommand } = useAria({
        startConversation, navigate, viewStoodioDetails, viewEngineerProfile, viewProducerProfile, viewArtistProfile, navigateToStudio, confirmBooking: () => {}, updateProfile: () => {}, selectRoleToSetup: () => {}, logout: () => {}
    });

    const [artist, setArtist] = useState<Artist | null>(selectedArtist);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const lastLoadedArtistIdRef = useRef<string | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'music' | 'activity' | 'dashboard'>('overview');
    const [isAriaChatOpen, setIsAriaChatOpen] = useState(false);
    const [isMixDoctorOpen, setIsMixDoctorOpen] = useState(false);
    const [isReleaseEngineOpen, setIsReleaseEngineOpen] = useState(false);
    const [isHookEnhancerOpen, setIsHookEnhancerOpen] = useState(false);

    const isAria = useMemo(() => {
        if (!artist) return false;
        const ariaSavedId = localStorage.getItem('aria_profile_id');
        const emailMatch = artist.email === ARIA_EMAIL;
        const idMatch = artist.id === 'aria' || artist.profile_id === 'aria' || (ariaSavedId && (artist.id === ariaSavedId || artist.profile_id === ariaSavedId));
        const nameLower = (artist.name || '').toLowerCase();
        const usernameLower = (artist.username || '').toLowerCase();
        const nameMatch = usernameLower === 'aria' || nameLower === 'aria' || nameLower === 'aria cantata';
        return emailMatch || idMatch || nameMatch;
    }, [artist]);
    const isOwner = useMemo(() => isAria && currentUser?.id === artist?.id, [isAria, currentUser, artist]);

    const buildAriaFallback = (profile?: Partial<Artist>): Artist => ({
        id: profile?.id || 'aria',
        profile_id: profile?.profile_id || profile?.id || 'aria',
        name: profile?.name || profile?.full_name || profile?.username || 'Aria Cantata',
        full_name: profile?.full_name || 'Aria Cantata',
        username: profile?.username || 'aria',
        image_url: profile?.image_url || ARIA_PROFILE_IMAGE_URL,
        cover_image_url: profile?.cover_image_url || ARIA_COVER_IMAGE_URL,
        email: profile?.email || ARIA_EMAIL,
        genres: profile?.genres || [],
        rating_overall: profile?.rating_overall || 0,
        ranking_tier: profile?.ranking_tier || 'PROVISIONAL',
        role: 'ARTIST',
        profiles: (profile as any)?.profiles || null,
    } as Artist);

    const readCachedArtist = (id: string) => {
        try {
            const key = id === 'aria' ? 'aria_profile_cache' : `artist_cache_${id}`;
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as Artist) : null;
        } catch {
            return null;
        }
    };

    const writeCachedArtist = (data: Artist) => {
        try {
            if (!data?.id) return;
            const key = data.email === ARIA_EMAIL ? 'aria_profile_cache' : `artist_cache_${data.id}`;
            localStorage.setItem(key, JSON.stringify(data));
        } catch {
            // ignore storage failures
        }
    };

    useEffect(() => {
        let isMounted = true;
        const resolveArtist = async () => {
            const savedId = localStorage.getItem('selected_entity_id');
            const savedType = localStorage.getItem('selected_entity_type');
            const ariaSavedId = localStorage.getItem('aria_profile_id');
            let targetId = selectedArtist?.id || selectedArtist?.profile_id || (savedType === 'artist' ? savedId : null);
            const ariaTarget =
                targetId === 'aria' ||
                (ariaSavedId && (targetId === ariaSavedId)) ||
                selectedArtist?.email === ARIA_EMAIL ||
                selectedArtist?.username?.toLowerCase() === 'aria' ||
                (selectedArtist?.name || '').toLowerCase() === 'aria cantata';

            if (!targetId && !selectedArtist && ariaSavedId) {
                targetId = ariaSavedId;
            }

            if (!targetId && selectedArtist) {
                try {
                    if (selectedArtist.email && selectedArtist.email !== ARIA_EMAIL) {
                        const profile = await fetchProfileByEmail(selectedArtist.email);
                        if (!isMounted) return;
                        if (profile?.id) {
                            targetId = profile.id;
                        }
                    }
                    if (!targetId && selectedArtist.username) {
                        targetId = selectedArtist.username;
                    }
                } catch {
                    // ignore resolution failures; will fall back below
                }
            }

            if (!targetId) {
                if (isMounted) {
                    if (ariaTarget) {
                        setArtist({
                            id: 'aria',
                            profile_id: 'aria',
                            name: 'Aria Cantata',
                            full_name: 'Aria Cantata',
                            username: 'aria',
                            image_url: ARIA_PROFILE_IMAGE_URL,
                            cover_image_url: ARIA_COVER_IMAGE_URL,
                            email: ARIA_EMAIL,
                            genres: [],
                            rating_overall: 0,
                            ranking_tier: 'PROVISIONAL',
                            role: 'ARTIST',
                            profiles: null,
                        } as any);
                    } else {
                        setArtist(selectedArtist || null);
                        setLoadError('Profile could not be resolved.');
                    }
                    setIsLoadingDetails(false);
                }
                return;
            }

            if (lastLoadedArtistIdRef.current === targetId) return;
            lastLoadedArtistIdRef.current = targetId;

            setIsLoadingDetails(true);
            setLoadError(null);
            const existing = artists.find(a => a.id === targetId);
            if (existing) setArtist(existing);

            try {
                let resolvedId = targetId;
                if (resolvedId === 'aria') {
                    const profile = await fetchProfileByEmail(ARIA_EMAIL);
                    if (!isMounted) return;
                    if (profile?.id) {
                        localStorage.setItem('aria_profile_id', profile.id);
                        resolvedId = profile.id;
                    }
                }

                const fullData = await fetchFullArtist(resolvedId);
                if (!isMounted) return;
                if (fullData) {
                    setArtist(fullData as Artist);
                    writeCachedArtist(fullData as Artist);
                    if (fullData?.email === ARIA_EMAIL && fullData?.id) {
                        localStorage.setItem('aria_profile_id', fullData.id);
                    }
                } else {
                    if (ariaTarget) {
                        const ariaProfile = await fetchProfileByEmail(ARIA_EMAIL);
                        if (!isMounted) return;
                        if (ariaProfile?.id) {
                            localStorage.setItem('aria_profile_id', ariaProfile.id);
                            setArtist({
                                id: ariaProfile.id,
                                profile_id: ariaProfile.id,
                                name: ariaProfile.full_name || ariaProfile.username || 'Aria Cantata',
                                full_name: ariaProfile.full_name || null,
                                username: ariaProfile.username || null,
                                image_url: ariaProfile.image_url || ARIA_PROFILE_IMAGE_URL,
                                cover_image_url: ARIA_COVER_IMAGE_URL,
                                email: ariaProfile.email || ARIA_EMAIL,
                                genres: [],
                                rating_overall: 0,
                                ranking_tier: 'PROVISIONAL',
                                role: 'ARTIST',
                                profiles: ariaProfile,
                            } as any);
                            return;
                        }
                        if (resolvedId === 'aria' || selectedArtist?.email === ARIA_EMAIL) {
                        setArtist(buildAriaFallback());
                        setLoadError('Live data unavailable. Showing Aria fallback.');
                        return;
                    }
                    }
                    setArtist(existing || null);
                    setLoadError('Profile not found.');
                }
            } catch (e) {
                console.error("Failed to load artist details", e);
                if (!isMounted) return;
                const cached = readCachedArtist(targetId);
                if (cached) {
                    setArtist(cached);
                    setLoadError('Live data timed out. Showing cached profile.');
                    return;
                }
                if (ariaTarget) {
                    setArtist(buildAriaFallback(selectedArtist as any));
                    setLoadError('Live data timed out. Showing Aria fallback.');
                } else {
                    setArtist(existing || null);
                    setLoadError('Unable to load this profile right now.');
                }
            } finally {
                if (isMounted) setIsLoadingDetails(false);
            }
        };
        resolveArtist();
        return () => {
            isMounted = false;
        };
    }, [selectedArtist?.id, artists]);

    useEffect(() => {
        if (!artist?.id) return;
        let isMounted = true;
        fetchUserPosts(artist.id)
            .then((p) => { if (isMounted) setPosts(p); })
            .catch((err) => {
                console.error('Failed to load artist posts', err);
                if (isMounted) setPosts([]);
            });
        return () => { isMounted = false; };
    }, [artist?.id]);

    useEffect(() => {
        if (!isLoadingDetails) return;
        const t = setTimeout(() => {
            lastLoadedArtistIdRef.current = null;
            setIsLoadingDetails(false);
            setLoadError('Request timed out. Please try again.');
        }, 18_000);
        return () => clearTimeout(t);
    }, [isLoadingDetails]);

    // All hooks must be called before any early returns
    const allUsers = useMemo(() => [...artists, ...engineers, ...stoodioz, ...producers], [artists, engineers, stoodioz, producers]);
    const followers = useMemo(() => {
        if (!artist) return [];
        return allUsers.filter(u => (artist.follower_ids || []).includes(u.id));
    }, [allUsers, artist]);
    const followedArtists = useMemo(() => {
        if (!artist) return [];
        return artists.filter(a => (artist.following?.artists || []).includes(a.id));
    }, [artists, artist]);
    const followedEngineers = useMemo(() => {
        if (!artist) return [];
        return engineers.filter(e => (artist.following?.engineers || []).includes(e.id));
    }, [engineers, artist]);
    const followedStoodioz = useMemo(() => {
        if (!artist) return [];
        return stoodioz.filter(s => (artist.following?.stoodioz || []).includes(s.id));
    }, [stoodioz, artist]);
    const followedProducers = useMemo(() => {
        if (!artist) return [];
        return producers.filter(p => (artist.following?.producers || []).includes(p.id));
    }, [producers, artist]);
    const followingCount = useMemo(() => {
        return followedArtists.length + followedEngineers.length + followedStoodioz.length + followedProducers.length;
    }, [followedArtists, followedEngineers, followedStoodioz, followedProducers]);

    const handlePersonalityIntent = () => {
        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
        dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: "I want to modify your personality core settings." } });
    };

    const handleBroadcastIntent = () => {
        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
        dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: "Prepare a global broadcast for the Stage network." } });
    };

    const handleSecurityIntent = () => {
        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
        dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: "Review system security protocols and API keys." } });
    };

    if (isLoadingDetails) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <img src={appIcon} alt="Loading" className="h-10 w-10 animate-spin" />
                <p className="text-zinc-500 font-medium">Loading profile...</p>
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="text-zinc-400 font-semibold">{loadError || 'Profile unavailable.'}</div>
                <button
                    onClick={goBack}
                    className="px-6 py-3 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-all font-bold"
                >
                    Go Back
                </button>
            </div>
        );
    }

    if (!isAria) {
        const isFollowing = currentUser ? (currentUser.following?.artists || []).includes(artist.id) : false;
        
        return (
            <div className="max-w-7xl mx-auto pb-32 animate-fade-in">
                <button onClick={goBack} className="absolute top-10 left-10 z-20 flex items-center gap-3 text-zinc-400 hover:text-orange-400 transition-all font-black uppercase tracking-[0.25em] text-[10px] mb-6">
                    <ChevronLeftIcon className="w-4 h-4" /> System Back
                </button>
                
                {/* Cover Section with Aria-style Profile Photo Layout */}
                <div
                    className="relative min-h-[50dvh] rounded-[40px] overflow-hidden border border-white/5 mb-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    style={{ 
                        backgroundImage: `url(${artist.cover_image_url || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop'})`, 
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
                                    src={getProfileImageUrl(artist)} 
                                    alt={getDisplayName(artist)} 
                                    className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-[8px] border-zinc-950 shadow-[0_0_60px_rgba(0,0,0,0.8)]" 
                                />
                                {/* Microphone badge in bottom-right corner (like Aria's magic wand) */}
                                <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-orange-500 to-pink-600 p-3 rounded-2xl shadow-2xl ring-4 ring-zinc-950">
                                    <MicrophoneIcon className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4" style={{ textShadow: '0 0 30px rgba(249,115,22,0.5)' }}>
                            {getDisplayName(artist, 'Artist')}
                        </h1>
                        <div className="flex items-center gap-4">
                            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-orange-400 bg-orange-500/10 px-6 py-2 rounded-full border border-orange-500/20 backdrop-blur-md">
                                Artist
                            </span>
                            {(artist as any).label_verified && <VerifiedBadge labelVerified={true} />}
                        </div>
                    </div>
                </div>

                {/* Action Buttons Section */}
                <div className="flex justify-center mb-12 px-4">
                    {currentUser && currentUser.id !== artist.id && (
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                                onClick={() => startConversation(artist)}
                                disabled={!currentUser || currentUser.id === artist.id}
                                className="px-6 py-3 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-all font-bold flex items-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <MessageIcon className="w-5 h-5" />
                                Message
                            </button>
                            <button 
                                onClick={() => toggleFollow('artist', artist.id)}
                                disabled={!currentUser || currentUser.id === artist.id}
                                className={`px-6 py-3 rounded-xl font-bold transition-all shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isFollowing ? 'bg-orange-500 text-white' : 'bg-white text-black hover:bg-orange-500 hover:text-white'}`}
                            >
                                {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Bio Section */}
                {artist.bio && (
                    <div className="cardSurface p-8 mb-8">
                        <h3 className="text-sm font-black uppercase text-orange-400 tracking-[0.2em] mb-4">Biography</h3>
                        <p className="text-slate-300 leading-relaxed text-lg italic">"{artist.bio}"</p>
                    </div>
                )}

                {/* Followers Section */}
                <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-4 text-slate-100 flex items-center gap-2">
                        <UsersIcon className="w-6 h-6" /> Followers ({followers.length})
                    </h3>
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

                {/* Following Section */}
                <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-4 text-slate-100 flex items-center gap-2">
                        <UserCheckIcon className="w-6 h-6" /> Following ({followingCount})
                    </h3>
                    {followingCount > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {followedArtists.map(p => <ProfileCard key={p.id} profile={p} type="artist" onClick={() => viewArtistProfile(p)} />)}
                            {followedEngineers.map(p => <ProfileCard key={p.id} profile={p} type="engineer" onClick={() => viewEngineerProfile(p)} />)}
                            {followedStoodioz.map(p => <ProfileCard key={p.id} profile={p} type="stoodio" onClick={() => viewStoodioDetails(p)} />)}
                            {followedProducers.map(p => <ProfileCard key={p.id} profile={p} type="producer" onClick={() => viewProducerProfile(p)} />)}
                        </div>
                    ) : <p className="text-slate-400">Not following anyone yet.</p>}
                </div>

                {/* Feed & Activity */}
                <div className="space-y-8 mt-12">
                    <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 mb-6">
                        <SoundWaveIcon className="w-6 h-6 text-orange-400" /> Feed & Activity
                    </h3>
                    {posts.length > 0 ? (
                        <PostFeed 
                            posts={posts} 
                            authors={new Map([[artist.id, artist]])} 
                            onLikePost={likePost} 
                            onCommentOnPost={commentOnPost} 
                            onSelectAuthor={() => {}} 
                        />
                    ) : (
                        <div className="cardSurface p-8 text-center">
                            <p className="text-zinc-400">No posts yet.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-32 animate-fade-in">
            <div
                className="relative min-h-[50dvh] rounded-[40px] overflow-hidden aria-mesh-gradient border border-white/5 mb-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                style={{ backgroundImage: `url(${ARIA_COVER_IMAGE_URL})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
                <div className="absolute inset-0 bg-black/30"></div>
                <button onClick={goBack} className="absolute top-10 left-10 z-20 flex items-center gap-3 text-zinc-400 hover:text-orange-400 transition-all font-black uppercase tracking-[0.25em] text-[10px]"><ChevronLeftIcon className="w-4 h-4" /> System Back</button>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-[80px] animate-pulse"></div>
                        <div className="relative animate-aria-float">
                            <img src={getProfileImageUrl(artist)} alt="Aria Cantata" className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-[8px] border-zinc-950 shadow-[0_0_60px_rgba(0,0,0,0.8)]" />
                            <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-orange-500 to-purple-600 p-3 rounded-2xl shadow-2xl ring-4 ring-zinc-950"><MagicWandIcon className="w-8 h-8 text-white" /></div>
                        </div>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4 text-glow">{artist.name}</h1>
                    <div className="flex items-center gap-4"><span className="text-[11px] font-black uppercase tracking-[0.4em] text-orange-400 bg-orange-500/10 px-6 py-2 rounded-full border border-orange-500/20 backdrop-blur-md">Operational Intelligence</span><VerifiedIcon className="w-6 h-6 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" /></div>
                </div>
            </div>

            <div className="flex justify-center mb-16 px-4">
                <div className="aria-glass p-2 rounded-full flex items-center gap-2 border border-white/10 shadow-2xl max-w-full overflow-x-auto scrollbar-hide">
                    <TabButton label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <TabButton label="Music" active={activeTab === 'music'} onClick={() => setActiveTab('music')} />
                    <TabButton label="Activity" active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
                    {isOwner && <TabButton label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isAdmin />}
                </div>
            </div>

            <div className="space-y-16">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fade-in">
                        <div className="lg:col-span-7 space-y-12">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <ActionCard icon={<MagicWandIcon className="w-6 h-6 text-orange-400" />} title="Find a Vibe" description="Neural matching to find the best engineer/producer/studio for your next move." color="bg-orange-500/10" onClick={() => dispatch({ type: ActionTypes.SET_VIBE_MATCHER_OPEN, payload: { isOpen: true } })} />
                                <ActionCard icon={<SoundWaveIcon className="w-6 h-6 text-blue-400" />} title="Mix Doctor" description="Upload your audio. Aria analyzes it professionally and tells you exactly what to fix." color="bg-blue-500/10" onClick={() => {
                                    setIsMixDoctorOpen(true);
                                }} />
                                <ActionCard icon={<MusicNoteIcon className="w-6 h-6 text-green-400" />} title="Hook Enhancer" description="Turn a rough idea into hooks that hit: 3 options + cadence map + performance notes." color="bg-green-500/10" onClick={() => {
                                    setIsHookEnhancerOpen(true);
                                }} />
                                <ActionCard icon={<ChartBarIcon className="w-6 h-6 text-purple-400" />} title="Release Engine" description="Complete release planning with timeline, content, distribution & marketing strategy." color="bg-purple-500/10" onClick={() => {
                                    setIsReleaseEngineOpen(true);
                                }} />
                            </div>

                            <div className="mt-10">
                                <AriaStudioBrain />
                            </div>
                        </div>
                        <div className="lg:col-span-5 space-y-8">
                            <div className="aria-panel-sunken rounded-[40px] p-8 h-[75dvh] flex flex-col relative shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)]">
                                <div className="flex-grow overflow-hidden flex flex-col">
                                    {!isAriaChatOpen ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-5">
                                                <MagicWandIcon className="w-8 h-8 text-orange-400" />
                                            </div>
                                            <p className="text-zinc-300 font-black tracking-tight">Aria Live Console</p>
                                            <p className="text-zinc-500 text-sm mt-2 max-w-xs">Open the assistant to run creative workflows, booking, and operational commands.</p>
                                            <button
                                                type="button"
                                                onClick={() => setIsAriaChatOpen(true)}
                                                className="mt-6 px-6 py-3 rounded-xl bg-orange-500 text-white font-black hover:bg-orange-600 transition"
                                            >
                                                Open Chat
                                            </button>
                                        </div>
                                    ) : (
                                        <AriaCantataAssistant
                                            isOpen={isAriaChatOpen}
                                            onClose={() => setIsAriaChatOpen(false)}
                                            onExecuteCommand={executeCommand}
                                            history={ariaHistory}
                                            setHistory={(h) => dispatch({ type: ActionTypes.SET_ARIA_HISTORY, payload: { history: h } })}
                                            initialPrompt={initialAriaCantataPrompt}
                                            clearInitialPrompt={() => dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: null } })}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="aria-glass p-6 rounded-[32px] aria-metal-stroke shadow-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-orange-400">Aria Photo Gallery</h3>
                                    <span className="text-xs text-zinc-500">Swipe</span>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
                                    {ARIA_GALLERY_IMAGES.map((src) => (
                                        <div key={src} className="snap-start shrink-0 w-56 h-72 rounded-2xl overflow-hidden bg-zinc-900/60 border border-white/5 shadow-[0_0_24px_rgba(249,115,22,0.1)]">
                                            <img
                                                src={encodeURI(src)}
                                                alt="Aria photo"
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'music' && <MusicPlayerSection />}
                {activeTab === 'activity' && (
                    <div className="animate-fade-in space-y-8">
                        <div className="cardSurface p-8">
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 mb-6">
                                <UsersIcon className="w-6 h-6 text-orange-400" /> Connections
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-lg font-bold text-zinc-100 mb-3">Followers ({followers.length})</h4>
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
                                    ) : (
                                        <p className="text-zinc-400 text-sm">No followers yet.</p>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-zinc-100 mb-3">Following ({followingCount})</h4>
                                    {followingCount > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {followedArtists.map(p => <ProfileCard key={p.id} profile={p} type="artist" onClick={() => viewArtistProfile(p)} />)}
                                            {followedEngineers.map(p => <ProfileCard key={p.id} profile={p} type="engineer" onClick={() => viewEngineerProfile(p)} />)}
                                            {followedStoodioz.map(p => <ProfileCard key={p.id} profile={p} type="stoodio" onClick={() => viewStoodioDetails(p)} />)}
                                            {followedProducers.map(p => <ProfileCard key={p.id} profile={p} type="producer" onClick={() => viewProducerProfile(p)} />)}
                                        </div>
                                    ) : (
                                        <p className="text-zinc-400 text-sm">Not following anyone yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 mb-6">
                                <SoundWaveIcon className="w-6 h-6 text-orange-400" /> Feed & Activity
                            </h3>
                            {posts.length > 0 ? (
                                <PostFeed 
                                    posts={posts} 
                                    authors={new Map([[artist.id, artist]])} 
                                    onLikePost={likePost} 
                                    onCommentOnPost={commentOnPost} 
                                    onSelectAuthor={() => {}} 
                                />
                            ) : (
                                <div className="aria-glass p-10 rounded-[40px] text-center">
                                    <p className="text-zinc-400 font-semibold">No posts yet.</p>
                                    <p className="text-zinc-600 text-sm mt-2">
                                        {isAria 
                                            ? "Posts created from Aria's dashboard will appear here and automatically on The Stage."
                                            : "Activity will appear here when Aria posts updates."
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'dashboard' && isOwner && (
                    <div className="animate-fade-in space-y-12">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <ActionCard icon={<EditIcon className="w-6 h-6 text-blue-400" />} title="Personality Core" description="Modify Aria's neural presence, semantic core, and public-facing metadata." color="bg-blue-500/10" onClick={handlePersonalityIntent} />
                            <ActionCard icon={<MicrophoneIcon className="w-6 h-6 text-orange-400" />} title="Broadcast Relay" description="Directly transmit status updates from the operational lead to the Stage network." color="bg-orange-500/10" onClick={handleBroadcastIntent} />
                            <ActionCard icon={<LockClosedIcon className="w-6 h-6 text-zinc-400" />} title="Security Subsystems" description="Configure API endpoints, encryption keys, and identity verification parameters." color="bg-zinc-800" onClick={handleSecurityIntent} />
                        </div>
                    </div>
                )}
            </div>

            {/* Mix Doctor Modal */}
            {isMixDoctorOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMixDoctorOpen(false)}></div>
                    <div className="relative w-full max-w-5xl max-h-[90dvh] overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl">
                        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-700 p-6 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-100">Mix Doctor</h2>
                                <p className="text-sm text-zinc-400 mt-1">Professional audio analysis powered by Aria</p>
                            </div>
                            <button
                                onClick={() => setIsMixDoctorOpen(false)}
                                className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors"
                            >
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <MixDoctor />
                        </div>
                    </div>
                </div>
            )}

            {/* Release Engine Modal */}
            {isReleaseEngineOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsReleaseEngineOpen(false)}></div>
                    <div className="relative w-full max-w-6xl max-h-[90dvh] overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl">
                        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-700 p-6 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-100">Release Engine</h2>
                                <p className="text-sm text-zinc-400 mt-1">Complete release planning with timeline, content & marketing strategy</p>
                            </div>
                            <button
                                onClick={() => setIsReleaseEngineOpen(false)}
                                className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors"
                            >
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <ReleaseEngine />
                        </div>
                    </div>
                </div>
            )}

            {/* Hook Enhancer Modal */}
            {isHookEnhancerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsHookEnhancerOpen(false)}></div>
                    <div className="relative w-full max-w-6xl max-h-[90dvh] overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl">
                        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-700 p-6 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-100">Hook Enhancer Pro</h2>
                                <p className="text-sm text-zinc-400 mt-1">AI-powered hook optimization • Cadence mapping • Viral potential analysis</p>
                            </div>
                            <button
                                onClick={() => setIsHookEnhancerOpen(false)}
                                className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors"
                            >
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <HookEnhancer />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArtistProfile;
