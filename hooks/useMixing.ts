import { useCallback } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { AppView } from '../types';
import type { BookingRequest, Engineer, MixingDetails } from '../types';
import { redirectToCheckout } from '../lib/stripe';

export const useMixing = (navigate: (view: AppView) => void) => {
  const dispatch = useAppDispatch();
  const { currentUser, userRole } = useAppState();

  const confirmRemoteMix = useCallback(
    async (bookingRequest: BookingRequest) => {
      if (!currentUser || !userRole || !bookingRequest?.requested_engineer_id) return;

      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

      try {
        const { sessionId } = await apiService.createCheckoutSessionForBooking(
          bookingRequest,
          undefined, // No stoodio for remote mix
          currentUser.id,
          userRole
        );

        await redirectToCheckout(sessionId);
        // Stripe takes over; webhook handles booking success.
      } catch (error) {
        console.error('Failed to book remote mix:', error);
      } finally {
        // ✅ Always release loading + close modal so UI never gets stuck.
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        dispatch({ type: ActionTypes.SET_MIXING_MODAL_OPEN, payload: { isOpen: false } });
      }
    },
    [currentUser, userRole, dispatch]
  );

  const initiateInStudioMix = useCallback(
    (engineer: Engineer, mixingDetails: MixingDetails) => {
      dispatch({ type: ActionTypes.SET_BOOKING_INTENT, payload: { intent: { engineer, mixingDetails } } });
      dispatch({ type: ActionTypes.SET_MIXING_MODAL_OPEN, payload: { isOpen: false } });
      navigate(AppView.STOODIO_LIST);
    },
    [dispatch, navigate]
  );

  return { confirmRemoteMix, initiateInStudioMix };
};
