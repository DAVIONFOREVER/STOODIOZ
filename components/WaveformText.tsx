
import React, { useState, useEffect } from 'react';

// --- Start of useWaveform hook logic ---
const pathCache = new Map<string, string>();

/**
 * Generates a plausible-looking, symmetrical waveform path string mathematically.
 * This avoids fetching and processing a real audio file, which can fail due to CORS or network issues.
 * @param width The conceptual width of the waveform.
 * @param height The conceptual height of the waveform.
 * @param points The number of data points to generate.
 * @returns An SVG path data string.
 */
const generateFakePath = (width: number, height: number, points: number): string => {
    const middle = height / 2;
    const dataPoints = [];

    for (let i = 0; i < points; i++) {
        // A combination of sine waves to make it look less uniform and more organic
        const highFreq = Math.sin(i * 0.4) * 0.15;
        const midFreq = Math.sin(i * 0.1) * 0.3;
        const lowFreq = Math.sin(i * 0.02 + 1) * 0.4;
        const noise = (Math.random() - 0.5) * 0.1;
        
        // Envelope to make it fade in and out at the edges
        const envelope = Math.sin((i / (points - 1)) * Math.PI);
        
        const amplitude = Math.abs(highFreq + midFreq + lowFreq + noise) * envelope;
        dataPoints.push(amplitude);
    }
    
    let path = `M 0 ${middle} `;
    dataPoints.forEach((amp, i) => {
        const x = (i / (points - 1)) * width;
        const y = amp * middle * 0.95; // Use 95% of height to avoid clipping
        path += `L ${x.toFixed(2)} ${middle - y} `;
    });

    for (let i = dataPoints.length - 1; i >= 0; i--) {
        const x = (i / (points - 1)) * width;
        const y = dataPoints[i] * middle * 0.95;
        path += `L ${x.toFixed(2)} ${middle + y} `;
    }

    path += 'Z';
    return path;
};

const useWaveform = (audioUrl: string) => {
    const [path, setPath] = useState<string | null>(pathCache.get(audioUrl) || null);

    useEffect(() => {
        // If a path is already cached for this 'URL', use it.
        if (pathCache.has(audioUrl)) {
            setPath(pathCache.get(audioUrl)!);
            return;
        }

        // Generate a new fake path, cache it, and set it in state.
        // This is deterministic for a given session but looks random.
        const generatedPath = generateFakePath(1000, 100, 200);
        pathCache.set(audioUrl, generatedPath);
        setPath(generatedPath);
    }, [audioUrl]);

    const isLoading = !path;

    return { path, isLoading };
};
// --- End of useWaveform hook logic ---


const DEFAULT_AUDIO_URL = 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-1-short.mp3';

interface WaveformTextProps {
    text: string;
    className?: string;
    as?: keyof React.JSX.IntrinsicElements;
}

const WaveformText: React.FC<WaveformTextProps> = ({ text, className = '', as: Component = 'h1' }) => {
    const { path: waveformPath, isLoading } = useWaveform(DEFAULT_AUDIO_URL);
    const uniqueId = React.useId();
    const patternId = `waveform-pattern-${uniqueId}`;
    const gradientId = `waveform-gradient-${uniqueId}`;
    
    // Fallback while loading or in non-browser environment
    if (isLoading || !waveformPath) {
        return <Component className={className}>{text}</Component>;
    }

    return (
        <Component className={className}>
            <svg viewBox="0 0 400 60" className="w-full h-auto overflow-visible">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#fb923c" />
                    </linearGradient>
                    
                    <pattern id={patternId} patternUnits="userSpaceOnUse" width="1000" height="100">
                        <path
                            d={waveformPath}
                            fill={`url(#${gradientId})`}
                        >
                            <animate attributeName="x" from="-1000" to="0" dur="10s" repeatCount="indefinite" />
                        </path>
                    </pattern>
                </defs>
                <text
                    x="50%"
                    y="50%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    className="font-extrabold tracking-tighter"
                    fontSize="50"
                    fill={`url(#${patternId})`}
                    textLength="390"
                    lengthAdjust="spacingAndGlyphs"
                >
                    {text}
                </text>
            </svg>
        </Component>
    );
};

export default WaveformText;
