

import React from 'react';
// FIX: Update props to accept Producer type
import type { Post, Artist, Engineer, Stoodio, Producer } from '../types';
import PostCard from './PostCard';

interface PostFeedProps {
    posts: Post[];
    authors: Map<string, Artist | Engineer | Stoodio | Producer>;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | Producer | null;
}

const PostFeed: React.FC<PostFeedProps> = ({ posts, authors, onLikePost, onCommentOnPost, currentUser }) => {
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
                const author = authors.get(post.authorId);
                if (!author || !currentUser) return null; // Don't render post if author or currentUser isn't found
                return (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        author={author} 
                        onLikePost={onLikePost}
                        onCommentOnPost={onCommentOnPost}
                        currentUser={currentUser}
                    />
                );
            })}
        </div>
    );
};

export default PostFeed;