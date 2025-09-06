

import React, { useState } from 'react';
// FIX: Added BookingRequest to the import list.
import type { Stoodio, Booking, Artist, Engineer, LinkAttachment, Comment, Post, BookingRequest } from '../types';
import { BookingStatus } from '../types';
import { EditIcon, PhotoIcon, EquipmentIcon, CalendarIcon, LocationIcon, UsersIcon, DollarSignIcon, SoundWaveIcon, UserCheckIcon, UserPlusIcon, UserGroupIcon, CloseIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';

interface StoodioDashboardProps {
    stoodio: Stoodio;
    bookings: Booking[];
    allArtists: Artist[];
    allEngineers: Engineer[];
    allStoodioz: Stoodio[];
    onUpdateStoodio: (updatedProfile: Partial<Stoodio>) => void;
    onToggleFollow: (type: 'artist' | 'engineer' | 'stoodio', id: string) => void;
    onSelectArtist: (artist: Artist) => void;
    onSelectEngineer: (engineer: Engineer) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onPost: (postData: { text: string; imageUrl?: string; link?: LinkAttachment }) => void;
    onLikePost: (postId: string) => void;
    onCommentOnPost: (postId: string, text: string) => void;
    currentUser: Artist | Engineer | Stoodio | null;
    // FIX: Added the onPostJob prop to fix the type error.
    onPostJob: (jobRequest: Omit<BookingRequest, 'totalCost' | 'engineerPayRate' | 'requestType'>) => void;
}

type DashboardTab = 'dashboard' | 'following' | 'followers' | 'photos';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-zinc-800 p-4 rounded-xl shadow-md flex items-center gap-4 border border-zinc-700">
        <div className="bg-orange-500/20 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-slate-400 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
    </div>
);

// FIX: Added a new component to allow studio owners to post jobs.
const PostJobCard: React.FC<{ onPostJob: StoodioDashboardProps['onPostJob'] }> = ({ onPostJob }) => {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [startTime, setStartTime] = useState('12:00');
    const [duration, setDuration] = useState(4);
    const [skills, setSkills] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onPostJob({
            date,
            startTime,
            duration,
            requiredSkills: skills ? skills.split(',').map(s => s.trim()) : [],
        });
        // Reset form
        setDate(today);
        setStartTime('12:00');
        setDuration(4);
        setSkills('');
    };

    return (
        <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
            <h3 className="text-xl font-bold text-slate-100 mb-4">Post a Job for Engineers</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                