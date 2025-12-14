
import React from 'react';
import { MagicWandIcon } from './icons';

interface AriaFABProps {
    onClick: () => void;
}

const AriaFAB: React.FC<AriaFABProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-40 group flex items-center justify-center bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-2xl shadow-purple-500/30 transition-all duration-300 ease-in-out hover:scale-105 focus:outline-none rounded-full h-14 w-14 hover:w-auto hover:px-4 overflow-hidden"
            aria-label="Open Aria Cantata Assistant"
        >
            <MagicWandIcon className="w-7 h-7 flex-shrink-0" />
            <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap font-bold text-sm">
                Ask Aria
            </span>
        </button>
    );
};

export default AriaFAB;
