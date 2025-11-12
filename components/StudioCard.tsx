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
            className="cardSurface cursor-pointer group relative overflow-hidden"
            onClick={() => onSelectStoodio(stoodio)}
        >
            <div className="relative">
                <img loading="lazy" src={stoodio.imageUrl} alt={stoodio.name} className="w-full h-48 object-cover transition-transform duration-300" />
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
                <div className="absolute top-4 right-4 bg-black/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-yellow-400 font-bold text-sm">
                    <StarIcon className="w-4 h-4" />
                    {/* FIX: Changed `stoodio.rating` to `stoodio.rating_overall` to match the property name in the `BaseUser` type. */}
                    <span>{stoodio.rating_overall.toFixed(1)}</span>
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