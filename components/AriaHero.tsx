import React from 'react';

interface AriaCantataHeroProps {
    onOpenAriaCantata: () => void;
}

const AriaCantataHero: React.FC<AriaCantataHeroProps> = ({ onOpenAriaCantata }) => {
    return (
        <div className="relative flex justify-center items-center my-12" aria-hidden="true">
            <style>{`
                @keyframes pulse-glow {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 0 20px 5px rgba(249, 115, 22, 0.4), 0 0 40px 15px rgba(124, 58, 237, 0.3);
                        opacity: 0.8;
                    }
                    50% {
                        transform: scale(1.05);
                        box-shadow: 0 0 30px 10px rgba(249, 115, 22, 0.6), 0 0 60px 25px rgba(124, 58, 237, 0.4);
                        opacity: 1;
                    }
                }
                 @keyframes rotate-hue {
                    0% { filter: hue-rotate(0deg) brightness(1); }
                    50% { filter: hue-rotate(20deg) brightness(1.1); }
                    100% { filter: hue-rotate(0deg) brightness(1); }
                }
                .aria-orb {
                    animation: pulse-glow 6s ease-in-out infinite, rotate-hue 8s ease-in-out infinite;
                }
                .aria-orb-core {
                     background-image: radial-gradient(circle, #000000 0%, #18181b 30%, #27272a 60%, transparent 100%);
                }
            `}</style>
            
            <button
                onClick={onOpenAriaCantata}
                className="relative w-40 h-40 rounded-full flex items-center justify-center cursor-pointer group aria-orb"
                aria-label="Ask Aria Cantata"
            >
                {/* Outer Glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 opacity-60 blur-xl"></div>
                
                {/* Core Orb */}
                <div className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden aria-orb-core">
                     {/* Inner Metallic Shine */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-50"></div>
                     <span className="font-bold text-lg text-orange-400 z-10 group-hover:scale-110 transition-transform duration-300">Ask Aria Cantata</span>
                </div>
            </button>
        </div>
    );
};

export default AriaCantataHero;