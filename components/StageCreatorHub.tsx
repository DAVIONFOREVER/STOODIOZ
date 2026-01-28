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
    onManagePosts: () => void;
    onStartLive: () => void;
    onJoinLive: (roomId: string) => void;
    showTopSections?: boolean;
    showSideSections?: boolean;
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
    onManagePosts,
    onStartLive,
    onJoinLive,
    showTopSections = true,
    showSideSections = true
}) => {
    return (
        <div className={`space-y-6 ${showTopSections ? 'pb-24 md:pb-0' : ''}`}>
            {showTopSections && (
                <>
                    <div className="cardSurface p-5 relative overflow-hidden hidden md:block">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-purple-500/10" />
                        <div className="relative space-y-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src={getProfileImageUrl(currentUser)}
                                    alt={currentUser.name}
                                    className="w-11 h-11 rounded-2xl object-cover ring-2 ring-orange-500/30 shadow-lg shadow-orange-500/20"
                                />
                                <div>
                                    <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Stage Control Engine</p>
                                    <p className="text-lg font-bold text-zinc-100">{currentUser.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4">
                                <div className="space-y-1">
                                    <p className="text-xs uppercase tracking-[0.2em] text-orange-400 font-semibold">Social Stoodio</p>
                                    <p className="text-sm text-zinc-300">Refine captions, visibility, and feed performance.</p>
                                </div>
                                <button
                                    onClick={onOpenAria}
                                    className="px-3 py-2 rounded-full bg-orange-500/20 text-orange-300 text-xs font-semibold hover:bg-orange-500/30"
                                >
                                    Aria Assist
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={onManagePosts} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-left hover:bg-zinc-900 transition-colors shadow-[0_0_16px_rgba(249,115,22,0.08)]">
                                    <div className="flex items-center gap-2">
                                        <EditIcon className="w-4 h-4 text-orange-400" />
                                        <p className="text-sm font-semibold text-zinc-100">Manage Posts</p>
                                    </div>
                                    <p className="mt-1 text-[11px] text-zinc-400">Edit or remove</p>
                                </button>
                                <button onClick={onOpenAria} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-left hover:bg-zinc-900 transition-colors shadow-[0_0_16px_rgba(168,85,247,0.1)]">
                                    <div className="flex items-center gap-2">
                                        <MagicWandIcon className="w-4 h-4 text-purple-400" />
                                        <p className="text-sm font-semibold text-zinc-100">Rewrite Caption</p>
                                    </div>
                                    <p className="mt-1 text-[11px] text-zinc-400">AI tuning</p>
                                </button>
                                <button onClick={() => onNavigate(AppView.INBOX)} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-left hover:bg-zinc-900 transition-colors shadow-[0_0_16px_rgba(16,185,129,0.1)]">
                                    <div className="flex items-center gap-2">
                                        <MagicWandIcon className="w-4 h-4 text-emerald-400" />
                                        <p className="text-sm font-semibold text-zinc-100">Social Replies</p>
                                    </div>
                                    <p className="mt-1 text-[11px] text-zinc-400">AI chat drafts</p>
                                </button>
                                <button onClick={onStartLive} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-left hover:bg-zinc-900 transition-colors shadow-[0_0_16px_rgba(34,211,238,0.08)]">
                                    <div className="flex items-center gap-2">
                                        <MicrophoneIcon className="w-4 h-4 text-cyan-400" />
                                        <p className="text-sm font-semibold text-zinc-100">Go Live Chat</p>
                                    </div>
                                    <p className="mt-1 text-[11px] text-zinc-400">Jump to inbox</p>
                                </button>
                            </div>

                            <div className="pt-4 border-t border-zinc-800/80">
                                <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Quick Access</p>
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    <button onClick={onManagePosts} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-2.5 py-2 text-left hover:bg-zinc-900 transition-colors shadow-[0_0_12px_rgba(249,115,22,0.08)]">
                                        <div className="flex items-center gap-2">
                                            <EditIcon className="w-4 h-4 text-orange-400" />
                                            <p className="text-xs font-semibold text-zinc-100">My Posts</p>
                                        </div>
                                    </button>
                                    <button onClick={() => onNavigate(AppView.MY_BOOKINGS)} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-2.5 py-2 text-left hover:bg-zinc-900 transition-colors shadow-[0_0_12px_rgba(249,115,22,0.08)]">
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4 text-orange-400" />
                                            <p className="text-xs font-semibold text-zinc-100">My Bookings</p>
                                        </div>
                                    </button>
                                    <button onClick={() => onNavigate(AppView.ARTIST_LIST)} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-2.5 py-2 text-left hover:bg-zinc-900 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <MicrophoneIcon className="w-4 h-4 text-green-400" />
                                            <p className="text-xs font-semibold text-zinc-100">Find Artists</p>
                                        </div>
                                    </button>
                                    <button onClick={() => onNavigate(AppView.ENGINEER_LIST)} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-2.5 py-2 text-left hover:bg-zinc-900 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <SoundWaveIcon className="w-4 h-4 text-amber-400" />
                                            <p className="text-xs font-semibold text-zinc-100">Find Engineers</p>
                                        </div>
                                    </button>
                                    <button onClick={() => onNavigate(AppView.PRODUCER_LIST)} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-2.5 py-2 text-left hover:bg-zinc-900 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <MusicNoteIcon className="w-4 h-4 text-purple-400" />
                                            <p className="text-xs font-semibold text-zinc-100">Find Producers</p>
                                        </div>
                                    </button>
                                    <button onClick={() => onNavigate(AppView.STOODIO_LIST)} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-2.5 py-2 text-left hover:bg-zinc-900 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <HouseIcon className="w-4 h-4 text-red-400" />
                                            <p className="text-xs font-semibold text-zinc-100">Find Stoodioz</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="cardSurface p-5 space-y-3 md:hidden">
                        <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Quick Access</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={onManagePosts} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-left hover:bg-zinc-900 transition-colors">
                                <EditIcon className="w-5 h-5 text-orange-400" />
                                <p className="mt-2 text-sm font-semibold text-zinc-100">My Posts</p>
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

                    <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
                        <div className="cardSurface border border-zinc-800/80 bg-zinc-950/90 backdrop-blur p-2">
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    onClick={onManagePosts}
                                    className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-zinc-300 hover:bg-zinc-900/60 transition-colors"
                                >
                                    <EditIcon className="w-5 h-5 text-orange-400" />
                                    <span className="mt-1 text-[10px] uppercase tracking-[0.2em]">Posts</span>
                                </button>
                                <button
                                    onClick={onOpenAria}
                                    className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-zinc-300 hover:bg-zinc-900/60 transition-colors"
                                >
                                    <MagicWandIcon className="w-5 h-5 text-purple-400" />
                                    <span className="mt-1 text-[10px] uppercase tracking-[0.2em]">Aria</span>
                                </button>
                                <button
                                    onClick={() => onNavigate(AppView.INBOX)}
                                    className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-zinc-300 hover:bg-zinc-900/60 transition-colors"
                                >
                                    <MagicWandIcon className="w-5 h-5 text-emerald-400" />
                                    <span className="mt-1 text-[10px] uppercase tracking-[0.2em]">Replies</span>
                                </button>
                                <button
                                    onClick={onStartLive}
                                    className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-zinc-300 hover:bg-zinc-900/60 transition-colors"
                                >
                                    <MicrophoneIcon className="w-5 h-5 text-cyan-400" />
                                    <span className="mt-1 text-[10px] uppercase tracking-[0.2em]">Live</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {showSideSections && (
                <>
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
                </>
            )}
        </div>
    );
};

export default StageCreatorHub;
