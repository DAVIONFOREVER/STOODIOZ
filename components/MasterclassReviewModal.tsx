import React, { useState } from 'react';
import type { Masterclass, Engineer, Producer } from '../types';
import { CloseIcon, StarIcon } from './icons';

interface MasterclassReviewModalProps {
    masterclassInfo: { masterclass: Masterclass; owner: Engineer | Producer };
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
}

const MasterclassReviewModal: React.FC<MasterclassReviewModalProps> = ({ masterclassInfo, onClose, onSubmit }) => {
    const { masterclass, owner } = masterclassInfo;
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating > 0) {
            onSubmit(rating, comment);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-lg cardSurface animate-slide-up">
                <div className="p-6 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-zinc-100">Review Masterclass</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 text-center">
                        <p className="text-lg text-zinc-300 mb-2">How would you rate "{masterclass.title}"?</p>
                        <p className="text-sm text-zinc-400 mb-6">Your feedback helps {owner.name} and the community.</p>
                        
                        <div className="flex justify-center items-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    className="p-1"
                                >
                                    <StarIcon 
                                        className={`w-10 h-10 transition-colors ${
                                            (hoverRating || rating) >= star 
                                            ? 'text-yellow-400' 
                                            : 'text-zinc-600'
                                        }`} 
                                    />
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            className="w-full p-3 bg-zinc-800/70 border-zinc-700 text-zinc-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Share your thoughts... (optional)"
                        />
                    </div>
                    <div className="p-4 bg-zinc-900/50 border-t border-zinc-700/50 rounded-b-lg flex justify-end">
                        <button
                            type="submit"
                            disabled={rating === 0}
                            className="bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-all shadow-md disabled:bg-zinc-600 disabled:cursor-not-allowed"
                        >
                            Submit Review
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MasterclassReviewModal;