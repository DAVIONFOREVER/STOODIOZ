import { useCallback } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { UserRole, SubscriptionPlan, AppView } from '../types';
import { redirectToCheckout } from '../lib/stripe';
import type { Subscription } from '../types';

export const useSubscription = (navigate: (view: AppView) => void) => {
    const dispatch = useAppDispatch();
    const { currentUser, userRole } = useAppState();

    const handleSubscribe = useCallback(async () => {
        if (!currentUser || !userRole) {
            navigate(AppView.LOGIN);
            return;
        }

        let planId: SubscriptionPlan;
        switch(userRole) {
            case UserRole.ENGINEER: planId = SubscriptionPlan.ENGINEER_PLUS; break;
            case UserRole.PRODUCER: planId = SubscriptionPlan.PRODUCER_PRO; break;
            case UserRole.STOODIO: planId = SubscriptionPlan.STOODIO_PRO; break;
            default: return; // No subscription for Artist
        }

        // --- MOCK FOR TESTING ---
        // In a live app, this block would be replaced with the Stripe logic below.
        // For testing, we'll just update the user's state to have an active subscription.
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true } });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newSubscription: Subscription = {
            plan: planId,
            status: 'active' as const,
            startDate: new Date().toISOString(),
            endDate: null,
        };

        const updatedUser = { ...currentUser, subscription: newSubscription };
        
        dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: { user: updatedUser } });
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false } });

        // Navigate to the user's dashboard to see the new features.
        switch(userRole) {
            case UserRole.ENGINEER: navigate(AppView.ENGINEER_DASHBOARD); break;
            case UserRole.PRODUCER: navigate(AppView.PRODUCER_DASHBOARD); break;
            case UserRole.STOODIO: navigate(AppView.STOODIO_DASHBOARD); break;
            default: navigate(AppView.THE_STAGE); break;
        }

        /* --- LIVE PRODUCTION LOGIC ---
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
        */

    }, [currentUser, userRole, dispatch, navigate]);
    
    return { handleSubscribe };
};