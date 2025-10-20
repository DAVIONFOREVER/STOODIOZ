

import { useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { Booking, Transaction, Artist, Engineer, Stoodio, Producer } from '../types';
import { TransactionCategory, TransactionStatus, UserRole } from '../types';

export const useSession = (navigate: (view: any) => void) => {
    const dispatch = useAppDispatch();
    // FIX: Destructure all user arrays to construct `allUsers`.
    const { userRole, bookings, currentUser, artists, engineers, producers, stoodioz } = useAppState();

    // FIX: Construct allUsers from individual state arrays.
    const allUsers = useMemo(() => [...artists, ...engineers, ...producers, ...stoodioz], [artists, engineers, producers, stoodioz]);

    const startSession = useCallback((booking: Booking) => {
        if (userRole !== UserRole.ENGINEER) return;
        dispatch({ type: ActionTypes.START_SESSION, payload: { booking } });
        navigate('ACTIVE_SESSION');
    }, [userRole, dispatch, navigate]);

    const endSession = useCallback(async (bookingId: string) => {
        try {
            // FIX: endSession takes 1 argument and returns updatedBooking. User wallet updates happen on the backend but are not returned.
            const { updatedBooking } = await apiService.endSession(bookingId);
            const updatedBookings = bookings.map(b => b.id === bookingId ? updatedBooking : b);
            dispatch({ type: ActionTypes.SET_BOOKINGS, payload: { bookings: updatedBookings } });
            // Cannot update users here as the API doesn't return them.
            dispatch({ type: ActionTypes.END_SESSION });
            navigate('ENGINEER_DASHBOARD');
        } catch (error) { console.error("Failed to end session:", error); }
    }, [navigate, bookings, dispatch]);

    const confirmTip = useCallback(async (bookingId: string, tipAmount: number) => {
        if (!currentUser) return;
        try {
            // FIX: addTip takes 2 arguments and doesn't return updatedUsers.
            const { updatedBookings } = await apiService.addTip(bookingId, tipAmount);
            const updatedBooking = updatedBookings[0];
            if (updatedBooking) {
                const newBookings = bookings.map(b => b.id === bookingId ? updatedBooking : b);
                dispatch({ type: ActionTypes.SET_BOOKINGS, payload: { bookings: newBookings } });
            }
        } catch(error) {
            console.error("Failed to add tip:", error);
        } finally {
            dispatch({ type: ActionTypes.CLOSE_TIP_MODAL });
        }
    }, [bookings, currentUser, dispatch]);
    
    const addFunds = (amount: number) => {
        if (!currentUser) return;
        const newTx: Transaction = {
            id: `txn-add-funds-${Date.now()}`, description: 'Added funds to wallet', amount,
            date: new Date().toISOString(), category: TransactionCategory.ADD_FUNDS, status: TransactionStatus.COMPLETED,
        };
        const updatedUser = { ...currentUser, walletBalance: currentUser.walletBalance + amount, walletTransactions: [newTx, ...currentUser.walletTransactions] };
        const newAllUsers = allUsers.map(u => u.id === currentUser.id ? updatedUser : u);
        dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: newAllUsers } });
        dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: false } });
    };

    const requestPayout = (amount: number) => {
        if (!currentUser || userRole === UserRole.ARTIST) return;
         const newTx: Transaction = {
            id: `txn-payout-${Date.now()}`, description: 'Payout to bank account', amount: -amount,
            date: new Date().toISOString(), category: TransactionCategory.WITHDRAWAL, status: TransactionStatus.PENDING,
        };
        const updatedUser = { ...currentUser, walletBalance: currentUser.walletBalance - amount, walletTransactions: [newTx, ...currentUser.walletTransactions] };
        const newAllUsers = allUsers.map(u => u.id === currentUser.id ? updatedUser : u);
        dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: newAllUsers } });
        dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: false } });

        setTimeout(() => {
            const finalAllUsers = allUsers.map(u => u.id === updatedUser.id ? {...u, walletTransactions: u.walletTransactions.map(tx => tx.id === newTx.id ? { ...tx, status: TransactionStatus.COMPLETED } : tx) } : u);
            dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: finalAllUsers } });
        }, 5000);
    };

    return { startSession, endSession, confirmTip, addFunds, requestPayout };
};