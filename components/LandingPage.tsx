import React from 'react';
import type { Stoodio, Producer } from '../types';
import { AppView } from '../types';
import { MicrophoneIcon, SoundWaveIcon, HouseIcon, ChevronRightIcon, MusicNoteIcon } from './icons.tsx';
import StoodioCard from './StudioCard.tsx';
import EngineerCard from './EngineerCard.tsx';
import ProducerCard from './ProducerCard.tsx';
import AiHeroText from './AiHeroText.tsx';
import ProductTour from './ProductTour.tsx';
import AriaCantataHero from './AriaHero.tsx';
import { useAppState } from '../contexts/AppContext.tsx';

interface LandingPageProps {
    onNavigate: (view: AppView) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectProducer: (producer: Producer) => void;
    onOpenAriaCantata: () => void;
}

const Stat: React.FC<{ value: string, label: string }> = ({ value, label }) => (
    <div className="text-center">
        <p className="text-4xl lg:text-5xl font-extrabold text-orange-400 text-glow">{value}</p>
        <p className="text-sm lg:text-base text-zinc-400 mt-1">{label}</p>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onSelectStoodio, onSelectProducer, onOpenAriaCantata }) => {
    const { stoodioz, engineers, artists, producers } = useAppState();
    
    const featuredStoodioz = stoodioz.slice(0, 3);
    const featuredEngineers = engineers.slice(0, 3);
    const featuredProducers = producers.slice(0, 3);

    return (
        <div className="space-y-24 md:space-y-32">
            {/* Hero Section */}
            <section className="text-center pt-12 md:pt-20">
                <AiHeroText text="Discover. Book. Create." className="text-6xl md:text-8xl font-extrabold tracking-tighter" />

                <p className="max-w-3xl mx-auto mt-6 text-lg md:text-xl text-zinc-300">
                   The all-in-one platform for artists, producers, and engineers. Find top-tier studios, collaborate with talent, and bring your projects to life—all powered by Aria Cantata, your personal AI assistant.
                </p>
                
                <AriaCantataHero onOpenAriaCantata={onOpenAriaCantata} />

                <div className="mt-10 flex justify-center items-center gap-4">
                    <button 
                        onClick={() => onNavigate(AppView.CHOOSE_PROFILE)}
                        className="bg-orange-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-orange-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 shadow-lg"
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
            
            {/* Featured Stoodioz Section */}
            <section>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-100 text-glow">Featured Stoodioz</h2>
                    <button onClick={() => onNavigate(AppView.STOODIO_LIST)} className="flex items-center gap-2 text-orange-400 font-semibold hover:underline">
                        View All <ChevronRightIcon className="w-5 h-5 text-orange-400"/>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {featuredStoodioz.map((stoodio, index) => (
                        <StoodioCard key={stoodio.id} stoodio={stoodio} onSelectStoodio={onSelectStoodio} />
                    ))}
                </div>
            </section>
            
            {/* Featured Engineers Section */}
            <section>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-100 text-glow">Top Engineers</h2>
                     <button onClick={() => onNavigate(AppView.ENGINEER_LIST)} className="flex items-center gap-2 text-orange-400 font-semibold hover:underline">
                        View All <ChevronRightIcon className="w-5 h-5 text-orange-400"/>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {featuredEngineers.map(engineer => (
                        <EngineerCard key={engineer.id} engineer={engineer} onSelectEngineer={() => onNavigate(AppView.ENGINEER_PROFILE)} onToggleFollow={() => {}} isFollowing={false} isSelf={false} isLoggedIn={false} />
                    ))}
                </div>
            </section>

             {/* Featured Producers Section */}
            <section>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-100 text-glow">Featured Producers</h2>
                    <button onClick={() => onNavigate(AppView.PRODUCER_LIST)} className="flex items-center gap-2 text-orange-400 font-semibold hover:underline">
                        View All <ChevronRightIcon className="w-5 h-5 text-orange-400"/>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {featuredProducers.map(producer => (
                        <ProducerCard key={producer.id} producer={producer} onSelectProducer={onSelectProducer} onToggleFollow={() => {}} isFollowing={false} isSelf={false} isLoggedIn={false} />
                    ))}
                </div>
            </section>
            
            {/* Stats Section */}
            <section className="max-w-4xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <Stat value={stoodioz.length.toString()} label="Verified Stoodioz" />
                    <Stat value={engineers.length.toString()} label="Pro Engineers" />
                    <Stat value={producers.length.toString()} label="Top Producers" />
                    <Stat value={artists.length.toString()} label="Artists" />
                </div>
            </section>

            {/* Product Tour Section */}
            <section>
                 <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-100 text-glow">Discover the Stoodioz Workflow</h2>
                </div>
                <ProductTour />
            </section>

            {/* How it works */}
            <section>
                 <div className="text-center">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-100 text-glow">How It Works</h2>
                    <p className="max-w-2xl mx-auto mt-4 text-lg text-zinc-400">
                        A seamless experience for every role in the music creation process.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="p-8 text-center cardSurface">
                        <MicrophoneIcon className="w-12 h-12 text-green-400 mx-auto mb-4"/>
                        <h3 className="text-2xl font-bold text-zinc-100">For Artists</h3>
                        <p className="text-zinc-400 mt-2">Find the perfect space and sound engineer. Book sessions, manage projects, and collaborate.</p>
                    </div>
                     <div className="p-8 text-center cardSurface">
                        <SoundWaveIcon className="w-12 h-12 text-orange-400 mx-auto mb-4"/>
                        <h3 className="text-2xl font-bold text-zinc-100">For Engineers</h3>
                        <p className="text-zinc-400 mt-2">Showcase your portfolio, get discovered by artists, and manage your bookings effortlessly.</p>
                    </div>
                     <div className="p-8 text-center cardSurface">
                        <HouseIcon className="w-12 h-12 text-red-400 mx-auto mb-4"/>
                        <h3 className="text-2xl font-bold text-zinc-100">For Stoodioz</h3>
                        <p className="text-zinc-400 mt-2">List your space, manage your calendar, find in-house talent, and keep your rooms booked.</p>
                    </div>
                    <div className="p-8 text-center cardSurface">
                        <MusicNoteIcon className="w-12 h-12 text-purple-400 mx-auto mb-4"/>
                        <h3 className="text-2xl font-bold text-zinc-100">For Producers</h3>
                        <p className="text-zinc-400 mt-2">Monetize your instrumentals, manage your beat store, and get hired for custom production work.</p>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="p-12 text-center cardSurface">
                <AiHeroText text="Ready to Create?" className="text-4xl md:text-5xl font-extrabold" />
                <p className="max-w-2xl mx-auto mt-4 text-lg text-zinc-300">
                    Join a community of passionate music creators. Sign up today and take the next step in your musical journey.
                </p>
                <button 
                    onClick={() => onNavigate(AppView.CHOOSE_PROFILE)}
                    className="mt-8 bg-orange-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-orange-600 transition-all duration-300 shadow-lg"
                >
                    Sign Up for Free
                </button>
            </section>
        </div>
    );
};

export default LandingPage;