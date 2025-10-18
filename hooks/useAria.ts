

import { useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
// FIX: Import AppView and UserRole as values, not just types.
import { AppView, UserRole, type Artist, type Engineer, type Stoodio, type Producer, type Booking, type VibeMatchResult } from '../types';

export const useAria = (
    handleStartConversation: (participant: Artist | Engineer | Stoodio | Producer) => void,
    handleNavigate: (view: AppView) => void,
    handleViewStoodioDetails: (stoodio: Stoodio) => void,
    handleViewEngineerProfile: (engineer: Engineer) => void,
    handleViewProducerProfile: (producer: Producer) => void,
    handleViewArtistProfile: (artist: Artist) => void,
    handleNavigateToStudio: (location: any) => void,
    handleConfirmBooking: (bookingRequest: any) => Promise<void>
) => {
    const dispatch = useAppDispatch();
    // FIX: Destructure individual user arrays instead of non-existent `allUsers`. Also get `conversations`.
    const { artists, engineers, producers, stoodioz, conversations, ariaNudge, ariaHistory, initialAriaCantataPrompt } = useAppState();
    
    // FIX: Construct `allUsers` from individual arrays.
    const allUsers = useMemo(() => [...artists, ...engineers, ...producers, ...stoodioz], [artists, engineers, producers, stoodioz]);

    const handleAriaCantataBooking = useCallback(async (bookingDetails: Omit<Booking, 'id' | 'status'>) => {
        const bookingRequest = { ...bookingDetails, requestType: bookingDetails.requestType, totalCost: bookingDetails.totalCost, engineerPayRate: bookingDetails.engineerPayRate };
        await handleConfirmBooking(bookingRequest);
        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: false } });
    }, [handleConfirmBooking, dispatch]);

    const handleShowVibeResults = useCallback(async (results: VibeMatchResult) => {
        dispatch({ type: ActionTypes.SET_VIBE_RESULTS, payload: { results } });
        // FIX: Use AppView enum instead of string.
        handleNavigate(AppView.VIBE_MATCHER_RESULTS);
    }, [dispatch, handleNavigate]);
    
    const handleAriaGroupConversation = useCallback((participants: (Artist | Engineer | Stoodio | Producer)[], title: string) => {
        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: false } });
        const newConversation = { id: `convo-group-${Date.now()}`, participants, messages: [], unreadCount: 0, title, imageUrl: '' };
        // FIX: `state` is not defined, use `conversations` from `useAppState`.
        dispatch({ type: ActionTypes.SET_CONVERSATIONS, payload: { conversations: [newConversation, ...conversations] } });
        dispatch({ type: ActionTypes.SET_SELECTED_CONVERSATION, payload: { conversationId: newConversation.id } });
        // FIX: Use AppView enum instead of string.
        handleNavigate(AppView.INBOX);
    }, [dispatch, handleNavigate, conversations]);

    const handleAriaSendMessage = useCallback((recipientName: string, messageText: string, currentUser: any) => {
        if (!currentUser) return;
        const recipient = allUsers.find(u => u.name.toLowerCase() === recipientName.toLowerCase());
        if (!recipient) return;
        handleStartConversation(recipient);
        setTimeout(() => {
            const newMessage = { type: 'text', text: messageText };
            const conversationId = `convo-${currentUser.id}-${recipient.id}`; // Reconstruct convo ID to send message
            // @ts-ignore - This is a mock implementation detail
            dispatch({ type: 'SEND_MESSAGE', payload: { conversationId, messageContent: newMessage } });
        }, 100);
        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: false } });
    }, [allUsers, handleStartConversation, dispatch]);

    const handleAriaNavigation = useCallback((view: AppView, entityName?: string) => {
        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: false } });
        if (!entityName) {
            handleNavigate(view);
            return;
        }
        const target = allUsers.find(u => u.name.toLowerCase() === entityName.toLowerCase());
        if (target) {
            if ('amenities' in target) handleViewStoodioDetails(target);
            else if ('specialties' in target) handleViewEngineerProfile(target);
            else if ('instrumentals' in target) handleViewProducerProfile(target);
            else handleViewArtistProfile(target as Artist);
        } else {
            handleNavigate(view);
        }
    }, [allUsers, handleNavigate, handleViewStoodioDetails, handleViewEngineerProfile, handleViewProducerProfile, handleViewArtistProfile, dispatch]);
    
    const handleAriaGetDirections = useCallback((entityName: string) => {
        const target = allUsers.find(e => e.name.toLowerCase() === entityName.toLowerCase());
        if (target?.coordinates) {
            handleNavigateToStudio(target.coordinates);
            dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: false } });
        }
    }, [allUsers, handleNavigateToStudio, dispatch]);

    const handleAriaNudgeClick = useCallback(() => {
        if (ariaNudge) {
            dispatch({ type: ActionTypes.SET_INITIAL_ARIA_PROMPT, payload: { prompt: ariaNudge } });
            dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
            dispatch({ type: ActionTypes.SET_ARIA_NUDGE, payload: { nudge: null } });
            dispatch({ type: ActionTypes.SET_IS_NUDGE_VISIBLE, payload: { isVisible: false } });
        }
    }, [ariaNudge, dispatch]);

    const handleDismissAriaNudge = useCallback(() => {
        dispatch({ type: ActionTypes.SET_IS_NUDGE_VISIBLE, payload: { isVisible: false } });
        setTimeout(() => dispatch({ type: ActionTypes.SET_ARIA_NUDGE, payload: { nudge: null } }), 300);
    }, [dispatch]);

    return {
        handleAriaCantataBooking,
        handleShowVibeResults,
        handleAriaGroupConversation,
        handleAriaSendMessage,
        handleAriaNavigation,
        handleAriaGetDirections,
        handleAriaNudgeClick,
        handleDismissAriaNudge,
        ariaHistory,
        initialAriaCantataPrompt
    };
};