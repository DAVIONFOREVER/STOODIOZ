
import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import type { Stoodio, Artist, Engineer, Producer, Location, Booking, Label } from '../types';
import { AppView } from '../types';

export const useNavigation = () => {
    const dispatch = useAppDispatch();
    
    const navigate = useCallback((view: AppView) => {
        // FIX: Persist the view to localStorage so it survives page refreshes
        localStorage.setItem('last_view', view);
        
        dispatch({ type: ActionTypes.NAVIGATE, payload: { view } });
        if ([AppView.STOODIO_LIST, AppView.ARTIST_LIST, AppView.ENGINEER_LIST, AppView.PRODUCER_LIST, AppView.MAP_VIEW, AppView.LABEL_IMPORT].includes(view)) {
            dispatch({ type: ActionTypes.RESET_PROFILE_SELECTIONS });
        }
    }, [dispatch]);

    const goBack = useCallback(() => dispatch({ type: ActionTypes.GO_BACK }), [dispatch]);
    const goForward = useCallback(() => dispatch({ type: ActionTypes.GO_FORWARD }), [dispatch]);
    
    const viewStoodioDetails = useCallback((stoodio: Stoodio) => {
        const id = stoodio?.id || (stoodio as any)?.profile_id;
        if (id) {
            localStorage.setItem('selected_entity_id', String(id));
            localStorage.setItem('selected_entity_type', 'stoodio');
        }
        dispatch({ type: ActionTypes.VIEW_STOODIO_DETAILS, payload: { stoodio } });
        navigate(AppView.STOODIO_DETAIL);
    }, [dispatch, navigate]);

    const viewArtistProfile = useCallback((artist: Artist) => {
        const id = artist?.id || (artist as any)?.profile_id;
        if (id) {
            localStorage.setItem('selected_entity_id', String(id));
            localStorage.setItem('selected_entity_type', 'artist');
        }
        dispatch({ type: ActionTypes.VIEW_ARTIST_PROFILE, payload: { artist } });
        navigate(AppView.ARTIST_PROFILE);
    }, [dispatch, navigate]);

    const viewEngineerProfile = useCallback((engineer: Engineer) => {
        const id = engineer?.id || (engineer as any)?.profile_id;
        if (id) {
            localStorage.setItem('selected_entity_id', String(id));
            localStorage.setItem('selected_entity_type', 'engineer');
        }
        dispatch({ type: ActionTypes.VIEW_ENGINEER_PROFILE, payload: { engineer } });
        navigate(AppView.ENGINEER_PROFILE);
    }, [dispatch, navigate]);

    const viewProducerProfile = useCallback((producer: Producer) => {
        const id = producer?.id || (producer as any)?.profile_id;
        if (id) {
            localStorage.setItem('selected_entity_id', String(id));
            localStorage.setItem('selected_entity_type', 'producer');
        }
        dispatch({ type: ActionTypes.VIEW_PRODUCER_PROFILE, payload: { producer } });
        navigate(AppView.PRODUCER_PROFILE);
    }, [dispatch, navigate]);
    
    const viewLabelProfile = useCallback((label: Label) => {
        const id = label?.id || (label as any)?.profile_id;
        if (id) {
            localStorage.setItem('selected_entity_id', String(id));
            localStorage.setItem('selected_entity_type', 'label');
        }
        dispatch({ type: ActionTypes.VIEW_LABEL_PROFILE, payload: { label } });
        navigate(AppView.LABEL_PROFILE);
    }, [dispatch, navigate]);
    
    const navigateToStudio = useCallback((location: Location) => {
        // Stay in-app: navigate to map view with directions intent
        // Create a temporary booking-like object to trigger directions
        const tempBookingId = `directions-${Date.now()}`;
        dispatch({ 
            type: ActionTypes.SET_DIRECTIONS_INTENT, 
            payload: { 
                bookingId: tempBookingId,
                destination: location // Store destination for directions
            } 
        });
        navigate(AppView.MAP_VIEW);
    }, [dispatch, navigate]);

    const startNavigationForBooking = useCallback((booking: Booking) => {
        dispatch({ type: ActionTypes.SET_DIRECTIONS_INTENT, payload: { bookingId: booking.id } });
        navigate(AppView.MAP_VIEW);
    }, [dispatch, navigate]);

    const viewBooking = (bookingId: string) => navigate(AppView.MY_BOOKINGS);
    
    const goToLabelImport = useCallback(() => navigate(AppView.LABEL_IMPORT), [navigate]);

    return { 
        navigate, 
        goBack, 
        goForward, 
        viewStoodioDetails, 
        viewArtistProfile, 
        viewEngineerProfile, 
        viewProducerProfile, 
        viewLabelProfile,
        navigateToStudio,
        startNavigationForBooking,
        viewBooking,
        goToLabelImport
    };
};
