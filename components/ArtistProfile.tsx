import React, { useMemo, useState, useEffect } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Post, Instrumental, AriaActionResponse, Label } from '../types';
import { AppView, UserRole } from '../types';
import { ActionTypes } from '../contexts/AppContext';
import { 
    ChevronLeftIcon, UserPlusIcon, UserCheckIcon, MessageIcon, LinkIcon, 
    UsersIcon, MicrophoneIcon, HouseIcon, SoundWaveIcon, MusicNoteIcon, 
    PhotoIcon, PlayIcon, MagicWandIcon, VerifiedIcon, CloseIcon, BriefcaseIcon, CalendarIcon, ChartBarIcon, CogIcon, EditIcon, ShieldCheckIcon
} from './icons';
import PostFeed from './PostFeed';
import InstrumentalPlayer from './InstrumentalPlayer';
import { useAppState, useAppDispatch } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useMessaging } from '../hooks/useMessaging';
import { useAria } from '../hooks/useAria';
import { fetchUserPosts, fetchFullArtist } from '../services/apiService';
import { ARIA_EMAIL, USER_SILHOUETTE_URL } from '../constants';
import AriaCantataAssistant from './AriaAssistant';

// FIX: Local definition for LockClosedIcon since it's not exported from icons.tsx
const LockClosedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

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
        selectedArtist, artists, currentUser, userRole, engineers, stoodioz, producers, ariaHistory, initialAriaCantataPrompt
    } = useAppState();
    const dispatch = useAppDispatch();
    const { goBack, viewArtistProfile, viewEngineerProfile, viewStoodioDetails, viewProducerProfile, navigate, navigateToStudio } = useNavigation();
    const { toggleFollow, likePost, commentOnPost, createPost } = useSocial();
    const { startConversation } = useMessaging(navigate);
    
    // FIX: Corrected useAria dependencies to include missing logout property
    const { executeCommand } = useAria({
        startConversation, navigate, viewStoodioDetails, viewEngineerProfile, viewProducerProfile, viewArtistProfile, navigateToStudio, confirmBooking: () => {}, updateProfile: () => {}, selectRoleToSetup: () => {}, logout: () => {}
    });

    const [artist, setArtist] = useState<Artist | null>(selectedArtist);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'music' | 'activity' | 'dashboard'>('overview');

    const isAria = useMemo(() => artist?.email === ARIA_EMAIL, [artist]);
    const isOwner = useMemo(() => isAria && currentUser?.id === artist?.id, [isAria, currentUser, artist]);

    useEffect(() => {
        const resolveArtist = async () => {
            const savedId = localStorage.getItem('selected_entity_id');
            const targetId = selectedArtist?.id || savedId;
            
            if (targetId) {
                setIsLoadingDetails(true);
                const existing = artists.find(a => a.id === targetId);
                if (existing) setArtist(existing);
                
                try {
                    // FIX: fetchFullArtist is imported from services/apiService.ts
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

    if (!isAria) {
        // Fallback to standard profile view (not enhanced for Aria)
        const isFollowing = currentUser ? ('following' in currentUser && (currentUser.following.artists || []).includes(artist.id)) : false;
        return (
            <div className="max-w-6xl mx-auto pb-24 animate-fade-in">
                <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                    <ChevronLeftIcon className="w-5 h-5" /> Back
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8">
                        <div className="relative rounded-3xl overflow-hidden mb-8 group">
                            <img src={artist.cover_image_url || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop'} alt={`${artist.name}'s cover`} className="w-full h-64 md:h-80 object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <img src={artist.image_url} alt={artist.name} className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-zinc-900 shadow-2xl" />
                                    <div>
                                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{artist.name}</h1>
                                        <div className="mt-2"><span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full border border-orange-500/20 uppercase tracking-widest">Artist</span></div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => currentUser ? startConversation(artist) : navigate(AppView.LOGIN)} className="px-6 py-3 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-all font-bold flex items-center gap-2 shadow-xl"><MessageIcon className="w-5 h-5" /> Message</button>
                                    <button onClick={() => currentUser ? toggleFollow('artist', artist.id) : navigate(AppView.LOGIN)} disabled={currentUser?.id === artist.id} className={`px-6 py-3 rounded-xl font-bold transition-all shadow-xl flex items-center gap-2 ${isFollowing ? 'bg-orange-500 text-white' : 'bg-white text-black hover:bg-orange-500 hover:text-white'}`}>{isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />} {isFollowing ? 'Following' : 'Follow'}</button>
                                </div>
                            </div>
                        </div>
                        <div className="cardSurface p-8 mb-8"><h3 className="text-sm font-black uppercase text-orange-400 tracking-[0.2em] mb-4">Biography</h3><p className="text-slate-300 leading-relaxed text-lg italic">"{artist.bio}"</p></div>
                        <div className="space-y-8"><h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3"><SoundWaveIcon className="w-6 h-6 text-orange-400" /> Feed & Activity</h3><PostFeed posts={posts} authors={new Map([[artist.id, artist]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={() => {}} /></div>
                    </div>
                </div>
            </div>
        );
    }

    // ENHANCED ARIA VIEW
    return (
        <div className="max-w-7xl mx-auto pb-32 animate-fade-in">
            {/* HERO / PRESENCE MODULE */}
            <div className="relative min-h-[45vh] rounded-[40px] overflow-hidden aria-mesh-gradient border border-white/5 mb-12">
                <div className="absolute inset-0 bg-black/40"></div>
                
                {/* Back button */}
                <button 
                    onClick={goBack}
                    className="absolute top-8 left-8 z-20 flex items-center gap-2 text-zinc-400 hover:text-orange-400 transition-colors font-bold uppercase tracking-widest text-xs"
                >
                    <ChevronLeftIcon className="w-4 h-4" /> System Back
                </button>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
                    <div className="relative mb-6">
                        {/* Soft Glow */}
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
                        {isAria && <VerifiedIcon className="w-5 h-5 text-blue-400" />}
                    </div>
                </div>
            </div>

            {/* SYSTEM TABS */}
            <div className="flex justify-center mb-16">
                <div className="aria-glass p-1.5 rounded-full flex items-center gap-1 border border-white/10 shadow-2xl">
                    <TabButton label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <TabButton label="Music" active={activeTab === 'music'} onClick={() => setActiveTab('music')} />
                    <TabButton label="Activity" active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
                    {isOwner && <TabButton label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isAdmin />}
                </div>
            </div>

            {/* TAB CONTENT COMMAND SWITCH */}
            <div className="space-y-12">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fade-in">
                        {/* LEFT: Action Grid + Player */}
                        <div className="lg:col-span-7 space-y-12">
                            {/* ACTION GRID */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <ActionCard 
                                    icon={<MagicWandIcon className="w-6 h-6 text-orange-400" />}
                                    title="AI Vibe Matcher"
                                    description="Analyze market trends and discover perfect talent pairings for your sonic identity."
                                    color="bg-orange-500/10"
                                    onClick={() => dispatch({ type: ActionTypes.SET_VIBE_MATCHER_OPEN, payload: { isOpen: true } })}
                                />
                                <ActionCard 
                                    icon={<BriefcaseIcon className="w-6 h-6 text-blue-400" />}
                                    title="Secure Asset Vault"
                                    description="Access masters, stems, and legal documents stored in Aria's encrypted repository."
                                    color="bg-blue-500/10"
                                    // FIX: AppView.ASSET_VAULT is defined in types.ts
                                    onClick={() => navigate(AppView.ASSET_VAULT)}
                                />
                                <ActionCard 
                                    icon={<CalendarIcon className="w-6 h-6 text-green-400" />}
                                    title="Global Schedule"
                                    description="Monitor live recording sessions and studio holds across your entire organization."
                                    color="bg-green-500/10"
                                    // FIX: AppView.MASTER_CALENDAR is defined in types.ts
                                    onClick={() => navigate(AppView.MASTER_CALENDAR)}
                                />
                                {userRole === 'LABEL' && (
                                    <ActionCard 
                                        icon={<ChartBarIcon className="w-6 h-6 text-purple-400" />}
                                        title="Scout Intelligence"
                                        description="Data-driven A&R scouting to find trending artists before they break the mainstream."
                                        color="bg-purple-500/10"
                                        onClick={() => navigate(AppView.LABEL_SCOUTING)}
                                    />
                                )}
                            </div>

                            {/* MUSIC PLAYER MODULE */}
                            <div className="aria-glass p-8 rounded-[32px] aria-metal-stroke shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <MusicNoteIcon className="w-12 h-12 text-orange-400" />
                                </div>
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
                                
                                {/* Fake waveform accents */}
                                <div className="flex items-end gap-1 h-8 mt-4 px-4 opacity-10">
                                    {Array.from({ length: 40 }).map((_, i) => (
                                        <div key={i} className="flex-grow bg-orange-400 rounded-full" style={{ height: `${Math.random() * 100}%` }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Sunken Chat Console */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="aria-panel-sunken rounded-[32px] p-6 h-[70vh] flex flex-col relative">
                                {/* Context Pills */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <div className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        Network: Sony Music
                                    </div>
                                    <div className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        Agent: Aria Cantata
                                    </div>
                                    <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                                        Role: {userRole || 'Visitor'}
                                    </div>
                                </div>

                                {/* Memory Snapshot (Conditional) */}
                                {ariaHistory.length > 0 && (
                                    <div className="mb-6 p-4 bg-zinc-900/50 rounded-2xl border border-white/5 text-xs text-zinc-500 space-y-2">
                                        <p className="font-bold text-zinc-400 uppercase tracking-wider text-[9px]">Contextual Memory</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Monitoring organization roadmap</li>
                                            <li>Active session conflict detection enabled</li>
                                            <li>Real-time market trend analysis active</li>
                                        </ul>
                                    </div>
                                )}

                                {/* Embedded Assistant (Stripped Version) */}
                                <div className="flex-grow overflow-hidden flex flex-col">
                                    <AriaCantataAssistant 
                                        isOpen={true} 
                                        onClose={() => {}} 
                                        onExecuteCommand={executeCommand} 
                                        history={ariaHistory} 
                                        setHistory={(h) => dispatch({ type: ActionTypes.SET_ARIA_HISTORY, payload: { history: h } })}
                                        initialPrompt={initialAriaCantataPrompt}
                                        clearInitialPrompt={() => dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: null } })}
                                    />
                                </div>
                                
                                {/* Overlay to prevent assistant's modal styling from breaking layout */}
                                <style>{`
                                    .fixed.inset-0.z-50.flex.items-center.justify-center.p-4 {
                                        position: relative !important;
                                        z-index: 1 !important;
                                        padding: 0 !important;
                                        background: transparent !important;
                                        inset: auto !important;
                                        height: 100% !important;
                                    }
                                    .fixed.inset-0.bg-black\\/60.backdrop-blur-sm { display: none !important; }
                                    .relative.w-full.max-w-2xl.h-\\[85vh\\].bg-zinc-900 {
                                        max-width: none !important;
                                        height: 100% !important;
                                        border: none !important;
                                        background: transparent !important;
                                        box-shadow: none !important;
                                    }
                                    .aria-panel-sunken .flex-grow.overflow-y-auto { scrollbar-width: none; }
                                    .aria-panel-sunken .flex-grow.overflow-y-auto::-webkit-scrollbar { display: none; }
                                `}</style>
                            </div>
                            
                            <div className="cardSurface p-6 bg-zinc-900/30 border-white/5">
                                <p className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.2em] mb-4">Identity Authorization</p>
                                <div className="flex items-center gap-4">
                                    <img src={artist.image_url} className="w-10 h-10 rounded-lg grayscale opacity-50" />
                                    <div>
                                        <p className="text-zinc-200 text-sm font-bold">AriaCantata.os</p>
                                        <p className="text-zinc-600 text-xs font-mono">v4.2.0-stable</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'music' && (
                    <div className="aria-glass p-12 rounded-[40px] animate-fade-in text-center">
                        <MusicNoteIcon className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-zinc-100">Official Discography</h2>
                        <p className="text-zinc-500 mt-2 max-w-md mx-auto">Access high-fidelity stems and masters directly from the Sony Music cloud once finalized.</p>
                        <button className="mt-8 px-8 py-3 bg-zinc-800 text-zinc-400 font-bold rounded-xl border border-white/5 hover:border-orange-500/40 transition-all">
                            Notify on Release
                        </button>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="max-w-4xl mx-auto animate-fade-in">
                        <PostFeed 
                            posts={posts} 
                            authors={new Map([[artist.id, artist]])} 
                            onLikePost={likePost} 
                            onCommentOnPost={commentOnPost} 
                            onSelectAuthor={() => {}} 
                        />
                    </div>
                )}
                
                {activeTab === 'dashboard' && isOwner && (
                    <div className="animate-fade-in space-y-8">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <ActionCard 
                                // FIX: EditIcon is imported from icons.tsx
                                icon={<EditIcon className="w-6 h-6 text-blue-400" />}
                                title="Edit Console"
                                description="Modify Aria's presence, personality core, and metadata."
                                color="bg-blue-500/10"
                                onClick={() => {}}
                            />
                            <ActionCard 
                                icon={<MicrophoneIcon className="w-6 h-6 text-orange-400" />}
                                title="Sync to The Stage"
                                description="Broadcast updates from the operational lead to the wider network."
                                color="bg-orange-500/10"
                                onClick={() => {}}
                            />
                            <ActionCard 
                                // FIX: LockClosedIcon is imported/defined
                                icon={<LockClosedIcon className="w-6 h-6 text-zinc-400" />}
                                title="Secure Config"
                                description="Adjust API keys, endpoint parameters, and system security."
                                color="bg-zinc-800"
                                onClick={() => {}}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArtistProfile;
