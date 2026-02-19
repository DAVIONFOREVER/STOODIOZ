import { useCallback } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import type { Booking } from '../types';
import { UserRole, AppView } from '../types';
import { redirectToCheckout } from '../lib/stripe';
import { useProfile } from '../hooks/useProfile';

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

  const addFunds = useCallback(
    async (amount: number) => {
      if (!currentUser || !userRole) return;

      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

      try {
        const profileId = (currentUser as any)?.profile_id ?? currentUser?.id;
        const res = await apiService.createCheckoutSessionForWallet(amount, profileId, undefined, { popup: true });
        const { sessionId, url } = res;

        if (url && typeof window !== 'undefined') {
          const balanceBefore = Number((currentUser as any)?.wallet_balance ?? 0);
          const popup = window.open(url, 'stripe_wallet', 'width=500,height=700,scrollbars=yes');
          dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
          dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: false } });

          const showNotification = (message: string) => {
            dispatch({
              type: ActionTypes.ADD_NOTIFICATION,
              payload: {
                notification: {
                  id: `add-funds-${Date.now()}`,
                  recipient_id: profileId,
                  type: 'SCHEDULE_REMINDER' as any,
                  message,
                  read: false,
                  timestamp: new Date().toISOString(),
                },
              },
            });
          };

          const checkBalanceAndNotify = async () => {
            const updated = await refreshCurrentUser();
            const newBalance = Number((updated as any)?.wallet_balance ?? 0);
            if (newBalance > balanceBefore) {
              const added = newBalance - balanceBefore;
              showNotification(`You just added $${added.toFixed(2)} to your wallet.`);
              return true;
            }
            return false;
          };

          const onDone = async () => {
            const showed = await checkBalanceAndNotify();
            if (showed) return;
            showNotification('Payment received. Your balance will update in a few seconds—refresh the wallet tab if needed.');
            setTimeout(() => checkBalanceAndNotify(), 2000);
            setTimeout(() => checkBalanceAndNotify(), 5000);
          };

          const handleMessage = (e: MessageEvent) => {
            if (e.data?.type === 'STRIPE_POPUP_SUCCESS') {
              window.removeEventListener('message', handleMessage);
              onDone();
            }
          };
          window.addEventListener('message', handleMessage);

          const poll = setInterval(() => {
            if (popup?.closed) {
              clearInterval(poll);
              window.removeEventListener('message', handleMessage);
              onDone();
            }
          }, 500);
          return;
        }

        await redirectToCheckout(sessionId);
      } catch (error: any) {
        console.error('Failed to create add funds session:', error);
        const msg = error?.message || 'Could not start checkout. Check your connection and try again.';
        alert(msg);
      } finally {
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
