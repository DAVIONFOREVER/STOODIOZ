
import React, { useState } from 'react';
import { CloseIcon, DollarSignIcon } from './icons';

interface AddFundsModalProps {
    onClose: () => void;
    onConfirm: (amount: number) => void;
}

const AddFundsModal: React.FC<AddFundsModalProps> = ({ onClose, onConfirm }) => {
    const [amount, setAmount] = useState(50);
    const presetAmounts = [50, 100, 250, 500];

    const handleConfirm = () => {
        if (amount > 0) {
            onConfirm(amount);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-zinc-800 rounded-2xl shadow-xl w-full max-w-md border border-zinc-700 animate-slide-up">
                <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-100">Add Funds to Wallet</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-100"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-slate-300 text-center">Select an amount or enter a custom value to add to your wallet balance.</p>
                    <div className="flex justify-center gap-2">
                        {presetAmounts.map(preset => (
                            <button
                                key={preset}
                                onClick={() => setAmount(preset)}
                                className={`font-bold py-2 px-4 rounded-lg transition-colors ${amount === preset ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-slate-200 hover:bg-zinc-600'}`}
                            >
                                ${preset}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full pl-7 p-3 bg-zinc-700 rounded-md text-center font-bold text-2xl"
                            min="5"
                        />
                    </div>
                </div>
                <div className="p-4 bg-zinc-800/50 border-t border-zinc-700">
                    <button
                        onClick={handleConfirm}
                        disabled={amount < 5}
                        className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        Add ${amount.toFixed(2)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddFundsModal;
