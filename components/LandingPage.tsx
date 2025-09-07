import React from 'react';
import { AppView } from '../types';
import type { Stoodio, Engineer, Artist, Booking, VibeMatchResult } from '../types';
// FIX: Added MicrophoneIcon, SoundWaveIcon, and HouseIcon to the import.
import { ChevronRightIcon, MicrophoneIcon, SoundWaveIcon, HouseIcon } from './icons';
import MapView from './MapView';

interface LandingPageProps {
    onNavigate: (view: AppView) => void;
    stoodioz: Stoodio[];
    engineers: Engineer[];
    artists: Artist[];
    bookings: Booking[];
    vibeMatchResults: VibeMatchResult | null;
    onSelectStoodio: (stoodio: Stoodio) => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 text-center shadow-lg">
        <div className="flex justify-center mb-4">
            <div className="bg-orange-500/10 p-4 rounded-full">
                {icon}
            </div>
        </div>
        <h3 className="text-xl font-bold mb-2 text-slate-900">{title}</h3>
        <p className="text-slate-600 text-sm">{description}</p>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, stoodioz, engineers, artists, bookings, vibeMatchResults, onSelectStoodio }) => {
    return (
        <div>
            <main>
                {/* Hero Section */}
                <section className="text-center py-24 sm:py-32 lg:py-40 px-4 bg-white">
                    <div className="container mx-auto">
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-slate-900">
                           Your Sound, <span className="text-orange-500">On Demand.</span>
                        </h1>
                        <p className="max-w-2xl mx-auto mt-4 text-lg text-slate-600">
                           The premiere marketplace for booking professional recording stoodioz and connecting with talented audio engineers.
                        </p>
                        <div className="mt-8 flex justify-center gap-4">
                            <button 
                                onClick={() => onNavigate(AppView.CHOOSE_PROFILE)} 
                                className="bg-orange-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-orange-600 transform hover:scale-105 transition-all duration-300 text-lg shadow-lg flex items-center gap-2"
                            >
                                Get Started <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </section>
                
                {/* How It Works Section */}
                <section className="py-20 sm:py-24 bg-slate-50">
                    <div className="container mx-auto px-4">
                         <h2 className="text-4xl font-extrabold text-center mb-12 text-slate-900">How It Works</h2>
                         <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                           <div className="text-center">
                               <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-white border-2 border-orange-500 text-orange-400 rounded-full font-bold text-3xl shadow-md">1</div>
                               <h3 className="text-xl font-bold mb-2 text-slate-900">Find Your Space</h3>
                               <p className="text-slate-600">Browse and filter top-tier stoodioz by location, price, and amenities.</p>
                           </div>
                            <div className="text-center">
                               <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-white border-2 border-orange-500 text-orange-400 rounded-full font-bold text-3xl shadow-md">2</div>
                               <h3 className="text-xl font-bold mb-2 text-slate-900">Book Your Session</h3>
                               <p className="text-slate-600">Check live availability and book your session instantly. Hire an engineer or bring your own.</p>
                           </div>
                            <div className="text-center">
                               <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-white border-2 border-orange-500 text-orange-400 rounded-full font-bold text-3xl shadow-md">3</div>
                               <h3 className="text-xl font-bold mb-2 text-slate-900">Create Your Masterpiece</h3>
                               <p className="text-slate-600">We handle the logistics so you can focus on your art.</p>
                           </div>
                         </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 sm:py-24 bg-white">
                    <div className="container mx-auto px-4">
                        <h2 className="text-4xl font-extrabold text-center mb-4 text-slate-900">A Platform For Everyone</h2>
                        <p className="text-center text-lg text-slate-600 mb-12 max-w-2xl mx-auto">Whether you're an artist, engineer, or stoodio owner, Stoodioz provides the tools you need to succeed.</p>
                        <div className="grid md:grid-cols-3 gap-8">
                             <FeatureCard 
                                icon={<MicrophoneIcon className="w-8 h-8 text-green-400" />}
                                title="For Artists"
                                description="Discover unique recording spaces, find the perfect engineer for your sound, and connect with a community of creators."
                            />
                             <FeatureCard 
                                icon={<SoundWaveIcon className="w-8 h-8 text-orange-400" />}
                                title="For Engineers"
                                description="Find freelance session work, showcase your skills with a professional portfolio, and get booked by artists in your area."
                            />
                            <FeatureCard 
                                icon={<HouseIcon className="w-8 h-8 text-red-400" />}
                                title="For Stoodioz"
                                description="List your recording space, manage your calendar with ease, and connect with a vibrant community of artists and engineers."
                            />
                        </div>
                    </div>
                </section>
                
                 {/* Live Activity Map Section */}
                <section className="py-20 sm:py-24 bg-slate-50">
                    <div className="container mx-auto px-4">
                        <h2 className="text-4xl font-extrabold text-center mb-4 text-slate-900">Live Activity Across the Nation</h2>
                        <p className="text-center text-lg text-slate-600 mb-12 max-w-2xl mx-auto">See where sessions are happening and creators are connecting in real-time.</p>
                        <div className="relative h-[50vh]">
                             <MapView
                                stoodioz={stoodioz}
                                engineers={engineers}
                                artists={artists}
                                bookings={bookings}
                                vibeMatchResults={vibeMatchResults}
                                onSelectStoodio={onSelectStoodio}
                            />
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-white py-12">
                    <div className="container mx-auto px-4 text-center text-slate-600">
                        <p>&copy; {new Date().getFullYear()} Stoodioz. All rights reserved.</p>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default LandingPage;