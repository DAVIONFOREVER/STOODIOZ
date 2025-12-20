import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import type { Stoodio, Artist, Engineer, Producer, Location, Booking, Label } from '../types';
import { AppView } from '../types';

export const useNavigation = () => {
    const dispatch = useAppDispatch();
    
    const navigate = useCallback((view: AppView) => {
        // Disabled view persistence to prevent auto-redirection loops on load
        // localStorage.setItem('last_view', view);
        
        dispatch({ type: ActionTypes.NAVIGATE, payload: { view } });
        if ([AppView.STOODIO_LIST, AppView.ARTIST_LIST, AppView.ENGINEER_LIST, AppView.PRODUCER_LIST, AppView.MAP_VIEW, AppView.LABEL_IMPORT].includes(view)) {
            dispatch({ type: ActionTypes.RESET_PROFILE_SELECTIONS });
            localStorage.removeItem('selected_entity_id');
        }
    }, [dispatch]);

    const goBack = useCallback(() => dispatch({ type: ActionTypes.GO_BACK }), [dispatch]);
    const goForward = useCallback(() => dispatch({ type: ActionTypes.GO_FORWARD }), [dispatch]);
    
    const viewStoodioDetails = useCallback((stoodio: Stoodio) => {
        localStorage.setItem('selected_entity_id', stoodio.id);
        dispatch({ type: ActionTypes.VIEW_STOODIO_DETAILS, payload: { stoodio } });
        navigate(AppView.STOODIO_DETAIL);
    }, [dispatch, navigate]);

    const viewArtistProfile = useCallback((artist: Artist) => {
        localStorage.setItem('selected_entity_id', artist.id);
        dispatch({ type: ActionTypes.VIEW_ARTIST_PROFILE, payload: { artist } });
        navigate(AppView.ARTIST_PROFILE);
    }, [dispatch, navigate]);

    const viewEngineerProfile = useCallback((engineer: Engineer) => {
        localStorage.setItem('selected_entity_id', engineer.id);
        dispatch({ type: ActionTypes.VIEW_ENGINEER_PROFILE, payload: { engineer } });
        navigate(AppView.ENGINEER_PROFILE);
    }, [dispatch, navigate]);

    const viewProducerProfile = useCallback((producer: Producer) => {
        localStorage.setItem('selected_entity_id', producer.id);
        dispatch({ type: ActionTypes.VIEW_PRODUCER_PROFILE, payload: { producer } });
        navigate(AppView.PRODUCER_PROFILE);
    }, [dispatch, navigate]);
    
    const viewLabelProfile = useCallback((label: Label) => {
        localStorage.setItem('selected_entity_id', label.id);
        dispatch({ type: ActionTypes.VIEW_LABEL_PROFILE, payload: { label } });
        navigate(AppView.LABEL_PROFILE);
    }, [dispatch, navigate]);
    
    const navigateToStudio = useCallback((location: Location) => {
        const { lat, lon } = location;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }, []);

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