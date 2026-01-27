
import React, { useState, useRef, useEffect } from 'react';
import { useOnScreen } from '../hooks/useOnScreen';
import { PlayIcon } from './icons';

interface StageMediaFrameProps {
    src: string;
    type: 'image' | 'video';
    thumbnailUrl?: string;
    displayMode?: 'fit' | 'fill';
    focusPoint?: { x: number; y: number };
    altText?: string;
}

const StageMediaFrame: React.FC<StageMediaFrameProps> = ({ 
    src, 
    type, 
    thumbnailUrl, 
    displayMode = 'fit', 
    focusPoint = { x: 0.5, y: 0.5 },
    altText = 'Media content'
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const isVisible = useOnScreen(videoRef as any, '0px');

    // Handle video auto-play/pause based on visibility
    useEffect(() => {
        if (type === 'video' && videoRef.current) {
            if (isVisible) {
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                         // Auto-play was prevented, usually due to browser policies
                         // We don't log here to avoid console noise
                    });
                }
            } else {
                videoRef.current.pause();
            }
        }
    }, [isVisible, type]);

    const handleLoad = () => setIsLoaded(true);

    // Determine styling based on display mode
    const objectFitClass = displayMode === 'fill' ? 'object-cover' : 'object-contain';
    
    // Focus point style for cropping (mostly relevant for 'fill' mode)
    const objectPositionStyle = {
        objectPosition: `${focusPoint.x * 100}% ${focusPoint.y * 100}%`
    };

    // Background blur source: prioritize thumbnail for video, source for image.
    // Ensure we don't use the video src as a background image as it won't render.
    const backgroundSrc = type === 'video' ? thumbnailUrl : src;

    return (
        <div 
            className="relative w-full aspect-[4/5] max-w-[1080px] max-h-[1350px] overflow-hidden rounded-[20px] bg-zinc-900 shadow-lg border border-zinc-800/50 mx-auto"
            role="img"
            aria-label={altText}
        >
            {/* 1. Blurframe Background Layer */}
            {/* Only render if we have a valid image source (not a video url) */}
            {backgroundSrc && (
                <div 
                    className="absolute inset-0 z-0 transform scale-150 opacity-50 blur-3xl transition-opacity duration-1000"
                    style={{
                        backgroundImage: `url(${backgroundSrc})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
            )}
            
            {/* Dark overlay to ensure text/controls contrast if needed */}
            <div className="absolute inset-0 z-0 bg-black/20" />

            {/* 2. Main Media Layer */}
            {/* If type is video, we ensure it's visible if it starts playing (audio), even if load event lags */}
            <div className={`absolute inset-0 z-10 flex items-center justify-center transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                {type === 'image' ? (
                    <img 
                        src={src} 
                        alt={altText} 
                        onLoad={handleLoad}
                        className={`w-full h-full ${objectFitClass}`}
                        style={objectPositionStyle}
                    />
                ) : (
                    <video
                        ref={videoRef}
                        src={src}
                        onLoadedData={handleLoad}
                        onLoadedMetadata={handleLoad} // Trigger visibility sooner
                        onCanPlay={handleLoad}        // Fallback trigger
                        onPlay={handleLoad}           // Absolute fallback: if it plays, show it
                        className={`w-full h-full ${objectFitClass}`}
                        style={objectPositionStyle}
                        poster={thumbnailUrl}
                        controls={false} 
                        loop
                        muted 
                        playsInline
                        preload="metadata"
                    />
                )}
            </div>

            {/* Video specific overlay controls (optional, simple play icon indicator if needed) */}
            {type === 'video' && !isVisible && isLoaded && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/40 p-4 rounded-full backdrop-blur-sm">
                        <PlayIcon className="w-8 h-8 text-white/80" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default StageMediaFrame;
