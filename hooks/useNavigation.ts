
import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import type { Stoodio, Artist, Engineer, Producer, Location, Booking, Label, ReviewTarget } from '../types';
import { AppView } from '../types';

export const useNavigation = () => {
    const dispatch = useAppDispatch();
    const isUuid = (value: any) =>
        typeof value === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    
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
        const profileId = (stoodio as any)?.profile_id;
        const id = stoodio?.id;
        if (isUuid(profileId)) {
            localStorage.setItem('selected_entity_id', String(profileId));
            localStorage.setItem('selected_entity_type', 'stoodio');
        } else if (isUuid(id)) {
            localStorage.setItem('selected_entity_id', String(id));
            localStorage.setItem('selected_entity_type', 'stoodio');
        }
        dispatch({ type: ActionTypes.VIEW_STOODIO_DETAILS, payload: { stoodio } });
        navigate(AppView.STOODIO_DETAIL);
    }, [dispatch, navigate]);

    const viewArtistProfile = useCallback((artist: Artist) => {
        const profileId = (artist as any)?.profile_id;
        const id = artist?.id;
        if (isUuid(profileId)) {
            localStorage.setItem('selected_entity_id', String(profileId));
            localStorage.setItem('selected_entity_type', 'artist');
        } else if ((artist as any)?.display_name) {
            localStorage.setItem('selected_entity_id', String((artist as any).display_name));
            localStorage.setItem('selected_entity_type', 'artist_handle');
        } else if ((artist as any)?.username) {
            localStorage.setItem('selected_entity_id', String((artist as any).username));
            localStorage.setItem('selected_entity_type', 'artist_handle');
        } else if (isUuid(id)) {
            localStorage.setItem('selected_entity_id', String(id));
            localStorage.setItem('selected_entity_type', 'artist');
        }
        dispatch({ type: ActionTypes.VIEW_ARTIST_PROFILE, payload: { artist } });
        navigate(AppView.ARTIST_PROFILE);
    }, [dispatch, navigate]);

    const viewEngineerProfile = useCallback((engineer: Engineer) => {
        const profileId = (engineer as any)?.profile_id;
        const id = engineer?.id;
        if (isUuid(profileId)) {
            localStorage.setItem('selected_entity_id', String(profileId));
            localStorage.setItem('selected_entity_type', 'engineer');
        } else if (isUuid(id)) {
            localStorage.setItem('selected_entity_id', String(id));
            localStorage.setItem('selected_entity_type', 'engineer');
        }
        dispatch({ type: ActionTypes.VIEW_ENGINEER_PROFILE, payload: { engineer } });
        navigate(AppView.ENGINEER_PROFILE);
    }, [dispatch, navigate]);

    const viewProducerProfile = useCallback((producer: Producer) => {
        const profileId = (producer as any)?.profile_id;
        const id = producer?.id;
        if (isUuid(profileId)) {
            localStorage.setItem('selected_entity_id', String(profileId));
            localStorage.setItem('selected_entity_type', 'producer');
        } else if (isUuid(id)) {
            localStorage.setItem('selected_entity_id', String(id));
            localStorage.setItem('selected_entity_type', 'producer');
        }
        dispatch({ type: ActionTypes.VIEW_PRODUCER_PROFILE, payload: { producer } });
        navigate(AppView.PRODUCER_PROFILE);
    }, [dispatch, navigate]);
    
    const viewLabelProfile = useCallback((label: Label) => {
        const profileId = (label as any)?.profile_id;
        const id = label?.id;
        if (isUuid(profileId)) {
            localStorage.setItem('selected_entity_id', String(profileId));
            localStorage.setItem('selected_entity_type', 'label');
        } else if (isUuid(id)) {
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

    const openReviewPage = useCallback((target: ReviewTarget) => {
        if (target) {
            try {
                localStorage.setItem('review_target', JSON.stringify(target));
            } catch {
                // ignore storage failures
            }
            dispatch({ type: ActionTypes.SET_REVIEW_TARGET, payload: { target } });
        }
        navigate(AppView.REVIEW_PAGE);
    }, [dispatch, navigate]);

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
        goToLabelImport,
        openReviewPage
    };
};
