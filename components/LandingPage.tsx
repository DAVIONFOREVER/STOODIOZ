import React from 'react';
import type { Stoodio, Producer } from '../types';
import { AppView } from '../types';
import AnimatedGradientText from './AnimatedGradientText';
import AriaHero from './AriaHero';
import ProductTour from './ProductTour';
import { useAppState } from '../contexts/AppContext';
import StudioCard from './StudioCard';
import ProducerCard from './ProducerCard';

interface LandingPageProps {
    onNavigate: (view: AppView) => void;
    onSelectStoodio: (stoodio: Stoodio) => void;
    onSelectProducer: (producer: Producer) => void;
    onOpenAriaCantata: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onSelectStoodio, onSelectProducer, onOpenAriaCantata }) => {
    const { stoodioz, producers, currentUser } = useAppState();

    const featuredStoodioz = stoodioz.slice(0, 3);
    const featuredProducers = producers.slice(0, 3);

    return (
        <div className="space-y-24 md:space-y-32">
            {/* Hero Section */}
            <section className="text-center">
                <AnimatedGradientText text="Discover, Book, Create." className="text-5xl md:text-7xl font-extrabold" />
                <p className="max-w-3xl mx-auto mt-6 text-lg md:text-xl text-slate-400">
                    The premier platform for artists to discover and book professional recording studios, and for studio owners to showcase their unique spaces.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button onClick={() => onNavigate(AppView.STOODIO_LIST)} className="w-full sm:w-auto bg-orange-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-orange-600 transition-all text-lg shadow-md shadow-orange-500/20">
                        Find a Stoodio
                    </button>
                    <button onClick={() => onNavigate(AppView.CHOOSE_PROFILE)} className="w-full sm:w-auto bg-zinc-700 text-slate-100 font-bold py-3 px-8 rounded-lg hover:bg-zinc-600 transition-all text-lg">
                        List Your Space
                    </button>
                </div>
            </section>
            
            <section>
                 <ProductTour />
            </section>

            {/* AI Assistant Section */}
            <section className="text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">Meet Aria Cantata</h2>
                <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-8">
                    Your AI A&R executive. Get personalized recommendations, booking assistance, and creative guidance to elevate your sound.
                </p>
                <AriaHero onOpenAriaCantata={onOpenAriaCantata} />
            </section>

            {/* Featured Studios */}
            <section>
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-10">Featured Stoodioz</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {featuredStoodioz.map(stoodio => (
                        <StudioCard key={stoodio.id} stoodio={stoodio} onSelectStoodio={onSelectStoodio} />
                    ))}
                </div>
            </section>

             {/* Featured Producers */}
            <section>
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-10">Top Producers</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {featuredProducers.map(producer => (
                        <ProducerCard 
                            key={producer.id} 
                            producer={producer} 
                            onSelectProducer={onSelectProducer}
                            onToggleFollow={() => {}}
                            isFollowing={false}
                            isSelf={false}
                            isLoggedIn={!!currentUser}
                        />
                    ))}
                </div>
            </section>

        </div>
    );
};

export default LandingPage;
