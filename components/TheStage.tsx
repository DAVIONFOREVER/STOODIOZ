import React, { useMemo } from 'react';
import type { Post, Artist, Engineer, Stoodio, LinkAttachment } from '../types';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';

interface TheStageProps {
    currentUser: Artist | Engineer | Stoodio;
    allArtists: Artist[];
    allEngineers: Engineer[];
    allStoodioz: Stoodio[];
    onPost: (postData: { text: string; imageUrl?: string; link?: LinkAttachment }) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
}

const TheStage: React.FC<TheStageProps> = ({ currentUser, allArtists, allEngineers, allStoodioz, onPost, onLikePost, onCommentOnPost }) => {
    const { feedPosts, authorsMap } = useMemo(() => {
        if (!currentUser || !('following' in currentUser)) {
            return { feedPosts: [], authorsMap: new Map() };
        }

        const followedIds = new Set([
            ...currentUser.following.artists,
            ...currentUser.following.engineers,
            ...currentUser.following.stoodioz,
        ]);
        
        const allUsers = [...allArtists, ...allEngineers, ...allStoodioz];
        
        const authorsMap = new Map<string, Artist | Engineer | Stoodio>();
        allUsers.forEach(u => authorsMap.set(u.id, u));

        const allPosts = allUsers.flatMap(user => user.posts || []);
        
        const feedPosts = allPosts
            .filter(post => followedIds.has(post.authorId) || post.authorId === currentUser.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return { feedPosts, authorsMap };
    }, [currentUser, allArtists, allEngineers, allStoodioz]);

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-extrabold text-center mb-2 tracking-tight text-orange-500">The Stage</h1>
            <p className="text-center text-lg text-slate-600 mb-8">
                Catch up on the latest from the artists, engineers, and stoodioz you follow.
            </p>
            <div className="space-y-8">
                <CreatePost currentUser={currentUser} onPost={onPost} />
                <PostFeed 
                    posts={feedPosts} 
                    authors={authorsMap}
                    onLikePost={onLikePost}
                    onCommentOnPost={onCommentOnPost}
                    currentUser={currentUser}
                />
            </div>
        </div>
    );
};

export default TheStage;