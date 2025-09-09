import React from 'react';
import type { Artist, Engineer, Stoodio, Transaction } from '../types';
import { TransactionCategory, TransactionStatus, UserRole } from '../types';
import { BanknotesIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, CalendarIcon, DollarSignIcon, HeartIcon, PlusCircleIcon, BriefcaseIcon } from './icons';
import { format } from 'date-fns';

interface WalletProps {
    user: Artist | Engineer | Stoodio;
    onAddFunds: () => void;
    onRequestPayout?: () => void;
    onViewBooking: (bookingId: string) => void;
    userRole: UserRole | null;
}

const TransactionIcon: React.FC<{ category: TransactionCategory }> = ({ category }) => {
    const iconClass = "w-6 h-6";
    switch (category) {
        case TransactionCategory.ADD_FUNDS:
            return <div className="bg-blue-500/10 text-blue-500 p-2 rounded-full"><PlusCircleIcon className={iconClass} /></div>;
        case TransactionCategory.SESSION_PAYMENT:
            return <div className="bg-red-500/10 text-red-500 p-2 rounded-full"><CalendarIcon className={iconClass} /></div>;
        case TransactionCategory.SESSION_PAYOUT:
            return <div className="bg-green-500/10 text-green-500 p-2 rounded-full"><BriefcaseIcon className={iconClass} /></div>;
        case TransactionCategory.TIP_PAYMENT:
        case TransactionCategory.TIP_PAYOUT:
            return <div className="bg-pink-500/10 text-pink-500 p-2 rounded-full"><HeartIcon className={iconClass} /></div>;
        case TransactionCategory.REFUND:
            return <div className="bg-yellow-500/10 text-yellow-500 p-2 rounded-full"><DollarSignIcon className={iconClass} /></div>;
        case TransactionCategory.WITHDRAWAL:
            return <div className="bg-indigo-500/10 text-indigo-500 p-2 rounded-full"><BanknotesIcon className={iconClass} /></div>;
        default:
            return <div className="bg-slate-500/10 text-slate-500 p-2 rounded-full"><DollarSignIcon className={iconClass} /></div>;
    }
};

const StatusBadge: React.FC<{ status: TransactionStatus }> = ({ status }) => {
    const baseClasses = "text-xs font-semibold px-2 py-0.5 rounded-full";
    switch (status) {
        case TransactionStatus.PENDING:
            return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>;
        case TransactionStatus.COMPLETED:
            return <span className={`${baseClasses} bg-green-100 text-green-800`}>Completed</span>;
        case TransactionStatus.FAILED:
            return <span className={`${baseClasses} bg-red-100 text-red-800`}>Failed</span>;
        default:
            return null;
    }
};

const Wallet: React.FC<WalletProps> = ({ user, onAddFunds, onRequestPayout, onViewBooking, userRole }) => {

    const sortedTransactions = [...user.walletTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-6 border-b border-slate-200">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Wallet</h3>
                    <p className="text-4xl font-bold text-green-600 mt-1">${user.walletBalance.toFixed(2)}</p>
                    <p className="text-sm text-slate-500">Available Balance</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onAddFunds} className="flex items-center gap-2 bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                        <ArrowUpCircleIcon className="w-5 h-5"/> Add Funds
                    </button>
                    {(userRole === UserRole.ENGINEER || userRole === UserRole.STOODIO) && (
                        <button onClick={onRequestPayout} className="flex items-center gap-2 bg-slate-200 text-slate-800 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors text-sm">
                            <ArrowDownCircleIcon className="w-5 h-5"/> Request Payout
                        </button>
                    )}
                </div>
            </div>

            <h4 className="font-bold text-lg text-slate-800 mb-4">Transaction History</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {sortedTransactions.length > 0 ? sortedTransactions.map((tx) => {
                    const isCredit = tx.amount > 0;
                    return (
                        <div key={tx.id} className="flex items-center gap-4 bg-slate-50 p-3 rounded-md">
                            <TransactionIcon category={tx.category} />
                            <div className="flex-grow">
                                <p className="font-semibold text-slate-800">{tx.description}</p>
                                <p className="text-xs text-slate-500">
                                    {format(new Date(tx.date), 'MMM d, yyyy, h:mm a')}
                                    {tx.relatedUserName && ` • To/From ${tx.relatedUserName}`}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className={`font-bold text-lg ${isCredit ? 'text-green-600' : 'text-slate-800'}`}>
                                    {isCredit ? '+' : ''}${tx.amount.toFixed(2)}
                                </p>
                                <div className="flex items-center justify-end gap-2 mt-0.5">
                                    {tx.relatedBookingId && <button onClick={() => onViewBooking(tx.relatedBookingId!)} className="text-xs text-orange-500 hover:underline">View Booking</button>}
                                    <StatusBadge status={tx.status} />
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                     <p className="text-slate-500 text-sm text-center py-8">No transactions yet.</p>
                )}
            </div>
        </div>
    );
};

export default Wallet;
