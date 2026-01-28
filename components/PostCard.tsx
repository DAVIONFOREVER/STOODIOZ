
import React, { useState, useRef, useEffect } from 'react';
import type { Post, Artist, Engineer, Stoodio, Comment, Producer, Label } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { HeartIcon, ChatBubbleIcon, ShareIcon, PaperAirplaneIcon, CogIcon, FlagIcon, CalendarIcon, SoundWaveIcon, MusicNoteIcon, PlayIcon, UsersIcon, EditIcon, CloseCircleIcon } from './icons.tsx';
import { useAppState } from '../contexts/AppContext.tsx';
import { useOnScreen } from '../hooks/useOnScreen.ts';
import StageMediaFrame from './StageMediaFrame';
import { getProfileImageUrl, getDisplayName } from '../constants';

interface PostCardProps {
    post: Post;
    author: Artist | Engineer | Stoodio | Producer | Label;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    onSelectAuthor: () => void;
    onEditPost?: (postId: string, text: string) => void;
    onDeletePost?: (postId: string) => void;
    isManaging?: boolean;
    useFixedFrame?: boolean;
    variant?: 'standard' | 'reel';
}

const PostCard: React.FC<PostCardProps> = ({ post, author, onLikePost, onCommentOnPost, onSelectAuthor, onEditPost, onDeletePost, isManaging = false, useFixedFrame = false, variant = 'standard' }) => {
    const { currentUser } = useAppState();
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(post.text || '');
    const [isSaving, setIsSaving] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    // Video optimization refs (for legacy view only)
    const videoRef = useRef<HTMLVideoElement>(null);
    const isVisible = useOnScreen(videoRef as any, '0px');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle video auto-play/pause based on visibility (Legacy View Logic)
    useEffect(() => {
        if (videoRef.current && !useFixedFrame) {
            if (isVisible) {
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                         // Auto-play was prevented
                    });
                }
            } else {
                videoRef.current.pause();
            }
        }
    }, [isVisible, useFixedFrame]);

    useEffect(() => {
        setEditText(post.text || '');
    }, [post.text]);

    if (!currentUser) return null;
    const isReel = variant === 'reel';
    const canManage = currentUser.id === author.id;

    const isLiked = post.likes.includes(currentUser.id);

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (commentText.trim()) {
            onCommentOnPost(post.id, commentText.trim());
            setCommentText('');
        }
    };

    const handleReport = () => {
        alert('Post reported. Our team will review it shortly. Thank you for helping keep Stoodioz safe.');
        setIsMenuOpen(false);
    };

    const handleEditStart = () => {
        setIsEditing(true);
        setIsMenuOpen(false);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditText(post.text || '');
    };

    const handleEditSave = async () => {
        if (!onEditPost) return;
        setIsSaving(true);
        try {
            await onEditPost(post.id, editText.trim());
            setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        if (!onDeletePost) return;
        setIsMenuOpen(false);
        onDeletePost(post.id);
    };

    const handleCTA = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectAuthor();
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/post/${post.id}`;
        const authorName = getDisplayName(author);
        const shareData = {
            title: `Post by ${authorName}`,
            text: post.text,
            url: url
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(url);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error("Error sharing:", err);
            // Fallback
            await navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    };

    // Helper to detect video links
    const getVideoEmbedUrl = (url: string): string | null => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
                const videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
                return `https://www.youtube.com/embed/${videoId}`;
            }
            if (urlObj.hostname.includes('vimeo.com')) {
                const videoId = urlObj.pathname.split('/').pop();
                return `https://player.vimeo.com/video/${videoId}`;
            }
        } catch (e) {
            return null;
        }
        return null;
    };

    const externalVideoUrl = post.link ? getVideoEmbedUrl(post.link.url) : null;

    return (
        <div className={`cardSurface group relative overflow-hidden border border-zinc-800/70 bg-gradient-to-br from-zinc-950/55 via-zinc-900/45 to-zinc-950/55 shadow-[0_0_40px_rgba(249,115,22,0.08)] ${isManaging && canManage ? 'ring-1 ring-orange-500/30' : ''} ${isReel ? 'rounded-[20px]' : (useFixedFrame ? 'rounded-3xl' : 'rounded-2xl')}`}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.12),_transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="pointer-events-none absolute left-0 top-0 h-0.5 w-full bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />
            <div className={isReel ? 'relative p-4' : 'relative p-6'}>
                {/* Post Header */}
                <div className={`flex items-start justify-between gap-4 ${isReel ? 'mb-5' : 'mb-4'}`}>
                    <button onClick={onSelectAuthor} className="flex items-center gap-4 group text-left">
                        <img src={getProfileImageUrl(author)} alt={getDisplayName(author)} className="w-12 h-12 rounded-xl object-cover" />
                        <div>
                            <p className="font-bold text-slate-100 group-hover:text-orange-400 transition-colors">{getDisplayName(author)}</p>
                            <p className="text-sm text-slate-400">{formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</p>
                        </div>
                    </button>
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-500 hover:text-slate-200 p-2 rounded-full">
                            <CogIcon className="w-5 h-5" />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute top-full right-0 mt-1 w-44 bg-zinc-700 rounded-md shadow-lg z-10 border border-zinc-600">
                                {canManage && onEditPost && (
                                    <button onClick={handleEditStart} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-zinc-600">
                                        <EditIcon className="w-4 h-4"/> Edit Post
                                    </button>
                                )}
                                {canManage && onDeletePost && (
                                    <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-300 hover:bg-zinc-600">
                                        <CloseCircleIcon className="w-4 h-4"/> Delete Post
                                    </button>
                                )}
                                <button onClick={handleReport} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-zinc-600">
                                    <FlagIcon className="w-4 h-4"/> Report Post
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {isReel && (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">The Stage</span>
                    </div>
                )}

                {/* Post Content */}
                {isEditing ? (
                    <div className="mb-4 space-y-3">
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={4}
                            className="w-full bg-zinc-900/80 border border-zinc-700/80 text-slate-100 rounded-xl p-3 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Edit your caption..."
                        />
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={handleEditCancel}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-300 border border-zinc-700 hover:bg-zinc-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleEditSave}
                                disabled={isSaving}
                                className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                ) : (
                    post.text && <p className="text-slate-300 whitespace-pre-wrap mb-4">{post.text}</p>
                )}
                
                {useFixedFrame ? (
                    // The Stage (Feed) View using Fixed Media Frame
                    <div className={isReel ? 'my-3' : 'my-4'}>
                        {post.image_url && (
                            <StageMediaFrame 
                                src={post.image_url} 
                                type="image" 
                                displayMode={post.display_mode}
                                focusPoint={post.focus_point}
                                variant={isReel ? 'reel' : 'stage'}
                            />
                        )}
                        {post.video_url && (
                            <StageMediaFrame 
                                src={post.video_url} 
                                type="video" 
                                thumbnailUrl={post.video_thumbnail_url} 
                                displayMode={post.display_mode}
                                focusPoint={post.focus_point}
                                variant={isReel ? 'reel' : 'stage'}
                            />
                        )}
                    </div>
                ) : (
                    // Legacy View (Profile/Standard)
                    <>
                        {post.image_url && (
                            <div className="my-4 rounded-lg overflow-hidden border border-zinc-700">
                                <img loading="lazy" src={post.image_url} alt="Post content" className="w-full h-auto object-cover"/>
                            </div>
                        )}
                        
                        {post.video_url && (
                            <div className="my-4 rounded-lg overflow-hidden border border-zinc-700 aspect-video relative bg-black">
                                <video
                                    ref={videoRef}
                                    src={post.video_url}
                                    controls 
                                    playsInline
                                    muted 
                                    className="w-full h-full object-contain"
                                    poster={post.video_thumbnail_url}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* External Video Embed (YouTube/Vimeo) - Not affected by Fixed Frame for now */}
                {externalVideoUrl && (
                     <div className="my-4 rounded-lg overflow-hidden border border-zinc-700 aspect-video relative bg-black">
                        <iframe 
                            src={externalVideoUrl} 
                            className="w-full h-full" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        ></iframe>
                    </div>
                )}
                
                {/* Standard Link Preview (if not a video) */}
                {post.link && !externalVideoUrl && (
                    <a href={post.link.url} target="_blank" rel="noopener noreferrer" className="block bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 hover:bg-zinc-700 transition-colors mt-2">
                        {post.link.image_url && <img src={post.link.image_url} alt={post.link.title} className="w-full h-32 object-cover" />}
                        <div className="p-3">
                            <p className="font-bold text-zinc-200 truncate">{post.link.title}</p>
                            <p className="text-xs text-zinc-400 truncate mt-1">{post.link.description}</p>
                            <p className="text-xs text-orange-400 mt-2">{new URL(post.link.url).hostname}</p>
                        </div>
                    </a>
                )}

            </div>

            {/* Contextual CTA */}
            {post.authorType !== 'ARTIST' && currentUser.id !== author.id && (
                <div className="px-6 pb-4">
                    <button onClick={handleCTA} className="w-full bg-orange-500/10 text-orange-400 font-bold py-2 px-4 rounded-lg hover:bg-orange-500/20 transition-colors text-sm flex items-center justify-center gap-2">
                        {post.authorType === 'STOODIO' && <><CalendarIcon className="w-4 h-4"/> Book this Stoodio</>}
                        {post.authorType === 'ENGINEER' && <><SoundWaveIcon className="w-4 h-4"/> Request Session</>}
                        {post.authorType === 'PRODUCER' && <><MusicNoteIcon className="w-4 h-4"/> View Beats</>}
                        {post.authorType === 'LABEL' && <><UsersIcon className="w-4 h-4"/> View Label</>}
                    </button>
                </div>
            )}

            {/* Post Actions */}
            <div className="border-t border-zinc-800/80 mx-4 sm:mx-6 my-4 py-2 flex justify-around items-center text-slate-400 bg-zinc-950/50 rounded-full backdrop-blur">
                <button
                    onClick={() => onLikePost(post.id)}
                    className={`flex items-center gap-1.5 font-semibold transition-colors p-2 rounded-lg text-sm ${isLiked ? 'text-orange-400' : 'hover:text-orange-400'}`}
                >
                    <HeartIcon className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">Like</span>
                    <span>({post.likes.length})</span>
                </button>
                <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-1.5 font-semibold transition-colors p-2 rounded-lg text-sm ${showComments ? 'text-orange-400' : 'hover:text-orange-400'}`}>
                    <ChatBubbleIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Comment</span>
                    <span>({post.comments.length})</span>
                </button>
                <button onClick={handleShare} className="flex items-center gap-1.5 font-semibold hover:text-orange-400 transition-colors p-2 rounded-lg text-sm">
                    <ShareIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Share</span>
                </button>
            </div>
            
            {/* Comments Section */}
            {showComments && (
                <div className="border-t border-zinc-700 p-6 space-y-4 bg-zinc-800/50 rounded-b-2xl">
                    {post.comments.length > 0 ? (
                        post.comments.map(comment => (
                            <div key={comment.id} className="flex items-start gap-3">
                                <img src={getProfileImageUrl({ image_url: comment.author_image_url })} alt={comment.authorName} className="w-8 h-8 rounded-lg object-cover mt-1"/>
                                <div>
                                    <div className="bg-orange-500 rounded-xl p-3 shadow-[0_0_18px_rgba(249,115,22,0.25)]">
                                        <p className="font-semibold text-sm text-white">{comment.authorName}</p>
                                        <p className="text-sm text-white/90">{comment.text}</p>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 pl-1">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-center text-slate-400">No comments yet.</p>
                    )}
                     {/* Comment Form */}
                    <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pt-4">
                        <img src={getProfileImageUrl(currentUser)} alt="Your profile" className="w-8 h-8 rounded-lg object-cover"/>
                         <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full bg-zinc-700 border-zinc-600 text-slate-200 placeholder:text-slate-400 rounded-full py-2 px-4 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        />
                        <button type="submit" disabled={!commentText.trim()} className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors flex-shrink-0 disabled:bg-slate-600">
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

// Use React.memo to prevent re-rendering if props haven't changed
export default React.memo(PostCard, (prevProps, nextProps) => {
    return (
        prevProps.post.id === nextProps.post.id &&
        prevProps.post.likes.length === nextProps.post.likes.length &&
        prevProps.post.comments.length === nextProps.post.comments.length &&
        prevProps.author.id === nextProps.author.id &&
        prevProps.useFixedFrame === nextProps.useFixedFrame &&
        prevProps.variant === nextProps.variant
    );
});
