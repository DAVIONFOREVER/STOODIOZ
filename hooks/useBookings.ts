

import { useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
// FIX: Import AppView as a value, not just a type.
import { UserRole, AppView } from '../types';
import type { BookingRequest, Booking, Engineer, Producer, Room } from '../types';

export const useBookings = (navigate: (view: AppView) => void) => {
    const dispatch = useAppDispatch();
    // FIX: Destructure all user arrays to construct `allUsers`.
    const { selectedStoodio, currentUser, userRole, engineers, producers, bookings, artists, stoodioz } = useAppState();

    // FIX: Construct allUsers from individual state arrays.
    const allUsers = useMemo(() => [...artists, ...engineers, ...producers, ...stoodioz], [artists, engineers, producers, stoodioz]);

    const openBookingModal = useCallback((date: string, time: string, room: Room) => {
        dispatch({ type: ActionTypes.OPEN_BOOKING_MODAL, payload: { date, time, room } });
        // FIX: Use AppView enum instead of string literal.
        navigate(AppView.BOOKING_MODAL);
    }, [dispatch, navigate]);

    const initiateBookingWithEngineer = useCallback((engineer: Engineer, date: string, time: string) => {
        dispatch({ type: ActionTypes.SET_BOOKING_INTENT, payload: { intent: { engineer, date, time } } });
        // FIX: Use AppView enum instead of string literal.
        navigate(AppView.STOODIO_LIST);
    }, [dispatch, navigate]);

    const initiateBookingWithProducer = useCallback((producer: Producer) => {
        dispatch({ type: ActionTypes.SET_BOOKING_INTENT, payload: { intent: { producer, pullUpFee: producer.pullUpPrice } } });
        // FIX: Use AppView enum instead of string literal.
        navigate(AppView.STOODIO_LIST);
    }, [dispatch, navigate]);

    const confirmBooking = useCallback(async (bookingRequest: BookingRequest) => {
        if (!userRole || !currentUser) return;
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        try {
            const newBooking = await apiService.createBooking(bookingRequest, selectedStoodio || undefined, currentUser, userRole, engineers, producers);
            dispatch({ type: ActionTypes.CONFIRM_BOOKING_SUCCESS, payload: { booking: newBooking } });
            // FIX: Use AppView enum instead of string literal.
            navigate(AppView.CONFIRMATION);
        } catch (error) {
            console.error("Failed to create booking:", error);
        } finally {
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        }
    }, [selectedStoodio, currentUser, userRole, engineers, producers, dispatch, navigate]);

    const confirmCancellation = useCallback(async (bookingId: string) => {
        const bookingToCancel = bookings.find(b => b.id === bookingId);
        if (!currentUser || !bookingToCancel) return;
        try {
            // FIX: Pass the full booking object to the mocked API
            const { updatedBookings } = await apiService.cancelBooking(bookingToCancel);
            const updatedBooking = updatedBookings[0];
            if (updatedBooking) {
                dispatch({ type: ActionTypes.SET_BOOKINGS, payload: { bookings: bookings.map(b => b.id === bookingId ? updatedBooking : b) } });
            }
        } catch (error) {
            console.error("Failed to cancel booking:", error);
        } finally {
            dispatch({ type: ActionTypes.CLOSE_CANCEL_MODAL });
        }
    }, [bookings, currentUser, dispatch]);

    const acceptBooking = useCallback(async (booking: Booking) => {
        if (userRole !== UserRole.ENGINEER || !currentUser) return;
        try {
            // FIX: Pass full booking object to mocked API
            const { updatedBooking } = await apiService.respondToBooking(booking, 'accept', currentUser as Engineer);
            dispatch({ type: ActionTypes.SET_BOOKINGS, payload: { bookings: bookings.map(b => b.id === booking.id ? updatedBooking : b) } });
        } catch (error) { console.error(error); }
    }, [bookings, currentUser, userRole, dispatch]);
    
    const denyBooking = useCallback(async (booking: Booking) => {
        if (userRole !== UserRole.ENGINEER || !currentUser) return;
        try {
            // FIX: Pass full booking object to mocked API
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
