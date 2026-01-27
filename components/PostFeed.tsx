
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
    useFixedFrame?: boolean;
}

const PostFeed: React.FC<PostFeedProps> = ({ posts, authors, onLikePost, onCommentOnPost, onSelectAuthor, useFixedFrame = false }) => {
    const { currentUser } = useAppState();

    if (!posts || posts.length === 0) {
        return (
            <div className="text-center text-slate-400 py-12 bg-zinc-800 rounded-2xl shadow-lg border border-zinc-700">
                <p>No posts to display yet.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {posts.map(post => {
                const author = authors.get(post.authorId) ?? {
                    id: post.authorId,
                    name: 'Unknown',
                    image_url: undefined,
                } as Artist;
                if (!currentUser) return null;
                const authorName = getDisplayName(author, 'Unknown');
                return (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        author={author} 
                        onLikePost={onLikePost}
                        onCommentOnPost={onCommentOnPost}
                        onSelectAuthor={() => onSelectAuthor(author)}
                        useFixedFrame={useFixedFrame}
                    />
                );
            })}
        </div>
    );
};

export default PostFeed;
