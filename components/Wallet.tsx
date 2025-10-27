import React from 'react';
import type { Artist, Engineer, Stoodio, Producer } from '../types';
import { UserRole, TransactionCategory } from '../types';
import { format } from 'date-fns';
import { BanknotesIcon, PlusCircleIcon, ArrowUpCircleIcon, ArrowDownCircleIcon } from './icons';

interface WalletProps {
    user: Artist | Engineer | Stoodio | Producer;
    onAddFunds: () => void;
    onRequestPayout: () => void;
    onViewBooking: (bookingId: string) => void;
    userRole: UserRole;
}

const TransactionIcon: React.FC<{ category: TransactionCategory }> = ({ category }) => {
    switch(category) {
        case TransactionCategory.ADD_FUNDS: return <PlusCircleIcon className="w-6 h-6 text-green-400"/>;
        case TransactionCategory.SESSION_PAYMENT: return <ArrowUpCircleIcon className="w-6 h-6 text-red-400"/>;
        case TransactionCategory.SESSION_PAYOUT: return <ArrowDownCircleIcon className="w-6 h-6 text-green-400"/>;
        case TransactionCategory.TIP_PAYMENT: return <ArrowUpCircleIcon className="w-6 h-6 text-red-400"/>;
        case TransactionCategory.TIP_PAYOUT: return <ArrowDownCircleIcon className="w-6 h-6 text-green-400"/>;
        case TransactionCategory.WITHDRAWAL: return <BanknotesIcon className="w-6 h-6 text-orange-400"/>;
        default: return <BanknotesIcon className="w-6 h-6 text-zinc-400"/>;
    }
};

const Wallet: React.FC<WalletProps> = ({ user, onAddFunds, onRequestPayout, userRole }) => {
    return (
        <div className="bg-zinc-800/50 p-6 rounded-lg shadow-md border border-zinc-700/50">
            <h1 className="text-2xl font-bold text-zinc-100 mb-4">Wallet</h1>
            <div className="bg-green-500/10 p-6 rounded-xl border border-green-500/20 text-center mb-6">
                <p className="text-sm font-semibold text-green-300">Current Balance</p>
                <p className="text-5xl font-extrabold text-white">${user.walletBalance.toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <button onClick={onAddFunds} className="w-full bg-green-500/20 text-green-300 font-bold py-3 px-4 rounded-lg hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2">
                    <PlusCircleIcon className="w-5 h-5"/> Add Funds
                </button>
                 {userRole !== UserRole.ARTIST && (
                    <button onClick={onRequestPayout} className="w-full bg-orange-500/20 text-orange-300 font-bold py-3 px-4 rounded-lg hover:bg-orange-500/30 transition-colors flex items-center justify-center gap-2">
                        <BanknotesIcon className="w-5 h-5"/> Request Payout
                    </button>
                 )}
            </div>
             <h2 className="text-xl font-bold text-zinc-100 mb-4">Transaction History</h2>
             <div className="space-y-3">
                {user.walletTransactions.map(tx => (
                    <div key={tx.id} className="bg-zinc-800 p-3 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TransactionIcon category={tx.category} />
                            <div>
                                <p className="font-semibold text-zinc-200">{tx.description}</p>
                                <p className="text-xs text-zinc-400">{format(new Date(tx.date), 'MMM d, yyyy')}</p>
                            </div>
                        </div>
                        <p className={`font-bold text-lg ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.amount > 0 ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                        </p>
                    </div>
                ))}
                {user.walletTransactions.length === 0 && <p className="text-zinc-500 text-sm text-center py-8">No transactions yet.</p>}
             </div>
        </div>
    );
};

export default Wallet;
