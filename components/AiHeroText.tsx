import React from 'react';

interface AiHeroTextProps {
    text: string;
    className?: string;
    as?: keyof JSX.IntrinsicElements;
}

const AiHeroText: React.FC<AiHeroTextProps> = ({ text, className = '', as: Component = 'h1' }) => {
    const style: React.CSSProperties = {
        // Use the animated GIF as the primary background, with a CSS gradient as a fallback.
        // This ensures the text is always visible and animated, even if the image fails to load.
        backgroundImage: `url('https://storage.googleapis.com/studiogena-assets/fluid-gradient.gif'), linear-gradient(90deg, #f97316, #fb923c, #f97316)`,
        // Apply size and animation to both background layers.
        backgroundSize: '200% auto',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text', // For cross-browser support
        color: 'transparent',
        // The 'gradient-flow' animation works for both the image and the fallback gradient.
        animation: 'gradient-flow 15s ease infinite',
    };

    return (
        <Component className={className} style={style}>
            {text}
        </Component>
    );
};

export default AiHeroText;