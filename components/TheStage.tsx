
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type { Post, Artist, Engineer, Stoodio, LinkAttachment, Producer } from '../types';
import { AppView, UserRole } from '../types';
import CreatePost from './CreatePost.tsx';
import PostFeed from './PostFeed.tsx';
import UserProfileCard from './UserProfileCard.tsx';
import WhoToFollow from './WhoToFollow.tsx';
import TrendingPost from './TrendingPost.tsx';
import { CalendarIcon, MicrophoneIcon, SoundWaveIcon, HouseIcon, MusicNoteIcon } from './icons.tsx';
import { useAppState } from '../contexts/AppContext.tsx';

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

// --- NEW ENGINEER-SPECIFIC PROFILE CARD ---
interface EngineerConsoleCardProps {
    user: Engineer;
    onNavigate: (view: AppView) => void;
}

const EngineerConsoleCard: React.FC<EngineerConsoleCardProps> = ({ user, onNavigate }) => {
    const faderTrackRef = useRef<HTMLDivElement>(null);
    const [faderPosition, setFaderPosition] = useState(0); // 0 = bottom, 100 = top
    const [isDragging, setIsDragging] = useState(false);

    const handleNavigate = useCallback(() => {
        onNavigate(AppView.ENGINEER_DASHBOARD);
    }, [onNavigate]);

    const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleInteractionEnd = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            if (faderPosition > 50) { // If dragged more than halfway
                handleNavigate();
            }
            // Animate back down
            setFaderPosition(0);
        }
    }, [isDragging, faderPosition, handleNavigate]);
    
    const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging || !faderTrackRef.current) return;
        
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const trackRect = faderTrackRef.current.getBoundingClientRect();
        const trackHeight = trackRect.height;
        // Clamp newY to be within the track bounds
        const newY = Math.max(0, Math.min(trackHeight, clientY - trackRect.top));
        
        let newPosition = 100 - (newY / trackHeight) * 100;
        
        setFaderPosition(newPosition);
    }, [isDragging]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleInteractionMove);
            window.addEventListener('mouseup', handleInteractionEnd);
            window.addEventListener('touchmove', handleInteractionMove);
            window.addEventListener('touchend', handleInteractionEnd);
        }
        
        return () => {
            window.removeEventListener('mousemove', handleInteractionMove);
            window.removeEventListener('mouseup', handleInteractionEnd);
            window.removeEventListener('touchmove', handleInteractionMove);
            window.removeEventListener('touchend', handleInteractionEnd);
        };
    }, [isDragging, handleInteractionMove, handleInteractionEnd]);

    const faderStyle = {
        bottom: `calc(${faderPosition}% - 12px)`, // Adjust for half fader height (24px / 2)
        transition: isDragging ? 'none' : 'bottom 0.3s ease-out',
    };

    return (
        <div 
            className="p-4 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl select-none"
        >
            <style>{`
                @keyframes flicker {
                    0%, 100% { transform: rotate(-5deg); }
                    25% { transform: rotate(2deg); }
                    50% { transform: rotate(8deg); }
                    75% { transform: rotate(-2deg); }
                }
                .vu-needle {
                    animation: flicker 1.5s ease-in-out infinite;
                    transform-origin: bottom center;
                    transition: transform 0.2s;
                }
            `}</style>
            
            {/* VU Meter */}
            <div className="relative w-24 h-24 mx-auto mb-4 bg-black/50 rounded-full border-4 border-zinc-600 flex items-center justify-center overflow-hidden">
                <img src={user.imageUrl} alt={user.name} className="absolute inset-0 w-full h-full object-cover rounded-full opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                {/* Meter background */}
                <div className="w-full h-1/2 absolute bottom-0 bg-gradient-to-t from-yellow-700/50 via-red-600/50 to-transparent"></div>
                {/* Needle */}
                <div className="absolute w-0.5 h-10 bg-orange-400 bottom-1/2 left-1/2 -translate-x-1/2 vu-needle"></div>
                <div className="absolute w-2 h-2 bg-zinc-900 rounded-full bottom-[45%]"></div>
            </div>

            {/* Scribble Strip */}
            <div className="bg-teal-900/50 border border-teal-700/50 rounded p-2 mb-6 text-center">
                <p className="font-mono text-lg font-bold text-teal-300" style={{ textShadow: '0 0 5px #2dd4bf' }}>{user.name}</p>
            </div>

            {/* Fader Track */}
            <div 
                ref={faderTrackRef} 
                className="relative h-48 w-16 mx-auto bg-zinc-900 rounded-full border-2 border-zinc-700 p-2 cursor-pointer"
                onMouseDown={handleInteractionStart}
                onTouchStart={handleInteractionStart}
            >
                {/* Fader Knob */}
                <div
                    style={faderStyle}
                    className="absolute left-1/2 -translate-x-1/2 w-12 h-6 bg-zinc-600 rounded-md border-t-2 border-zinc-500 group pointer-events-none"
                >
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-orange-400 group-hover:bg-orange-300 transition-colors"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-300 group-hover:text-white tracking-wider">DASHBOARD</div>
                </div>
            </div>
            
            {/* Aesthetic Knobs */}
            <div className="flex justify-around mt-6">
                <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-zinc-600 flex items-center justify-center cursor-pointer hover:border-orange-500 transition-colors">
                        <div className="w-1 h-3 bg-zinc-400 rounded-full"></div>
                    </div>
                    <p className="text-xs font-mono text-zinc-500">PAN</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                     <div className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-zinc-600 flex items-center justify-center cursor-pointer hover:border-orange-500 transition-colors">
                        <div className="w-1 h-3 bg-zinc-400 rounded-full"></div>
                    </div>
                    <p className="text-xs font-mono text-zinc-500">GAIN</p>
                </div>
            </div>
        </div>
    );
};
// --- END NEW COMPONENT ---

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

    const { feedPosts, authorsMap, suggestions, trendingPost, trendingPostAuthor } = useMemo(() => {
        const allUsers = [...artists, ...engineers, ...stoodioz, ...producers];
        const authorsMap = new Map<string, Artist | Engineer | Stoodio | Producer>();
        allUsers.forEach(u => authorsMap.set(u.id, u));
        
        const allPosts = allUsers.flatMap(user => user.posts || []);

        let feedPosts: Post[] = [];
        let suggestions: (Artist | Engineer | Stoodio | Producer)[] = [];

        const ariaProfile = artists.find(a => a.id === 'artist-aria-cantata');
        const ariaPosts = ariaProfile?.posts || [];

        let otherPosts: Post[] = [];
        let followedIds: Set<string> | null = null;
        
        if (currentUser && 'following' in currentUser) {
            followedIds = new Set([
                ...currentUser.following.artists,
                ...currentUser.following.engineers,
                ...currentUser.following.stoodioz,
                ...currentUser.following.producers,
                currentUser.id
            ]);
            
            otherPosts = allPosts.filter(post => followedIds!.has(post.authorId));
                
            suggestions = allUsers.filter(u => !followedIds!.has(u.id) && u.id !== currentUser.id && u.id !== 'artist-aria-cantata').slice(0, 4);
        } else {
            // Guest view: show all posts
            otherPosts = allPosts;
            suggestions = allUsers.filter(u => u.id !== 'artist-aria-cantata').slice(0, 4);
        }
        
        // Combine Aria's posts with others, ensuring no duplicates if user follows Aria
        const combinedPosts = [...ariaPosts, ...otherPosts];
        const postMap = new Map<string, Post>();
        combinedPosts.forEach(post => postMap.set(post.id, post));
        
        feedPosts = Array.from(postMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
            <div className="grid grid-cols-12 lg:grid-cols-12 gap-8">
                {/* Left Sidebar */}
                <aside className="hidden lg:block lg:col-span-3">
                    <div className="lg:sticky lg:top-28 space-y-6">
                       {userRole === UserRole.ENGINEER ? (
                           <EngineerConsoleCard user={currentUser as Engineer} onNavigate={onNavigate} />
                       ) : (
                           <UserProfileCard user={currentUser} onNavigate={onNavigate}/>
                       )}
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
