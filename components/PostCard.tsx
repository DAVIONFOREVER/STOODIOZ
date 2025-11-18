


import React, { useState, useRef, useEffect } from 'react';
import type { Post, Artist, Engineer, Stoodio, Comment, Producer } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { HeartIcon, ChatBubbleIcon, ShareIcon, PaperAirplaneIcon, CogIcon, FlagIcon, CalendarIcon, SoundWaveIcon, MusicNoteIcon, PlayIcon } from './icons.tsx';
import { useAppState } from '../contexts/AppContext.tsx';

interface PostCardProps {
    post: Post;
    author: Artist | Engineer | Stoodio | Producer;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    onSelectAuthor: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, author, onLikePost, onCommentOnPost, onSelectAuthor }) => {
    const { currentUser } = useAppState();
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!currentUser) return null;

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

    const handleCTA = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectAuthor();
    };

    return (
        <div className="rounded-2xl cardSurface overflow-hidden">
            <div className="p-6">
                {/* Post Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <button onClick={onSelectAuthor} className="flex items-center gap-4 group text-left">
                        <img src={author.image_url} alt={author.name} className="w-12 h-12 rounded-xl object-cover" />
                        <div>
                            <p className="font-bold text-slate-100 group-hover:text-orange-400 transition-colors">{author.name}</p>
                            <p className="text-sm text-slate-400">{formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</p>
                        </div>
                    </button>
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-500 hover:text-slate-200 p-2 rounded-full">
                            <CogIcon className="w-5 h-5" />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute top-full right-0 mt-1 w-40 bg-zinc-700 rounded-md shadow-lg z-10 border border-zinc-600">
                                <button onClick={handleReport} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-zinc-600">
                                    <FlagIcon className="w-4 h-4"/> Report Post
                                </button>
                            </div>
                        )}
                    </div>
                </div>


                {/* Post Content */}
                {post.text && <p className="text-slate-300 whitespace-pre-wrap mb-4">{post.text}</p>}
                
                {post.image_url && (
                    <div className="my-4 rounded-lg overflow-hidden border border-zinc-700">
                        <img src={post.image_url} alt="Post content" className="w-full h-auto object-cover"/>
                    </div>
                )}
                {post.videoUrl && post.videoThumbnailUrl && (
                    <div className="my-4 rounded-lg overflow-hidden border border-zinc-700 aspect-video relative bg-black">
                        {isPlaying ? (
                            <video
                                src={post.videoUrl}
                                controls
                                autoPlay
                                playsInline
                                className="w-full h-full object-contain"
                                poster={post.videoThumbnailUrl}
                                onEnded={() => setIsPlaying(false)}
                            />
                        ) : (
                            <button onClick={() => setIsPlaying(true)} className="w-full h-full block relative group" aria-label="Play video">
                                <img src={post.videoThumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity opacity-70 group-hover:opacity-100">
                                     <div className="bg-black/50 rounded-full p-4 transition-transform group-hover:scale-110">
                                        <PlayIcon className="w-10 h-10 text-white"/>
                                    </div>
                                </div>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Contextual CTA */}
            {post.authorType !== 'ARTIST' && currentUser.id !== author.id && (
                <div className="px-6 pb-4">
                    <button onClick={handleCTA} className="w-full bg-orange-500/10 text-orange-400 font-bold py-2 px-4 rounded-lg hover:bg-orange-500/20 transition-colors text-sm flex items-center justify-center gap-2">
                        {post.authorType === 'STOODIO' && <><CalendarIcon className="w-4 h-4"/> Book this Stoodio</>}
                        {post.authorType === 'ENGINEER' && <><SoundWaveIcon className="w-4 h-4"/> Request Session</>}
                        {post.authorType === 'PRODUCER' && <><MusicNoteIcon className="w-4 h-4"/> View Beats</>}
                    </button>
                </div>
            )}

            {/* Post Actions */}
            <div className="border-t border-zinc-700 mx-4 sm:mx-6 py-1 flex justify-around items-center text-slate-400">
                <button
                    onClick={() => onLikePost(post.id)}
                    className={`flex items-center gap-1.5 font-semibold transition-colors p-2 rounded-lg text-sm ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                >
                    <HeartIcon className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">Like</span>
                    <span>({post.likes.length})</span>
                </button>
                <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 font-semibold hover:text-orange-400 transition-colors p-2 rounded-lg text-sm">
                    <ChatBubbleIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Comment</span>
                    <span>({post.comments.length})</span>
                </button>
                <button className="flex items-center gap-1.5 font-semibold hover:text-blue-400 transition-colors p-2 rounded-lg text-sm">
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
                                <img src={comment.author_image_url} alt={comment.authorName} className="w-8 h-8 rounded-lg object-cover mt-1"/>
                                <div>
                                    <div className="bg-zinc-700 rounded-xl p-3">
                                        <p className="font-semibold text-sm text-slate-200">{comment.authorName}</p>
                                        <p className="text-sm text-slate-300">{comment.text}</p>
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
                        <img src={currentUser.image_url} alt="Your profile" className="w-8 h-8 rounded-lg object-cover"/>
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

export default PostCard;