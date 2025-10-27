import React, { useMemo } from 'react';
import type { Post, Artist, Engineer, Stoodio, LinkAttachment, Producer } from '../types';
import { AppView } from '../types';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import UserProfileCard from './UserProfileCard';
import WhoToFollow from './WhoToFollow';
import TrendingPost from './TrendingPost';
import { CalendarIcon, MicrophoneIcon, SoundWaveIcon, HouseIcon, MusicNoteIcon } from './icons';
import { useAppState } from '../contexts/AppContext';

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
    const { currentUser, artists, engineers, stoodioz, producers } = useAppState();

    const { feedPosts, authorsMap, suggestions, trendingPost, trendingPostAuthor } = useMemo(() => {
        const allUsers = [...artists, ...engineers, ...stoodioz, ...producers];
        const authorsMap = new Map<string, Artist | Engineer | Stoodio | Producer>();
        allUsers.forEach(u => authorsMap.set(u.id, u));

        if (!currentUser || !('following' in currentUser)) {
            return { feedPosts: [], authorsMap, suggestions: [], trendingPost: null, trendingPostAuthor: null };
        }

        const followedIds = new Set([
            ...currentUser.following.artists,
            ...currentUser.following.engineers,
            ...currentUser.following.stoodioz,
            ...currentUser.following.producers,
            currentUser.id
        ]);
        
        const allPosts = allUsers.flatMap(user => user.posts || []);
        
        const feedPosts = [...allPosts]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        const suggestions = allUsers.filter(u => !followedIds.has(u.id) && u.id !== currentUser.id).slice(0, 4);

        const trendingPost = [...allPosts]
            .sort((a, b) => (b.likes.length + b.comments.length) - (a.likes.length + a.comments.length))[0] || null;
            
        const trendingPostAuthor = trendingPost ? authorsMap.get(trendingPost.authorId) : null;


        return { feedPosts, authorsMap, suggestions, trendingPost, trendingPostAuthor };
    }, [currentUser, artists, engineers, stoodioz, producers]);

    const handleSelectUser = (user: Artist | Engineer | Stoodio | Producer) => {
        if ('amenities' in user) onSelectStoodio(user as Stoodio);
        else if ('specialties' in user) onSelectEngineer(user as Engineer);
        else if ('instrumentals' in user) onSelectProducer(user as Producer);
        else onSelectArtist(user as Artist);
    };

    if (!currentUser) return null;

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar */}
                <aside className="lg:col-span-3">
                    <div className="lg:sticky lg:top-28 space-y-6">
                       <UserProfileCard user={currentUser} onNavigate={onNavigate}/>
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
                <main className="lg:col-span-6">
                    <div className="space-y-8">
                        <CreatePost currentUser={currentUser} onPost={onPost} />
                        <PostFeed 
                            posts={feedPosts} 
                            authors={authorsMap}
                            onLikePost={onLikePost}
                            onCommentOnPost={onCommentOnPost}
                            onSelectAuthor={handleSelectUser}
                        />
                    </div>
                </main>

                {/* Right Sidebar */}
                 <aside className="lg:col-span-3">
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
                                onLikePost={onLikePost}
                                onCommentOnPost={onCommentOnPost}
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