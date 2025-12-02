
import React from 'react';
import type { Artist, Engineer, Stoodio, Transaction, Producer, Label } from '../types';
import { TransactionCategory, TransactionStatus, UserRole } from '../types';
import { BanknotesIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, CalendarIcon, DollarSignIcon, HeartIcon, PlusCircleIcon, BriefcaseIcon } from './icons';
import { format } from 'date-fns';

interface WalletProps {
    user: Artist | Engineer | Stoodio | Producer | Label;
    onAddFunds: () => void;
    onRequestPayout?: () => void;
    onViewBooking: (bookingId: string) => void;
    userRole: UserRole | null;
}

const TransactionIcon: React.FC<{ category: TransactionCategory }> = ({ category }) => {
    const iconClass = "w-6 h-6";
    switch (category) {
        case TransactionCategory.ADD_FUNDS:
            return <div className="bg-blue-500/10 text-blue-400 p-2 rounded-full"><PlusCircleIcon className={iconClass} /></div>;
        case TransactionCategory.SESSION_PAYMENT:
            return <div className="bg-red-500/10 text-red-400 p-2 rounded-full"><CalendarIcon className={iconClass} /></div>;
        case TransactionCategory.SESSION_PAYOUT:
            return <div className="bg-green-500/10 text-green-400 p-2 rounded-full"><BriefcaseIcon className={iconClass} /></div>;
        case TransactionCategory.TIP_PAYMENT:
        case TransactionCategory.TIP_PAYOUT:
            return <div className="bg-pink-500/10 text-pink-400 p-2 rounded-full"><HeartIcon className={iconClass} /></div>;
        case TransactionCategory.REFUND:
            return <div className="bg-yellow-500/10 text-yellow-400 p-2 rounded-full"><DollarSignIcon className={iconClass} /></div>;
        case TransactionCategory.WITHDRAWAL:
            return <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-full"><BanknotesIcon className={iconClass} /></div>;
        default:
            return <div className="bg-slate-500/10 text-slate-400 p-2 rounded-full"><DollarSignIcon className={iconClass} /></div>;
    }
};

const StatusBadge: React.FC<{ status: TransactionStatus }> = ({ status }) => {
    const baseClasses = "text-xs font-semibold px-2 py-0.5 rounded-full";
    switch (status) {
        case TransactionStatus.PENDING:
            return <span className={`${baseClasses} bg-yellow-400/10 text-yellow-300`}>Pending</span>;
        case TransactionStatus.COMPLETED:
            return <span className={`${baseClasses} bg-green-400/10 text-green-300`}>Completed</span>;
        case TransactionStatus.FAILED:
            return <span className={`${baseClasses} bg-red-400/10 text-red-300`}>Failed</span>;
        default:
            return null;
    }
};

const Wallet: React.FC<WalletProps> = ({ user, onAddFunds, onRequestPayout, onViewBooking, userRole }) => {

    // FIX: Corrected property 'wallet_transactions' to be accessed correctly for sorting.
    const sortedTransactions = [...(user.wallet_transactions || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="p-6 cardSurface">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-6 border-b border-zinc-700">
                <div>
                    <h3 className="text-xl font-bold text-slate-100">Wallet</h3>
                    <p className="text-4xl font-bold text-green-400 mt-1">${user.wallet_balance.toFixed(2)}</p>
                    <p className="text-sm text-slate-400">Available Balance</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onAddFunds} className="flex items-center gap-2 bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                        <ArrowUpCircleIcon className="w-5 h-5"/> Add Funds
                    </button>
                    {(userRole === UserRole.ENGINEER || userRole === UserRole.STOODIO || userRole === UserRole.PRODUCER) && (
                        <button onClick={onRequestPayout} className="flex items-center gap-2 bg-zinc-700 text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-zinc-600 transition-colors text-sm">
                            <ArrowDownCircleIcon className="w-5 h-5"/> Request Payout
                        </button>
                    )}
                </div>
            </div>

            <h4 className="font-bold text-lg text-slate-200 mb-4">Transaction History</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {sortedTransactions.length > 0 ? sortedTransactions.map((tx) => {
                    const isCredit = tx.amount > 0;
                    return (
                        <div key={tx.id} className="cardSurface p-3 flex items-center gap-4">
                            <TransactionIcon category={tx.category} />
                            <div className="flex-grow">
                                <p className="font-semibold text-slate-200">{tx.description}</p>
                                <p className="text-xs text-slate-400">
                                    {format(new Date(tx.date), 'MMM d, yyyy, h:mm a')}
                                    {tx.related_user_name && ` • To/From ${tx.related_user_name}`}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className={`font-bold text-lg ${isCredit ? 'text-green-400' : 'text-slate-200'}`}>
                                    {isCredit ? '+' : ''}${tx.amount.toFixed(2)}
                                </p>
                                <div className="flex items-center justify-end gap-2 mt-0.5">
                                    {tx.related_booking_id && <button onClick={() => onViewBooking(tx.related_booking_id!)} className="text-xs text-orange-400 hover:underline">View Booking</button>}
                                    <StatusBadge status={tx.status} />
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                     <p className="text-slate-400 text-sm text-center py-8">No transactions yet.</p>
                )}
            </div>
        </div>
    );
};

export default Wallet;
