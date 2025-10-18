
import { useCallback } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
// FIX: Import AppView as a value, not just a type.
import { AppView, type BookingRequest, type Engineer, type MixingDetails } from '../types';

export const useMixing = (navigate: (view: AppView) => void) => {
    const dispatch = useAppDispatch();
    const { currentUser, userRole, engineers, producers } = useAppState();

    const confirmRemoteMix = useCallback(async (bookingRequest: BookingRequest) => {
        if (!currentUser || !bookingRequest.requestedEngineerId) return;
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        try {
            const newBooking = await apiService.createBooking(bookingRequest, undefined, currentUser, userRole!, engineers, producers);
            dispatch({ type: ActionTypes.ADD_BOOKING, payload: { booking: newBooking } });
            dispatch({ type: ActionTypes.SET_LATEST_BOOKING, payload: { booking: newBooking } });
            // FIX: Use AppView enum instead of string literal.
            navigate(AppView.CONFIRMATION);
        } catch(error) {
            console.error("Failed to book remote mix", error);
        } finally {
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
            dispatch({ type: ActionTypes.SET_MIXING_MODAL_OPEN, payload: { isOpen: false } });
        }
    }, [currentUser, userRole, engineers, producers, dispatch, navigate]);

    const initiateInStudioMix = useCallback((engineer: Engineer, mixingDetails: MixingDetails) => {
        dispatch({ type: ActionTypes.SET_BOOKING_INTENT, payload: { intent: { engineer, mixingDetails } } });
        dispatch({ type: ActionTypes.SET_MIXING_MODAL_OPEN, payload: { isOpen: false } });
        // FIX: Use AppView enum instead of string literal.
        navigate(AppView.STOODIO_LIST);
    }, [dispatch, navigate]);
    
    return { confirmRemoteMix, initiateInStudioMix };
};
