
import React, { useState } from 'react';
import { CloseIcon, BanknotesIcon } from './icons';

interface RequestPayoutModalProps {
    onClose: () => void;
    onConfirm: (amount: number) => void;
    onConnect?: () => void;
    currentBalance: number;
    hasConnect: boolean;
    payoutsEnabled: boolean;
}

const RequestPayoutModal: React.FC<RequestPayoutModalProps> = ({ onClose, onConfirm, onConnect, currentBalance, hasConnect, payoutsEnabled }) => {
    const [amount, setAmount] = useState<string>(String(currentBalance));

    const handleConfirm = () => {
        const numericAmount = parseFloat(amount);
        if (numericAmount > 0 && numericAmount <= currentBalance) {
            onConfirm(numericAmount);
        }
    };

    const isInvalid = !amount || parseFloat(amount) <= 0 || parseFloat(amount) > currentBalance;
    const isBlocked = !hasConnect || !payoutsEnabled;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-md rounded-2xl overflow-hidden cardSurface shadow-2xl shadow-orange-500/20">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-orange-400">Payout</p>
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2 mt-1">
                            <BanknotesIcon className="w-6 h-6 text-orange-400"/> Request Payout
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-slate-300 mb-2">
                        Enter the amount you'd like to withdraw to your linked bank account. Payouts are typically processed within 2-3 business days.
                    </p>
                    <p className="text-sm font-semibold text-slate-200 mb-6">
                        Available Balance: <span className="text-green-400">${currentBalance.toFixed(2)}</span>
                    </p>
                    {isBlocked && (
                        <div className="mb-4 p-3 rounded-lg border border-orange-500/30 bg-orange-500/10 text-sm text-orange-200 space-y-2">
                            {!hasConnect && (
                                <>
                                    <p>Connect your Stripe account to receive payouts.</p>
                                    <button
                                        type="button"
                                        onClick={onConnect}
                                        disabled={!onConnect}
                                        className="w-full mt-2 bg-orange-500 text-white font-semibold py-2 px-3 rounded-lg text-sm hover:bg-orange-600 disabled:bg-zinc-600 disabled:cursor-not-allowed"
                                    >
                                        Connect Stripe
                                    </button>
                                </>
                            )}
                            {hasConnect && !payoutsEnabled && <p>Payouts are currently disabled for this account.</p>}
                        </div>
                    )}

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

                <div className="p-6 bg-black/30 border-t border-white/10 rounded-b-2xl backdrop-blur-sm">
                    <button
                        onClick={handleConfirm}
                        disabled={isInvalid || isBlocked}
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
      