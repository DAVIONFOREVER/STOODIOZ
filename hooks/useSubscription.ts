import { useCallback } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { UserRole, SubscriptionPlan, AppView } from '../types';
import { redirectToCheckout } from '../lib/stripe';

export const useSubscription = (navigate: (view: AppView) => void) => {
  const dispatch = useAppDispatch();
  const { currentUser, userRole } = useAppState();

  const resolvePlanForRole = (role: UserRole): SubscriptionPlan | null => {
    switch (role) {
      case UserRole.ENGINEER:
        return SubscriptionPlan.ENGINEER_PLUS;
      case UserRole.PRODUCER:
        return SubscriptionPlan.PRODUCER_PRO;
      case UserRole.STOODIO:
        return SubscriptionPlan.STOODIO_PRO;
      default:
        return null; // No subscription for Artist/Label in your current rules
    }
  };

  const navigateToRoleDashboard = (role: UserRole) => {
    switch (role) {
      case UserRole.ENGINEER:
        navigate(AppView.ENGINEER_DASHBOARD);
        break;
      case UserRole.PRODUCER:
        navigate(AppView.PRODUCER_DASHBOARD);
        break;
      case UserRole.STOODIO:
        navigate(AppView.STOODIO_DASHBOARD);
        break;
      case UserRole.LABEL:
        navigate(AppView.LABEL_DASHBOARD);
        break;
      case UserRole.ARTIST:
      default:
        navigate(AppView.THE_STAGE);
        break;
    }
  };

  const handleSubscribe = useCallback(async () => {
    if (!currentUser || !userRole) {
      navigate(AppView.LOGIN);
      return;
    }

    const planId = resolvePlanForRole(userRole);
    if (!planId) {
      // Nothing to subscribe to (by your rules). Just route somewhere sensible.
      navigateToRoleDashboard(userRole);
      return;
    }

    dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });

    try {
      const { sessionId } = await apiService.createCheckoutSessionForSubscription(planId, currentUser.id);
      await redirectToCheckout(sessionId);
      // Stripe redirect takes over the page. Webhook + return URL should hydrate subscription state.
    } catch (error) {
      console.error('Failed to start subscription flow:', error);
      alert('Could not start subscription checkout. Check Stripe price IDs and try again.');
    } finally {
      // ✅ Always release loading. Even if Stripe redirect fails or mock throws.
      dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
    }
  }, [currentUser, userRole, dispatch, navigate]);

  return { handleSubscribe };
};
