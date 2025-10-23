import { useCallback } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { UserRole, SubscriptionPlan, AppView } from '../types';
import { redirectToCheckout } from '../lib/stripe';

export const useSubscription = (navigate: (view: AppView) => void) => {
    const dispatch = useAppDispatch();
    const { currentUser } = useAppState();

    const handleSubscribe = useCallback(async (role: UserRole) => {
        if (!currentUser) {
            navigate(AppView.LOGIN);
            return;
        }

        let planId: SubscriptionPlan;
        switch(role) {
            case UserRole.ENGINEER: planId = SubscriptionPlan.ENGINEER_PLUS; break;
            case UserRole.PRODUCER: planId = SubscriptionPlan.PRODUCER_PRO; break;
            case UserRole.STOODIO: planId = SubscriptionPlan.STOODIO_PRO; break;
            default: return; // No subscription for Artist
        }

        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        try {
            const { sessionId } = await apiService.createCheckoutSessionForSubscription(planId, currentUser.id);
            await redirectToCheckout(sessionId);
            // On successful redirect, Stripe takes over. 
            // The user will be sent back to a success URL handled by the app.
        } catch (error) {
            console.error("Failed to create subscription checkout session:", error);
            // If the redirect fails for any reason, stop the loading indicator.
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });
        }

    }, [currentUser, dispatch, navigate]);
    
    return { handleSubscribe };
};
