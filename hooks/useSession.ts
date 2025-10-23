import { useCallback } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { Booking } from '../types';
import { UserRole } from '../types';
import { redirectToCheckout } from '../lib/stripe';

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

            const { sessionId } = await apiService.addTip(bookingToTip, tipAmount);
            await redirectToCheckout(sessionId);
            
            // The UI will close automatically upon redirecting to Stripe.
            // The actual state update will happen via webhook.
        } catch(error) {
            console.error("Failed to create tip session:", error);
            // Handle error, maybe show a toast message
        }
    }, [bookings, currentUser, dispatch]);
    
    const addFunds = async (amount: number) => {
        if (!currentUser || !userRole) return;
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        try {
            const { sessionId } = await apiService.createCheckoutSessionForWallet(amount, currentUser.id);
            await redirectToCheckout(sessionId);
        } catch(error) {
            console.error("Failed to create add funds session:", error);
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        } finally {
            dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: false } });
        }
    };

    const requestPayout = async (amount: number) => {
        if (!currentUser || userRole === UserRole.ARTIST || !userRole) return;
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        try {
            await apiService.initiatePayout(amount, currentUser.id);
            // On success, you'd show a confirmation toast.
            // The wallet balance will update automatically when the DB is updated via the backend
            // and the component re-fetches its data.
        } catch(error) {
            console.error("Failed to request payout:", error);
            // Show an error toast message
        } finally {
             dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
             dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: false } });
        }
    };

    return { startSession, endSession, confirmTip, addFunds, requestPayout };
};