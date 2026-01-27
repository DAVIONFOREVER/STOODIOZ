import React from 'react';
import type { Artist, Engineer, Stoodio, Producer, Label, Post } from '../types';
import { AppView } from '../types';
import { MagicWandIcon, CalendarIcon, SoundWaveIcon, MusicNoteIcon, HouseIcon, EditIcon, MicrophoneIcon } from './icons';
import WhoToFollow from './WhoToFollow';
import TrendingPost from './TrendingPost';
import LiveHub from './LiveHub';
import { getProfileImageUrl } from '../constants';

interface StageCreatorHubProps {
    currentUser: Artist | Engineer | Stoodio | Producer | Label;
    suggestions: (Artist | Engineer | Stoodio | Producer | Label)[];
    trendingPost: Post | null;
    trendingPostAuthor: Artist | Engineer | Stoodio | Producer | Label | null;
    onToggleFollow: (type: 'stoodio' | 'engineer' | 'artist' | 'producer' | 'label', id: string) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    onSelectUser: (user: Artist | Engineer | Stoodio | Producer | Label) => void;
    onNavigate: (view: AppView) => void;
    onOpenAria: () => void;
    onStartLive: () => void;
    onJoinLive: (roomId: string) => void;
}

const StageCreatorHub: React.FC<StageCreatorHubProps> = ({
    currentUser,
    suggestions,
    trendingPost,
    trendingPostAuthor,
    onToggleFollow,
    onLikePost,
    onCommentOnPost,
    onSelectUser,
    onNavigate,
    onOpenAria,
    onStartLive,
    onJoinLive
}) => {
    const dashboardView = (() => {
        const role = ((currentUser as any).role || (currentUser as any).profiles?.role || '').toString().toUpperCase();
        if (role === 'ENGINEER') return AppView.ENGINEER_DASHBOARD;
        if (role === 'PRODUCER') return AppView.PRODUCER_DASHBOARD;
        if (role === 'STOODIO') return AppView.STOODIO_DASHBOARD;
        if (role === 'LABEL') return AppView.LABEL_DASHBOARD;
        return AppView.ARTIST_DASHBOARD;
    })();

    return (
        <div className="space-y-6">
            <div className="cardSurface p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-purple-500/10" />
                <div className="relative space-y-4">
                    <div className="flex items-center gap-3">
                        <img src={getProfileImageUrl(currentUser)} alt={currentUser.name} className="w-11 h-11 rounded-2xl object-cover border border-zinc-700" />
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Stage Control Engine</p>
                            <p className="text-lg font-bold text-zinc-100">{currentUser.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4">
                        <div className="space-y-1">
                            <p className="text-xs uppercase tracking-[0.2em] text-orange-400 font-semibold">Social Studio</p>
                            <p className="text-sm text-zinc-300">Refine captions, visibility, and feed performance.</p>
                        </div>
                        <button
                            onClick={onOpenAria}
                            className="px-3 py-2 rounded-full bg-orange-500/20 text-orange-300 text-xs font-semibold hover:bg-orange-500/30"
                        >
                            Aria Assist
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => onNavigate(dashboardView)} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-left hover:bg-zinc-900 transition-colors">
                            <EditIcon className="w-5 h-5 text-orange-400" />
                            <p className="mt-3 text-sm font-semibold text-zinc-100">Manage Posts</p>
                            <p className="text-xs text-zinc-400">Edit, pin, or remove</p>
                        </button>
                        <button onClick={onOpenAria} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-left hover:bg-zinc-900 transition-colors">
                            <MagicWandIcon className="w-5 h-5 text-purple-400" />
                            <p className="mt-3 text-sm font-semibold text-zinc-100">Rewrite Caption</p>
                            <p className="text-xs text-zinc-400">AI tuning</p>
                        </button>
                        <button onClick={() => onNavigate(AppView.INBOX)} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-left hover:bg-zinc-900 transition-colors">
                            <MagicWandIcon className="w-5 h-5 text-emerald-400" />
                            <p className="mt-3 text-sm font-semibold text-zinc-100">Social Replies</p>
                            <p className="text-xs text-zinc-400">AI chat drafts</p>
                        </button>
                        <button onClick={onStartLive} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-left hover:bg-zinc-900 transition-colors">
                            <MicrophoneIcon className="w-5 h-5 text-cyan-400" />
                            <p className="mt-3 text-sm font-semibold text-zinc-100">Go Live Chat</p>
                            <p className="text-xs text-zinc-400">Jump to inbox live</p>
                        </button>
                    </div>
                </div>
            </div>

            <div className="cardSurface p-5 space-y-3">
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Quick Access</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => onNavigate(dashboardView)} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-left hover:bg-zinc-900 transition-colors">
                        <EditIcon className="w-5 h-5 text-orange-400" />
                        <p className="mt-2 text-sm font-semibold text-zinc-100">My Dashboard</p>
                    </button>
                    <button onClick={() => onNavigate(AppView.MY_BOOKINGS)} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-left hover:bg-zinc-900 transition-colors">
                        <CalendarIcon className="w-5 h-5 text-orange-400" />
                        <p className="mt-2 text-sm font-semibold text-zinc-100">My Bookings</p>
                    </button>
                    <button onClick={() => onNavigate(AppView.ARTIST_LIST)} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-left hover:bg-zinc-900 transition-colors">
                        <MicrophoneIcon className="w-5 h-5 text-green-400" />
                        <p className="mt-2 text-sm font-semibold text-zinc-100">Find Artists</p>
                    </button>
                    <button onClick={() => onNavigate(AppView.ENGINEER_LIST)} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-left hover:bg-zinc-900 transition-colors">
                        <SoundWaveIcon className="w-5 h-5 text-amber-400" />
                        <p className="mt-2 text-sm font-semibold text-zinc-100">Find Engineers</p>
                    </button>
                    <button onClick={() => onNavigate(AppView.PRODUCER_LIST)} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-left hover:bg-zinc-900 transition-colors">
                        <MusicNoteIcon className="w-5 h-5 text-purple-400" />
                        <p className="mt-2 text-sm font-semibold text-zinc-100">Find Producers</p>
                    </button>
                    <button onClick={() => onNavigate(AppView.STOODIO_LIST)} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-left hover:bg-zinc-900 transition-colors">
                        <HouseIcon className="w-5 h-5 text-red-400" />
                        <p className="mt-2 text-sm font-semibold text-zinc-100">Find Stoodioz</p>
                    </button>
                </div>
            </div>

            <LiveHub onStartLive={onStartLive} onJoinLive={onJoinLive} />

            {suggestions.length > 0 && (
                <WhoToFollow
                    suggestions={suggestions}
                    onToggleFollow={onToggleFollow}
                    onSelectUser={onSelectUser}
                />
            )}
            {trendingPost && trendingPostAuthor && (
                <TrendingPost
                    post={trendingPost}
                    author={trendingPostAuthor}
                    onLikePost={onLikePost}
                    onCommentOnPost={onCommentOnPost}
                    onSelectUser={onSelectUser}
                />
            )}
        </div>
    );
};

export default StageCreatorHub;
