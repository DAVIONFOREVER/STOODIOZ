import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import type { Stoodio, Artist, Engineer, Producer, Location, Booking } from '../types';
import { AppView } from '../types';

export const useNavigation = () => {
    const dispatch = useAppDispatch();
    
    const navigate = useCallback((view: AppView) => {
        dispatch({ type: ActionTypes.NAVIGATE, payload: { view } });
        if ([AppView.STOODIO_LIST, AppView.ARTIST_LIST, AppView.ENGINEER_LIST, AppView.PRODUCER_LIST, AppView.MAP_VIEW].includes(view)) {
            dispatch({ type: ActionTypes.RESET_PROFILE_SELECTIONS });
        }
    }, [dispatch]);

    const goBack = useCallback(() => dispatch({ type: ActionTypes.GO_BACK }), [dispatch]);
    const goForward = useCallback(() => dispatch({ type: ActionTypes.GO_FORWARD }), [dispatch]);
    
    const viewStoodioDetails = useCallback((stoodio: Stoodio) => {
        dispatch({ type: ActionTypes.VIEW_STOODIO_DETAILS, payload: { stoodio } });
        navigate(AppView.STOODIO_DETAIL);
    }, [dispatch, navigate]);

    const viewArtistProfile = useCallback((artist: Artist) => {
        dispatch({ type: ActionTypes.VIEW_ARTIST_PROFILE, payload: { artist } });
        navigate(AppView.ARTIST_PROFILE);
    }, [dispatch, navigate]);

    const viewEngineerProfile = useCallback((engineer: Engineer) => {
        dispatch({ type: ActionTypes.VIEW_ENGINEER_PROFILE, payload: { engineer } });
        navigate(AppView.ENGINEER_PROFILE);
    }, [dispatch, navigate]);

    const viewProducerProfile = useCallback((producer: Producer) => {
        dispatch({ type: ActionTypes.VIEW_PRODUCER_PROFILE, payload: { producer } });
        navigate(AppView.PRODUCER_PROFILE);
    }, [dispatch, navigate]);
    
    const navigateToStudio = useCallback((location: Location) => {
        // FIX: Changed property `lon` to `lng` to match the `Location` type definition.
        const { lat, lng } = location;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }, []);

    const startNavigationForBooking = useCallback((booking: Booking) => {
        dispatch({ type: ActionTypes.SET_DIRECTIONS_INTENT, payload: { bookingId: booking.id } });
        navigate(AppView.MAP_VIEW);
    }, [dispatch, navigate]);

    const viewBooking = (bookingId: string) => navigate(AppView.MY_BOOKINGS);
    
    return { 
        navigate, 
        goBack, 
        goForward, 
        viewStoodioDetails, 
        viewArtistProfile, 
        viewEngineerProfile, 
        viewProducerProfile, 
        navigateToStudio,
        startNavigationForBooking,
        viewBooking
    };
};