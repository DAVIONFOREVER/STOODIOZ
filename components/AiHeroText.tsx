
import React from 'react';

interface AiHeroTextProps {
    text: string;
    className?: string;
    as?: keyof React.JSX.IntrinsicElements;
}

const AiHeroText: React.FC<AiHeroTextProps> = ({ text, className = '', as: Component = 'h1' }) => {
    const style: React.CSSProperties = {
        // Use a CSS gradient as the background.
        // The animated GIF was removed as it was causing a 404 error.
        backgroundImage: `linear-gradient(90deg, #f97316, #fb923c, #f97316)`,
        // Apply size and animation to the background layer.
        backgroundSize: '200% auto',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text', // For cross-browser support
        color: 'transparent',
        // The 'gradient-flow' animation works perfectly on the fallback gradient.
        animation: 'gradient-flow 15s ease infinite',
    };

    return (
        <Component className={className} style={style}>
            {text}
        </Component>
    );
};

export default AiHeroText;