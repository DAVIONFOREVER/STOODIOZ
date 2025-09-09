import React, { useState } from 'react';
import { CloseIcon } from './icons';

interface AddFundsModalProps {
    onClose: () => void;
    onConfirm: (amount: number) => void;
}

const AddFundsModal: React.FC<AddFundsModalProps> = ({ onClose, onConfirm }) => {
    const [amount, setAmount] = useState<string>('100');
    const quickAmounts = [50, 100, 250, 500];

    const handleConfirm = () => {
        const numericAmount = parseFloat(amount);
        if (numericAmount > 0) {
            onConfirm(numericAmount);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all border border-slate-200">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900">Add Funds to Wallet</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 text-center">
                    <p className="text-slate-600 mb-6">Select an amount or enter a custom amount to add to your balance.</p>

                    <div className="flex justify-center gap-4 mb-6">
                        {quickAmounts.map(amt => (
                            <button
                                key={amt}
                                onClick={() => setAmount(String(amt))}
                                className={`w-full py-3 rounded-lg font-bold text-lg transition-colors ${
                                    Number(amount) === amt
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                }`}
                            >
                               ${amt}
                            </button>
                        ))}
                    </div>

                     <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">$</span>
                        <input
                            type="number"
                            placeholder="Custom Amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full text-center bg-slate-100 border-slate-300 text-slate-900 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500 font-semibold text-xl"
                        />
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
                    <button
                        onClick={handleConfirm}
                        disabled={!amount || parseFloat(amount) <= 0}
                        className="w-full text-white bg-orange-500 hover:bg-orange-600 disabled:bg-slate-400 disabled:cursor-not-allowed font-bold rounded-lg text-lg px-5 py-3.5 text-center transition-all shadow-md"
                    >
                       Add ${parseFloat(amount || '0').toFixed(2)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddFundsModal;
