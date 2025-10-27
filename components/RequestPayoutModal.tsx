
import React, { useState } from 'react';
import { CloseIcon, BanknotesIcon } from './icons';

interface RequestPayoutModalProps {
    onClose: () => void;
    onConfirm: (amount: number) => void;
    currentBalance: number;
}

const RequestPayoutModal: React.FC<RequestPayoutModalProps> = ({ onClose, onConfirm, currentBalance }) => {
    const [amount, setAmount] = useState(Math.floor(currentBalance));

    const handleConfirm = () => {
        if (amount > 0 && amount <= currentBalance) {
            onConfirm(amount);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-zinc-800 rounded-2xl shadow-xl w-full max-w-md border border-zinc-700 animate-slide-up">
                <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-100">Request Payout</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-100"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-slate-400">Available Balance</p>
                        <p className="text-3xl font-bold text-green-400">${currentBalance.toFixed(2)}</p>
                    </div>
                    <p className="text-slate-300 text-center">Enter the amount you'd like to withdraw. Funds will be sent to your connected bank account within 3-5 business days.</p>

                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full pl-7 p-3 bg-zinc-700 rounded-md text-center font-bold text-2xl"
                            max={currentBalance}
                            min="0"
                        />
                    </div>
                     <button onClick={() => setAmount(Math.floor(currentBalance))} className="w-full text-sm text-orange-400 hover:underline">
                        Withdraw Maximum
                    </button>
                </div>
                <div className="p-4 bg-zinc-800/50 border-t border-zinc-700">
                    <button
                        onClick={handleConfirm}
                        disabled={amount <= 0 || amount > currentBalance}
                        className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <BanknotesIcon className="w-5 h-5"/>
                        Request Payout of ${amount.toFixed(2)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RequestPayoutModal;
