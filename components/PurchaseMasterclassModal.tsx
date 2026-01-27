import React from 'react';
import type { Masterclass, Engineer, Producer } from '../types';
import { CloseIcon, StarIcon, DollarSignIcon } from './icons';
import { getProfileImageUrl } from '../constants';

interface PurchaseMasterclassModalProps {
    masterclassInfo: { masterclass: Masterclass; owner: Engineer | Producer };
    onClose: () => void;
    onConfirm: () => void;
}

const PurchaseMasterclassModal: React.FC<PurchaseMasterclassModalProps> = ({ masterclassInfo, onClose, onConfirm }) => {
    const { masterclass, owner } = masterclassInfo;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-lg cardSurface animate-slide-up">
                <div className="p-6 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-zinc-100">Confirm Purchase</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <img src={getProfileImageUrl(owner)} alt={owner.name} className="w-16 h-16 rounded-lg object-cover" />
                        <div>
                            <p className="text-sm text-zinc-400">Masterclass by</p>
                            <p className="font-bold text-lg text-zinc-200">{owner.name}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-orange-400">{masterclass.title}</h3>
                        <p className="text-zinc-400 text-sm mt-1">{masterclass.description}</p>
                    </div>

                    <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20 flex justify-between items-center font-bold text-lg">
                        <span>Total Cost</span>
                        <span className="text-orange-400">${masterclass.price.toFixed(2)}</span>
                    </div>
                </div>

                <div className="p-4 bg-zinc-900/50 border-t border-zinc-700 rounded-b-lg flex justify-end">
                    <button
                        onClick={onConfirm}
                        className="bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 flex items-center gap-2"
                    >
                        <DollarSignIcon className="w-5 h-5" />
                        Pay ${masterclass.price.toFixed(2)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseMasterclassModal;