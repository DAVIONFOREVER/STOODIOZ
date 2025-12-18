import React, { useMemo, useState, useEffect } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Post } from '../types';
import { AppView } from '../types';
import { 
    ChevronLeftIcon, UserPlusIcon, UserCheckIcon, MessageIcon, LinkIcon, 
    UsersIcon, MicrophoneIcon, HouseIcon, SoundWaveIcon, MusicNoteIcon, 
    PhotoIcon, PlayIcon, MagicWandIcon, BriefcaseIcon, CalendarIcon, ChartBarIcon, CloseIcon 
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
        <button onClick={onClick} className="w-full flex items-center gap-3 p-2 text-left cardSurface aria-glass">
            <img src={profile.image_url} alt={profile.name} className="w-12 h-12 rounded-md object-cover border border-white/5" />
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm text-slate-200 truncate">{profile.name}</p>
                <p className="text-xs text-zinc-500 truncate flex items-center gap-1.5">{icon}{details}</p>
            </div>
        </button>
    );
};

const ArtistProfile: React.FC = () => {
    const { 
        selectedArtist, artists, currentUser, userRole, engineers, stoodioz, producers,
        ariaHistory, initialAriaCantataPrompt
    } = useAppState();
    const dispatch = useAppDispatch();
    const { goBack, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile, navigate } = useNavigation();
    const { toggleFollow, likePost, commentOnPost } = useSocial();
    const { startConversation } = useMessaging(useNavigation().navigate);

    const [artist, setArtist] = useState<Artist | null>(selectedArtist);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'music' | 'activity'>('overview');
    const [isConsoleActive, setIsConsoleActive] = useState(true);

    const isAria = useMemo(() => artist?.email === ARIA_EMAIL, [artist]);

    const allUsers = useMemo(() => [...artists, ...engineers, ...stoodioz, ...producers], [artists, engineers, stoodioz, producers]);
    
    const followers = useMemo(() => {
        if (!artist) return [];
        return allUsers.filter(u => (artist.follower_ids || []).includes(u.id));
    }, [allUsers, artist]);

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
                // FIX: Explicitly cast return from fetchFullArtist as Artist to resolve unknown type error.
                const fullData = (await fetchFullArtist(savedId)) as Artist;
                if (fullData) {
                    // FIX: Ensure fullData is identified as Artist for setState.
                    setArtist(fullData as Artist);
                    // FIX: access .id safely on typed fullData.
                    fetchUserPosts(fullData.id).then(setPosts);
                }
                setIsLoadingDetails(false);
            }
        };
        resolveArtist();
    }, [selectedArtist, artists]);

    if (!artist || isLoadingDetails) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                <p className="text-zinc-500 font-medium">Syncing profile...</p>
            </div>
        );
    }

    const isFollowing = currentUser ? ('following' in currentUser && (currentUser.following.artists || []).includes(artist.id)) : false;

    // --- ARIA SPECIALIZED SECTIONS ---
    
    const AriaCommandGrid = () => {
        const actions = [
            { id: 'vibe', label: 'Analyze Vibe', icon: <MagicWandIcon className="w-6 h-6 text-purple-400" />, onClick: () => dispatch({ type: ActionTypes.SET_VIBE_MATCHER_OPEN, payload: { isOpen: true } }), roles: ['ARTIST', 'PRODUCER', 'LABEL'] },
            { id: 'vault', label: 'Asset Vault', icon: <BriefcaseIcon className="w-6 h-6 text-orange-400" />, onClick: () => navigate(AppView.ASSET_VAULT), roles: ['ARTIST', 'PRODUCER', 'ENGINEER', 'LABEL'] },
            { id: 'calendar', label: 'Master Schedule', icon: <CalendarIcon className="w-6 h-6 text-blue-400" />, onClick: () => navigate(AppView.MASTER_CALENDAR), roles: ['ARTIST', 'LABEL'] },
            { id: 'scout', label: 'Scout Intelligence', icon: <ChartBarIcon className="w-6 h-6 text-green-400" />, onClick: () => navigate(AppView.LABEL_SCOUTING), roles: ['LABEL'] },
        ].filter(a => !userRole || a.roles.includes(userRole));

        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {actions.map(action => (
                    <button key={action.id} onClick={action.onClick} className="aria-command-card aria-glass p-5 rounded-2xl group flex flex-col items-center text-center gap-3">
                        <div className="p-3 bg-zinc-800 rounded-xl group-hover:bg-zinc-700 transition-colors">
                            {action.icon}
                        </div>
                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">{action.label}</span>
                    </button>
                ))}
            </div>
        );
    };

    const AriaMusicModule = () => (
        <div className="aria-glass rounded-3xl p-8 mb-8 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <MusicNoteIcon className="w-24 h-24 text-orange-400" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 cursor-pointer hover:scale-105 transition-transform">
                    <PlayIcon className="w-8 h-8 text-white ml-1" />
                </div>
                <div className="text-center md:text-left">
                    <h3 className="text-2xl font-bold text-zinc-100">Aria's Sonic Signatures</h3>
                    <p className="text-zinc-500 mt-1">High-fidelity compositions arriving in the next cycle.</p>
                </div>
                <div className="flex-grow flex justify-center md:justify-end gap-1 px-4 opacity-30">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="w-1 bg-orange-500/50 rounded-full" style={{ height: `${Math.random() * 30 + 10}px` }}></div>
                    ))}
                </div>
            </div>
        </div>
    );

    // --- MAIN RENDER ---

    if (isAria) {
        return (
            <div className="max-w-6xl mx-auto pb-24 animate-fade-in">
                {/* 1. HERO */}
                <div className="relative rounded-[40px] overflow-hidden aria-panel-sunken mb-12 aria-mesh-bg min-h-[50vh] flex flex-col items-center justify-center p-8">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-2xl scale-125"></div>
                            <img 
                                src={artist.image_url} 
                                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-zinc-800 shadow-2xl animate-aria-float relative z-10" 
                                alt="Aria" 
                            />
                            <div className="absolute -bottom-2 -right-2 bg-orange-500 p-2 rounded-full shadow-lg border-2 border-zinc-900 z-20">
                                <MagicWandIcon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter text-glow">{artist.name}</h1>
                        <p className="text-zinc-400 font-bold uppercase tracking-[0.3em] text-xs mt-4 opacity-60">Strategic A&R Lead &middot; Global Artist</p>
                        
                        <div className="flex gap-4 mt-8">
                            <button 
                                onClick={() => dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } })}
                                className="px-8 py-3 bg-white text-black font-black rounded-full hover:bg-orange-500 hover:text-white transition-all shadow-xl flex items-center gap-2"
                            >
                                <MessageIcon className="w-5 h-5" /> Direct Access
                            </button>
                            <button 
                                onClick={() => toggleFollow('artist', artist.id)}
                                className={`px-8 py-3 rounded-full font-black border-2 transition-all ${isFollowing ? 'border-orange-500/50 bg-orange-500/10 text-orange-400' : 'border-white/10 text-white hover:bg-white/5'}`}
                            >
                                {isFollowing ? 'Tracking' : 'Follow'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. TABS */}
                <div className="flex justify-center mb-12">
                    <div className="inline-flex p-1.5 bg-zinc-900/80 backdrop-blur border border-white/5 rounded-2xl shadow-xl">
                        {[
                            { id: 'overview', label: 'Console' },
                            { id: 'music', label: 'Sonic' },
                            { id: 'activity', label: 'Transmission' }
                        ].map(t => (
                            <button 
                                key={t.id}
                                onClick={() => setActiveTab(t.id as any)}
                                className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-orange-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. CONTENT */}
                <div className="grid grid-cols-1 gap-8">
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            <AriaCommandGrid />
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <AriaMusicModule />
                                    
                                    {isConsoleActive ? (
                                        <div className="aria-panel-sunken rounded-3xl p-1 overflow-hidden animate-slide-up">
                                            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter">Encrypted Operations Portal</span>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <div className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-400 border border-white/5">Role: {userRole || 'Guest'}</div>
                                                    <button 
                                                        onClick={() => setIsConsoleActive(false)}
                                                        className="bg-zinc-800 p-0.5 rounded text-zinc-500 hover:text-white transition-colors"
                                                    >
                                                        <CloseIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="h-[450px] overflow-hidden relative">
                                                <AriaCantataAssistant 
                                                    isOpen={true} 
                                                    onClose={() => {}} 
                                                    onExecuteCommand={async (cmd) => dispatch({ type: ActionTypes.NAVIGATE, payload: { view: AppView.STOODIO_LIST } }) as any}
                                                    history={ariaHistory}
                                                    setHistory={(h) => dispatch({ type: ActionTypes.SET_ARIA_HISTORY, payload: { history: h } })}
                                                    initialPrompt={null}
                                                    clearInitialPrompt={() => {}}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setIsConsoleActive(true)}
                                            className="w-full py-12 rounded-3xl border-2 border-dashed border-zinc-800 flex flex-col items-center gap-3 text-zinc-600 hover:text-orange-400 hover:border-orange-500/30 transition-all group"
                                        >
                                            <MagicWandIcon className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                            <span className="font-black uppercase text-xs tracking-widest">Reactivate Lead Console</span>
                                        </button>
                                    )}
                                </div>
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="cardSurface p-6 aria-glass rounded-3xl">
                                        <h3 className="text-sm font-black uppercase text-orange-400 tracking-widest mb-4">Strategic Bio</h3>
                                        <p className="text-sm text-zinc-300 leading-relaxed italic">"{artist.bio}"</p>
                                    </div>
                                    <div className="cardSurface p-6 aria-glass rounded-3xl">
                                         <h3 className="text-sm font-black uppercase text-orange-400 tracking-widest mb-4">Network Status</h3>
                                         <div className="space-y-3">
                                             <div className="flex justify-between items-center text-xs"><span className="text-zinc-500 font-bold uppercase">Reach</span><span className="text-zinc-100">Global</span></div>
                                             <div className="flex justify-between items-center text-xs"><span className="text-zinc-500 font-bold uppercase">Followers</span><span className="text-zinc-100">{artist.follower_ids.length.toLocaleString()}</span></div>
                                             <div className="flex justify-between items-center text-xs"><span className="text-zinc-500 font-bold uppercase">Clearance</span><span className="text-orange-400">Level 5 (Lead)</span></div>
                                         </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="max-w-3xl mx-auto w-full">
                            <PostFeed posts={posts} authors={new Map([[artist.id, artist]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={() => {}} />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- STANDARD ARTIST VIEW ---
    return (
        <div>
            <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back to Artists
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                <div className="lg:col-span-3">
                     <img src={artist.cover_image_url || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop'} alt={`${artist.name}'s cover`} className="w-full h-64 object-cover rounded-2xl mb-6 shadow-lg" />
                     <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-4">
                        <div className="flex items-start gap-4">
                             <img src={artist.image_url} alt={artist.name} className="w-24 h-24 rounded-full object-cover border-4 border-zinc-700 -mt-12 shadow-lg flex-shrink-0" />
                             <div><h1 className="text-4xl font-extrabold text-orange-500">{artist.name}</h1><p className="text-zinc-400 mt-1">Remote</p></div>
                        </div>
                         <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <button onClick={() => currentUser && startConversation(artist)} disabled={!currentUser || currentUser.id === artist.id} className="px-6 py-3 rounded-lg bg-zinc-700 text-slate-100 hover:bg-zinc-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"><MessageIcon className="w-5 h-5" /> Message</button>
                            <button onClick={() => currentUser && toggleFollow('artist', artist.id)} disabled={!currentUser || currentUser.id === artist.id} className={`flex-shrink-0 px-6 py-3 rounded-lg font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 ${isFollowing ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-orange-400 border-2 border-orange-400 hover:bg-zinc-600'}`}>
                                {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />} {isFollowing ? 'Following' : 'Follow'}
                            </button>
                        </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed mt-4 mb-8">{artist.bio}</p>
                    <div className="mb-10"><PostFeed posts={posts} authors={new Map([[artist.id, artist]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={() => {}} /></div>
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <div className="cardSurface p-6">
                        <h3 className="text-xl font-bold mb-4 text-slate-100 flex items-center gap-2"><UsersIcon className="w-5 h-5" /> Followers ({followers.length})</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {followers.slice(0, 5).map(f => {
                                const type = 'amenities' in f ? 'stoodio' : 'specialties' in f ? 'engineer' : 'instrumentals' in f ? 'producer' : 'artist';
                                return <ProfileCard key={f.id} profile={f} type={type as any} onClick={() => {}} />;
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtistProfile;