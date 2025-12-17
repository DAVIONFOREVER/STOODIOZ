
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
                    playPromise.catch(() => {
                         // Auto-play prevented
                    });
                }
            } else {
                videoRef.current.pause();
            }
        }
    }, [isVisible, type]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const objectFitClass = displayMode === 'fill' ? 'object-cover' : 'object-contain';
    
    const objectPositionStyle = {
        objectPosition: `${focusPoint.x * 100}% ${focusPoint.y * 100}%`
    };

    const backgroundSrc = type === 'video' ? thumbnailUrl : src;

    return (
        <div 
            className="relative w-full aspect-[4/5] max-w-[1080px] max-h-[1350px] overflow-hidden rounded-[20px] bg-zinc-950 shadow-lg border border-zinc-800/50 mx-auto"
            role="img"
            aria-label={altText}
        >
            {/* 1. Blurframe Background Layer */}
            {backgroundSrc && (
                <div 
                    className="absolute inset-0 z-0 transform scale-150 opacity-40 blur-3xl transition-opacity duration-1000"
                    style={{
                        backgroundImage: `url(${backgroundSrc})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
            )}
            
            <div className="absolute inset-0 z-0 bg-black/40" />

            {/* 2. Main Media Layer */}
            <div className={`absolute inset-0 z-10 flex items-center justify-center transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                {type === 'image' ? (
                    <img 
                        src={src} 
                        alt={altText} 
                        onLoad={handleLoad}
                        onError={handleLoad} // Trigger visibility even if error to show alternate text/silhouette
                        className={`w-full h-full ${objectFitClass}`}
                        style={objectPositionStyle}
                    />
                ) : (
                    <video
                        ref={videoRef}
                        src={src}
                        onLoadedData={handleLoad}
                        onLoadedMetadata={handleLoad}
                        onCanPlay={handleLoad}
                        onPlay={handleLoad}
                        onError={handleLoad}
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

            {/* Error Fallback / Placeholder if src fails to load but isLoaded is true */}
            {!src && isLoaded && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900">
                    <div className="text-zinc-600">Media unavailable</div>
                </div>
            )}
        </div>
    );
};

export default StageMediaFrame;
