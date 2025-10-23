import { useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { UserRole, AppView } from '../types';
import type { BookingRequest, Booking, Engineer, Producer, Room } from '../types';
import { redirectToCheckout } from '../lib/stripe';

export const useBookings = (navigate: (view: AppView) => void) => {
    const dispatch = useAppDispatch();
    const { selectedStoodio, currentUser, userRole, bookings, engineers, producers } = useAppState();

    const openBookingModal = useCallback((date: string, time: string, room: Room) => {
        dispatch({ type: ActionTypes.OPEN_BOOKING_MODAL, payload: { date, time, room } });
        navigate(AppView.BOOKING_MODAL);
    }, [dispatch, navigate]);

    const initiateBookingWithEngineer = useCallback((engineer: Engineer, date: string, time: string) => {
        dispatch({ type: ActionTypes.SET_BOOKING_INTENT, payload: { intent: { engineer, date, time } } });
        navigate(AppView.STOODIO_LIST);
    }, [dispatch, navigate]);

    const initiateBookingWithProducer = useCallback((producer: Producer) => {
        dispatch({ type: ActionTypes.SET_BOOKING_INTENT, payload: { intent: { producer, pullUpFee: producer.pullUpPrice } } });
        navigate(AppView.STOODIO_LIST);
    }, [dispatch, navigate]);

    const confirmBooking = useCallback(async (bookingRequest: BookingRequest) => {
        if (!userRole || !currentUser) return;
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        try {
            // The new API service function calls a Supabase Edge Function
            // which creates the booking record and a Stripe session.
            const { sessionId } = await apiService.createCheckoutSessionForBooking(
                bookingRequest,
                selectedStoodio?.id,
                currentUser.id,
                userRole
            );
            
            // Redirect the user to the Stripe-hosted checkout page.
            await redirectToCheckout(sessionId);
            
            // Note: We no longer dispatch CONFIRM_BOOKING_SUCCESS here.
            // The success is handled by a Stripe webhook that updates our database.
            // The user will be redirected back to a success/failure URL specified in the Edge Function.
            
        } catch (error) {
            console.error("Failed to create Stripe checkout session:", error);
            // Optionally, show an error message to the user.
        } finally {
            // We may not want to set loading to false if a redirect is happening.
            // Stripe's redirect will take over the page.
            // If the redirect fails, we should handle that case and set loading to false.
        }
    }, [selectedStoodio, currentUser, userRole, dispatch]);

    const confirmCancellation = useCallback(async (bookingId: string) => {
        const bookingToCancel = bookings.find(b => b.id === bookingId);
        if (!currentUser || !bookingToCancel) return;
        try {
            const { updatedBookings } = await apiService.cancelBooking(bookingToCancel);
            const updatedBooking = updatedBookings[0];
            dispatch({ type: ActionTypes.SET_BOOKINGS, payload: { bookings: bookings.map(b => b.id === bookingId ? updatedBooking : b) } });
        } catch (error) {
            console.error("Failed to cancel booking:", error);
        } finally {
            dispatch({ type: ActionTypes.CLOSE_CANCEL_MODAL });
        }
    }, [bookings, currentUser, dispatch]);

    const acceptBooking = useCallback(async (booking: Booking) => {
        if (userRole !== UserRole.ENGINEER || !currentUser) return;
        try {
            const { updatedBooking } = await apiService.respondToBooking(booking, 'accept', currentUser as Engineer);
            dispatch({ type: ActionTypes.SET_BOOKINGS, payload: { bookings: bookings.map(b => b.id === booking.id ? updatedBooking : b) } });
        } catch (error) { console.error(error); }
    }, [bookings, currentUser, userRole, dispatch]);
    
    const denyBooking = useCallback(async (booking: Booking) => {
        if (userRole !== UserRole.ENGINEER || !currentUser) return;
        try {
            const { updatedBooking } = await apiService.respondToBooking(booking, 'deny', currentUser as Engineer);
            dispatch({ type: ActionTypes.SET_BOOKINGS, payload: { bookings: bookings.map(b => b.id === booking.id ? updatedBooking : b) } });
        } catch (error) { console.error(error); }
    }, [bookings, currentUser, userRole, dispatch]);
    
    return { 
        openBookingModal, 
        initiateBookingWithEngineer, 
        initiateBookingWithProducer, 
        confirmBooking, 
        confirmCancellation, 
        acceptBooking, 
        denyBooking 
    };
};