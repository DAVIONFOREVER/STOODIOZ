import React, { useState } from 'react';
import { UserRole, type Artist, type Engineer, type Stoodio, type Comment, type LinkAttachment, type Post } from '../types';
import { ChevronLeftIcon, UserPlusIcon, UserCheckIcon, UsersIcon, MessageIcon, SoundWaveIcon, HouseIcon, MicrophoneIcon } from './icons';
import PostFeed from './PostFeed';

interface ArtistProfileProps {
    artist: Artist;
    allStoodioz: Stoodio[];
    allEngineers: Engineer[];
    allArtists: Artist[];
    onBack: () => void;
    onToggleFollow: (type: 'artist' | 'engineer' | 'stoodio', id: string) => void;
    isFollowing: boolean;
    userRole: UserRole | null;
    onStartNavigation: (artist: Artist) => void;
    onStartConversation: (participant: Stoodio | Artist | Engineer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectArtist: (artist: Artist) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | null;
}

type ProfileTab = 'activity' | 'following' | 'followers' | 'links';

const ProfileCard: React.FC<{
    profile: Stoodio | Engineer | Artist;
    type: 'stoodio' | 'engineer' | 'artist';
    onClick: () => void;
}> = ({ profile, type, onClick }) => {
    let icon;
    let details;
    if (type === 'stoodio') {
        icon = <HouseIcon className="w-4 h-4" />;
        details = (profile as Stoodio).location;
    } else if (type === 'engineer') {
        icon = <SoundWaveIcon className="w-4 h-4" />;
        details = (profile as Engineer).specialties.join(', ');
    } else {
        icon = <MicrophoneIcon className="w-4 h-4" />;
        details = (profile as Artist).bio;
    }

    return (
        <button onClick={onClick} className="w-full flex items-center gap-3 bg-zinc-700/50 p-3 rounded-lg hover:bg-zinc-700 transition-colors text-left">
            <img src={profile.imageUrl} alt={profile.name} className="w-12 h-12 rounded-md object-cover" />
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm text-slate-200 truncate">{profile.name}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">{icon}{details}</p>
            </div>
        </button>
    );
};


const ArtistProfile: React.FC<ArtistProfileProps> = (props) => {
    const { artist, onBack, onToggleFollow, isFollowing, userRole, onStartConversation, allArtists, allEngineers, allStoodioz, onSelectArtist, onSelectEngineer, onSelectStoodio, onLikePost, onCommentOnPost, currentUser } = props;
    const [activeTab, setActiveTab] = useState<ProfileTab>('activity');
    
    const TabButton: React.FC<{tab: ProfileTab, label: string}> = ({ tab, label }) => (
        <button 
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeTab === tab 
                ? 'bg-orange-500 text-white' 
                : 'text-slate-300 hover:bg-zinc-700'
            }`}
        >
            {label}
        </button>
    );
    
    const renderContent = () => {
        switch (activeTab) {
            case 'activity':
                return <PostFeed 
                            posts={artist.posts || []} 
                            authors={new Map([[artist.id, artist]])}
                            onLikePost={onLikePost}
                            onCommentOnPost={onCommentOnPost}
                            currentUser={currentUser}
                        />;
            case 'links':
                return artist.links && artist.links.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {artist.links.map((link, index) => (
                             <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="p-4 bg-zinc-700/50 rounded-lg flex items-center gap-3 hover:bg-zinc-700 transition-colors">
                                <div className="w-8 h-8 bg-orange-500/20 rounded-md flex items-center justify-center">
                                    <SoundWaveIcon className="w-5 h-5 text-orange-400" />
                                </div>
                                <span className="font-semibold text-slate-200">{link.title}</span>
                            </a>
                        ))}
                    </div>
                ) : <div className="text-center text-slate-400 py-8">This artist hasn't added any links yet.</div>;
            case 'following':
                const followedArtists = allArtists.filter(a => artist.following.artists.includes(a.id));
                const followedEngineers = allEngineers.filter(e => artist.following.engineers.includes(e.id));
                const followedStoodioz = allStoodioz.filter(s => artist.following.stoodioz.includes(s.id));
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followedStoodioz.map(p => <ProfileCard key={p.id} profile={p} type="stoodio" onClick={() => onSelectStoodio(p)} />)}
                        {followedEngineers.map(p => <ProfileCard key={p.id} profile={p} type="engineer" onClick={() => onSelectEngineer(p)} />)}
                        {followedArtists.map(p => <ProfileCard key={p.id} profile={p} type="artist" onClick={() => onSelectArtist(p)} />)}
                    </div>
                );
            case 'followers':
                 const followers = allArtists.filter(a => artist.followerIds.includes(a.id));
                 return followers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followers.map(p => <ProfileCard key={p.id} profile={p} type="artist" onClick={() => onSelectArtist(p)} />)}
                    </div>
                 ) : <div className="text-center text-slate-400 py-8">This artist doesn't have any followers yet.</div>;
        }
    }


    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />
                Back to Artists
            </button>
            <div className="bg-zinc-800 rounded-2xl shadow-xl border border-zinc-700">
                 {/* Profile Header */}
                 <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                        <img src={artist.imageUrl} alt={artist.name} className="w-40 h-40 rounded-xl object-cover shadow-lg border-4 border-zinc-700"/>
                        <div className="flex-grow text-center md:text-left">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-4">
                                <div>
                                    <h1 className="text-5xl font-extrabold text-orange-500">{artist.name}</h1>
                                    <div className="flex items-center justify-center md:justify-start text-slate-400 mt-2">
                                        <UsersIcon className="w-5 h-5 mr-2" />
                                        <span>{artist.followers.toLocaleString()} followers</span>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={() => onStartConversation(artist)}
                                        className="w-full sm:w-auto px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md bg-zinc-700 text-slate-100 hover:bg-zinc-600"
                                    >
                                        <MessageIcon className="w-5 h-5" />
                                        Message
                                    </button>
                                    <button 
                                        onClick={() => onToggleFollow('artist', artist.id)}
                                        className={`w-full sm:w-auto px-6 py-3 rounded-lg text-base font-bold transition-colors duration-200 flex items-center justify-center gap-2 shadow-md ${isFollowing ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-orange-400 border-2 border-orange-400 hover:bg-zinc-600'}`}
                                    >
                                        {isFollowing ? <UserCheckIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                </div>
                            </div>
                            <p className="text-slate-300 leading-relaxed max-w-2xl">{artist.bio}</p>
                        </div>
                    </div>
                 </div>

                 {/* Tabs */}
                 <div className="border-t border-zinc-700 px-8 py-3 flex items-center gap-2">
                    <TabButton tab="activity" label="Activity" />
                    <TabButton tab="links" label="Links" />
                    <TabButton tab="following" label={`Following (${artist.following.artists.length + artist.following.engineers.length + artist.following.stoodioz.length})`} />
                    <TabButton tab="followers" label={`Followers (${artist.followerIds.length})`} />
                 </div>
                 
                 {/* Tab Content */}
                 <div className="p-8 border-t border-zinc-700 bg-zinc-800/50 rounded-b-2xl">
                    {renderContent()}
                 </div>
            </div>
        </div>
    );
};

export default ArtistProfile;