import React from 'react';
import { MagicWandIcon } from './icons';

interface AriaFABProps {
    onClick: () => void;
}

const AriaFAB: React.FC<AriaFABProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-purple-500/30 hover:scale-110 focus:scale-110 transition-transform duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-orange-500/50 animate-fade-in"
            aria-label="Open Aria Cantata Assistant"
        >
            <MagicWandIcon className="w-8 h-8" />
        </button>
    );
};

export default AriaFAB;