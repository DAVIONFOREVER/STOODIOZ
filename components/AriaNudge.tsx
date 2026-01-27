import React from 'react';
import { CloseIcon, ChatBubbleLeftRightIcon } from './icons';
import { ARIA_CANTATA_IMAGE_URL } from '../constants';
import type { AriaNudgeData } from '../types';

interface AriaNudgeProps {
    nudge: AriaNudgeData;
    onDismiss: () => void;
    onClick: () => void;
}

const AriaNudge: React.FC<AriaNudgeProps> = ({ nudge, onDismiss, onClick }) => {
    return (
        <div 
            className="fixed bottom-24 right-6 z-50 w-[calc(100%-3rem)] max-w-sm animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
        >
            <div className="flex items-end gap-2">
                <img src={ARIA_CANTATA_IMAGE_URL} alt="Aria Cantata" className="w-12 h-12 rounded-full border-2 border-orange-500/50 shadow-lg"/>
                <div className="relative bg-zinc-800 rounded-xl rounded-bl-none border border-zinc-700 shadow-xl p-3 flex-grow">
                     <button 
                        onClick={onClick} 
                        className="text-left text-zinc-200 text-sm hover:text-orange-300 transition-colors"
                    >
                        {nudge.text}
                    </button>
                    <button 
                        onClick={onDismiss} 
                        className="absolute -top-2 -right-2 p-0.5 bg-zinc-700 rounded-full text-zinc-400 hover:bg-red-500 hover:text-white transition-colors"
                        aria-label="Dismiss suggestion"
                    >
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AriaNudge;