
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
    variant?: 'stage' | 'reel';
}

const StageMediaFrame: React.FC<StageMediaFrameProps> = ({ 
    src, 
    type, 
    thumbnailUrl, 
    displayMode = 'fit', 
    focusPoint = { x: 0.5, y: 0.5 },
    altText = 'Media content',
    variant = 'stage'
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const isVisible = useOnScreen(videoRef as any, '0px');

    // Handle video auto-play/pause based on visibility
    useEffect(() => {
        if (type !== 'video' || !videoRef.current) return;
        videoRef.current.muted = isMuted;
        if (isVisible) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Auto-play was prevented, usually due to browser policies
                });
            }
        } else {
            videoRef.current.pause();
        }
    }, [isVisible, isMuted, type]);

    const handleLoad = () => setIsLoaded(true);
    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        if (videoRef.current) {
            videoRef.current.muted = nextMuted;
            if (!nextMuted) {
                videoRef.current.play().catch(() => {});
            }
        }
    };

    // Determine styling based on display mode
    const objectFitClass = displayMode === 'fill' ? 'object-cover' : 'object-contain';
    
    // Focus point style for cropping (mostly relevant for 'fill' mode)
    const objectPositionStyle = {
        objectPosition: `${focusPoint.x * 100}% ${focusPoint.y * 100}%`
    };

    // Background blur source: prioritize thumbnail for video, source for image.
    // Ensure we don't use the video src as a background image as it won't render.
    const backgroundSrc = type === 'video' ? thumbnailUrl : src;

    const frameClassName = variant === 'reel'
        ? 'relative w-full h-[560px] overflow-hidden rounded-[24px] bg-zinc-950/30 shadow-[0_20px_60px_rgba(0,0,0,0.35)] border border-zinc-800/40 mx-auto'
        : 'relative w-full aspect-[4/5] max-w-[1080px] max-h-[1350px] overflow-hidden rounded-[20px] bg-zinc-900/30 shadow-lg border border-zinc-800/40 mx-auto';

    return (
        <div 
            className={frameClassName}
            role="img"
            aria-label={altText}
        >
            {/* 1. Blurframe Background Layer */}
            {/* Only render if we have a valid image source (not a video url) */}
            {backgroundSrc && (
                <div 
                    className="absolute inset-0 z-0 transform scale-150 opacity-35 blur-3xl transition-opacity duration-1000"
                    style={{
                        backgroundImage: `url(${backgroundSrc})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
            )}
            
            {/* Dark overlay to ensure text/controls contrast if needed */}
            <div className="absolute inset-0 z-0 bg-black/10" />

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

            {type === 'video' && (
                <div className="absolute bottom-4 right-4 z-30">
                    <button
                        onClick={toggleMute}
                        className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-semibold hover:bg-black/80 transition-colors"
                    >
                        {isMuted ? 'Sound Off' : 'Sound On'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default StageMediaFrame;
