import { useCallback, useRef } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { Booking } from '../types';
import { UserRole, AppView } from '../types';
import { redirectToCheckout } from '../lib/stripe';
import { useProfile } from '../hooks/useProfile';
import { getSupabase } from '../lib/supabase';

export const useSession = (navigate: (view: any) => void) => {
  const dispatch = useAppDispatch();
  const { userRole, bookings, currentUser } = useAppState();
  const { refreshCurrentUser } = useProfile();

  const startSession = useCallback(
    (booking: Booking) => {
      if (userRole !== UserRole.ENGINEER) return;
      dispatch({ type: ActionTypes.START_SESSION, payload: { booking } });
      navigate(AppView.ACTIVE_SESSION);
    },
    [userRole, dispatch, navigate]
  );

  const endSession = useCallback(
    async (bookingId: string) => {
      try {
        const bookingToEnd = bookings.find((b) => b.id === bookingId);
        if (!bookingToEnd) return;

        const { updatedBooking } = await apiService.endSession(bookingToEnd);

        const updatedBookings = bookings.map((b) => (b.id === bookingId ? updatedBooking : b));
        dispatch({ type: ActionTypes.SET_BOOKINGS, payload: { bookings: updatedBookings } });

        dispatch({ type: ActionTypes.END_SESSION });
        navigate(AppView.ENGINEER_DASHBOARD);
      } catch (error) {
        console.error('Failed to end session:', error);
      }
    },
    [navigate, bookings, dispatch]
  );

  const confirmTip = useCallback(
    async (bookingId: string, tipAmount: number) => {
      if (!currentUser) return;

      // Optional: show loading during checkout creation
      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

      try {
        const bookingToTip = bookings.find((b) => b.id === bookingId);
        if (!bookingToTip) return;

        const { sessionId } = await apiService.addTip(bookingToTip, tipAmount);
        await redirectToCheckout(sessionId);
      } catch (error) {
        console.error('Failed to create tip session:', error);
      } finally {
        // ✅ Always release loading no matter what Stripe does
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
      }
    },
    [bookings, currentUser, dispatch]
  );

  const { history, historyIndex, selectedStoodio, bookingTime } = useAppState();

  const addFundsInFlightRef = useRef(false);
  const addFunds = useCallback(
    async (amount: number) => {
      if (!currentUser || !userRole) return;
      if (addFundsInFlightRef.current) return;
      addFundsInFlightRef.current = true;
      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
          addFundsInFlightRef.current = false;
          if (typeof window !== 'undefined') alert('Please log in to add funds.');
          return;
        }

        const profileId = (currentUser as any)?.profile_id ?? currentUser?.id ?? session?.user?.id;
        const res = await apiService.createCheckoutSessionForWallet(amount, profileId, undefined, { popup: true });
        const sessionId = res?.sessionId;
        const url = res?.url;

        if (!sessionId) {
          throw new Error('No checkout session returned. Try again.');
        }

        // Save return context so we land back on dashboard/wallet after Stripe
        try {
          const currentView = history[historyIndex] ?? (userRole === UserRole.LABEL ? AppView.LABEL_DASHBOARD : AppView.THE_STAGE);
          sessionStorage.setItem(
            'add_funds_return',
            JSON.stringify({
              view: currentView,
              returnTab: currentView === AppView.LABEL_DASHBOARD ? 'financials' : undefined,
            })
          );
          sessionStorage.setItem('stripe_return_in_progress', '1');
          sessionStorage.setItem('stripe_return_profile_id', String(profileId));
        } catch (_) {}

        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: false } });
        addFundsInFlightRef.current = false;

        // Always redirect current tab to Stripe (most reliable: direct URL, no popup)
        if (url && typeof url === 'string' && url.startsWith('http')) {
          window.location.href = url;
          return;
        }
        await redirectToCheckout(sessionId);
      } catch (error: any) {
        console.error('Failed to create add funds session:', error);
        const msg = error?.message || 'Could not start checkout. Check your connection and try again.';
        let friendly = msg;
        if (msg.includes('Please log in')) friendly = msg;
        else if (msg.includes('Failed to fetch') || msg.includes('reach the payment server')) {
          friendly = 'Could not reach the payment server. Check your internet connection and that your Supabase project is not paused (Dashboard → Project Settings). Then try Add Funds again.';
        } else if (msg.includes('500')) {
          friendly = msg + ' — If the message above is empty, set STRIPE_SECRET_KEY in Supabase → Edge Functions → Secrets and run: npx supabase functions deploy create-wallet-checkout --no-verify-jwt';
        }
        alert(friendly);
      } finally {
        addFundsInFlightRef.current = false;
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: false } });
      }
    },
    [currentUser, userRole, dispatch, history, historyIndex, selectedStoodio, bookingTime, refreshCurrentUser]
  );

  const requestPayout = useCallback(
    async (amount: number) => {
      if (!currentUser || !userRole) return;

      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

      try {
        const hasConnect = Boolean((currentUser as any).stripe_connect_account_id || (currentUser as any).stripe_connect_id);
        if (!hasConnect) {
          alert('Please connect your Stripe account before requesting a payout.');
          return;
        }
        if ((currentUser as any).payouts_enabled === false) {
          alert('Payouts are not enabled for this account yet.');
          return;
        }
        await apiService.initiatePayout(currentUser.id, amount);
        await refreshCurrentUser();
        alert('Payout requested. Funds should arrive in 2-3 business days.');
      } catch (error) {
        console.error('Failed to request payout:', error);
        alert((error as Error)?.message || 'Failed to request payout. Please try again.');
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: false } });
      }
    },
    [currentUser, userRole, dispatch, refreshCurrentUser]
  );

  return { startSession, endSession, confirmTip, addFunds, requestPayout };
};
