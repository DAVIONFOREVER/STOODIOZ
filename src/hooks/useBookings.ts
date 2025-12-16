
import { useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { UserRole, AppView, SmokingPolicy } from '../types';
// FIX: Import missing types
import type { BookingRequest, Booking, Engineer, Producer, Room } from '../types';
import { redirectToCheckout } from '../lib/stripe';

export const useBookings = (navigate: (view: AppView) => void) => {
    const dispatch = useAppDispatch();
    const { selectedStoodio, currentUser, userRole, bookings, engineers, producers } = useAppState();

    const openBookingModal = useCallback((date: string, time: string, room: Room) => {
        dispatch({ type: ActionTypes.OPEN_BOOKING_MODAL, payload: { date, time, room } });
    }, [dispatch]);

    const initiateBookingWithEngineer = useCallback((engineer: Engineer, date: string, time: string) => {
        dispatch({ type: ActionTypes.SET_BOOKING_INTENT, payload: { intent: { engineer, date, time } } });
        navigate(AppView.STOODIO_LIST);
    }, [dispatch, navigate]);

    const initiateBookingWithProducer = useCallback((producer: Producer) => {
        // Set the intent
        dispatch({ type: ActionTypes.SET_BOOKING_INTENT, payload: { intent: { producer, pullUpFee: producer.pull_up_price } } });
        
        // DIRECT CHECKOUT FLOW:
        // Instead of navigating to STOODIO_LIST, we clear the selected studio (to indicate direct booking)
        // and open the modal immediately with a placeholder room (cost $0 for the room itself).
        
        dispatch({ type: ActionTypes.RESET_PROFILE_SELECTIONS }); // Clear any previously selected studio

        const directServiceRoom: Room = {
            id: 'direct-service',
            name: 'Direct Service',
            description: 'Direct booking with producer',
            hourly_rate: 0,
            photos: [],
            smoking_policy: SmokingPolicy.NON_SMOKING
        };

        dispatch({ 
            type: ActionTypes.OPEN_BOOKING_MODAL, 
            payload: { 
                date: new Date().toISOString().split('T')[0], 
                time: '12:00', 
                room: directServiceRoom 
            } 
        });
        
    }, [dispatch]);

    const confirmBooking = useCallback(async (bookingRequest: BookingRequest) => {
        if (!userRole || !currentUser) return;
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        try {
            const { sessionId } = await apiService.createCheckoutSessionForBooking(
                bookingRequest,
                selectedStoodio?.id,
                currentUser.id,
                userRole
            );
            
            await redirectToCheckout(sessionId);
            
        } catch (error) {
            console.error("Failed to create Stripe checkout session:", error);
            // CRITICAL FIX: Stop loading spinner if payment/redirect fails
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        } finally {
            // FIX: Force stop loading here to prevent "frozen" spinner state if redirect is not immediate
            // or if we are using a mock implementation that doesn't actually unload the page.
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        }
    }, [selectedStoodio, currentUser, userRole, dispatch]);

    const confirmCancellation = useCallback(async (bookingId: string) => {
        const bookingToCancel = bookings.find(b => b.id === bookingId);
        if (!currentUser || !bookingToCancel) return;
        try {
            const updatedBooking = await apiService.cancelBooking(bookingToCancel);
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
            const updatedBooking = await apiService.respondToBooking(booking, 'accept', currentUser as Engineer);
            dispatch({ type: ActionTypes.SET_BOOKINGS, payload: { bookings: bookings.map(b => b.id === booking.id ? updatedBooking : b) } });
        } catch (error) { console.error(error); }
    }, [bookings, currentUser, userRole, dispatch]);
    
    const denyBooking = useCallback(async (booking: Booking) => {
        if (userRole !== UserRole.ENGINEER || !currentUser) return;
        try {
            const updatedBooking = await apiService.respondToBooking(booking, 'deny', currentUser as Engineer);
            dispatch({ type: ActionTypes.SET_BOOKINGS, payload: { bookings: bookings.map(b => b.id === booking.id ? updatedBooking : b) } });
        } catch (error) { console.error(error); }
    }, [bookings, currentUser, userRole, dispatch]);

    const acceptJob = useCallback(async (booking: Booking) => {
        if (!currentUser || userRole !== UserRole.ENGINEER) {
            alert("Only engineers can accept jobs.");
            return;
        }
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        try {
            const updatedBooking = await apiService.acceptJob(booking, currentUser as Engineer);
            const updatedBookings = bookings.map(b => b.id === booking.id ? updatedBooking : b);
            dispatch({ type: ActionTypes.SET_BOOKINGS, payload: { bookings: updatedBookings } });
            navigate(AppView.MY_BOOKINGS);
        } catch (error) {
            console.error("Failed to accept job:", error);
        } finally {
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        }
    }, [bookings, currentUser, userRole, dispatch, navigate]);
    
    return { 
        openBookingModal, 
        initiateBookingWithEngineer, 
        initiateBookingWithProducer, 
        confirmBooking, 
        confirmCancellation, 
        acceptBooking, 
        denyBooking,
        acceptJob
    };
};
