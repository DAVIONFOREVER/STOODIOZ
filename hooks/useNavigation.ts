import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';
import type { Stoodio, Artist, Engineer, Producer, Location, AppView } from '../types';

export const useNavigation = () => {
    const dispatch = useAppDispatch();
    
    const navigate = useCallback((view: AppView) => {
        dispatch({ type: ActionTypes.NAVIGATE, payload: { view } });
        if (['STOODIO_LIST', 'ARTIST_LIST', 'ENGINEER_LIST', 'PRODUCER_LIST', 'MAP_VIEW'].includes(view)) {
            dispatch({ type: ActionTypes.RESET_PROFILE_SELECTIONS });
        }
    }, [dispatch]);

    const goBack = useCallback(() => dispatch({ type: ActionTypes.GO_BACK }), [dispatch]);
    const goForward = useCallback(() => dispatch({ type: ActionTypes.GO_FORWARD }), [dispatch]);
    
    const viewStoodioDetails = useCallback((stoodio: Stoodio) => {
        dispatch({ type: ActionTypes.VIEW_STOODIO_DETAILS, payload: { stoodio } });
        navigate('STOODIO_DETAIL');
    }, [dispatch, navigate]);

    const viewArtistProfile = useCallback((artist: Artist) => {
        dispatch({ type: ActionTypes.VIEW_ARTIST_PROFILE, payload: { artist } });
        navigate('ARTIST_PROFILE');
    }, [dispatch, navigate]);

    const viewEngineerProfile = useCallback((engineer: Engineer) => {
        dispatch({ type: ActionTypes.VIEW_ENGINEER_PROFILE, payload: { engineer } });
        navigate('ENGINEER_PROFILE');
    }, [dispatch, navigate]);

    const viewProducerProfile = useCallback((producer: Producer) => {
        dispatch({ type: ActionTypes.VIEW_PRODUCER_PROFILE, payload: { producer } });
        navigate('PRODUCER_PROFILE');
    }, [dispatch, navigate]);
    
    const navigateToStudio = useCallback((location: Location) => {
        const { lat, lon } = location;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }, []);

    const viewBooking = (bookingId: string) => navigate('MY_BOOKINGS');
    
    return { 
        navigate, 
        goBack, 
        goForward, 
        viewStoodioDetails, 
        viewArtistProfile, 
        viewEngineerProfile, 
        viewProducerProfile, 
        navigateToStudio,
        viewBooking
    };
};
