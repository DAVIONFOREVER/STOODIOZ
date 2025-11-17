import React, { useMemo } from 'react';
import type { Masterclass, Engineer, Producer } from '../types';
import { useAppState } from '../contexts/AppContext';
import { StarIcon, PlayIcon, DollarSignIcon } from './icons';

interface MasterclassCardProps {
    masterclass: Masterclass;
    owner: Engineer | Producer;
    onPurchase: (masterclass: Masterclass, owner: Engineer | Producer) => void;
    onWatch: (masterclass: Masterclass, owner: Engineer | Producer) => void;
}

const MasterclassCard: React.FC<MasterclassCardProps> = ({ masterclass, owner, onPurchase, onWatch }) => {
    const { currentUser, reviews } = useAppState();

    const hasPurchased = useMemo(() => {
        // FIX: Changed `purchasedMasterclassIds` to `purchased_masterclass_ids` to match the property name in the `BaseUser` type.
        return currentUser?.purchased_masterclass_ids?.includes(masterclass.id) || false;
    }, [currentUser, masterclass.id]);

    const { averageRating, reviewCount } = useMemo(() => {
        const relevantReviews = reviews.filter(r => r.masterclassId === masterclass.id);
        if (relevantReviews.length === 0) {
            return { averageRating: 0, reviewCount: 0 };
        }
        const totalRating = relevantReviews.reduce((sum, r) => sum + r.rating, 0);
        return {
            averageRating: totalRating / relevantReviews.length,
            reviewCount: relevantReviews.length
        };
    }, [reviews, masterclass.id]);

    const handleButtonClick = () => {
        if (hasPurchased) {
            onWatch(masterclass, owner);
        } else {
            onPurchase(masterclass, owner);
        }
    };

    return (
        <div className="cardSurface p-8 text-center border-2 border-orange-500/50 shadow-2xl shadow-orange-500/10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-orange-400">Masterclass</h2>
            <h3 className="text-3xl font-extrabold text-zinc-100 mt-2">{masterclass.title}</h3>
            
            {reviewCount > 0 && (
                <div className="flex items-center justify-center gap-1 text-yellow-400 mt-3">
                    <StarIcon className="w-5 h-5" />
                    <span className="font-bold text-lg text-slate-200">{averageRating.toFixed(1)}</span>
                    <span className="text-slate-400 text-sm">({reviewCount} ratings)</span>
                </div>
            )}
            
            <p className="text-zinc-400 mt-4 max-w-xl mx-auto">{masterclass.description}</p>

            <button
                onClick={handleButtonClick}
                disabled={!currentUser || currentUser.id === owner.id}
                className={`mt-6 w-full max-w-xs mx-auto py-3 px-6 rounded-lg text-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:bg-zinc-600 disabled:cursor-not-allowed ${
                    hasPurchased 
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-green-500/20'
                    : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20'
                }`}
            >
                {hasPurchased ? (
                    <>
                        <PlayIcon className="w-6 h-6"/> Watch Now
                    </>
                ) : (
                    <>
                        <DollarSignIcon className="w-6 h-6"/> Purchase for ${masterclass.price.toFixed(2)}
                    </>
                )}
            </button>
            {currentUser?.id === owner.id && <p className="text-xs text-zinc-500 mt-2">This is your masterclass.</p>}
        </div>
    );
};

export default MasterclassCard;