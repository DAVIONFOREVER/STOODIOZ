
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type { Post, Artist, Engineer, Stoodio, LinkAttachment, Producer } from '../types';
import { AppView, UserRole } from '../types';
import CreatePost from './CreatePost.tsx';
import PostFeed from './PostFeed.tsx';
import UserProfileCard from './UserProfileCard.tsx';
import WhoToFollow from './WhoToFollow';
import TrendingPost from './TrendingPost.tsx';
import { CalendarIcon, MicrophoneIcon, SoundWaveIcon, HouseIcon, MusicNoteIcon } from './icons.tsx';
import { useAppState } from '../contexts/AppContext.tsx';
import { fetchGlobalFeed } from '../services/apiService';
import { useOnScreen } from '../hooks/useOnScreen';
import { getSupabase } from '../lib/supabase';

interface TheStageProps {
    onPost: (postData: { text: string; imageUrl?: string; videoUrl?: string; videoThumbnailUrl?: string; link?: LinkAttachment }) => Promise<void>;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    onToggleFollow: (type: 'stoodio' | 'engineer' | 'artist' | 'producer', id: string) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectProducer: (producer: Producer) => void;
    onNavigate: (view: AppView) => void;
}

const QuickLink: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-zinc-700 transition-colors">
        {icon}
        <span className="font-semibold text-sm">{label}</span>
    </button>
);

const TheStage: React.FC<TheStageProps> = (props) => {
    const { 
        onPost, 
        onLikePost, 
        onCommentOnPost,
        onToggleFollow,
        onSelectArtist,
        onSelectEngineer,
        onSelectStoodio,
        onSelectProducer,
        onNavigate
    } = props;
    const { currentUser, userRole, artists, engineers, stoodioz, producers } = useAppState();

    // Local state for the infinite feed
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isBottomVisible = useOnScreen(loadMoreRef);

    // Combine all users for author lookup
    const authorsMap = useMemo(() => {
        const allUsers = [...artists, ...engineers, ...stoodioz, ...producers];
        const map = new Map<string, Artist | Engineer | Stoodio | Producer>();
        allUsers.forEach(u => map.set(u.id, u));
        return map;
    }, [artists, engineers, stoodioz, producers]);

    // Suggestions logic
    const suggestions = useMemo(() => {
        const allUsers = [...artists, ...engineers, ...stoodioz, ...producers];
        if (currentUser && 'following' in currentUser) {
            const followedIds = new Set([
                ...(currentUser.following.artists || []),
                ...(currentUser.following.engineers || []),
                ...(currentUser.following.stoodioz || []),
                ...(currentUser.following.producers || []),
                currentUser.id
            ]);
            return allUsers.filter(u => !followedIds.has(u.id) && u.id !== 'artist-aria-cantata').slice(0, 4);
        }
        return allUsers.filter(u => u.id !== 'artist-aria-cantata').slice(0, 4);
    }, [currentUser, artists, engineers, stoodioz, producers]);

    // Trending Logic (simplified for performance)
    const { trendingPost, trendingPostAuthor } = useMemo(() => {
        if (posts.length === 0) return { trendingPost: null, trendingPostAuthor: null };
        const trending = [...posts].sort((a, b) => (b.likes.length + b.comments.length) - (a.likes.length + a.comments.length))[0];
        return { trendingPost: trending, trendingPostAuthor: authorsMap.get(trending.authorId) };
    }, [posts, authorsMap]);

    // Infinite Scroll Loader
    const loadMorePosts = useCallback(async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);

        const lastPost = posts.length > 0 ? posts[posts.length - 1] : null;
        const beforeTimestamp = lastPost ? lastPost.timestamp : undefined;

        try {
            const newPosts = await fetchGlobalFeed(10, beforeTimestamp);
            if (newPosts.length < 10) {
                setHasMore(false);
            }
            // Merge new posts, avoiding duplicates by ID
            setPosts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNewPosts];
            });
        } catch (e) {
            console.error("Failed to load feed:", e);
        } finally {
            setIsLoading(false);
        }
    }, [posts, isLoading, hasMore]);

    // Initial Load
    useEffect(() => {
        if (posts.length === 0) {
            loadMorePosts();
        }
    }, []);

    // Trigger load on scroll
    useEffect(() => {
        if (isBottomVisible && hasMore && !isLoading) {
            loadMorePosts();
        }
    }, [isBottomVisible, hasMore, isLoading, loadMorePosts]);

    // Realtime Feed Updates
    useEffect(() => {
        const supabase = getSupabase();
        if (!supabase) return;

        const channel = supabase.channel('public:posts')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'posts' },
                async (payload) => {
                    const newPost = payload.new as any;
                    // Format correctly
                    const formattedPost: Post = {
                         id: newPost.id,
                         authorId: newPost.author_id,
                         authorType: newPost.author_type,
                         text: newPost.text,
                         image_url: newPost.image_url,
                         video_url: newPost.video_url,
                         video_thumbnail_url: newPost.video_thumbnail_url,
                         link: newPost.link,
                         timestamp: newPost.timestamp,
                         likes: newPost.likes || [],
                         comments: newPost.comments || []
                    };
                    
                    // Avoid duplicate optimistic updates
                    setPosts(prev => {
                        if (prev.some(p => p.id === formattedPost.id)) return prev;
                        return [formattedPost, ...prev];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleSelectUser = (user: Artist | Engineer | Stoodio | Producer) => {
        if ('amenities' in user) onSelectStoodio(user as Stoodio);
        else if ('specialties' in user) onSelectEngineer(user as Engineer);
        else if ('instrumentals' in user) onSelectProducer(user as Producer);
        else onSelectArtist(user as Artist);
    };

    // Optimistic updates for likes/comments to keep UI snappy
    const handleLocalLike = (postId: string) => {
        onLikePost(postId); // Update server/global state
        if (!currentUser) return;
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                const isLiked = p.likes.includes(currentUser.id);
                return { 
                    ...p, 
                    likes: isLiked 
                        ? p.likes.filter(id => id !== currentUser.id) 
                        : [...p.likes, currentUser.id] 
                };
            }
            return p;
        }));
    };

    const handleLocalComment = (postId: string, text: string) => {
        onCommentOnPost(postId, text); // Update server/global state
        if (!currentUser) return;
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                 const newComment = {
                    id: `temp-${Date.now()}`,
                    authorId: currentUser.id,
                    authorName: currentUser.name,
                    author_image_url: currentUser.image_url,
                    text: text,
                    timestamp: new Date().toISOString()
                };
                return { ...p, comments: [...p.comments, newComment] };
            }
            return p;
        }));
    }

    const handleNewPost = async (postData: any) => {
        // 1. Create temp post object for immediate feedback
        if (currentUser && userRole) {
            const tempPost: Post = {
                id: `temp-${Date.now()}`,
                authorId: currentUser.id,
                authorType: userRole,
                text: postData.text,
                image_url: postData.imageUrl,
                video_url: postData.videoUrl,
                video_thumbnail_url: postData.videoThumbnailUrl,
                link: postData.link,
                timestamp: new Date().toISOString(),
                likes: [],
                comments: []
            };
            
            // 2. Update local state immediately (Optimistic Update)
            setPosts(prev => [tempPost, ...prev]);
        }

        // 3. Trigger API call
        await onPost(postData);
    }

    if (!currentUser) return null;

    return (
        <div>
            <div className="grid grid-cols-12 lg:grid-cols-12 gap-8">
                {/* Left Sidebar */}
                <aside className="hidden lg:block lg:col-span-3">
                    <div className="lg:sticky lg:top-28 space-y-6">
                       <UserProfileCard user={currentUser} userRole={userRole} onNavigate={onNavigate} />
                       <div className="cardSurface p-4">
                           <h3 className="font-bold text-slate-100 px-3 mb-2">Quick Links</h3>
                           <nav className="space-y-1">
                               <QuickLink icon={<CalendarIcon className="w-5 h-5 text-orange-400"/>} label="My Bookings" onClick={() => onNavigate(AppView.MY_BOOKINGS)} />
                               <QuickLink icon={<MicrophoneIcon className="w-5 h-5 text-green-400"/>} label="Discover Artists" onClick={() => onNavigate(AppView.ARTIST_LIST)} />
                               <QuickLink icon={<SoundWaveIcon className="w-5 h-5 text-amber-400"/>} label="Discover Engineers" onClick={() => onNavigate(AppView.ENGINEER_LIST)} />
                               <QuickLink icon={<MusicNoteIcon className="w-5 h-5 text-purple-400"/>} label="Discover Producers" onClick={() => onNavigate(AppView.PRODUCER_LIST)} />
                               <QuickLink icon={<HouseIcon className="w-5 h-5 text-red-400"/>} label="Discover Stoodioz" onClick={() => onNavigate(AppView.STOODIO_LIST)} />
                           </nav>
                       </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="col-span-12 lg:col-span-6">
                    <div className="space-y-8">
                        <CreatePost currentUser={currentUser} onPost={handleNewPost} />
                        
                        <PostFeed 
                            posts={posts} 
                            authors={authorsMap}
                            onLikePost={handleLocalLike}
                            onCommentOnPost={handleLocalComment}
                            onSelectAuthor={handleSelectUser}
                        />
                        
                        {/* Infinite Scroll Sentinel */}
                        <div ref={loadMoreRef} className="py-8 text-center">
                            {isLoading && (
                                <div className="flex justify-center">
                                     <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            )}
                            {!hasMore && posts.length > 0 && (
                                <p className="text-zinc-500 text-sm">You've reached the end of the stage.</p>
                            )}
                        </div>
                    </div>
                </main>

                {/* Right Sidebar */}
                 <aside className="hidden lg:block lg:col-span-3">
                     <div className="lg:sticky lg:top-28 space-y-6">
                        {suggestions.length > 0 && (
                            <WhoToFollow 
                                suggestions={suggestions}
                                onToggleFollow={onToggleFollow}
                                onSelectUser={handleSelectUser}
                            />
                        )}
                        {trendingPost && trendingPostAuthor && (
                            <TrendingPost
                                post={trendingPost}
                                author={trendingPostAuthor}
                                onLikePost={handleLocalLike}
                                onCommentOnPost={handleLocalComment}
                                onSelectUser={handleSelectUser}
                            />
                        )}
                     </div>
                </aside>
            </div>
        </div>
    );
};

export default TheStage;
