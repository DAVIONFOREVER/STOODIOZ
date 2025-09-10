

import React from 'react';
import type { Post, Artist, Engineer, Stoodio, Producer } from '../types';
import { HeartIcon, ChatBubbleIcon } from './icons';

interface TrendingPostProps {
    post: Post;
    author: Artist | Engineer | Stoodio | Producer;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | Producer | null;
    onSelectUser: (user: Artist | Engineer | Stoodio | Producer) => void;
}

const TrendingPost: React.FC<TrendingPostProps> = ({ post, author, onLikePost, onCommentOnPost, currentUser, onSelectUser }) => {
    const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;

    return (
        <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 shadow-lg">
            <h3 className="font-bold text-slate-100 px-1 mb-2">Trending on Stoodioz</h3>
            <div className="bg-zinc-700/50 rounded-lg p-3 border border-zinc-600">
                <button onClick={() => onSelectUser(author)} className="flex items-center gap-3 mb-2 text-left">
                     <img loading="lazy" src={author.imageUrl} alt={author.name} className="w-8 h-8 rounded-lg object-cover" />
                    <div>
                        <p className="font-semibold text-sm text-slate-200">{author.name}</p>
                    </div>
                </button>
                <p className="text-sm text-slate-300 mb-3">{post.text.substring(0, 100)}{post.text.length > 100 ? '...' : ''}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold">
                    <span className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : ''}`}>
                        <HeartIcon className="w-4 h-4" /> {post.likes.length}
                    </span>
                     <span className="flex items-center gap-1">
                        <ChatBubbleIcon className="w-4 h-4" /> {post.comments.length}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TrendingPost;