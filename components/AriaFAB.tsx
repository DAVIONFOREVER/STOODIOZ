import React from 'react';
import { ARIA_PROFILE_IMAGE_URL } from '../constants';

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
            <img src={ARIA_PROFILE_IMAGE_URL} alt="Aria Cantata" className="w-12 h-12 rounded-full object-cover border-2 border-white/70 shadow-lg"/>
        </button>
    );
};

export default AriaFAB;