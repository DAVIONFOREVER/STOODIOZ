

import React, { useState } from 'react';
// FIX: Update currentUser to accept Producer and onStartConversation to accept Producer
import type { Stoodio, Artist, Review, Booking, Engineer, Post, Room, Producer } from '../types';
import { UserRole, VerificationStatus } from '../types';
import Calendar from './Calendar';
import PostFeed from './PostFeed';
import { ChevronLeftIcon, PhotoIcon, UserPlusIcon, UserCheckIcon, StarIcon, UsersIcon, MessageIcon, HouseIcon, SoundWaveIcon, MicrophoneIcon, VerifiedIcon } from './icons';

interface StoodioDetailProps {
    stoodio: Stoodio;
    reviews: Review[];
    bookings: Booking[];
    allArtists: Artist[];
    allEngineers: Engineer[];
    allStoodioz: Stoodio[];
    onBook: (date: string, time: string, room: Room) => void;
    onBack: () => void;
    currentUser: Artist | Engineer | Stoodio | Producer | null;
    userRole: UserRole | null;
    onToggleFollow: (type: 'stoodio' | 'engineer' | 'artist' | 'producer', id: string) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onStartConversation: (participant: Stoodio | Artist | Engineer | Producer) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
}

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
        <button onClick={onClick} className="w-full flex items-center gap-3 bg-zinc-800 p-2 rounded-lg hover:bg-zinc-700 transition-colors text-left">
            <img src={profile.imageUrl} alt={profile.name} className="w-12 h-12 rounded-md object-cover" />
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm text-slate-200 truncate">{profile.name}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">{icon}{details}</p>
            </div>
        </button>
    );
};


const StoodioDetail: React.FC<StoodioDetailProps> = ({ stoodio, reviews, bookings, allArtists, allEngineers, allStoodioz, onBook, onBack, currentUser, userRole, onToggleFollow, onSelectArtist, onSelectEngineer, onSelectStoodio, onStartConversation, onLikePost, onCommentOnPost }) => {
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string, time: string } | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(stoodio.rooms[0] || null);

    const isFollowing = currentUser && 'following' in currentUser ? (currentUser.following.stoodioz || []).includes(stoodio.id) : false;

    const stoodioReviews = reviews.filter(r => r.stoodioId === stoodio.id);
    
    const hostedArtists = Array.from(new Set(bookings.filter(b => b.stoodio.id === stoodio.id && b.artist).map(b => b.artist!.id)))
        .map(id => allArtists.find(a => a.id === id))
        .filter((artist): artist is Artist => artist !== undefined)
        .slice(0, 5);

    const followers = allArtists.filter(a => a.following.stoodioz.includes(stoodio.id));
    const followedArtists = allArtists.filter(a => stoodio.following.artists.includes(a.id));
    const followedEngineers = allEngineers.filter(e => stoodio.following.engineers.includes(e.id));
    const followedStoodioz = allStoodioz.filter(s => stoodio.following.stoodioz.includes(s.id));

    const handleSelectTimeSlot = (date: string, time: string) => {
        if (selectedTimeSlot?.date === date && selectedTimeSlot?.time === time) {
             setSelectedTimeSlot(null); // Deselect if clicking the same slot
        } else {
            setSelectedTimeSlot({ date, time });
        }
    };

    const isBookingDisabled = !selectedTimeSlot || !selectedRoom || !currentUser;

    const getButtonText = (mobile: boolean = false) => {
        if (!currentUser) return 'Login to Book';
        if (userRole === UserRole.STOODIO && currentUser.id !== stoodio.id) return 'Cannot Book Other Stoodioz';
        if (!selectedRoom) return 'Select a Room';
        if (!selectedTimeSlot) return 'Select a Time Slot';
        return mobile ? `Book for ${selectedTimeSlot.time}` : `Book ${selectedRoom.name}: ${selectedTimeSlot.time}`;
    };
    
    return (
        <div>
             <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-orange-400 mb-6 transition-colors font-semibold">
                <ChevronLeftIcon className="w-5 h-5" />