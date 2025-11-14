import React, { useMemo } from 'react';
import type { Masterclass, Engineer, Producer } from '../types';
import { CloseIcon, StarIcon } from './icons';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';

interface WatchMasterclassModalProps {
    masterclassInfo: { masterclass: Masterclass; owner: Engineer | Producer };
    onClose: () => void;
}

const WatchMasterclassModal: React.FC<WatchMasterclassModalProps> = ({ masterclassInfo, onClose }) => {
    const { masterclass, owner } = masterclassInfo;
    const dispatch = useAppDispatch();

    const embedUrl = useMemo(() => {
        try {
            const url = new URL(masterclass.videoUrl);
            if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
                const videoId = url.searchParams.get('v') || url.pathname.split('/').pop();
                return `https://www.youtube.com/embed/${videoId}`;
            }
            if (url.hostname.includes('vimeo.com')) {
                const videoId = url.pathname.split('/').pop();
                return `https://player.vimeo.com/video/${videoId}`;
            }
        } catch (e) {
            // Not a valid URL, return original
        }
        return masterclass.videoUrl;
    }, [masterclass.videoUrl]);

    const handleOpenReviewModal = () => {
        onClose();
        dispatch({ type: ActionTypes.OPEN_REVIEW_MASTERCLASS_MODAL, payload: { masterclass, owner } });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-4xl h-[90vh] flex flex-col cardSurface animate-slide-up">
                <div className="p-4 border-b border-zinc-700 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-orange-400">{masterclass.title}</h2>
                        <p className="text-sm text-zinc-400">by {owner.name}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow bg-black">
                    <iframe
                        src={embedUrl}
                        title={masterclass.title}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
                 <div className="p-4 bg-zinc-900/50 border-t border-zinc-700/50 flex-shrink-0 flex justify-end">
                    <button
                        onClick={handleOpenReviewModal}
                        className="bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 transition-all shadow-md flex items-center gap-2"
                    >
                        <StarIcon className="w-5 h-5"/>
                        Leave a Review
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WatchMasterclassModal;