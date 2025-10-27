import React from 'react';
import type { Post, Artist, Engineer, Stoodio, Producer } from '../types';
import { HeartIcon, ChatBubbleIcon } from './icons';
import { useAppState } from '../contexts/AppContext';

interface TrendingPostProps {
    post: Post;
    author: Artist | Engineer | Stoodio | Producer;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    onSelectUser: (user: Artist | Engineer | Stoodio | Producer) => void;
}

const TrendingPost: React.FC<TrendingPostProps> = ({ post, author, onSelectUser }) => {
    const { currentUser } = useAppState();
    const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;

    return (
        <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
            <h3 className="font-bold text-slate-100 px-1 mb-2">Trending on Stoodioz</h3>
            <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
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
