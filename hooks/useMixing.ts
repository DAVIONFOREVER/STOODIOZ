
import { useCallback } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
import type { BookingRequest, Engineer, MixingDetails } from '../types';
import { redirectToCheckout } from '../lib/stripe';

export const useMixing = (navigate: (view: AppView) => void) => {
    const dispatch = useAppDispatch();
    const { currentUser, userRole, engineers, producers } = useAppState();

    const confirmRemoteMix = useCallback(async (bookingRequest: BookingRequest) => {
        if (!currentUser || !bookingRequest.requestedEngineerId || !userRole) return;
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        try {
            // FIX: Replaced deprecated createBooking with createCheckoutSessionForBooking for payment processing.
            const { sessionId } = await apiService.createCheckoutSessionForBooking(
                bookingRequest,
                undefined, // No stoodio for remote mix
                currentUser.id,
                userRole
            );
            await redirectToCheckout(sessionId);
            // The booking success is handled by Stripe webhook, no need to navigate here.
        } catch(error) {
            console.error("Failed to book remote mix", error);
            // If redirect fails, stop loading
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        } finally {
            // Close modal, but don't stop loading if redirect is in progress
            dispatch({ type: ActionTypes.SET_MIXING_MODAL_OPEN, payload: { isOpen: false } });
        }
    }, [currentUser, userRole, dispatch]);

    const initiateInStudioMix = useCallback((engineer: Engineer, mixingDetails: MixingDetails) => {
        dispatch({ type: ActionTypes.SET_BOOKING_INTENT, payload: { intent: { engineer, mixingDetails } } });
        dispatch({ type: ActionTypes.SET_MIXING_MODAL_OPEN, payload: { isOpen: false } });
        navigate(AppView.STOODIO_LIST);
    }, [dispatch, navigate]);
    
    return { confirmRemoteMix, initiateInStudioMix };
};