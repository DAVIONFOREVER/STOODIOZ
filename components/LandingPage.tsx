import React from 'react';
import type { Stoodio, Engineer, Artist, Booking, VibeMatchResult } from '../types';
import { AppView } from '../types';
import { MicrophoneIcon, SoundWaveIcon, HouseIcon, ChevronRightIcon } from './icons';
import StoodioCard from './StudioCard';
import EngineerCard from './EngineerCard';
import ArtistCard from './ArtistCard';
import AnimatedGradientText from './AnimatedGradientText';
import AiHeroText from './AiHeroText';
import DevNotificationButton from './DevNotificationButton';

interface LandingPageProps {
    onNavigate: (view: AppView) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    stoodioz: Stoodio[];
    engineers: Engineer[];
    artists: Artist[];
    bookings: Booking[];
    vibeMatchResults: VibeMatchResult | null;
}

const Stat: React.FC<{ value: string, label: string }> = ({ value, label }) => (
    <div className="text-center">
        <p className="text-4xl lg:text-5xl font-extrabold text-orange-400">{value}</p>
        <p className="text-sm lg:text-base text-zinc-400 mt-1">{label}</p>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onSelectStoodio, stoodioz, engineers, artists, bookings }) => {
    
    // Get some featured items
    const featuredStoodioz = stoodioz.slice(0, 3);
    const featuredEngineers = engineers.slice(0, 2);

    return (
        <div className="space-y-24 md:space-y-32">
            {/* Hero Section */}
            <section className="text-center pt-12 md:pt-20">
                <AnimatedGradientText text="Your Sound, Connected." className="text-6xl md:text-8xl font-extrabold tracking-tighter" />
                <p className="max-w-3xl mx-auto mt-6 text-lg md:text-xl text-zinc-300">
                    The ultimate platform for artists, audio engineers, and recording stoodioz. Discover talent, book sessions, and collaborate on your next masterpiece.
                </p>
                <div className="mt-10 flex justify-center items-center gap-4">
                    <button 
                        onClick={() => onNavigate(AppView.CHOOSE_PROFILE)}
                        className="bg-orange-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-orange-600 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 shadow-lg"
                    >
                        Get Started
                    </button>
                    <button 
                        onClick={() => onNavigate(AppView.STOODIO_LIST)}
                        className="bg-transparent border-2 border-zinc-600 text-zinc-100 font-bold py-3 px-8 rounded-lg hover:bg-zinc-800 hover:border-zinc-500 transition-all duration-300"
                    >
                        Browse Stoodioz
                    </button>
                </div>
            </section>
            
             {/* Stats Section */}
            <section className="max-w-4xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <Stat value={stoodioz.length.toString()} label="Verified Stoodioz" />
                    <Stat value={engineers.length.toString()} label="Pro Engineers" />
                    <Stat value={artists.length.toString()} label="Talented Artists" />
                    <Stat value={bookings.length.toLocaleString() + "+"} label="Sessions Booked" />
                </div>
            </section>

            {/* How it works */}
            <section>
                 <div className="text-center">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-100">How It Works</h2>
                    <p className="max-w-2xl mx-auto mt-4 text-lg text-zinc-400">
                        A seamless experience for every role in the music creation process.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700/50 text-center">
                        <MicrophoneIcon className="w-12 h-12 text-green-400 mx-auto mb-4"/>
                        <h3 className="text-2xl font-bold text-zinc-100">For Artists</h3>
                        <p className="text-zinc-400 mt-2">Find the perfect space and sound engineer. Book sessions, manage projects, and collaborate.</p>
                    </div>
                     <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700/50 text-center">
                        <SoundWaveIcon className="w-12 h-12 text-amber-400 mx-auto mb-4"/>
                        <h3 className="text-2xl font-bold text-zinc-100">For Engineers</h3>
                        <p className="text-zinc-400 mt-2">Showcase your portfolio, get discovered by artists, and manage your bookings effortlessly.</p>
                    </div>
                     <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700/50 text-center">
                        <HouseIcon className="w-12 h-12 text-orange-400 mx-auto mb-4"/>
                        <h3 className="text-2xl font-bold text-zinc-100">For Stoodioz</h3>
                        <p className="text-zinc-400 mt-2">List your space, manage your calendar, find in-house talent, and keep your rooms booked.</p>
                    </div>
                </div>
            </section>

            {/* Featured Stoodioz Section */}
            <section>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-100">Featured Stoodioz</h2>
                    <button onClick={() => onNavigate(AppView.STOODIO_LIST)} className="flex items-center gap-2 text-orange-400 font-semibold hover:underline">
                        View All <ChevronRightIcon className="w-5 h-5"/>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuredStoodioz.map(stoodio => (
                        <StoodioCard key={stoodio.id} stoodio={stoodio} onSelectStoodio={onSelectStoodio} />
                    ))}
                </div>
            </section>
            
             {/* Featured Engineers Section */}
            <section>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-100">Top Engineers</h2>
                     <button onClick={() => onNavigate(AppView.ENGINEER_LIST)} className="flex items-center gap-2 text-orange-400 font-semibold hover:underline">
                        View All <ChevronRightIcon className="w-5 h-5"/>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {featuredEngineers.map(engineer => (
                        <EngineerCard key={engineer.id} engineer={engineer} onSelectEngineer={() => {
                            // a bit of a hack to navigate, a more robust solution would pass the select handler down
                            onNavigate(AppView.ENGINEER_LIST); 
                            setTimeout(() => onNavigate(AppView.ENGINEER_PROFILE), 0);
                        }} onToggleFollow={()=>{}} isFollowing={false} isSelf={false} isLoggedIn={false} />
                    ))}
                </div>
            </section>

            {/* Call to Action */}
            <section className="bg-zinc-800 rounded-2xl p-12 text-center border border-zinc-700">
                <AnimatedGradientText text="Ready to Create?" className="text-4xl md:text-5xl font-extrabold" />
                <p className="max-w-2xl mx-auto mt-4 text-lg text-zinc-300">
                    Join a community of passionate music creators. Sign up today and take the next step in your musical journey.
                </p>
                <button 
                    onClick={() => onNavigate(AppView.CHOOSE_PROFILE)}
                    className="mt-8 bg-orange-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-orange-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
                >
                    Sign Up for Free
                </button>
            </section>
            
            <DevNotificationButton />
        </div>
    );
};

export default LandingPage;