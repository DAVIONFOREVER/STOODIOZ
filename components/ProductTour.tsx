
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface Slide {
    title: string;
    description: string;
}

const tourSlides: Slide[] = [
    {
        title: "1. Discover Your Sound",
        description: "Use our powerful search and interactive map to find the perfect space. Filter by location, amenities, and vibe.",
    },
    {
        title: "2. Book with Confidence",
        description: "Check real-time availability on the studio's calendar. Select your room, date, and time to instantly book your session.",
    },
    {
        title: "3. Collaborate & Create",
        description: "Keep the project moving. Use the built-in messenger to chat with your engineer, share audio files, and finalize details.",
    }
];

const AnimatedSlide: React.FC<{ slide: Slide; isActive: boolean }> = ({ slide, isActive }) => {
    // IMPORTANT: inactive slides must not intercept clicks (opacity-0 still blocks pointer events).
    const commonWrapperClass = `absolute inset-0 bg-zinc-900/50 p-4 sm:p-6 flex items-center justify-center transition-opacity duration-500 ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`;

    if (slide.title.includes("Discover")) {
        return (
            <div className={commonWrapperClass}>
                <div className="w-full max-w-md mx-auto">
                    <div className="bg-zinc-800 rounded-lg p-2 shadow-lg mb-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
                        <div className="w-full bg-zinc-700 h-8 rounded-md"></div>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-2 shadow-lg animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        <div className="w-full h-24 bg-zinc-700 rounded-md"></div>
                    </div>
                    <div className="bg-orange-500/20 ring-2 ring-orange-500 rounded-lg p-2 shadow-2xl shadow-orange-500/20 my-2 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                        <div className="w-full h-24 bg-orange-500/30 rounded-md"></div>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-2 shadow-lg animate-fade-in-up" style={{ animationDelay: '800ms' }}>
                        <div className="w-full h-24 bg-zinc-700 rounded-md"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (slide.title.includes("Book")) {
        return (
            <div className={commonWrapperClass}>
                <div className="w-full max-w-sm mx-auto bg-zinc-800 p-4 rounded-xl shadow-2xl flex gap-4">
                    <div className="w-1/2 space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className={`h-8 rounded-md animate-fade-in`} style={{ animationDelay: `${200 + i * 100}ms`, backgroundColor: i === 2 ? '#fb923c' : '#3f3f46' }}></div>
                        ))}
                    </div>
                    <div className="w-1/2 space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className={`h-8 rounded-md animate-fade-in`} style={{ animationDelay: `${600 + i * 100}ms`, backgroundColor: i === 1 ? '#f97316' : '#3f3f46' }}></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (slide.title.includes("Collaborate")) {
         return (
            <div className={commonWrapperClass}>
                 <div className="w-full max-w-sm mx-auto">
                    <div className="flex justify-start mb-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <div className="bg-zinc-700 rounded-lg p-3 w-3/4">
                            <div className="h-2 bg-zinc-600 rounded w-full mb-2"></div>
                            <div className="h-2 bg-zinc-600 rounded w-2/3"></div>
                        </div>
                    </div>
                     <div className="flex justify-end mb-4 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                        <div className="bg-orange-500 rounded-lg p-3 w-3/4">
                            <div className="h-2 bg-orange-400 rounded w-full"></div>
                        </div>
                    </div>
                     <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded-full animate-fade-in" style={{ animationDelay: '1000ms' }}>
                        <div className="flex-grow h-6 bg-zinc-700 rounded-full"></div>
                        <div className="w-6 h-6 rounded-full bg-orange-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};


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

    return (
        <div className="max-w-4xl mx-auto p-6 cardSurface">
            {/* Slideshow Container */}
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg bg-zinc-900">
                {/* Animated Backgrounds */}
                {tourSlides.map((slide, index) => (
                    <AnimatedSlide key={slide.title} slide={slide} isActive={currentIndex === index} />
                ))}

                {/* Text Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                 <div className="absolute bottom-0 left-0 p-6 sm:p-8 text-white w-full">
                    {tourSlides.map((slide, index) => (
                        <div key={slide.title} className={`transition-opacity duration-500 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}>
                            {index === currentIndex && (
                                <div className="animate-fade-in-up" style={{animationDelay: '100ms'}}>
                                    <h3 className="text-2xl md:text-3xl font-bold text-orange-400">{slide.title}</h3>
                                    <p className="text-zinc-200 mt-2 max-w-xl text-sm sm:text-base">{slide.description}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Navigation Controls */}
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
            
            {/* Progress Dots */}
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
