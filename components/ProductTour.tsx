import React, { useState, useEffect, useCallback } from 'react';
import { TOUR_IMAGE_DISCOVER, TOUR_IMAGE_BOOK, TOUR_IMAGE_COLLABORATE } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface Slide {
    title: string;
    description: string;
    imageUrl: string;
}

const tourSlides: Slide[] = [
    {
        title: "1. Discover Your Sound",
        description: "Use our powerful search and interactive map to find the perfect space. Filter by location, amenities, and vibe.",
        imageUrl: TOUR_IMAGE_DISCOVER,
    },
    {
        title: "2. Book with Confidence",
        description: "Check real-time availability on the studio's calendar. Select your room, date, and time to instantly book your session.",
        imageUrl: TOUR_IMAGE_BOOK,
    },
    {
        title: "3. Collaborate & Create",
        description: "Keep the project moving. Use the built-in messenger to chat with your engineer, share audio files, and finalize details.",
        imageUrl: TOUR_IMAGE_COLLABORATE,
    }
];

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
        <div className="max-w-4xl mx-auto bg-zinc-800/50 p-6 rounded-3xl border border-zinc-700/50 shadow-2xl backdrop-blur-sm">
            {/* Slideshow Container */}
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg">
                {/* Slides Wrapper */}
                <div
                    className="flex h-full transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {tourSlides.map((slide) => (
                        <div key={slide.title} className="w-full h-full flex-shrink-0 relative">
                            <img
                                src={slide.imageUrl}
                                alt={slide.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-6 sm:p-8 text-white">
                                <h3 className="text-2xl md:text-3xl font-bold text-orange-400">{slide.title}</h3>
                                <p className="text-zinc-200 mt-2 max-w-xl text-sm sm:text-base">{slide.description}</p>
                            </div>
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