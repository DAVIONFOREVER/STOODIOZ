
import React, { useMemo } from 'react';
import type { Post, Artist, Engineer, Stoodio, Producer, LinkAttachment } from '../types';
import { AppView, UserRole } from '../types';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import UserProfileCard from './UserProfileCard';
import WhoToFollow from './WhoToFollow';
import TrendingPost from './TrendingPost';
import { useAppState } from '../contexts/AppContext';

interface TheStageProps {
    onPost: (postData: { text: string; imageUrl?: string; link?: LinkAttachment }) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    onToggleFollow: (type: 'stoodio' | 'engineer' | 'artist' | 'producer', id: string) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectProducer: (producer: Producer) => void;
    onNavigate: (view: AppView) => void;
}

const TheStage: React.FC<TheStageProps> = (props) => {
    const { onPost, onLikePost, onCommentOnPost, onToggleFollow, onSelectArtist, onSelectEngineer, onSelectStoodio, onSelectProducer, onNavigate } = props;
    const { currentUser, artists, engineers, stoodioz, producers } = useAppState();

    const allUsers = useMemo(() => [...artists, ...engineers, ...stoodioz, ...producers], [artists, engineers, stoodioz, producers]);
    
    const { feedPosts, authors } = useMemo(() => {
        const posts: Post[] = [];
        const authorMap = new Map<string, Artist | Engineer | Stoodio | Producer>();

        allUsers.forEach(user => {
            if (user.posts) {
                posts.push(...user.posts);
                authorMap.set(user.id, user);
            }
        });
        
        posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        return { feedPosts: posts, authors: authorMap };
    }, [allUsers]);

    const suggestions = useMemo(() => {
        if (!currentUser) return [];
        return allUsers.filter(u => u.id !== currentUser.id && !(currentUser.following.artists.includes(u.id) || currentUser.following.engineers.includes(u.id) || currentUser.following.stoodioz.includes(u.id) || currentUser.following.producers.includes(u.id))).slice(0, 3);
    }, [allUsers, currentUser]);

    const trendingPost = useMemo(() => {
        if (feedPosts.length === 0) return null;
        return [...feedPosts].sort((a,b) => (b.likes.length + b.comments.length) - (a.likes.length + a.comments.length))[0];
    }, [feedPosts]);
    
    const handleSelectUser = (user: Artist | Engineer | Stoodio | Producer) => {
        if ('amenities' in user) onSelectStoodio(user);
        else if ('specialties' in user) onSelectEngineer(user);
        else if ('instrumentals' in user) onSelectProducer(user);
        else onSelectArtist(user);
    };

    if (!currentUser) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="hidden lg:block lg:col-span-1 space-y-6">
                <UserProfileCard user={currentUser} onNavigate={onNavigate} />
                <WhoToFollow suggestions={suggestions} onToggleFollow={onToggleFollow} onSelectUser={handleSelectUser} />
                {trendingPost && authors.get(trendingPost.authorId) && (
                    <TrendingPost post={trendingPost} author={authors.get(trendingPost.authorId)!} onLikePost={onLikePost} onCommentOnPost={onCommentOnPost} onSelectUser={handleSelectUser} />
                )}
            </aside>
            <div className="lg:col-span-3 space-y-6">
                <CreatePost currentUser={currentUser} onPost={onPost} />
                <PostFeed
                    posts={feedPosts}
                    authors={authors}
                    onLikePost={onLikePost}
                    onCommentOnPost={onCommentOnPost}
                    onSelectAuthor={handleSelectUser}
                />
            </div>
        </div>
    );
};

export default TheStage;
