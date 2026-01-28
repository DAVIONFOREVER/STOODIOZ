
import React from 'react';
import type { Post, Artist, Engineer, Stoodio, Producer, Label } from '../types';
import PostCard from './PostCard.tsx';
import { useAppState } from '../contexts/AppContext.tsx';
import { getDisplayName } from '../constants';

interface PostFeedProps {
    posts: Post[];
    authors: Map<string, Artist | Engineer | Stoodio | Producer | Label>;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    onSelectAuthor: (author: Artist | Engineer | Stoodio | Producer | Label) => void;
    onEditPost?: (postId: string, text: string) => void;
    onDeletePost?: (postId: string) => void;
    isManaging?: boolean;
    useFixedFrame?: boolean;
    variant?: 'standard' | 'reel';
}

const PostFeed: React.FC<PostFeedProps> = ({ posts, authors, onLikePost, onCommentOnPost, onSelectAuthor, onEditPost, onDeletePost, isManaging = false, useFixedFrame = false, variant = 'standard' }) => {
    const { currentUser } = useAppState();

    if (!posts || posts.length === 0) {
        return (
            <div className="text-center text-slate-400 py-12 bg-zinc-800 rounded-2xl shadow-lg border border-zinc-700">
                <p>No posts to display yet.</p>
            </div>
        );
    }
    
    const isReel = variant === 'reel';

    return (
        <div className={isReel ? 'flex flex-col items-center gap-0' : 'space-y-6'}>
            {isReel && (
                <div className="w-full max-w-[760px] mb-6">
                    <div className="cardSurface border border-zinc-800/80 bg-zinc-950/70 backdrop-blur p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Neural Feed</p>
                            <h3 className="text-lg md:text-xl font-bold text-zinc-100">Signal-driven creator stream</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['For You', 'Trending', 'New', 'Nearby'].map((label) => (
                                <button
                                    key={label}
                                    type="button"
                                    className="px-3 py-1.5 rounded-full border border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-orange-300 hover:border-orange-500/50 hover:bg-orange-500/10 transition-colors"
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {posts.map(post => {
                const author = authors.get(post.authorId) ?? {
                    id: post.authorId,
                    name: 'Unknown',
                    image_url: undefined,
                } as Artist;
                if (!currentUser) return null;
                const authorName = getDisplayName(author, 'Unknown');
                return (
                    <div
                        key={post.id}
                        className={isReel ? 'w-full max-w-[760px]' : undefined}
                    >
                        <PostCard 
                            post={post} 
                            author={author} 
                            onLikePost={onLikePost}
                            onCommentOnPost={onCommentOnPost}
                            onSelectAuthor={() => onSelectAuthor(author)}
                            onEditPost={onEditPost}
                            onDeletePost={onDeletePost}
                            isManaging={isManaging}
                            useFixedFrame={useFixedFrame}
                            variant={variant}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default PostFeed;
