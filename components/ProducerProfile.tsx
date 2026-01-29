
import React, { useMemo, useState, useEffect, useRef } from 'react';
// FIX: Import missing types
import type { Producer, Artist, Stoodio, Engineer, Instrumental, Post, BeatPurchaseType, ProducerProduct } from '../types';
import { ChevronLeftIcon, UserPlusIcon, UserCheckIcon, MessageIcon, LinkIcon, UsersIcon, HouseIcon, SoundWaveIcon, MicrophoneIcon, DollarSignIcon, CalendarIcon, MusicNoteIcon, StarIcon, PhotoIcon, PlayIcon } from './icons';
import PostFeed from './PostFeed';
import InstrumentalPlayer from './InstrumentalPlayer';
import PurchaseBeatModal from './PurchaseBeatModal';
import MasterclassCard from './MasterclassCard';
import VerifiedBadge from './VerifiedBadge';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useMasterclass } from '../hooks/useMasterclass';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useMessaging } from '../hooks/useMessaging';
import { useBookings } from '../hooks/useBookings';
import { AppView } from '../types';
import * as apiService from '../services/apiService';
import { fetchUserPosts, fetchFullProducer } from '../services/apiService';
import { getProfileImageUrl, getDisplayName } from '../constants';
import appIcon from '../assets/stoodioz-app-icon.png';

// Instagram-style Feed Component with Tabs
const ProducerFeedTabs: React.FC<{
    posts: Post[];
    mediaItems: Array<{ id: string; url: string; type: 'image' | 'video' }>;
    producer: Producer;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    onSelectAuthor: () => void;
}> = ({ posts, mediaItems, producer, onLikePost, onCommentOnPost, onSelectAuthor }) => {
    const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'updates'>('posts');

    const postsWithMedia = useMemo(() => {
        return posts.filter(p => p.image_url || p.video_url);
    }, [posts]);

    const textPosts = useMemo(() => {
        return posts.filter(p => !p.image_url && !p.video_url);
    }, [posts]);

    return (
        <div className="aria-glass rounded-[40px] aria-metal-stroke shadow-2xl p-8 mb-8">
            {/* Tabs */}
            <div className="flex items-center gap-6 mb-6 border-b border-white/10 pb-4">
                <button 
                    onClick={() => setActiveTab('posts')}
                    className={`text-sm font-black uppercase tracking-[0.2em] transition-all pb-2 border-b-2 ${
                        activeTab === 'posts' 
                            ? 'text-purple-400 border-purple-500' 
                            : 'text-zinc-500 hover:text-zinc-400 border-transparent'
                    }`}
                >
                    Posts ({posts.length})
                </button>
                <button 
                    onClick={() => setActiveTab('media')}
                    className={`text-sm font-black uppercase tracking-[0.2em] transition-all pb-2 border-b-2 ${
                        activeTab === 'media' 
                            ? 'text-purple-400 border-purple-500' 
                            : 'text-zinc-500 hover:text-zinc-400 border-transparent'
                    }`}
                >
                    Media ({mediaItems.length})
                </button>
                <button 
                    onClick={() => setActiveTab('updates')}
                    className={`text-sm font-black uppercase tracking-[0.2em] transition-all pb-2 border-b-2 ${
                        activeTab === 'updates' 
                            ? 'text-purple-400 border-purple-500' 
                            : 'text-zinc-500 hover:text-zinc-400 border-transparent'
                    }`}
                >
                    Updates ({textPosts.length})
                </button>
            </div>
            
            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'posts' && (
                    posts.length > 0 ? (
                        <PostFeed 
                            posts={posts}
                            authors={new Map([[producer.id, producer]])}
                            onLikePost={onLikePost}
                            onCommentOnPost={onCommentOnPost}
                            onSelectAuthor={onSelectAuthor}
                        />
                    ) : (
                        <div className="text-center py-16">
                            <PhotoIcon className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                            <p className="text-zinc-400 font-semibold">No posts yet</p>
                            <p className="text-sm text-zinc-500 mt-2">Check back later for updates</p>
                        </div>
                    )
                )}

                {activeTab === 'media' && (
                    mediaItems.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {mediaItems.map(item => (
                                <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 group cursor-pointer hover:border-purple-500/50 transition-all">
                                    <img src={item.url} alt="Media" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                    {item.type === 'video' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                                            <PlayIcon className="w-8 h-8 text-white drop-shadow-lg" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <PhotoIcon className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                            <p className="text-zinc-400 font-semibold">No media yet</p>
                            <p className="text-sm text-zinc-500 mt-2">Check back later for photos and videos</p>
                        </div>
                    )
                )}

                {activeTab === 'updates' && (
                    textPosts.length > 0 ? (
                        <PostFeed 
                            posts={textPosts}
                            authors={new Map([[producer.id, producer]])}
                            onLikePost={onLikePost}
                            onCommentOnPost={onCommentOnPost}
                            onSelectAuthor={onSelectAuthor}
                        />
                    ) : (
                        <div className="text-center py-16">
                            <PhotoIcon className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                            <p className="text-zinc-400 font-semibold">No text updates yet</p>
                            <p className="text-sm text-zinc-500 mt-2">Check back later for updates</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

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
            <img src={getProfileImageUrl(profile)} alt={getDisplayName(profile)} className="w-12 h-12 rounded-md object-cover" />
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm text-slate-200 truncate">{getDisplayName(profile)}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">{icon}{details}</p>
            </div>
        </button>
    );
};

const ProducerProfile: React.FC = () => {
    const { selectedProducer, currentUser, artists, engineers, stoodioz, producers, userRole } = useAppState();
    const dispatch = useAppDispatch();
    
    const { goBack, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile, navigate } = useNavigation();
    const { toggleFollow, likePost, commentOnPost } = useSocial();
    const { startConversation } = useMessaging(navigate);
    const { initiateBookingWithProducer } = useBookings(navigate);

    const [selectedBeat, setSelectedBeat] = useState<Instrumental | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isPurchasingKit, setIsPurchasingKit] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [producer, setProducer] = useState<Producer | null>(selectedProducer || null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const lastLoadedIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (selectedProducer) setProducer(selectedProducer);
    }, [selectedProducer]);

    useEffect(() => {
        let isMounted = true;
        const resolveProducer = async () => {
            const savedId = localStorage.getItem('selected_entity_id');
            const savedType = localStorage.getItem('selected_entity_type');
            const targetId = selectedProducer?.id || selectedProducer?.profile_id || (savedType === 'producer' ? savedId : null);

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
                const fullData = await fetchFullProducer(targetId);
                if (!isMounted) return;
                if (fullData) setProducer(fullData as Producer);
                else {
                    setProducer(null);
                    setLoadError('Profile not found.');
                }
            } catch (e) {
                console.error('Failed to load producer details', e);
                if (isMounted) {
                    setProducer(null);
                    setLoadError('Unable to load this profile right now.');
                }
            } finally {
                if (isMounted) setIsLoadingDetails(false);
            }
        };

        resolveProducer();
        return () => {
            isMounted = false;
        };
    }, [selectedProducer?.id]);

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
        if (producer?.id) {
            fetchUserPosts(producer.id).then(setPosts);
        }
    }, [producer?.id]);

    // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
    const mediaItems = useMemo(() => {
        return posts.filter(p => p.image_url || p.video_url).map(p => ({
            id: p.id,
            url: p.image_url || p.video_thumbnail_url || '',
            type: p.video_url ? 'video' : 'image'
        }));
    }, [posts]);

    // Memoized values that depend on producer - use null-safe defaults
    const allUsers = useMemo(() => [...artists, ...engineers, ...stoodioz, ...producers], [artists, engineers, stoodioz, producers]);
    const followers = useMemo(() => {
        if (!producer) return [];
        return allUsers.filter(u => (producer.follower_ids || []).includes(u.id));
    }, [allUsers, producer?.follower_ids]);

    const followedArtists = useMemo(() => {
        if (!producer) return [];
        return artists.filter(a => (producer.following?.artists || []).includes(a.id));
    }, [artists, producer?.following?.artists]);
    
    const followedEngineers = useMemo(() => {
        if (!producer) return [];
        return engineers.filter(e => (producer.following?.engineers || []).includes(e.id));
    }, [engineers, producer?.following?.engineers]);
    
    const followedStoodioz = useMemo(() => {
        if (!producer) return [];
        return stoodioz.filter(s => (producer.following?.stoodioz || []).includes(s.id));
    }, [stoodioz, producer?.following?.stoodioz]);
    
    const followedProducers = useMemo(() => {
        if (!producer) return [];
        return producers.filter(p => (producer.following?.producers || []).includes(p.id));
    }, [producers, producer?.following?.producers]);
    
    const followingCount = followedArtists.length + followedEngineers.length + followedStoodioz.length + followedProducers.length;

    // NOW we can do early returns after all hooks
    if (isLoadingDetails) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <img src={appIcon} alt="Loading" className="h-10 w-10 animate-spin" />
                <p className="text-zinc-500 font-medium">Loading profile...</p>
            </div>
        );
    }

    if (!producer) {
        return (
            <div className="text-center text-zinc-400 space-y-3">
                <p>{loadError || 'Producer not found.'}</p>
                <p className="text-xs text-zinc-500 mt-2">If this should exist, check Supabase RLS policies.</p>
                <button onClick={goBack} className="mt-4 text-orange-400">Go Back</button>
            </div>
        );
    }
    
    const isFollowing = currentUser ? (currentUser.following?.producers || []).includes(producer.id) : false;

    const handlePurchaseClick = (instrumental: Instrumental) => {
        if (!currentUser) {
            navigate(AppView.LOGIN);
            return;
        }
        if (currentUser.id === producer.id) {
            alert("You cannot purchase your own beat.");
            return; 
        }
        setSelectedBeat(instrumental);
    };

    const confirmPurchase = async (type: BeatPurchaseType) => {
        if (!currentUser || !selectedBeat || !userRole) return;

        setIsPurchasing(true);
        try {
            const { updatedBooking, sessionId } = await apiService.purchaseBeat(selectedBeat, type, currentUser, producer, userRole);
            if (updatedBooking) {
                dispatch({ type: ActionTypes.ADD_BOOKING, payload: { booking: updatedBooking } });
            }
            if (sessionId) {
                const { redirectToCheckout } = await import('../lib/stripe');
                await redirectToCheckout(sessionId);
            } else {
                alert(`Purchase initialized. If Stripe did not open, check your Stripe settings.`);
            }
            setSelectedBeat(null);
        } catch (error) {
            console.error("Purchase failed:", error);
            alert("Purchase failed. Please try again.");
        } finally {
            setIsPurchasing(false);
        }
    };

    const handlePurchaseKit = async (product: ProducerProduct) => {
        if (!currentUser || !userRole) {
            navigate(AppView.LOGIN);
            return;
        }
        if (currentUser.id === producer.id) {
            alert("You cannot purchase your own product.");
            return;
        }
        setIsPurchasingKit(true);
        try {
            const { updatedBooking, sessionId } = await apiService.purchaseProduct(product, currentUser, producer, userRole);
            if (updatedBooking) {
                dispatch({ type: ActionTypes.ADD_BOOKING, payload: { booking: updatedBooking } });
            }
            if (sessionId) {
                const { redirectToCheckout } = await import('../lib/stripe');
                await redirectToCheckout(sessionId);
            } else {
                alert(`Purchase initialized. If Stripe did not open, check your Stripe settings.`);
            }
        } catch (error) {
            console.error("Product purchase failed:", error);
            alert("Purchase failed. Please try again.");
        } finally {
            setIsPurchasingKit(false);
        }
    };
    
    const isSelf = currentUser?.id === producer.id;

    // Placeholder functions for masterclass modals (to be implemented)
    const openPurchaseMasterclassModal = () => {
        alert('Masterclass purchase coming soon!');
    };

    const openWatchMasterclassModal = () => {
        alert('Masterclass viewer coming soon!');
    };

    return (
        <div className="max-w-7xl mx-auto pb-32 animate-fade-in">
            <button onClick={goBack} className="absolute top-10 left-10 z-20 flex items-center gap-3 text-zinc-400 hover:text-purple-400 transition-all font-black uppercase tracking-[0.25em] text-[10px] mb-6">
                <ChevronLeftIcon className="w-4 h-4" /> System Back
            </button>
            
            {/* Cover Section with Aria-style Profile Photo Layout */}
            <div
                className="relative min-h-[50vh] rounded-[40px] overflow-hidden border border-white/5 mb-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                style={{ 
                    backgroundImage: `url(${producer.cover_image_url || 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=1200&auto=format&fit=crop'})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center' 
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                <div className="absolute inset-0 bg-black/30"></div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
                    <div className="relative mb-8">
                        {/* Glowing background effect like Aria */}
                        <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-[80px] animate-pulse"></div>
                        {/* Floating profile photo with Aria-style effects */}
                        <div className="relative animate-aria-float">
                            <img 
                                src={getProfileImageUrl(producer)} 
                                alt={getDisplayName(producer)} 
                                className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-[8px] border-zinc-950 shadow-[0_0_60px_rgba(0,0,0,0.8)]" 
                            />
                            {/* Music note badge in bottom-right corner (like Aria's magic wand) */}
                            <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-2xl shadow-2xl ring-4 ring-zinc-950">
                                <MusicNoteIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4" style={{ textShadow: '0 0 30px rgba(168,85,247,0.5)' }}>
                        {getDisplayName(producer, 'Producer')}
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-purple-400 bg-purple-500/10 px-6 py-2 rounded-full border border-purple-500/20 backdrop-blur-md">
                            Producer
                        </span>
                        {(producer as any).label_verified && <VerifiedBadge labelVerified={true} />}
                        <div className="flex items-center gap-1 text-yellow-400">
                            <StarIcon className="w-5 h-5" />
                            <span className="font-bold text-white">{(producer.rating_overall ?? 0).toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons Section */}
            <div className="flex justify-center mb-12 px-4">
                {!isSelf && (
                    <div className="flex flex-col sm:flex-row gap-3">
                        {producer.pull_up_price && currentUser && (
                            <button 
                                onClick={() => initiateBookingWithProducer(producer)}
                                className="px-6 py-3 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-all font-bold flex items-center gap-2 shadow-xl"
                            >
                                <CalendarIcon className="w-5 h-5" />
                                Book Pull Up
                            </button>
                        )}
                        <button 
                            onClick={() => currentUser ? startConversation(producer) : navigate(AppView.LOGIN)}
                            className="px-6 py-3 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-all font-bold flex items-center gap-2 shadow-xl"
                        >
                            <MessageIcon className="w-5 h-5" />
                            Message
                        </button>
                        <button 
                            onClick={() => currentUser ? toggleFollow('producer', producer.id) : navigate(AppView.LOGIN)}
                            disabled={currentUser?.id === producer.id}
                            className={`px-6 py-3 rounded-xl font-bold transition-all shadow-xl flex items-center gap-2 ${isFollowing ? 'bg-purple-500 text-white' : 'bg-white text-black hover:bg-purple-500 hover:text-white'}`}
                        >
                            {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>
                )}
            </div>

            {/* Beat Store - Directly Under Profile Photo */}
            <div className="mb-12">
                <InstrumentalPlayer instrumentals={producer.instrumentals || []} onPurchase={handlePurchaseClick} producer={producer} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content: Posts & Media Feed */}
                <div className="lg:col-span-8">
                    {/* Instagram-style Feed with Tabs */}
                    <ProducerFeedTabs 
                        posts={posts}
                        mediaItems={mediaItems}
                        producer={producer}
                        onLikePost={likePost}
                        onCommentOnPost={commentOnPost}
                        onSelectAuthor={() => viewProducerProfile(producer)}
                    />
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Biography Card */}
                    <div className="aria-glass rounded-2xl p-6 border border-white/10">
                        <h3 className="text-sm font-black uppercase text-purple-400 tracking-[0.2em] mb-4">Biography</h3>
                        <p className="text-slate-300 leading-relaxed text-base italic">"{producer.bio || 'No biography available.'}"</p>
                    </div>

                    {/* Pull Up Price */}
                    {producer.pull_up_price && (
                        <div className="aria-glass rounded-2xl p-6 border border-white/10 bg-green-500/5">
                            <div className="flex items-center gap-3">
                                <DollarSignIcon className="w-6 h-6 text-green-400"/>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Pull Up Session</p>
                                    <p className="text-xl font-black text-green-400">${producer.pull_up_price}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Masterclass */}
                    {producer.masterclass?.is_enabled && (
                        <div>
                            <MasterclassCard
                                masterclass={producer.masterclass}
                                owner={producer}
                                onPurchase={openPurchaseMasterclassModal}
                                onWatch={openWatchMasterclassModal}
                            />
                        </div>
                    )}

                    {/* Kits & Presets - Sidebar Compact */}
                    <div className="aria-glass rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
                        {/* Decorative background icon */}
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all duration-500">
                            <MusicNoteIcon className="w-12 h-12 text-orange-400" />
                        </div>

                        {/* Header */}
                        <div className="mb-4 flex items-center gap-2 relative z-10">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Kits & Presets</h3>
                        </div>

                        {/* Products List - Compact */}
                        <div className="space-y-3 relative z-10">
                            {(producer.products?.length ?? 0) > 0 ? (
                                (producer.products || []).slice(0, 3).map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:border-orange-500/30 transition-all bg-zinc-900/20 hover:bg-zinc-900/40 group/item"
                                    >
                                        {/* Artwork */}
                                        <div className="flex-shrink-0">
                                            {p.cover_url ? (
                                                <img
                                                    src={p.cover_url}
                                                    alt={p.title}
                                                    className="w-12 h-12 rounded-lg object-cover border border-white/10"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/5">
                                                    <MusicNoteIcon className="w-6 h-6 text-zinc-600" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Title & Price */}
                                        <div className="flex-grow min-w-0">
                                            <p className="font-black text-sm text-slate-100 mb-1 tracking-tight truncate">
                                                {p.title || 'Untitled Product'}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30 font-bold uppercase tracking-[0.1em]">
                                                    {p.type ? p.type.replace(/_/g, ' ') : 'Product'}
                                                </span>
                                                <span className="font-black text-green-400 text-sm">
                                                    ${Number(p.price || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Purchase Button */}
                                        {!isSelf && (
                                            <button
                                                onClick={() => handlePurchaseKit(p)}
                                                disabled={isPurchasingKit || !p.price || p.price <= 0}
                                                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black text-xs hover:from-orange-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Buy
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <MusicNoteIcon className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                                    <p className="text-zinc-500 text-xs">No kits or presets</p>
                                </div>
                            )}
                            {(producer.products?.length ?? 0) > 3 && (
                                <button className="w-full text-xs text-purple-400 hover:text-purple-300 font-bold uppercase tracking-[0.1em] pt-2 border-t border-white/5">
                                    View All ({producer.products?.length})
                                </button>
                            )}
                        </div>
                    </div>
                     {producer.links && producer.links.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-slate-100 flex items-center gap-2"><LinkIcon className="w-5 h-5" /> Links</h3>
                            <div className="space-y-3">
                                {producer.links.map(link => (
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.url} className="p-3 transition-colors flex items-center gap-3 cardSurface hover:bg-zinc-800">
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
                        <h3 className="text-xl font-bold mb-4 text-slate-100 flex items-center gap-2"><UsersIcon className="w-5 h-5" /> Followers ({followers.length})</h3>
                        {followers.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {followers.slice(0, 5).map(f => {
                                    const type = 'amenities' in f ? 'stoodio' : 'specialties' in f ? 'engineer' : 'instrumentals' in f ? 'producer' : 'artist';
                                    const onClick = () => {
                                        // Ensure we have a valid profile object with id before navigating
                                        if (!f || !f.id) return;
                                        if (type === 'artist') viewArtistProfile(f as Artist);
                                        else if (type === 'engineer') viewEngineerProfile(f as Engineer);
                                        else if (type === 'stoodio') viewStoodioDetails(f as Stoodio);
                                        else if (type === 'producer') viewProducerProfile(f as Producer);
                                    }
                                    return <ProfileCard key={f.id} profile={f} type={type} onClick={onClick} />;
                                })}
                            </div>
                        ) : <p className="text-slate-400">No followers yet.</p>}
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-4 text-slate-100 flex items-center gap-2"><UserCheckIcon className="w-5 h-5" /> Following ({followingCount})</h3>
                        {followingCount > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {followedArtists.map(p => <ProfileCard key={p.id} profile={p} type="artist" onClick={() => p?.id && viewArtistProfile(p)} />)}
                                {followedProducers.map(p => <ProfileCard key={p.id} profile={p} type="producer" onClick={() => p?.id && viewProducerProfile(p)} />)}
                                {followedEngineers.map(p => <ProfileCard key={p.id} profile={p} type="engineer" onClick={() => p?.id && viewEngineerProfile(p)} />)}
                                {followedStoodioz.map(p => <ProfileCard key={p.id} profile={p} type="stoodio" onClick={() => p?.id && viewStoodioDetails(p)} />)}
                            </div>
                        ) : <p className="text-slate-400">Not following anyone yet.</p>}
                    </div>
                </div>
            </div>

            {selectedBeat && (
                <PurchaseBeatModal 
                    instrumental={selectedBeat}
                    producer={producer}
                    onClose={() => setSelectedBeat(null)}
                    onConfirm={confirmPurchase}
                    isLoading={isPurchasing}
                />
            )}
        </div>
    );
};

export default ProducerProfile;
