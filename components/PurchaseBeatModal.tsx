
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Instrumental, Producer, BeatPurchaseType } from '../types';
import { CloseIcon, MusicNoteIcon, DollarSignIcon } from './icons';
import BeatContractModal from './BeatContractModal';

interface PurchaseBeatModalProps {
    instrumental: Instrumental;
    producer: Producer;
    onClose: () => void;
    onConfirm: (type: BeatPurchaseType) => void;
    isLoading: boolean;
}

const PurchaseBeatModal: React.FC<PurchaseBeatModalProps> = ({ instrumental, producer, onClose, onConfirm, isLoading }) => {
    const canLeaseMp3 = !!(instrumental.audio_url && (instrumental.price_lease ?? 0) > 0);
    const canLeaseWav = !!(instrumental.wav_url && (instrumental.price_lease_wav ?? 0) > 0);
    const canExclusive = !!(instrumental.wav_url && (instrumental.price_exclusive ?? 0) > 0);

    const defaultType: BeatPurchaseType = canLeaseMp3 ? 'lease_mp3' : canLeaseWav ? 'lease_wav' : canExclusive ? 'exclusive' : 'lease_mp3';
    const [purchaseType, setPurchaseType] = useState<BeatPurchaseType>(defaultType);
    const [contractModal, setContractModal] = useState<'lease' | 'exclusive' | null>(null);

    const price = useMemo(() => {
        if (purchaseType === 'lease_mp3') return Number(instrumental.price_lease ?? 0);
        if (purchaseType === 'lease_wav') return Number(instrumental.price_lease_wav ?? 0);
        return Number(instrumental.price_exclusive ?? 0);
    }, [purchaseType, instrumental.price_lease, instrumental.price_lease_wav, instrumental.price_exclusive]);

    const canConfirm = (purchaseType === 'lease_mp3' && canLeaseMp3) || (purchaseType === 'lease_wav' && canLeaseWav) || (purchaseType === 'exclusive' && canExclusive);

    const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // Only close if clicking the backdrop itself, not the modal content
        if (e.target === e.currentTarget && !isLoading) {
            onClose();
        }
    }, [onClose, isLoading]);

    // Close on ESC key press
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isLoading) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose, isLoading]);

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" 
            role="dialog" 
            aria-modal="true"
            onClick={handleBackdropClick}
        >
            <div 
                className="w-full max-w-lg rounded-2xl overflow-hidden transform animate-slide-up flex flex-col cardSurface shadow-2xl shadow-orange-500/20"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-zinc-100">Purchase Beat</h2>
                    <button 
                        onClick={onClose} 
                        disabled={isLoading}
                        className="text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Close purchase modal"
                    >
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
                        {canLeaseMp3 && (
                            <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${purchaseType === 'lease_mp3' ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="purchaseType" checked={purchaseType === 'lease_mp3'} onChange={() => setPurchaseType('lease_mp3')} className="sr-only" />
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${purchaseType === 'lease_mp3' ? 'border-orange-500' : 'border-zinc-500'}`}>
                                            {purchaseType === 'lease_mp3' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-zinc-200">Lease (MP3)</p>
                                            <p className="text-xs text-zinc-400">MP3 file</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-green-400 text-lg">${Number(instrumental.price_lease ?? 0).toFixed(2)}</p>
                                </div>
                            </label>
                        )}

                        {canLeaseWav && (
                            <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${purchaseType === 'lease_wav' ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="purchaseType" checked={purchaseType === 'lease_wav'} onChange={() => setPurchaseType('lease_wav')} className="sr-only" />
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${purchaseType === 'lease_wav' ? 'border-orange-500' : 'border-zinc-500'}`}>
                                            {purchaseType === 'lease_wav' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-zinc-200">Lease (WAV)</p>
                                            <p className="text-xs text-zinc-400">WAV file, higher quality</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-green-400 text-lg">${Number(instrumental.price_lease_wav ?? 0).toFixed(2)}</p>
                                </div>
                            </label>
                        )}

                        {canExclusive && (
                            <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${purchaseType === 'exclusive' ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="purchaseType" checked={purchaseType === 'exclusive'} onChange={() => setPurchaseType('exclusive')} className="sr-only" />
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${purchaseType === 'exclusive' ? 'border-purple-500' : 'border-zinc-500'}`}>
                                            {purchaseType === 'exclusive' && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-zinc-200">Exclusive</p>
                                            <p className="text-xs text-zinc-400">WAV + Stems • Unlimited use</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-green-400 text-lg">${Number(instrumental.price_exclusive ?? 0).toFixed(2)}</p>
                                </div>
                            </label>
                        )}

                    </div>

                    {(!canLeaseMp3 && !canLeaseWav && !canExclusive) && (
                        <p className="text-amber-400 text-sm mt-2">No purchase options available for this beat.</p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-4">
                        {(canLeaseMp3 || canLeaseWav) && (
                            <button type="button" onClick={() => setContractModal('lease')} className="text-sm text-orange-400 hover:text-orange-300 underline">
                                View Lease Agreement
                            </button>
                        )}
                        {(canLeaseMp3 || canLeaseWav) && canExclusive && <span className="text-zinc-600">|</span>}
                        {canExclusive && (
                            <button type="button" onClick={() => setContractModal('exclusive')} className="text-sm text-purple-400 hover:text-purple-300 underline">
                                View Exclusive Agreement
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-zinc-900/50 border-t border-zinc-700/50 flex justify-between items-center">
                    <div>
                        <p className="text-zinc-400 text-sm">Total</p>
                        <p className="text-2xl font-bold text-zinc-100">${price.toFixed(2)}</p>
                    </div>
                    <button
                        onClick={() => onConfirm(purchaseType)}
                        disabled={isLoading || !canConfirm || price <= 0}
                        className="bg-green-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <span>Processing...</span> : <><DollarSignIcon className="w-5 h-5" /> Pay Now</>}
                    </button>
                </div>
            </div>

            {contractModal && (
                <BeatContractModal type={contractModal} instrumental={instrumental} producer={producer} onClose={() => setContractModal(null)} />
            )}
        </div>
    );
};

export default PurchaseBeatModal;
