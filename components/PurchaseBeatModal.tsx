
import React, { useState } from 'react';
import type { Instrumental, Producer } from '../types';
import { CloseIcon, MusicNoteIcon, DollarSignIcon, CheckCircleIcon } from './icons';

interface PurchaseBeatModalProps {
    instrumental: Instrumental;
    producer: Producer;
    onClose: () => void;
    onConfirm: (type: 'lease' | 'exclusive') => void;
    isLoading: boolean;
}

const PurchaseBeatModal: React.FC<PurchaseBeatModalProps> = ({ instrumental, producer, onClose, onConfirm, isLoading }) => {
    const [purchaseType, setPurchaseType] = useState<'lease' | 'exclusive'>('lease');

    const price = purchaseType === 'lease' ? instrumental.price_lease : instrumental.price_exclusive;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" role="dialog" aria-modal="true">
            <div className="w-full max-w-lg transform animate-slide-up flex flex-col cardSurface">
                <div className="p-6 border-b border-zinc-700/50 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-zinc-100">Purchase Beat</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        {instrumental.cover_art_url ? (
                            <img src={instrumental.cover_art_url} alt={instrumental.title} className="w-20 h-20 rounded-lg object-cover" />
                        ) : (
                            <div className="w-20 h-20 bg-zinc-800 rounded-lg flex items-center justify-center">
                                <MusicNoteIcon className="w-8 h-8 text-zinc-500" />
                            </div>
                        )}
                        <div>
                            <h3 className="text-xl font-bold text-zinc-100">{instrumental.title}</h3>
                            <p className="text-zinc-400 text-sm">by {producer.name}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${purchaseType === 'lease' ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="radio" 
                                        name="purchaseType" 
                                        checked={purchaseType === 'lease'} 
                                        onChange={() => setPurchaseType('lease')} 
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${purchaseType === 'lease' ? 'border-orange-500' : 'border-zinc-500'}`}>
                                        {purchaseType === 'lease' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-200">Standard Lease</p>
                                        <p className="text-xs text-zinc-400">MP3 File • 50k Streams</p>
                                    </div>
                                </div>
                                <p className="font-bold text-green-400 text-lg">${instrumental.price_lease.toFixed(2)}</p>
                            </div>
                        </label>

                        <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${purchaseType === 'exclusive' ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="radio" 
                                        name="purchaseType" 
                                        checked={purchaseType === 'exclusive'} 
                                        onChange={() => setPurchaseType('exclusive')} 
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${purchaseType === 'exclusive' ? 'border-purple-500' : 'border-zinc-500'}`}>
                                        {purchaseType === 'exclusive' && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-200">Exclusive Rights</p>
                                        <p className="text-xs text-zinc-400">WAV + Stems • Unlimited Use</p>
                                    </div>
                                </div>
                                <p className="font-bold text-green-400 text-lg">${instrumental.price_exclusive.toFixed(2)}</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="p-6 bg-zinc-900/50 border-t border-zinc-700/50 flex justify-between items-center">
                    <div>
                        <p className="text-zinc-400 text-sm">Total</p>
                        <p className="text-2xl font-bold text-zinc-100">${price.toFixed(2)}</p>
                    </div>
                    <button
                        onClick={() => onConfirm(purchaseType)}
                        disabled={isLoading}
                        className="bg-green-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span>Processing...</span>
                        ) : (
                            <>
                                <DollarSignIcon className="w-5 h-5" />
                                Pay Now
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseBeatModal;
