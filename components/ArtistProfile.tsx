import React, { useMemo, useState, useEffect } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Post } from '../types';
import { AppView } from '../types';
import { 
    ChevronLeftIcon, UserPlusIcon, UserCheckIcon, MessageIcon, LinkIcon, 
    UsersIcon, MicrophoneIcon, HouseIcon, SoundWaveIcon, MusicNoteIcon, 
    PhotoIcon, PlayIcon, MagicWandIcon, VerifiedIcon, BriefcaseIcon, CalendarIcon
} from './icons';
import PostFeed from './PostFeed';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useMessaging } from '../hooks/useMessaging';
import { fetchUserPosts, fetchFullArtist } from '../services/apiService';
import { ARIA_EMAIL, USER_SILHOUETTE_URL } from '../constants';
import AriaCantataAssistant from './AriaAssistant';

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

const ArtistProfile: React.FC = () => {
    const { 
        selectedArtist, artists, currentUser, engineers, stoodioz, producers, userRole
    } = useAppState();
    const dispatch = useAppDispatch();
    const { goBack, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile, navigate } = useNavigation();
    const { toggleFollow, likePost, commentOnPost } = useSocial();
    const { startConversation } = useMessaging(navigate);

    const [artist, setArtist] = useState<Artist | null>(selectedArtist);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'music' | 'activity'>('overview');

    const isAria = useMemo(() => artist?.email === ARIA_EMAIL, [artist]);

    useEffect(() => {
        const resolveArtist = async () => {
            const savedId = localStorage.getItem('selected_entity_id');
            const targetId = selectedArtist?.id || savedId;

            if (targetId) {
                setIsLoadingDetails(true);
                const existing = artists.find(a => a.id === targetId);
                if (existing) setArtist(existing);
                
                try {
                    const fullData = await fetchFullArtist(targetId);
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

    if (!artist || isLoadingDetails) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                <p className="text-zinc-500 font-medium">Calibrating console...</p>
            </div>
        );
    }

    const isFollowing = currentUser ? ('following' in currentUser && (currentUser.following.artists || []).includes(artist.id)) : false;

    // --- ARIA PREMIUM VIEW ---
    if (isAria) {
        return (
            <div className="max-w-7xl mx-auto pb-32 animate-fade-in">
                {/* HERO / PRESENCE MODULE */}
                <div className="relative min-h-[45vh] rounded-[40px] overflow-hidden aria-mesh-gradient border border-white/5 mb-12">
                    <div className="absolute inset-0 bg-black/40"></div>
                    
                    <button 
                        onClick={goBack}
                        className="absolute top-8 left-8 z-20 flex items-center gap-2 text-zinc-400 hover:text-orange-400 transition-colors font-bold uppercase tracking-widest text-xs"
                    >
                        <ChevronLeftIcon className="w-4 h-4" /> System Back
                    </button>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-orange-500/30 rounded-full blur-[60px] animate-pulse"></div>
                            <div className="relative animate-aria-float">
                                <img 
                                    src={artist.image_url} 
                                    alt="Aria Cantata" 
                                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-[6px] border-zinc-950 shadow-[0_0_40px_rgba(0,0,0,0.5)]" 
                                />
                                <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-orange-500 to-purple-600 p-2 rounded-xl shadow-xl">
                                    <MagicWandIcon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-2 text-glow">
                            {artist.name}
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400 bg-orange-500/10 px-4 py-1.5 rounded-full border border-orange-500/20">
                                Operational Intelligence
                            </span>
                            <VerifiedIcon className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>
                </div>

                {/* INTERACTIVE ACTION GRID */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    <div className="md:col-span-8 space-y-12">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ActionCard 
                                icon={<MagicWandIcon className="w-6 h-6 text-orange-400" />}
                                title="AI Vibe Matcher"
                                description="Discover perfect talent pairings for your sonic identity."
                                color="bg-orange-500/10"
                                onClick={() => dispatch({ type: ActionTypes.SET_VIBE_MATCHER_OPEN, payload: { isOpen: true } })}
                            />
                            <ActionCard 
                                icon={<BriefcaseIcon className="w-6 h-6 text-blue-400" />}
                                title="Secure Asset Vault"
                                description="Access masters, stems, and legal documents."
                                color="bg-blue-500/10"
                                onClick={() => navigate(AppView.ASSET_VAULT)}
                            />
                            <ActionCard 
                                icon={<CalendarIcon className="w-6 h-6 text-green-400" />}
                                title="Global Schedule"
                                description="Monitor live recording sessions across the network."
                                color="bg-green-500/10"
                                onClick={() => navigate(AppView.MASTER_CALENDAR)}
                            />
                            {userRole === 'LABEL' && (
                                <ActionCard 
                                    icon={<UsersIcon className="w-6 h-6 text-purple-400" />}
                                    title="Scout Intelligence"
                                    description="A&R scouting to find trending artists before they break."
                                    color="bg-purple-500/10"
                                    onClick={() => navigate(AppView.LABEL_SCOUTING)}
                                />
                            )}
                        </div>

                        {/* MUSIC PLAYER MODULE */}
                        <div className="aria-glass p-8 rounded-[32px] aria-metal-stroke shadow-2xl relative overflow-hidden group">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-8 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                                Sonic Repository
                            </h3>
                            <div className="py-12 text-center">
                                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                                    <PlayIcon className="w-8 h-8 text-zinc-700" />
                                </div>
                                <p className="text-zinc-400 font-bold text-lg">Releases coming soon.</p>
                                <p className="text-zinc-600 text-sm mt-2 max-w-xs mx-auto">Aria's neural compositions are currently in final mastering.</p>
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR / CHAT CONTEXT */}
                    <div className="md:col-span-4 space-y-6">
                        <div className="aria-panel-sunken rounded-[32px] p-6 h-[60vh] flex flex-col relative">
                            <div className="flex flex-wrap gap-2 mb-6">
                                <div className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sony Music Core</div>
                                <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] font-bold text-orange-400 uppercase tracking-widest">Role: {userRole || 'Visitor'}</div>
                            </div>
                            <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                                <MagicWandIcon className="w-12 h-12 text-zinc-700 mb-4" />
                                <p className="text-zinc-500 text-sm italic">Direct Assistant access is available via the floating terminal in the bottom right corner of the interface.</p>
                            </div>
                        </div>
                        <div className="cardSurface p-6 bg-zinc-900/30 border-white/5 text-center">
                             <p className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.2em] mb-2">System Auth</p>
                             <p className="text-zinc-200 text-sm font-bold">AriaCantata.os</p>
                             <p className="text-zinc-600 text-xs font-mono">v4.2.0-stable</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- STANDARD ARTIST VIEW ---
    return (
        <div className="max-w-6xl mx-auto pb-24 animate-fade-in">
            <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" /> Back
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
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
                                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{artist.name}</h1>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full border border-orange-500/20 uppercase tracking-widest">Artist</span>
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

                <div className="lg:col-span-4 space-y-8">
                    <div className="cardSurface p-6">
                        <h3 className="text-sm font-black uppercase text-zinc-500 tracking-widest mb-6 flex items-center justify-between">
                            <span>Followers</span>
                            <span className="text-zinc-400">{(artist.follower_ids || []).length}</span>
                        </h3>
                        <div className="space-y-3 text-center py-4 text-zinc-600 text-sm italic">
                            Social connections visible in active roster view.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtistProfile;