import React, { useState } from 'react';
import type { Artist, Booking } from '../types';
import { BookingStatus, AppView, UserRole } from '../types';
import { CalendarIcon, UsersIcon, DollarSignIcon, EditIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import Wallet from './Wallet';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { useNavigation } from '../hooks/useNavigation';
import { useSocial } from '../hooks/useSocial';
import { useProfile } from '../hooks/useProfile';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-zinc-800/50 p-4 rounded-xl flex items-center gap-4 border border-zinc-700/50">
        <div className="bg-orange-500/10 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-zinc-400 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-zinc-100">{value}</p>
        </div>
    </div>
);

const ArtistSettings: React.FC<{ artist: Artist, onUpdateArtist: (updates: Partial<Artist>) => void }> = ({ artist, onUpdateArtist }) => {
    const [name, setName] = useState(artist.name);
    const [bio, setBio] = useState(artist.bio);
    const [imageUrl, setImageUrl] = useState(artist.imageUrl);
    const [coverUrl, setCoverUrl] = useState(artist.cover_image_url || '');

    const handleSave = () => {
        onUpdateArtist({ name, bio, imageUrl, cover_image_url: coverUrl });
    };

    const hasChanges = name !== artist.name || bio !== artist.bio || imageUrl !== artist.imageUrl || coverUrl !== (artist.cover_image_url || '');
    
    const inputClasses = "w-full p-2 bg-zinc-700 border-zinc-600 text-zinc-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500";
    const labelClasses = "block text-sm font-medium text-zinc-300 mb-1";

    return (
        <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2 flex items-center gap-2">
                <EditIcon className="w-6 h-6 text-orange-400" />
                Profile Settings
            </h1>
            <p className="text-zinc-400 mb-6">Update your public profile information.</p>
            <div className="space-y-4">
                <div>
                    <label htmlFor="artist-name" className={labelClasses}>Artist Name</label>
                    <input type="text" id="artist-name" value={name} onChange={e => setName(e.target.value)} className={inputClasses} />
                </div>
                 <div>
                    <label htmlFor="artist-bio" className={labelClasses}>Bio</label>
                    <textarea id="artist-bio" value={bio} onChange={e => setBio(e.target.value)} rows={4} className={inputClasses}></textarea>
                </div>
                <div>
                    <label htmlFor="artist-image-url" className={labelClasses}>Profile Picture URL</label>
                    <input type="text" id="artist-image-url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={inputClasses} placeholder="https://..." />
                </div>
                 <div>
                    <label htmlFor="artist-cover-url" className={labelClasses}>Cover Image URL</label>
                    <input type="text" id="artist-cover-url" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} className={inputClasses} placeholder="https://..." />
                </div>
            </div>
             <div className="mt-6 flex justify-end">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-all disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};


const ArtistDashboard: React.FC = () => {
    const { currentUser, bookings } = useAppState();
    const dispatch = useAppDispatch();
    const { navigate, viewArtistProfile, viewBooking } = useNavigation();
    const { createPost, likePost, commentOnPost } = useSocial();
    const { updateProfile } = useProfile();

    const [activeTab, setActiveTab] = useState('dashboard');
    const artist = currentUser as Artist;

    const onOpenAddFundsModal = () => dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: true } });

    const upcomingBookings = bookings.filter(b => b.artist?.id === artist.id && b.status === BookingStatus.CONFIRMED && new Date(b.date) >= new Date());

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <CreatePost currentUser={currentUser!} onPost={createPost} />
                            <PostFeed posts={artist.posts || []} authors={new Map([[artist.id, artist]])} onLikePost={likePost} onCommentOnPost={commentOnPost} onSelectAuthor={() => viewArtistProfile(artist)} />
                        </div>
                         <div className="lg:col-span-1 space-y-6">
                            {/* Placeholder for potential artist-specific widgets */}
                        </div>
                    </div>
                );
            case 'settings':
                return <ArtistSettings artist={artist} onUpdateArtist={updateProfile} />;
            case 'wallet':
                return <Wallet user={artist} onAddFunds={onOpenAddFundsModal} onRequestPayout={() => {}} onViewBooking={viewBooking} userRole={UserRole.ARTIST} />;
            default:
                return null;
        }
    };
    
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-zinc-800/50 p-6 md:p-8 rounded-2xl border border-zinc-700/50 shadow-lg">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <img src={artist.imageUrl} alt={artist.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-zinc-700" />
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{artist.name}</h1>
                        <p className="text-zinc-400 mt-2">Artist Dashboard</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <StatCard label="Wallet Balance" value={`$${artist.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                    <StatCard label="Upcoming Sessions" value={upcomingBookings.length} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
                    <StatCard label="Followers" value={artist.followers} icon={<UsersIcon className="w-6 h-6 text-blue-400" />} />
                </div>
            </div>

            <div className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 shadow-lg">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-3 font-semibold text-sm ${activeTab === 'dashboard' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100'}`}>Dashboard</button>
                    <button onClick={() => setActiveTab('settings')} className={`px-4 py-3 font-semibold text-sm ${activeTab === 'settings' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100'}`}>Settings</button>
                    <button onClick={() => setActiveTab('wallet')} className={`px-4 py-3 font-semibold text-sm ${activeTab === 'wallet' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100'}`}>Wallet</button>
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ArtistDashboard;