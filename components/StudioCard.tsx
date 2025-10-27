import React from 'react';
import type { Stoodio } from '../types';
import { VerificationStatus } from '../types';
import { LocationIcon, StarIcon, VerifiedIcon } from './icons';

interface StoodioCardProps {
    stoodio: Stoodio;
    onSelectStoodio: (stoodio: Stoodio) => void;
}

const StoodioCard: React.FC<StoodioCardProps> = ({ stoodio, onSelectStoodio }) => {
    return (
        <div
            className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl shadow-lg cursor-pointer group transition-all duration-400 ease-in-out border border-zinc-700/50 hover:shadow-[0_0_24px_rgba(249,115,22,0.4),_0_20px_40px_-15px_rgba(249,115,22,0.2)] hover:border-orange-500/50 hover:-translate-y-1 hover:rotate-1 shimmer glass-overlay relative overflow-hidden"
            onClick={() => onSelectStoodio(stoodio)}
            style={{ '--shimmer-delay': (Math.random() * 8 + 2) } as React.CSSProperties}
        >
            <div className="relative">
                <img loading="lazy" src={stoodio.imageUrl} alt={stoodio.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                    <h3 className="text-2xl font-bold text-white group-hover:text-orange-400 transition-colors flex items-center gap-2 text-glow">
                        {stoodio.name}
                        {stoodio.verificationStatus === VerificationStatus.VERIFIED && (
                            // FIX: The `title` attribute is not a valid prop for the `VerifiedIcon` component. The fix is to use an SVG `<title>` element for accessibility.
                            <VerifiedIcon className="w-6 h-6 text-blue-400"><title>Verified Stoodio</title></VerifiedIcon>
                        )}
                    </h3>
                    <p className="text-zinc-300 font-semibold flex items-center gap-1.5"><LocationIcon className="w-4 h-4" /> {stoodio.location}</p>
                </div>
                <div className="absolute top-4 right-4 bg-zinc-900/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-yellow-400 font-bold text-sm">
                    <StarIcon className="w-4 h-4" />
                    <span>{stoodio.rating.toFixed(1)}</span>
                </div>
            </div>
            <div className="p-4 relative">
                <p className="text-zinc-400 text-sm mb-3 h-10 overflow-hidden">{stoodio.description}</p>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-zinc-400 text-xs">From</p>
                        <p className="text-xl font-bold text-zinc-100">${stoodio.hourlyRate}<span className="text-sm font-normal text-zinc-400">/hr</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoodioCard;