import React, { useMemo, useState, useEffect } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Post } from '../types';
import { AppView } from '../types';
import { 
    ChevronLeftIcon, UserPlusIcon, UserCheckIcon, MessageIcon, LinkIcon, 
    UsersIcon, MicrophoneIcon, HouseIcon, SoundWaveIcon, MusicNoteIcon, 
    PhotoIcon, PlayIcon, MagicWandIcon, VerifiedIcon 
} from './icons';
import PostFeed from './PostFeed';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useMessaging } from '../hooks/useMessaging';
import { fetchUserPosts, fetchFullArtist } from '../services/apiService';
import { ARIA_EMAIL, USER_SILHOUETTE_URL } from '../constants';

const ProfileCard: React.FC<{
    profile: Stoodio | Engineer | Artist | Producer;
    type: 'stoodio' | 'engineer' | 'artist' | 'producer';
    onClick: () => void;
}> = ({ profile, type, onClick }) => {
    let icon = <MicrophoneIcon className="w-4 h-4" />;
    let details = (profile as any).bio || (profile as any).location || '';

    if (type === 'stoodio') icon = <HouseIcon className="w-4 h-4" />;
    else if (type === 'engineer') icon = <SoundWaveIcon className="w-4 h-4" />;
    else if (type === 'producer') icon = <MusicNoteIcon className="w-4 h-4" />;

    return (
        <button onClick={onClick} className="w-full flex items-center gap-3 p-2 text-left cardSurface hover:border-orange-500/40 transition-all">
            <img src={profile.image_url || USER_SILHOUETTE_URL} alt={profile.name} className="w-12 h-12 rounded-md object-cover border border-white/5" />
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm text-slate-200 truncate">{profile.name}</p>
                <p className="text-xs text-zinc-500 truncate flex items-center gap-1.5">{icon}{details}</p>
            </div>
        </button>
    );
};

const ArtistProfile: React.FC = () => {
    const { 
        selectedArtist, artists, currentUser, engineers, stoodioz, producers
    } = useAppState();
    const dispatch = useAppDispatch();
    const { goBack, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile, navigate } = useNavigation();
    const { toggleFollow, likePost, commentOnPost } = useSocial();
    const { startConversation } = useMessaging(navigate);

    const [artist, setArtist] = useState<Artist | null>(selectedArtist);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);

    const isAria = useMemo(() => artist?.email === ARIA_EMAIL, [artist]);

    useEffect(() => {
        const resolveArtist = async () => {
            if (selectedArtist) {
                setArtist(selectedArtist);
                fetchUserPosts(selectedArtist.id).then(setPosts);
                return;
            }
            const savedId = localStorage.getItem('selected_entity_id');
            if (savedId) {
                setIsLoadingDetails(true);
                const existing = artists.find(a => a.id === savedId);
                if (existing) setArtist(existing);
                
                try {
                    const fullData = await fetchFullArtist(savedId);
                    if (fullData) {
                        setArtist(fullData as Artist);
                        fetchUserPosts(fullData.id).then(setPosts);
                    }
                } catch (e) {
                    console.error("Failed to load artist details", e);
                } finally {
                    setIsLoadingDetails(false);
                }
            }
        };
        resolveArtist();
    }, [selectedArtist, artists]);

    const allUsers = useMemo(() => [...artists, ...engineers, ...stoodioz, ...producers], [artists, engineers, stoodioz, producers]);
    
    const followers = useMemo(() => {
        if (!artist) return [];
        return allUsers.filter(u => (artist.follower_ids || []).includes(u.id));
    }, [allUsers, artist]);

    if (!artist || isLoadingDetails) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                <p className="text-zinc-500 font-medium">Syncing profile...</p>
            </div>
        );
    }

    const isFollowing = currentUser ? ('following' in currentUser && (currentUser.following.artists || []).includes(artist.id)) : false;

    return (
        <div className="max-w-6xl mx-auto pb-24 animate-fade-in">
            <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Main Content Area */}
                <div className="lg:col-span-8">
                    <div className="relative rounded-3xl overflow-hidden mb-8 group">
                        <img 
                            src={artist.cover_image_url || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop'} 
                            alt={`${artist.name}'s cover`} 
                            className="w-full h-64 md:h-80 object-cover" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <img src={artist.image_url} alt={artist.name} className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-zinc-900 shadow-2xl" />
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{artist.name}</h1>
                                        {isAria && <VerifiedIcon className="w-8 h-8 text-blue-400" />}
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full border border-orange-500/20 uppercase tracking-widest">Artist</span>
                                        {isAria && <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full border border-purple-500/20 uppercase tracking-widest">A&R Lead</span>}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => currentUser ? startConversation(artist) : navigate(AppView.LOGIN)} 
                                    className="px-6 py-3 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-all font-bold flex items-center gap-2 shadow-xl"
                                >
                                    <MessageIcon className="w-5 h-5" /> Message
                                </button>
                                <button 
                                    onClick={() => currentUser ? toggleFollow('artist', artist.id) : navigate(AppView.LOGIN)} 
                                    disabled={currentUser?.id === artist.id}
                                    className={`px-6 py-3 rounded-xl font-bold transition-all shadow-xl flex items-center gap-2 ${isFollowing ? 'bg-orange-500 text-white' : 'bg-white text-black hover:bg-orange-500 hover:text-white'}`}
                                >
                                    {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="cardSurface p-8 mb-8">
                        <h3 className="text-sm font-black uppercase text-orange-400 tracking-[0.2em] mb-4">Biography</h3>
                        <p className="text-slate-300 leading-relaxed text-lg italic">"{artist.bio}"</p>
                    </div>

                    <div className="space-y-8">
                        <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                            <SoundWaveIcon className="w-6 h-6 text-orange-400" />
                            Feed & Activity
                        </h3>
                        <PostFeed posts={posts} authors={new Map([[artist.id, artist]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={() => {}} />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    {isAria && (
                        <div className="bg-gradient-to-br from-orange-500 to-purple-600 p-px rounded-3xl shadow-2xl shadow-orange-500/10">
                            <div className="bg-zinc-950 rounded-[23px] p-6 text-center">
                                <MagicWandIcon className="w-12 h-12 text-orange-400 mx-auto mb-4 animate-aria-float" />
                                <h3 className="text-xl font-bold text-white mb-2">Need Strategic Advice?</h3>
                                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">Ask Aria anything about talent scouting, market trends, or project management.</p>
                                <button 
                                    onClick={() => dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } })}
                                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl transition-all shadow-lg"
                                >
                                    Direct Assistant Access
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="cardSurface p-6">
                        <h3 className="text-sm font-black uppercase text-zinc-500 tracking-widest mb-6 flex items-center justify-between">
                            <span>Followers</span>
                            <span className="text-zinc-400">{followers.length}</span>
                        </h3>
                        <div className="space-y-3">
                            {followers.slice(0, 5).map(f => {
                                const type = 'amenities' in f ? 'stoodio' : 'specialties' in f ? 'engineer' : 'instrumentals' in f ? 'producer' : 'artist';
                                return <ProfileCard key={f.id} profile={f} type={type as any} onClick={() => {
                                    if (type === 'stoodio') viewStoodioDetails(f as any);
                                    else if (type === 'engineer') viewEngineerProfile(f as any);
                                    else if (type === 'producer') viewProducerProfile(f as any);
                                    else viewArtistProfile(f as any);
                                }} />;
                            })}
                            {followers.length === 0 && <p className="text-zinc-600 text-sm italic text-center py-4">No followers yet.</p>}
                        </div>
                    </div>

                    {artist.links && artist.links.length > 0 && (
                        <div className="cardSurface p-6">
                            <h3 className="text-sm font-black uppercase text-zinc-500 tracking-widest mb-6">Social Connections</h3>
                            <div className="space-y-3">
                                {artist.links.map((link, i) => (
                                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-white/5 transition-all text-sm group">
                                        <LinkIcon className="w-4 h-4 text-zinc-500 group-hover:text-orange-400" />
                                        <span className="text-zinc-300 font-bold truncate">{link.title || link.url}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArtistProfile;