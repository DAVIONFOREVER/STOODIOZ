import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from './icons';

interface Slide {
    title: string;
    description: string;
}

const tourSlides: Slide[] = [
    {
        title: "1. Discover Your Sound",
        description: "Use powerful search and an interactive map to find the perfect space. Filter by location, amenities, and vibe.",
    },
    {
        title: "2. Book with Confidence",
        description: "Check real-time availability on the studio's calendar. Select your room, date, and time to instantly book your session.",
    },
    {
        title: "3. Find Your Vibe with AI",
        description: "Describe the sound you're looking for, and let our AI recommend the perfect studios, engineers, and producers for your project.",
    },
    {
        title: "4. Collaborate & Create",
        description: "Keep the project moving. Use the built-in messenger to chat with your engineer, share audio files, and finalize details.",
    },
    {
        title: "5. Monetize Your Talent",
        description: "For professionals, Stoodioz is a business tool. Sell beats, offer masterclasses, and get hired for sessions.",
    }
];

const Slide1_Discover: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <div className={`animated-slide-wrapper ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full max-w-sm mx-auto">
            {/* Search Bar */}
            <div className="bg-zinc-800 rounded-lg p-3 shadow-lg mb-4 flex items-center gap-2 animate-in" style={{ '--delay': '200ms' }}>
                <SearchIcon className="w-5 h-5 text-zinc-500" />
                <div className="w-full bg-zinc-700 h-4 rounded-md relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-full bg-orange-400 w-full animate-[type-in_1.5s_steps(15,end)_500ms_forwards]"></div>
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-900 animate-[text-reveal_1.5s_steps(15,end)_500ms_forwards]">lo-fi vibe...</span>
                </div>
            </div>
            {/* Studio Cards */}
            <div className="bg-zinc-800 rounded-lg p-2 shadow-lg animate-in" style={{ '--delay': '800ms' }}>
                <div className="w-full h-16 bg-zinc-700 rounded-md"></div>
            </div>
            <div className="bg-orange-500/20 ring-2 ring-orange-500 rounded-lg p-2 shadow-2xl shadow-orange-500/20 my-2 animate-in" style={{ '--delay': '1100ms' }}>
                <div className="w-full h-16 bg-orange-500/30 rounded-md"></div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-2 shadow-lg animate-in" style={{ '--delay': '1400ms' }}>
                <div className="w-full h-16 bg-zinc-700 rounded-md"></div>
            </div>
        </div>
    </div>
);

const Slide2_Book: React.FC<{ isActive: boolean }> = ({ isActive }) => (
     <div className={`animated-slide-wrapper ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full max-w-sm mx-auto bg-zinc-800 p-4 rounded-xl shadow-2xl flex gap-4">
            {/* Calendar */}
            <div className="w-1/2 bg-zinc-900/50 p-2 rounded-lg animate-in" style={{ '--delay': '200ms' }}>
                <div className="grid grid-cols-4 gap-1">
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className={`h-5 w-5 rounded-full ${i === 10 ? 'bg-orange-500 animate-[pop_0.5s_ease-out_800ms_forwards]' : 'bg-zinc-700'}`}></div>
                    ))}
                </div>
            </div>
            {/* Time Slots */}
            <div className="w-1/2 space-y-2">
                <div className="h-6 rounded-md bg-zinc-700 animate-in" style={{ '--delay': '1200ms' }}></div>
                <div className="h-6 rounded-md bg-orange-500 animate-[pop_0.5s_ease-out_1800ms_forwards] animate-in" style={{ '--delay': '1400ms' }}></div>
                <div className="h-6 rounded-md bg-zinc-700 animate-in" style={{ '--delay': '1600ms' }}></div>
            </div>
        </div>
    </div>
);

const Slide3_AI: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <div className={`animated-slide-wrapper ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full max-w-md mx-auto">
            <div className="bg-zinc-800 rounded-lg p-3 shadow-lg mb-4 animate-in" style={{ '--delay': '200ms' }}>
                 <div className="h-12 bg-zinc-700 rounded-md relative p-2">
                     <div className="w-full bg-zinc-600 h-2 rounded-full mb-2 animate-[type-in_1.5s_steps(20,end)_400ms_forwards]"></div>
                     <div className="w-2/3 bg-zinc-600 h-2 rounded-full animate-[type-in_1.5s_steps(15,end)_400ms_forwards]"></div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-zinc-800 rounded-lg p-2 h-24 shadow-lg animate-in" style={{ '--delay': '1000ms' }}></div>
                <div className="bg-zinc-800 rounded-lg p-2 h-24 shadow-lg animate-in" style={{ '--delay': '1200ms' }}></div>
                <div className="bg-zinc-800 rounded-lg p-2 h-24 shadow-lg animate-in" style={{ '--delay': '1400ms' }}></div>
            </div>
        </div>
    </div>
);

const Slide4_Collaborate: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <div className={`animated-slide-wrapper ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full max-w-sm mx-auto">
            <div className="flex justify-start mb-3 animate-in" style={{ '--delay': '400ms' }}>
                <div className="bg-zinc-700 rounded-lg p-2 w-3/4">
                    <div className="h-2 bg-zinc-600 rounded w-full mb-1"></div>
                    <div className="h-2 bg-zinc-600 rounded w-2/3"></div>
                </div>
            </div>
            <div className="flex justify-end mb-4 animate-in" style={{ '--delay': '1000ms' }}>
                <div className="bg-orange-500 rounded-lg p-2 w-1/2">
                    <div className="h-2 bg-orange-400 rounded w-full"></div>
                </div>
            </div>
             <div className="flex justify-start animate-in" style={{ '--delay': '1600ms' }}>
                <div className="bg-zinc-700 rounded-lg p-2 w-1/2">
                    <div className="h-2 bg-zinc-600 rounded w-full"></div>
                </div>
            </div>
        </div>
    </div>
);

const Slide5_Monetize: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <div className={`animated-slide-wrapper ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full max-w-md mx-auto bg-zinc-800 p-4 rounded-xl shadow-2xl">
            <div className="flex justify-between items-center mb-3 animate-in" style={{ '--delay': '300ms' }}>
                <div className="h-4 w-1/4 bg-zinc-700 rounded"></div>
                <div className="h-6 w-1/3 bg-zinc-700 rounded-lg flex items-center justify-end px-2">
                    <span className="text-sm font-bold text-green-400 animate-[count-up_2s_ease-out_1800ms_forwards] opacity-0" style={{'--target-number': 1250}}>
                        $<span className="counter-value">850</span>
                    </span>
                </div>
            </div>
            <div className="relative bg-zinc-700/50 p-3 rounded-lg animate-in" style={{'--delay': '800ms'}}>
                <div className="grid grid-cols-2 gap-2">
                    <div className="h-20 bg-zinc-600 rounded"></div>
                    <div className="relative h-20 bg-zinc-600 rounded">
                         <div className="absolute inset-0 flex items-center justify-center text-white font-black text-2xl tracking-widest bg-green-600 rounded animate-[stamp_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_1500ms_forwards] opacity-0 scale-150">
                            SOLD!
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);


const ProductTour: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = useCallback(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % tourSlides.length);
    }, []);

    const handlePrev = () => {
        setCurrentIndex(prevIndex => (prevIndex - 1 + tourSlides.length) % tourSlides.length);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            handleNext();
        }, 5000); // Auto-play every 5 seconds

        return () => clearInterval(timer);
    }, [handleNext]);

    const slides = [
        <Slide1_Discover isActive={currentIndex === 0} />,
        <Slide2_Book isActive={currentIndex === 1} />,
        <Slide3_AI isActive={currentIndex === 2} />,
        <Slide4_Collaborate isActive={currentIndex === 3} />,
        <Slide5_Monetize isActive={currentIndex === 4} />
    ];

    return (
        <div className="max-w-4xl mx-auto p-6 cardSurface">
            <div className="relative aspect-[16/10] sm:aspect-video rounded-2xl overflow-hidden shadow-lg bg-zinc-900">
                <style>{`
                    @keyframes pop {
                        0% { transform: scale(0.9); opacity: 0.8; }
                        70% { transform: scale(1.05); }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    @keyframes type-in {
                        from { width: 0; }
                        to { width: 60%; }
                    }
                     @keyframes text-reveal {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes stamp {
                        from { opacity: 0; transform: scale(2) rotate(15deg); }
                        to { opacity: 1; transform: scale(1) rotate(-10deg); }
                    }
                    @property --num {
                        syntax: '<integer>';
                        initial-value: 850;
                        inherits: false;
                    }
                    @keyframes count-up { to { --num: var(--target-number, 1250); } }
                    .counter-value::after { content: counter(num); }
                    .animate-\\[count-up_2s_ease-out_1800ms_forwards\\] { animation: count-up 2s ease-out 1.8s forwards; counter-reset: num var(--num); }
                    
                    .animated-slide-wrapper {
                        position: absolute;
                        inset: 0;
                        background-color: rgba(9,9,11,0.5);
                        padding: 1rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: opacity 500ms ease-in-out;
                    }
                    .animate-in {
                        animation: fade-in-up 0.6s ease-out var(--delay, 0s) forwards;
                        opacity: 0;
                    }
                `}</style>

                {slides.map((slide, index) => (
                    <React.Fragment key={index}>
                        {slide}
                    </React.Fragment>
                ))}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 sm:p-8 text-white w-full">
                    {tourSlides.map((slide, index) => (
                        <div key={slide.title} className={`transition-opacity duration-500 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}>
                            {index === currentIndex && (
                                <div className="animate-in" style={{ '--delay': '100ms' }}>
                                    <h3 className="text-2xl md:text-3xl font-bold text-orange-400">{slide.title}</h3>
                                    <p className="text-zinc-200 mt-2 max-w-xl text-sm sm:text-base">{slide.description}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <button 
                    onClick={handlePrev} 
                    className="absolute top-1/2 left-3 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors text-white z-10"
                    aria-label="Previous slide"
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <button 
                    onClick={handleNext} 
                    className="absolute top-1/2 right-3 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors text-white z-10"
                    aria-label="Next slide"
                >
                    <ChevronRightIcon className="w-6 h-6" />
                </button>
            </div>
            
            <div className="flex justify-center items-center mt-4">
                <div className="flex items-center gap-2">
                    {tourSlides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-orange-500 w-6' : 'bg-zinc-600 hover:bg-zinc-500'}`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductTour;