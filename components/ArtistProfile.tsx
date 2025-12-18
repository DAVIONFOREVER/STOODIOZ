
import React, { useMemo, useState, useEffect } from 'react';
import type { Artist, Engineer, Stoodio, Producer, Post, AriaActionResponse } from '../types';
import { AppView, UserRole } from '../types';
import { 
    ChevronLeftIcon, UserPlusIcon, UserCheckIcon, MessageIcon, LinkIcon, 
    UsersIcon, MicrophoneIcon, HouseIcon, SoundWaveIcon, MusicNoteIcon, 
    PhotoIcon, PlayIcon, MagicWandIcon, VerifiedIcon, BriefcaseIcon, CalendarIcon, ChartBarIcon, LockClosedIcon, EditIcon
} from './icons';
import PostFeed from './PostFeed';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useMessaging } from '../hooks/useMessaging';
import { useAria } from '../hooks/useAria';
import { fetchUserPosts, fetchFullArtist } from '../services/apiService';
import { ARIA_EMAIL, USER_SILHOUETTE_URL } from '../constants';
import AriaCantataAssistant from './AriaAssistant';

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
    const { toggleFollow, likePost, commentOnPost } = useSocial();
    const { startConversation } = useMessaging(navigate);

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

    if (!artist || isLoadingDetails) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                <p className="text-zinc-500 font-medium">Synchronizing operational console...</p>
            </div>
        );
    }

    if (!isAria) {
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
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
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

    return (
        <div className="max-w-7xl mx-auto pb-32 animate-fade-in">
            <div className="relative min-h-[50vh] rounded-[40px] overflow-hidden aria-mesh-gradient border border-white/5 mb-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-black/30"></div>
                <button onClick={goBack} className="absolute top-10 left-10 z-20 flex items-center gap-3 text-zinc-400 hover:text-orange-400 transition-all font-black uppercase tracking-[0.25em] text-[10px]"><ChevronLeftIcon className="w-4 h-4" /> System Back</button>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-[80px] animate-pulse"></div>
                        <div className="relative animate-aria-float">
                            <img src={artist.image_url} alt="Aria Cantata" className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-[8px] border-zinc-950 shadow-[0_0_60px_rgba(0,0,0,0.8)]" />
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
                                <ActionCard icon={<MagicWandIcon className="w-6 h-6 text-orange-400" />} title="Find a Vibe" description="Leverage neural market analysis to discover perfect collaborative talent for your next project." color="bg-orange-500/10" onClick={() => dispatch({ type: ActionTypes.SET_VIBE_MATCHER_OPEN, payload: { isOpen: true } })} />
                                <ActionCard icon={<BriefcaseIcon className="w-6 h-6 text-blue-400" />} title="Secure the Vault" description="Access high-fidelity masters, stems, and legal agreements from the encrypted Sony repository." color="bg-blue-500/10" onClick={() => navigate(AppView.ASSET_VAULT)} />
                                <ActionCard icon={<CalendarIcon className="w-6 h-6 text-green-400" />} title="Global Schedule" description="Real-time monitoring of recording sessions and studio holds across your organizational network." color="bg-green-500/10" onClick={() => navigate(AppView.MASTER_CALENDAR)} />
                                {userRole === 'LABEL' && <ActionCard icon={<ChartBarIcon className="w-6 h-6 text-purple-400" />} title="Scout Intelligence" description="Data-driven A&R intelligence to identify high-potential artists before mainstream detection." color="bg-purple-500/10" onClick={() => navigate(AppView.LABEL_SCOUTING)} />}
                            </div>
                            <div className="aria-glass p-10 rounded-[40px] aria-metal-stroke shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-all duration-500"><MusicNoteIcon className="w-16 h-16 text-orange-400" /></div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-10 flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></div>Sonic Repository</h3>
                                <div className="py-16 text-center">
                                    <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-inner group-hover:scale-105 transition-transform duration-300"><PlayIcon className="w-10 h-10 text-zinc-700" /></div>
                                    <p className="text-zinc-400 font-black text-xl tracking-tight">Releases coming soon.</p>
                                    <p className="text-zinc-600 text-sm mt-3 max-w-xs mx-auto leading-relaxed">Aria's generative neural compositions are currently undergoing final mastering protocols.</p>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-5 space-y-8">
                            <div className="aria-panel-sunken rounded-[40px] p-8 h-[75vh] flex flex-col relative shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)]">
                                <div className="flex-grow overflow-hidden flex flex-col">
                                    <AriaCantataAssistant isOpen={true} onClose={() => {}} onExecuteCommand={executeCommand} history={ariaHistory} setHistory={(h) => dispatch({ type: ActionTypes.SET_ARIA_HISTORY, payload: { history: h } })} initialPrompt={initialAriaCantataPrompt} clearInitialPrompt={() => dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: null } })} />
                                </div>
                            </div>
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
        </div>
    );
};

export default ArtistProfile;
