import { useCallback } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { Booking } from '../types';
import { UserRole } from '../types';

export const useSession = (navigate: (view: any) => void) => {
    const dispatch = useAppDispatch();
    const { userRole, bookings, currentUser } = useAppState();

    const startSession = useCallback((booking: Booking) => {
        if (userRole !== UserRole.ENGINEER) return;
        dispatch({ type: ActionTypes.START_SESSION, payload: { booking } });
        navigate('ACTIVE_SESSION');
    }, [userRole, dispatch, navigate]);

    const endSession = useCallback(async (bookingId: string) => {
        try {
            const bookingToEnd = bookings.find(b => b.id === bookingId);
            if (!bookingToEnd) return;
            const { updatedBooking } = await apiService.endSession(bookingToEnd);
            const updatedBookings = bookings.map(b => b.id === bookingId ? updatedBooking : b);
            dispatch({ type: ActionTypes.SET_BOOKINGS, payload: { bookings: updatedBookings } });
            
            dispatch({ type: ActionTypes.END_SESSION });
            navigate('ENGINEER_DASHBOARD');
        } catch (error) { console.error("Failed to end session:", error); }
    }, [navigate, bookings, dispatch]);

    const confirmTip = useCallback(async (bookingId: string, tipAmount: number) => {
        if (!currentUser) return;
        try {
            const bookingToTip = bookings.find(b => b.id === bookingId);
            if (!bookingToTip) return;

            const { updatedBooking, updatedUsers } = await apiService.addTip(bookingToTip, tipAmount);
            dispatch({ type: ActionTypes.SET_BOOKINGS, payload: { bookings: bookings.map(b => b.id === bookingId ? updatedBooking : b) } });
            // In a real app, you would dispatch the updatedUsers to update wallet balances
            // dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers } });
        } catch(error) {
            console.error("Failed to add tip:", error);
        } finally {
            dispatch({ type: ActionTypes.CLOSE_TIP_MODAL });
        }
    }, [bookings, currentUser, dispatch]);
    
    const addFunds = async (amount: number) => {
        if (!currentUser || !userRole) return;
        try {
            const updatedUser = await apiService.updateUserWallet(currentUser.id, userRole, amount, 'ADD_FUNDS');
            dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: { user: updatedUser } });
        } catch(error) {
            console.error("Failed to add funds:", error);
        } finally {
            dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: false } });
        }
    };

    const requestPayout = async (amount: number) => {
        if (!currentUser || userRole === UserRole.ARTIST || !userRole) return;
        try {
            const updatedUser = await apiService.updateUserWallet(currentUser.id, userRole, -amount, 'WITHDRAWAL');
            dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: { user: updatedUser } });
        } catch(error) {
            console.error("Failed to request payout:", error);
        } finally {
             dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: false } });
        }
    };

    return { startSession, endSession, confirmTip, addFunds, requestPayout };
};
