
import React, { useMemo } from 'react';

interface WaveformTextProps {
    text: string;
    className?: string;
    as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Generates a deterministic waveform path based on the input text string.
 * This creates a unique visual signature for the text without needing an audio file.
 */
const generateTextWaveform = (text: string, width: number, height: number, bars: number) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }

    const seededRandom = (seed: number) => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    const middle = height / 2;
    const barWidth = width / bars;
    let d = `M 0 ${middle} `;

    for (let i = 0; i < bars; i++) {
        // Use the hash and index to generate consistent "random" height
        const rand = seededRandom(hash + i);
        // Height varies between 20% and 100% of available height
        const amplitude = (rand * 0.8 + 0.2) * (height / 2);
        
        const x = i * barWidth;
        const yTop = middle - amplitude;
        const yBottom = middle + amplitude;

        // Draw a vertical bar
        d += `M ${x} ${middle} L ${x} ${yTop} L ${x + barWidth * 0.6} ${yTop} L ${x + barWidth * 0.6} ${yBottom} L ${x} ${yBottom} Z `;
    }

    return d;
};

const WaveformText: React.FC<WaveformTextProps> = ({ text, className = '', as: Component = 'h1' }) => {
    const uniqueId = React.useId();
    const patternId = `waveform-pattern-${uniqueId}`;
    const gradientId = `waveform-gradient-${uniqueId}`;
    
    const waveformPath = useMemo(() => generateTextWaveform(text, 1000, 100, 80), [text]);

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
                            opacity="0.8"
                        >
                            <animate attributeName="x" from="-1000" to="0" dur="20s" repeatCount="indefinite" />
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
