
import React, { useState } from 'react';
import { CloseIcon, BanknotesIcon } from './icons';

interface RequestPayoutModalProps {
    onClose: () => void;
    onConfirm: (amount: number) => void;
    currentBalance: number;
}

const RequestPayoutModal: React.FC<RequestPayoutModalProps> = ({ onClose, onConfirm, currentBalance }) => {
    const [amount, setAmount] = useState<string>(String(currentBalance));

    const handleConfirm = () => {
        const numericAmount = parseFloat(amount);
        if (numericAmount > 0 && numericAmount <= currentBalance) {
            onConfirm(numericAmount);
        }
    };

    const isInvalid = !amount || parseFloat(amount) <= 0 || parseFloat(amount) > currentBalance;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-md transform transition-all cardSurface">
                <div className="p-6 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2"><BanknotesIcon className="w-6 h-6 text-orange-400"/> Request Payout</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-slate-300 mb-2">
                        Enter the amount you'd like to withdraw to your linked bank account. Payouts are typically processed within 2-3 business days.
                    </p>
                    <p className="text-sm font-semibold text-slate-200 mb-6">
                        Available Balance: <span className="text-green-400">${currentBalance.toFixed(2)}</span>
                    </p>

                     <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">$</span>
                        <input
                            type="number"
                            placeholder="Payout Amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            max={currentBalance}
                            className="w-full text-center bg-zinc-700 border-zinc-600 text-slate-100 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500 font-semibold text-xl"
                        />
                    </div>
                    {parseFloat(amount) > currentBalance && <p className="text-red-400 text-sm text-center mt-2">Amount cannot exceed your available balance.</p>}
                </div>

                <div className="p-6 bg-zinc-800/50 border-t border-zinc-700 rounded-b-2xl">
                    <button
                        onClick={handleConfirm}
                        disabled={isInvalid}
                        className="w-full text-white bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 disabled:cursor-not-allowed font-bold rounded-lg text-lg px-5 py-3.5 text-center transition-all shadow-md shadow-orange-500/20"
                    >
                       Request Payout of ${parseFloat(amount || '0').toFixed(2)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RequestPayoutModal;
      