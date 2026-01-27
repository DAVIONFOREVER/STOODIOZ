import { useCallback } from 'react';
import { useAppDispatch, ActionTypes } from '../contexts/AppContext';

export const useVibeMatcher = () => {
    const dispatch = useAppDispatch();
    
    const vibeMatch = useCallback(async (vibeDescription: string) => {
        dispatch({ type: ActionTypes.SET_VIBE_MATCHER_LOADING, payload: { isLoading: true } });
        dispatch({ type: ActionTypes.SET_VIBE_MATCHER_OPEN, payload: { isOpen: false } });
        dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: `Find me a vibe match for: ${vibeDescription}` } });
        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
        dispatch({ type: ActionTypes.SET_VIBE_MATCHER_LOADING, payload: { isLoading: false } });
    }, [dispatch]);
    
    return { vibeMatch };
};