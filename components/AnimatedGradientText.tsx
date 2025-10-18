
import React from 'react';

interface AnimatedGradientTextProps {
    text: string;
    className?: string;
    // FIX: Fully qualify the JSX namespace to resolve "Cannot find namespace 'JSX'" error.
    as?: keyof React.JSX.IntrinsicElements;
}

const AnimatedGradientText: React.FC<AnimatedGradientTextProps> = ({ text, className = '', as: Component = 'h1' }) => {
    // The bg-[length:200%_auto] makes the gradient twice as wide as the container, allowing it to move.
    // The animate-[gradient-flow_4s_ease_infinite] applies the animation defined in index.html.
    return (
        <Component className={className}>
            <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradient-flow_4s_ease_infinite]">
                {text}
            </span>
        </Component>
    );
};

export default AnimatedGradientText;
