import React, { useState, useEffect } from 'react';
import type { Artist, Booking, Conversation, Stoodio, Engineer, LinkAttachment, Comment, Post } from '../types';
import { AppView, BookingStatus } from '../types';
import { EditIcon, UsersIcon, UserGroupIcon, CalendarIcon, InboxIcon, PhotoIcon, SoundWaveIcon, UserCheckIcon, LocationIcon, UserPlusIcon, DollarSignIcon, MagicWandIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import TheStage from './TheStage';

interface ArtistDashboardProps {
    artist: Artist;
    bookings: Booking[];
    conversations: Conversation[];
    allStoodioz: Stoodio[];
    allEngineers: Engineer[];
    allArtists: Artist[];
    onNavigate: (view: AppView) => void;
    onUpdateProfile: (updatedProfile: Partial<Artist>) => void;
    onToggleFollow: (type: 'stoodio' | 'engineer' | 'artist', id: string) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onPost: (postData: { text: string; imageUrl?: string; link?: LinkAttachment }) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | null;
    onOpenVibeMatcher: () => void;
}

type DashboardTab = 'dashboard' | 'following' | 'followers';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-zinc-800 p-4 rounded-xl shadow-md flex items-center gap-4 border border-zinc-700">
        <div className="bg-orange-500/20 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-slate-400 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
    </div>
);

const AddLinkForm: React.FC<{ onAddLink: (title: string, url: string) => void; onCancel: () => void }> = ({ onAddLink, onCancel }) => {
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title && url) {
            onAddLink(title, url);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-4 bg-zinc-700/50 rounded-lg border border-zinc-600">
            <input
                type="text"
                placeholder="Link Title (e.g., Spotify)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded mb-2 bg-zinc-600 border-zinc-500 text-slate-200"
            />
            <input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-2 border rounded mb-2 bg-zinc-600 border-zinc-500 text-slate-200"
            />
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="text-sm font-semibold px-3 py-1 rounded text-slate-300 hover:bg-zinc-600">Cancel</button>
                <button type="submit" className="text-sm font-semibold px-3 py-1 rounded bg-orange-500 text-white">Add</button>
            </div>
        </form>
    );
};

const DashboardContent: React.FC<Omit<ArtistDashboardProps, 'allStoodioz' | 'allEngineers' | 'allArtists' | 'onToggleFollow' | 'onSelectStoodio' | 'onSelectArtist' | 'onSelectEngineer'>> = ({ artist, bookings, conversations, onNavigate, onUpdateProfile, onPost, onLikePost, onCommentOnPost, currentUser, onOpenVibeMatcher }) => {
    const [isAddingLink, setIsAddingLink] = useState(false);
    const upcomingBookings = bookings.filter(b => b.status === BookingStatus.CONFIRMED).slice(0, 3);
    const recentConversations = conversations.filter(c => c.unreadCount > 0).slice(0, 3);

    const handleAddLink = (title: string, url: string) => {
        const newLinks = [...(artist.links || []), { title, url }];
        onUpdateProfile({ links: newLinks });
        setIsAddingLink(false);
    };
    return (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Vibe Matcher Card */}
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-6 rounded-2xl shadow-lg text-white border border-orange-400/50">
                    <h3 className="text-2xl font-bold flex items-center gap-2"><MagicWandIcon className="w-6 h-6"/> AI Stoodio Vibe Matcher</h3>
                    <p className="mt-2 mb-4 text-orange-100">Got a reference track? Paste a link and our AI will find stoodioz and engineers that match its vibe.</p>
                    <button onClick={onOpenVibeMatcher} className="bg-white text-orange-500 font-bold py-2 px-6 rounded-lg hover:bg-orange-100 transition-all shadow-md">
                        Find My Vibe
                    </button>
                </div>
                {/* Create Post */}
                <CreatePost currentUser={artist} onPost={onPost} />
                
                {/* Post Feed */}
                <PostFeed 
                    posts={artist.posts || []} 
                    authors={new Map([[artist.id, artist]])}
                    onLikePost={onLikePost}
                    onCommentOnPost={onCommentOnPost}
                    currentUser={currentUser}
                 />

                {/* Upcoming Sessions */}
                <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-100">Upcoming Sessions</h3>
                        <button onClick={() => onNavigate(AppView.MY_BOOKINGS)} className="text-sm font-semibold text-orange-400 hover:underline">
                            View All
                        </button>
                    </div>
                    {upcomingBookings.length > 0 ? (
                        <ul className="space-y-4">
                            {upcomingBookings.map(booking => (
                                <li key={booking.id} className="p-3 bg-zinc-700/50 rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{booking.stoodio.name}</p>
                                        <p className="text-sm text-slate-400">
                                            {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-us', {month: 'short', day: 'numeric'})} at {booking.startTime}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-slate-200">{booking.engineer?.name || 'BYO Engineer'}</p>
                                        <p className="text-xs text-slate-500">Engineer</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-400 text-sm text-center py-4">No upcoming sessions booked. Time to create!</p>
                    )}
                </div>

                {/* Recent Messages */}
                    <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-100">Recent Messages</h3>
                        <button onClick={() => onNavigate(AppView.INBOX)} className="text-sm font-semibold text-orange-400 hover:underline">
                            View Inbox
                        </button>
                    </div>
                        {recentConversations.length > 0 ? (
                        <ul className="space-y-3">
                            {recentConversations.map(convo => (
                                <li key={convo.id} className="p-3 bg-zinc-700/50 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-zinc-700" onClick={() => onNavigate(AppView.INBOX)}>
                                    <img src={convo.participant.imageUrl} alt={convo.participant.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold truncate">{convo.participant.name}</p>
                                        <p className="text-sm text-slate-400 truncate">{convo.messages[convo.messages.length - 1].text}</p>
                                    </div>
                                    <span className="flex-shrink-0 bg-orange-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{convo.unreadCount}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-400 text-sm text-center py-4">Your inbox is all caught up.</p>
                    )}
                </div>
            </div>
            <div className="space-y-8">
                {/* Notification Settings */}
                <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
                    <h3 className="text-xl font-bold text-slate-100 mb-4">Settings</h3>
                    <label htmlFor="notif-toggle" className="flex items-center justify-between cursor-pointer">
                        <span className="font-semibold text-slate-300">Enable Notifications</span>
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                id="notif-toggle" 
                                className="sr-only peer" 
                                checked={artist.notificationsEnabled ?? true}
                                onChange={(e) => onUpdateProfile({ notificationsEnabled: e.target.checked })}
                            />
                            <div className="block bg-zinc-600 w-12 h-6 rounded-full peer-checked:bg-green-500 transition"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></div>
                        </div>
                    </label>
                </div>
                {/* Wallet */}
                <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
                    <h3 className="text-xl font-bold text-slate-100 mb-4">Wallet</h3>
                    <p className="text-slate-400 text-sm">Current Balance</p>
                    <p className="text-4xl font-bold text-green-400 mb-4">${artist.walletBalance.toFixed(2)}</p>
                    <div className="flex gap-2 mb-6">
                        <button className="w-full bg-orange-500 text-white font-semibold py-2 px-3 rounded-lg hover:bg-orange-600 text-sm">Add Funds</button>
                        <button className="w-full bg-zinc-700 text-slate-200 font-semibold py-2 px-3 rounded-lg hover:bg-zinc-600 text-sm">Withdraw</button>
                    </div>
                     <h4 className="font-semibold text-slate-300 mb-2 text-sm">Recent Transactions</h4>
                     <ul className="space-y-2">
                        {artist.walletTransactions.slice(0, 4).map(tx => (
                            <li key={tx.id} className="flex justify-between text-sm">
                                <span className="text-slate-300">{tx.description}</span>
                                <span className={`font-semibold ${tx.type === 'debit' ? 'text-red-400' : 'text-green-400'}`}>
                                    {tx.type === 'debit' ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                                </span>
                            </li>
                        ))}
                     </ul>
                </div>
                 {/* My Links */}
                <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-100">My Links</h3>
                        {!isAddingLink && (
                            <button onClick={() => setIsAddingLink(true)} className="text-sm font-semibold text-orange-400 hover:underline">
                                Add Link
                            </button>
                        )}
                    </div>
                    {artist.links && artist.links.length > 0 ? (
                        <ul className="space-y-3">
                            {artist.links.map((link, index) => (
                                <li key={index}>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-700/50 rounded-lg flex items-center gap-3 hover:bg-zinc-700 transition-colors">
                                        <div className="w-8 h-8 bg-orange-500/20 rounded-md flex items-center justify-center">
                                            <SoundWaveIcon className="w-5 h-5 text-orange-400" />
                                        </div>
                                        <span className="font-semibold text-slate-200">{link.title}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : (
                            !isAddingLink && <p className="text-slate-400 text-sm text-center py-4">Add links to your Spotify, SoundCloud, or social media.</p>
                    )}
                    {isAddingLink && <AddLinkForm onAddLink={handleAddLink} onCancel={() => setIsAddingLink(false)} />}
                </div>
            </div>
        </div>
    );
};

const FollowingContent: React.FC<Pick<ArtistDashboardProps, 'artist' | 'allStoodioz' | 'allEngineers' | 'allArtists' | 'onToggleFollow' | 'onSelectStoodio' | 'onSelectArtist' | 'onSelectEngineer'>> = ({ artist, allStoodioz, allEngineers, allArtists, onToggleFollow, onSelectStoodio, onSelectArtist, onSelectEngineer }) => {
    const followedStoodioz = allStoodioz.filter(s => artist.following.stoodioz.includes(s.id));
    const followedEngineers = allEngineers.filter(e => artist.following.engineers.includes(e.id));
    const followedArtists = allArtists.filter(a => artist.following.artists.includes(a.id));
    
    return (
        <div className="space-y-12">
            {/* Followed Stoodioz */}
            <div>
                <h2 className="text-3xl font-bold mb-6 text-slate-100">Stoodioz</h2>
                {followedStoodioz.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followedStoodioz.map(stoodio => (
                            <div key={stoodio.id} className="bg-zinc-800 rounded-xl shadow-lg p-4 flex items-center gap-4 border border-zinc-700">
                                <img src={stoodio.imageUrl} alt={stoodio.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                                <div className="flex-grow">
                                    <button onClick={() => onSelectStoodio(stoodio)} className="font-bold text-lg hover:text-orange-400 transition-colors text-left text-slate-100">{stoodio.name}</button>
                                    <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                                        <LocationIcon className="w-4 h-4"/>
                                        {stoodio.location}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => onToggleFollow('stoodio', stoodio.id)}
                                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-500 text-white"
                                >
                                    <UserCheckIcon className="w-4 h-4" />
                                    Following
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400">You're not following any stoodioz yet.</p>
                )}
            </div>

            {/* Followed Engineers */}
            <div>
                <h2 className="text-3xl font-bold mb-6 text-slate-100">Engineers</h2>
                    {followedEngineers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followedEngineers.map(engineer => (
                            <div key={engineer.id} className="bg-zinc-800 rounded-xl shadow-lg p-4 flex items-center gap-4 border border-zinc-700">
                                <img src={engineer.imageUrl} alt={engineer.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                                <div className="flex-grow">
                                    <button onClick={() => onSelectEngineer(engineer)} className="font-bold text-lg hover:text-orange-400 transition-colors text-left text-slate-100">{engineer.name}</button>
                                    <p className="text-sm text-slate-400 truncate">{engineer.specialties.join(', ')}</p>
                                </div>
                                <button 
                                    onClick={() => onToggleFollow('engineer', engineer.id)}
                                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-500 text-white"
                                >
                                    <UserCheckIcon className="w-4 h-4" />
                                    Following
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400">You're not following any engineers yet.</p>
                )}
            </div>

            {/* Followed Artists */}
            <div>
                <h2 className="text-3xl font-bold mb-6 text-slate-100">Artists</h2>
                    {followedArtists.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followedArtists.map(artist => (
                            <div key={artist.id} className="bg-zinc-800 rounded-xl shadow-lg p-4 flex items-center gap-4 border border-zinc-700">
                                <img src={artist.imageUrl} alt={artist.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                                <div className="flex-grow">
                                    <button onClick={() => onSelectArtist(artist)} className="font-bold text-lg hover:text-orange-400 transition-colors text-left text-slate-100">{artist.name}</button>
                                    <p className="text-sm text-slate-400 truncate">{artist.bio.substring(0,50)}...</p>
                                </div>
                                <button 
                                    onClick={() => onToggleFollow('artist', artist.id)}
                                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 bg-orange-500 text-white"
                                >
                                    <UserCheckIcon className="w-4 h-4" />
                                    Following
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400">You're not following any artists yet.</p>
                )}
            </div>
        </div>
    );
};

const FollowersContent: React.FC<Pick<ArtistDashboardProps, 'artist' | 'allArtists' | 'onToggleFollow' | 'onSelectArtist'>> = ({ artist, allArtists, onToggleFollow, onSelectArtist }) => {
    const followers = allArtists.filter(a => artist.followerIds.includes(a.id));

    return (
         <div>
            <h2 className="text-3xl font-bold mb-6 text-slate-100">Followers</h2>
            {followers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {followers.map(follower => {
                        const isFollowingBack = artist.following.artists.includes(follower.id);
                        return (
                            <div key={follower.id} className="bg-zinc-800 rounded-xl shadow-lg p-4 flex items-center gap-4 border border-zinc-700">
                                <img src={follower.imageUrl} alt={follower.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                                <div className="flex-grow">
                                    <button onClick={() => onSelectArtist(follower)} className="font-bold text-lg hover:text-orange-400 transition-colors text-left text-slate-100">{follower.name}</button>
                                    <p className="text-sm text-slate-400 truncate">{follower.bio.substring(0,50)}...</p>
                                </div>
                                <button 
                                    onClick={() => onToggleFollow('artist', follower.id)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 ${isFollowingBack ? 'bg-orange-500 text-white' : 'bg-zinc-600 text-slate-200 hover:bg-zinc-500'}`}
                                >
                                    {isFollowingBack ? <UserCheckIcon className="w-4 h-4" /> : <UserPlusIcon className="w-4 h-4" />}
                                    {isFollowingBack ? 'Following' : 'Follow Back'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-slate-400">You don't have any followers yet.</p>
            )}
        </div>
    );
};


const ArtistDashboard: React.FC<ArtistDashboardProps> = (props) => {
    const { artist, bookings, onUpdateProfile } = props;
    const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [editedBio, setEditedBio] = useState(artist.bio);
    const followingCount = artist.following.stoodioz.length + artist.following.engineers.length + artist.following.artists.length;
    const totalSpent = bookings.reduce((acc, b) => acc + b.totalCost + (b.tip || 0), 0);
    
    useEffect(() => {
        setEditedBio(artist.bio);
    }, [artist.bio]);

    const handleSaveBio = () => {
        onUpdateProfile({ bio: editedBio });
        setIsEditingBio(false);
    };

    const handleUpdatePhoto = () => {
        // This is a mock update. In a real app, this would open a file picker.
        const newSeed = `artist1-updated-${Date.now()}`;
        onUpdateProfile({ imageUrl: `https://picsum.photos/seed/${newSeed}/100` });
        alert("Profile photo updated!");
    };

    const handleSeekingToggle = (isSeeking: boolean) => {
        onUpdateProfile({ isSeekingSession: isSeeking });
    };
    
    const TabButton: React.FC<{tab: DashboardTab, label: string, icon: React.ReactNode}> = ({ tab, label, icon }) => (
        <button 
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-3 w-full p-3 rounded-lg text-left font-semibold transition-colors ${
                activeTab === tab 
                ? 'bg-orange-500 text-white' 
                : 'text-slate-300 hover:bg-zinc-700'
            }`}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6 md:items-start mb-8">
                 <div className="relative group flex-shrink-0">
                    <img src={artist.imageUrl} alt={artist.name} className="w-32 h-32 object-cover rounded-xl shadow-md border-4 border-zinc-700" />
                    <button onClick={handleUpdatePhoto} className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <PhotoIcon className="w-8 h-8"/>
                    </button>
                </div>
                <div className="flex-grow">
                    <h1 className="text-5xl font-extrabold tracking-tight text-orange-500">{artist.name}</h1>
                     {isEditingBio ? (
                        <div className="mt-2">
                            <textarea
                                value={editedBio}
                                onChange={(e) => setEditedBio(e.target.value)}
                                className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500"
                                rows={4}
                            />
                            <div className="flex justify-start gap-2 mt-2">
                                <button onClick={() => { setIsEditingBio(false); setEditedBio(artist.bio); }} className="text-sm font-semibold px-4 py-2 rounded-lg text-slate-300 hover:bg-zinc-600">Cancel</button>
                                <button onClick={handleSaveBio} className="text-sm font-semibold px-4 py-2 rounded-lg bg-orange-500 text-white">Save Bio</button>
                            </div>
                        </div>
                     ) : (
                        <p className="text-slate-500 mt-2 max-w-xl">{artist.bio}</p>
                     )}
                </div>
                <div className="flex flex-col gap-4 items-end">
                     {!isEditingBio && (
                        <button 
                            onClick={() => setIsEditingBio(true)}
                            className="flex-shrink-0 flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors"
                        >
                            <EditIcon className="w-4 h-4" /> Edit Bio
                        </button>
                     )}
                    <label htmlFor="seeking-toggle" className="flex items-center cursor-pointer bg-zinc-800 border border-zinc-600 px-4 py-2 rounded-lg">
                        <span className="mr-3 font-semibold text-slate-300 text-sm">Actively Seeking Sessions</span>
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                id="seeking-toggle" 
                                className="sr-only peer" 
                                checked={artist.isSeekingSession}
                                onChange={(e) => handleSeekingToggle(e.target.checked)}
                            />
                            <div className="block bg-zinc-600 w-12 h-6 rounded-full peer-checked:bg-green-500 transition"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></div>
                        </div>
                    </label>
                 </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard label="Followers" value={artist.followers.toLocaleString()} icon={<UsersIcon className="w-6 h-6 text-orange-400" />} />
                <StatCard label="Following" value={followingCount} icon={<UserGroupIcon className="w-6 h-6 text-orange-400" />} />
                <StatCard label="Total Bookings" value={bookings.length} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
                <StatCard label="Wallet Balance" value={`$${artist.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-orange-400" />} />
            </div>

            {/* Content Grid */}
            <div className="flex flex-col md:flex-row gap-8 mt-10">
                <aside className="md:w-1/4 lg:w-1/5">
                    <nav className="flex flex-col space-y-2">
                        <TabButton tab="dashboard" label="Dashboard" icon={<SoundWaveIcon className="w-5 h-5"/>} />
                        <TabButton tab="following" label="Following" icon={<UserCheckIcon className="w-5 h-5"/>} />
                        <TabButton tab="followers" label="Followers" icon={<UsersIcon className="w-5 h-5"/>} />
                    </nav>
                </aside>
                <main className="flex-1">
                    {activeTab === 'dashboard' && <DashboardContent {...props} />}
                    {activeTab === 'following' && <FollowingContent {...props} />}
                    {activeTab === 'followers' && <FollowersContent {...props} />}
                </main>
            </div>
        </div>
    );
};

export default ArtistDashboard;