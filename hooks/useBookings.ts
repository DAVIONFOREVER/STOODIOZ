import { useCallback } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { UserRole, AppView, SmokingPolicy } from '../types';
import type { BookingRequest, Booking, Engineer, Producer, Room } from '../types';
import { redirectToCheckout } from '../lib/stripe';

export const useBookings = (navigate: (view: AppView) => void) => {
  const dispatch = useAppDispatch();
  const { selectedStoodio, currentUser, userRole, bookings } = useAppState();

  const openBookingModal = useCallback(
    (date: string, time: string, room: Room) => {
      dispatch({ type: ActionTypes.OPEN_BOOKING_MODAL, payload: { date, time, room } });
    },
    [dispatch]
  );

  const initiateBookingWithEngineer = useCallback(
    (engineer: Engineer, date: string, time: string) => {
      dispatch({ type: ActionTypes.SET_BOOKING_INTENT, payload: { intent: { engineer, date, time } } });
      navigate(AppView.STOODIO_LIST);
    },
    [dispatch, navigate]
  );

  const initiateBookingWithProducer = useCallback(
    (producer: Producer) => {
      dispatch({
        type: ActionTypes.SET_BOOKING_INTENT,
        payload: { intent: { producer, pullUpFee: producer.pull_up_price } },
      });
      dispatch({ type: ActionTypes.RESET_PROFILE_SELECTIONS });

      const directServiceRoom: Room = {
        id: 'direct-service',
        name: 'Direct Service',
        description: 'Direct booking with producer',
        hourly_rate: 0,
        photos: [],
        smoking_policy: SmokingPolicy.NON_SMOKING,
      };

      dispatch({
        type: ActionTypes.OPEN_BOOKING_MODAL,
        payload: {
          date: new Date().toISOString().split('T')[0],
          time: '12:00',
          room: directServiceRoom,
        },
      });
    },
    [dispatch]
  );

  const confirmBooking = useCallback(
    async (bookingRequest: BookingRequest) => {
      if (!userRole || !currentUser) return;

      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

      try {
        const { sessionId } = await apiService.createCheckoutSessionForBooking(
          bookingRequest,
          selectedStoodio?.id,
          currentUser.id,
          userRole
        );

        // Mock path: simulate success for UI demo
        if (!sessionId || sessionId === 'mock') {
          console.log('💳 MOCK CHECKOUT: In a live env, this would redirect to Stripe.');
          dispatch({ type: ActionTypes.CLOSE_BOOKING_MODAL });
          alert('Booking requested! (Mock Checkout Successful)');
          navigate(AppView.MY_BOOKINGS);
          return;
        }

        // Stripe path
        await redirectToCheckout(sessionId);
        // Stripe takes over; webhook + return URL should drive final confirmation.
      } catch (error: any) {
        console.error('Booking process error:', error);
        alert(`Could not initialize checkout: ${error?.message || 'Unknown error'}`);
      } finally {
        // ✅ Always release loading so the UI can never get stuck.
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
      }
    },
    [selectedStoodio, currentUser, userRole, dispatch, navigate]
  );

  const confirmCancellation = useCallback(
    async (bookingId: string) => {
      const bookingToCancel = bookings.find((b) => b.id === bookingId);
      if (!currentUser || !bookingToCancel) return;

      try {
        const updatedBooking = await apiService.cancelBooking(bookingToCancel);
        dispatch({
          type: ActionTypes.SET_BOOKINGS,
          payload: { bookings: bookings.map((b) => (b.id === bookingId ? updatedBooking : b)) },
        });
      } catch (error) {
        console.error('Failed to cancel booking:', error);
      } finally {
        dispatch({ type: ActionTypes.CLOSE_CANCEL_MODAL });
      }
    },
    [bookings, currentUser, dispatch]
  );

  const acceptJob = useCallback(
    async (booking: Booking) => {
      if (!currentUser || userRole !== UserRole.ENGINEER) {
        alert('Only engineers can accept jobs.');
        return;
      }

      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

      try {
        const updatedBooking = await apiService.acceptJob(booking, currentUser as Engineer);
        const updatedBookings = bookings.map((b) => (b.id === booking.id ? updatedBooking : b));

        dispatch({ type: ActionTypes.SET_BOOKINGS, payload: { bookings: updatedBookings } });
        navigate(AppView.MY_BOOKINGS);
      } catch (error) {
        console.error('Failed to accept job:', error);
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
      }
    },
    [bookings, currentUser, userRole, dispatch, navigate]
  );

  return {
    openBookingModal,
    initiateBookingWithEngineer,
    initiateBookingWithProducer,
    confirmBooking,
    confirmCancellation,
    acceptJob,
  };
};
