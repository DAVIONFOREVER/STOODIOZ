


import React, { useState } from 'react';
// FIX: Added BookingRequest to the import list.
import type { Stoodio, Booking, Artist, Engineer, LinkAttachment, Comment, Post, BookingRequest } from '../types';
import { BookingStatus } from '../types';
import { EditIcon, PhotoIcon, EquipmentIcon, CalendarIcon, LocationIcon, UsersIcon, DollarSignIcon, SoundWaveIcon, UserCheckIcon, UserPlusIcon, UserGroupIcon, CloseIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';

// FIX: Defined JobPostData to match the expected structure for posting a job.
type JobPostData = Pick<BookingRequest, 'date' | 'startTime' | 'duration' | 'requiredSkills' | 'engineerPayRate'>;


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
    // FIX: Corrected the onPostJob prop type to align with the implementation, which does not expect a 'room' property.
    onPostJob: (jobRequest: JobPostData) => void;
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

// FIX: The PostJobCard component now correctly handles engineer pay rate and has been updated to accept the `stoodio` prop.
const PostJobCard: React.FC<{ stoodio: Stoodio; onPostJob: StoodioDashboardProps['onPostJob'] }> = ({ stoodio, onPostJob }) => {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [startTime, setStartTime] = useState('12:00');
    const [duration, setDuration] = useState(4);
    const [skills, setSkills] = useState('');
    const [engineerPayRate, setEngineerPayRate] = useState(stoodio.engineerPayRate.toString());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // FIX: The object passed to onPostJob now includes `engineerPayRate` and correctly matches the updated prop type, resolving the original error about the missing 'room' property by fixing the type definition.
        onPostJob({
            date,
            startTime,
            duration,
            requiredSkills: skills ? skills.split(',').map(s => s.trim()) : [],
            engineerPayRate: parseFloat(engineerPayRate) || 0,
        });
        // Reset form
        setDate(today);
        setStartTime('12:00');
        setDuration(4);
        setSkills('');
        setEngineerPayRate(stoodio.engineerPayRate.toString());
    };

    return (
        <div className="bg-zinc-800 rounded-2xl shadow-lg p-6 border border-zinc-700">
            <h3 className="text-xl font-bold text-slate-100 mb-4">Post a Job for Engineers</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="job-date" className="text-sm font-semibold text-slate-400 mb-1 block">Date</label>
                        <input type="date" id="job-date" value={date} min={today} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                     <div>
                        <label htmlFor="job-start-time" className="text-sm font-semibold text-slate-400 mb-1 block">Start Time</label>
                        <input type="time" id="job-start-time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                </div>
                 <div>
                    <label htmlFor="job-duration" className="text-sm font-semibold text-slate-400 mb-1 block">Duration (hours)</label>
                    <input type="number" id="job-duration" value={duration} min="1" max="12" onChange={e => setDuration(parseInt(e.target.value))} className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" />
                </div>
                <div>
                    <label htmlFor="job-pay-rate" className="text-sm font-semibold text-slate-400 mb-1 block">Engineer Payout ($/hr)</label>
                    <input type="number" id="job-pay-rate" value={engineerPayRate} min="0" step="1" onChange={e => setEngineerPayRate(e.target.value)} className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" />
                </div>
                 <div>
                    <label htmlFor="job-skills" className="text-sm font-semibold text-slate-400 mb-1 block">Required Skills (optional, comma-separated)</label>
                    <input type="text" id="job-skills" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g., Pro Tools, Vocal Tuning" className="w-full bg-zinc-700 border-zinc-600 text-slate-200 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" />
                </div>
                <button type="submit" className="w-full bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-all shadow-md">
                    Post Job to Board
                </button>
            </form>
        </div>
    );
};
