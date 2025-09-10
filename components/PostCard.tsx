

import React, { useState } from 'react';
// FIX: Update props to accept Producer type
import type { Post, Artist, Engineer, Stoodio, Comment, Producer } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { HeartIcon, ChatBubbleIcon, ShareIcon, PaperAirplaneIcon } from './icons';

interface PostCardProps {
    post: Post;
    author: Artist | Engineer | Stoodio | Producer;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | Producer | null;
}

const PostCard: React.FC<PostCardProps> = ({ post, author, onLikePost, onCommentOnPost, currentUser }) => {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');

    if (!currentUser) return null;

    const isLiked = post.likes.includes(currentUser.id);

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (commentText.trim()) {
            onCommentOnPost(post.id, commentText.trim());
            setCommentText('');
        }
    };

    return (
        <div className="bg-zinc-800 rounded-2xl shadow-lg border border-zinc-700">
            <div className="p-6">
                {/* Post Header */}
                <div className="flex items-center gap-4 mb-4">
                    <img src={author.imageUrl} alt={author.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                        <p className="font-bold text-slate-100">{author.name}</p>
                        <p className="text-sm text-slate-400">{formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</p>
                    </div>
                </div>

                {/* Post Content */}
                {post.text && <p className="text-slate-300 whitespace-pre-wrap mb-4">{post.text}</p>}
                {post.imageUrl && (
                    <img loading="lazy" src={post.imageUrl} alt="Post image" className="rounded-xl w-full h-auto max-h-96 object-cover my-4" />
                )}
                 {post.videoUrl && (
                    <div className="my-4 rounded-xl overflow-hidden w-full aspect-video bg-black">
                        <video
                            src={post.videoUrl}
                            poster={post.videoThumbnailUrl}
                            controls
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-contain"
                        />
                    </div>
                )}
                {post.link && (
                    <a href={post.link.url} target="_blank" rel="noopener noreferrer" className="block my-4 p-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg border border-zinc-600 transition-colors">
                        <p className="font-semibold text-slate-200">{post.link.title}</p>
                        <p className="text-sm text-slate-400 truncate">{post.link.url}</p>
                    </a>
                )}
            </div>

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
                                <img src={comment.authorImageUrl} alt={comment.authorName} className="w-8 h-8 rounded-lg object-cover mt-1"/>
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
                        <img src={currentUser.imageUrl} alt="Your profile" className="w-8 h-8 rounded-lg object-cover"/>
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