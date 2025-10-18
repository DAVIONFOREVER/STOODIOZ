import React, { useState, useRef } from 'react';
import type { Stoodio, Booking, Artist, Engineer, LinkAttachment, Post, BookingRequest, Transaction, Producer } from '../types';
import { BookingStatus, UserRole, AppView, SubscriptionPlan } from '../types';
import { BriefcaseIcon, CalendarIcon, UsersIcon, DollarSignIcon, PhotoIcon, StarIcon, EditIcon } from './icons';
import CreatePost from './CreatePost';
import PostFeed from './PostFeed';
import AvailabilityManager from './AvailabilityManager';
import Following from './Following';
import FollowersList from './FollowersList';
import RoomManager from './RoomManager';
import EngineerManager from './EngineerManager';
import VerificationManager from './VerificationManager';
import Wallet from './Wallet';
import { useAppState } from '../contexts/AppContext';

type JobPostData = Pick<BookingRequest, 'date' | 'startTime' | 'duration' | 'requiredSkills' | 'engineerPayRate'>;

const JobPostForm: React.FC<{ onPostJob: (data: JobPostData) => void }> = ({ onPostJob }) => {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [startTime, setStartTime] = useState('14:00');
    const [duration, setDuration] = useState(4);
    const [engineerPayRate, setEngineerPayRate] = useState(50);
    const [requiredSkills, setRequiredSkills] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onPostJob({
            date,
            startTime,
            duration,
            engineerPayRate,
            requiredSkills: requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        });
    };
    
    const inputClasses = "mt-1 w-full p-2 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500";

    return (
        <form onSubmit={handleSubmit} className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-xl border border-zinc-700/50 mb-6">
            <h3 className="text-xl font-bold text-zinc-100 mb-4">Post a New Job</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-400">Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} min={today} className={inputClasses} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400">Start Time</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputClasses} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400">Duration (hrs)</label>
                    <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min="1" className={inputClasses} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400">Pay Rate ($/hr)</label>
                    <input type="number" value={engineerPayRate} onChange={e => setEngineerPayRate(Number(e.target.value))} min="20" className={inputClasses} />
                </div>
                <div className="md:col-span-2 lg:col-span-5">
                    <label className="block text-sm font-medium text-zinc-400">Required Skills (optional, comma-separated)</label>
                    <input type="text" value={requiredSkills} onChange={e => setRequiredSkills(e.target.value)} placeholder="e.g. Pro Tools, Vocal Tuning, Mixing" className={inputClasses} />
                </div>
                 <div className="lg:col-start-5">
                     <button type="submit" className="w-full bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors">Post Job</button>
                </div>
            </div>
        </form>
    );
};

const StoodioJobManagement: React.FC<{ stoodio: Stoodio; bookings: Booking[]; onPostJob: (data: JobPostData) => void; }> = ({ stoodio, bookings, onPostJob }) => {
    const postedJobs = bookings
        .filter(b => b.postedBy === UserRole.STOODIO && b.stoodio?.id === stoodio.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getStatusInfo = (job: Booking) => {
        switch(job.status) {
            case BookingStatus.PENDING:
                return { text: "Pending", color: "bg-yellow-400/10 text-yellow-300" };
            case BookingStatus.CONFIRMED:
                return { text: `Filled by ${job.engineer?.name}`, color: "bg-green-400/10 text-green-300" };
            case BookingStatus.COMPLETED:
                return { text: "Completed", color: "bg-blue-400/10 text-blue-300" };
            case BookingStatus.CANCELLED:
                 return { text: "Cancelled", color: "bg-red-400/10 text-red-300" };
            default:
                return { text: job.status, color: "bg-zinc-400/10 text-zinc-300" };
        }
    }

    return (
        <div>
            <JobPostForm onPostJob={onPostJob} />
             <h3 className="text-xl font-bold text-zinc-100 mb-4">Your Posted Jobs</h3>
             <div className="space-y-4">
                {postedJobs.length > 0 ? postedJobs.map(job => {
                    const status = getStatusInfo(job);
                    return (
                        <div key={job.id} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                            <div>
                                <p className="text-xs text-zinc-400">Date</p>
                                <p className="font-semibold">{new Date(job.date + 'T00:00:00').toLocaleDateString()}</p>
                            </div>
                             <div>
                                <p className="text-xs text-zinc-400">Payout</p>
                                <p className="font-semibold text-green-400">${(job.engineerPayRate * job.duration).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-400">Status</p>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.text}</span>
                            </div>
                            <div className="text-right">
                                {/* Future actions like "Cancel Job" could go here */}
                            </div>
                        </div>
                    );
                }) : (
                    <p className="text-center py-8 text-zinc-500">You haven't posted any jobs yet.</p>
                )}
             </div>
        </div>
    );
};

const UpgradeProCard: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-2xl text-white text-center shadow-lg shadow-orange-500/10">
        <StarIcon className="w-10 h-10 mx-auto text-white/80 mb-2" />
        <h3 className="text-xl font-bold mb-2">Upgrade to Stoodio Pro</h3>
        <p className="text-sm opacity-90 mb-4">Unlock advanced features, lower service fees, and priority support to grow your business.</p>
        <button 
            onClick={() => onNavigate(AppView.SUBSCRIPTION_PLANS)}
            className="bg-white text-orange-500 font-bold py-2 px-6 rounded-lg hover:bg-zinc-100 transition-all duration-300"
        >
            View Plans
        </button>
    </div>
);

type DashboardTab = 'dashboard' | 'verification' | 'jobManagement' | 'availability' | 'rooms' | 'engineers' | 'wallet' | 'photos' | 'followers' | 'following';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-zinc-800/50 p-4 rounded-xl flex items-center gap-4 border border-zinc-700/50">
        <div className="bg-orange-500/10 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-zinc-400 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-zinc-100">{value}</p>
        </div>
    </div>
);

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-3 font-semibold text-sm transition-colors whitespace-nowrap ${isActive ? 'border-b-2 border-orange-500 text-orange-400' : 'text-zinc-400 hover:text-zinc-100 border-b-2 border-transparent'}`}
    >
        {label}
    </button>
);

const StoodioDashboard: React.FC = () => {
    const { 
        currentUser, bookings, artists, engineers, stoodioz, producers 
    } = useAppState();
    const stoodio = currentUser as Stoodio;
    
    // Mock handlers defined inside component
    const onUpdateStoodio = (updates: Partial<Stoodio>) => console.log('Update Stoodio:', updates);
    const onToggleFollow = (type: string, id: string) => console.log(`Toggle follow ${type}:`, id);
    const onSelectArtist = (a: Artist) => console.log('Select artist:', a.name);
    const onSelectEngineer = (e: Engineer) => console.log('Select engineer:', e.name);
    const onSelectStoodio = (s: Stoodio) => console.log('Select stoodio:', s.name);
    const onSelectProducer = (p: Producer) => console.log('Select producer:', p.name);
    const onPost = (postData: any) => console.log('New Post:', postData);
    const onLikePost = (postId: string) => console.log('Like post:', postId);
    const onCommentOnPost = (postId: string, text: string) => console.log('Comment on post:', postId, text);
    const onPostJob = (jobData: JobPostData) => console.log('Post job:', jobData);
    const onVerificationSubmit = (id: string, data: any) => console.log('Submit verification:', id, data);
    const onNavigate = (view: AppView) => console.log('Navigate to:', view);
    const onOpenAddFundsModal = () => console.log('Open add funds');
    const onOpenPayoutModal = () => console.log('Open payout');
    const onViewBooking = (id: string) => console.log('View booking:', id);

    const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                onUpdateStoodio({ imageUrl });
            };
            reader.readAsDataURL(file);
        }
    };

    const upcomingBookingsCount = bookings
        .filter(b => b.status === BookingStatus.CONFIRMED && new Date(`${b.date}T${b.startTime}`) >= new Date())
        .length;
    
    const followers = [...artists, ...engineers, ...stoodioz, ...producers].filter(u => u.followerIds.includes(stoodio.id));
    const followedArtists = artists.filter(a => stoodio.following.artists.includes(a.id));
    const followedEngineers = engineers.filter(e => stoodio.following.engineers.includes(e.id));
    const followedStoodioz = stoodioz.filter(s => stoodio.following.stoodioz.includes(s.id));
    const followedProducers = producers.filter(p => stoodio.following.producers.includes(p.id));

    const handleBookSession = () => {
        onSelectStoodio(stoodio);
        onNavigate(AppView.STOODIO_DETAIL);
    };
    
    const isProPlan = stoodio.subscription?.plan === SubscriptionPlan.STOODIO_PRO;

    const renderContent = () => {
        switch (activeTab) {
            case 'verification':
                return <VerificationManager stoodio={stoodio} onVerificationSubmit={onVerificationSubmit} />;
            case 'jobManagement':
                return <StoodioJobManagement stoodio={stoodio} bookings={bookings} onPostJob={onPostJob} />;
            case 'availability':
                return <AvailabilityManager user={stoodio} onUpdateUser={onUpdateStoodio} />;
            case 'rooms':
                return <RoomManager stoodio={stoodio} onUpdateStoodio={onUpdateStoodio} />;
            case 'engineers':
                return <EngineerManager stoodio={stoodio} allEngineers={engineers} onUpdateStoodio={onUpdateStoodio} />;
            case 'wallet':
                return (
                     <Wallet
                        user={stoodio}
                        onAddFunds={onOpenAddFundsModal}
                        onRequestPayout={onOpenPayoutModal}
                        onViewBooking={onViewBooking}
                        userRole={UserRole.STOODIO}
                    />
                );
            case 'photos':
                return (
                    <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
                        <h3 className="text-xl font-bold mb-4">Photo Management</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {stoodio.photos.map((photo, index) => (
                                <img key={index} src={photo} alt={`${stoodio.name} ${index + 1}`} className="w-full h-32 object-cover rounded-lg"/>
                            ))}
                        </div>
                        <div className="border-2 border-dashed border-zinc-600 rounded-lg p-8 text-center">
                            <PhotoIcon className="mx-auto h-12 w-12 text-zinc-500" />
                            <p className="mt-2 text-sm text-zinc-400">Drag & drop photos here or click to upload</p>
                            <button className="mt-4 bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg text-sm">Upload Photos</button>
                        </div>
                    </div>
                );
            case 'followers':
                 return <FollowersList followers={followers} onSelectArtist={onSelectArtist} onSelectEngineer={onSelectEngineer} onSelectStoodio={onSelectStoodio} onSelectProducer={onSelectProducer} />;
            case 'following':
                return <Following studios={followedStoodioz} engineers={followedEngineers} artists={followedArtists} producers={followedProducers} onToggleFollow={onToggleFollow} onSelectStudio={onSelectStoodio} onSelectArtist={onSelectArtist} onSelectEngineer={onSelectEngineer} onSelectProducer={onSelectProducer} />;
            case 'dashboard':
            default:
                 return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <CreatePost currentUser={currentUser!} onPost={onPost} />
                            <PostFeed posts={stoodio.posts || []} authors={new Map([[stoodio.id, stoodio]])} onLikePost={onLikePost} onCommentOnPost={onCommentOnPost} onSelectAuthor={onSelectStoodio} />
                        </div>
                         <div className="lg:col-span-1 space-y-6">
                            {!isProPlan && <UpgradeProCard onNavigate={onNavigate} />}
                        </div>
                    </div>
                );
        }
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Profile Header */}
            <div className="bg-zinc-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-zinc-700/50 shadow-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                     <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group flex-shrink-0">
                            <img src={stoodio.imageUrl} alt={stoodio.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-zinc-700" />
                             <button 
                                onClick={handleImageUploadClick} 
                                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                aria-label="Change profile photo"
                            >
                                <EditIcon className="w-8 h-8 text-white" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100">{stoodio.name}</h1>
                            <p className="text-zinc-400 mt-2">Stoodio Dashboard</p>
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col gap-y-4">
                        <button
                            onClick={handleBookSession}
                            className="bg-orange-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors text-base shadow-md flex items-center justify-center gap-2"
                        >
                            <CalendarIcon className="w-5 h-5"/>
                            Book a New Session
                        </button>
                        <label className="flex items-center cursor-pointer self-center sm:self-auto">
                            <span className="text-sm font-medium text-zinc-300 mr-3">Show on Map</span>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={stoodio.showOnMap ?? false} 
                                    onChange={(e) => onUpdateStoodio({ showOnMap: e.target.checked })} 
                                />
                                <div className={`block w-12 h-6 rounded-full transition-colors ${stoodio.showOnMap ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${stoodio.showOnMap ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                     <StatCard label="Wallet Balance" value={`$${stoodio.walletBalance.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-green-400" />} />
                    <StatCard label="Upcoming Bookings" value={upcomingBookingsCount} icon={<CalendarIcon className="w-6 h-6 text-orange-400" />} />
                    <StatCard label="Followers" value={stoodio.followers} icon={<UsersIcon className="w-6 h-6 text-blue-400" />} />
                </div>
            </div>

            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 shadow-lg">
                <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                    <TabButton label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <TabButton label="Verification" isActive={activeTab === 'verification'} onClick={() => setActiveTab('verification')} />
                    <TabButton label="Job Management" isActive={activeTab === 'jobManagement'} onClick={() => setActiveTab('jobManagement')} />
                    <TabButton label="Availability" isActive={activeTab === 'availability'} onClick={() => setActiveTab('availability')} />
                    <TabButton label="Rooms" isActive={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} />
                    <TabButton label="Engineers" isActive={activeTab === 'engineers'} onClick={() => setActiveTab('engineers')} />
                    <TabButton label="Wallet" isActive={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} />
                    <TabButton label="Photos" isActive={activeTab === 'photos'} onClick={() => setActiveTab('photos')} />
                    <TabButton label="Followers" isActive={activeTab === 'followers'} onClick={() => setActiveTab('followers')} />
                    <TabButton label="Following" isActive={activeTab === 'following'} onClick={() => setActiveTab('following')} />
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default StoodioDashboard;