import { useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
// FIX: Import AppView and UserRole as values, not just types.
import { AppView, UserRole, type Artist, type Engineer, type Stoodio, type Producer, type Booking, type VibeMatchResult, type Message } from '../types';

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
    const { artists, engineers, producers, stoodioz, conversations, ariaNudge, ariaHistory, initialAriaCantataPrompt, bookings } = useAppState();
    
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
    
    const handleAriaSendDocument = useCallback((recipient: Artist | Engineer | Stoodio | Producer, documentContent: string, fileName: string) => {
        const ariaProfile = artists.find(a => a.id === 'artist-aria-cantata');
        if (!ariaProfile) return;

        const fileUri = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(documentContent);
        const fileSize = new Blob([documentContent]).size;

        const newMessage: Message = {
            id: `msg-doc-${Date.now()}`,
            senderId: ariaProfile.id,
            timestamp: new Date().toISOString(),
            type: 'files',
            text: `Here is the document we discussed: ${fileName}`,
            files: [{ name: fileName, url: fileUri, size: `${(fileSize / 1024).toFixed(1)} KB` }],
        };
        
        let convo = conversations.find(c => c.participants.length === 2 && c.participants.every(p => [recipient.id, ariaProfile.id].includes(p.id)));
        let updatedConversations = [...conversations];

        if (convo) {
            updatedConversations = updatedConversations.map(c => c.id === convo!.id ? { ...c, messages: [...c.messages, newMessage] } : c);
        } else {
            convo = { id: `convo-${recipient.id}-${ariaProfile.id}`, participants: [recipient, ariaProfile], messages: [newMessage], unreadCount: 1 };
            updatedConversations = [convo, ...updatedConversations];
        }

        dispatch({ type: ActionTypes.SET_CONVERSATIONS, payload: { conversations: updatedConversations } });
        dispatch({ type: ActionTypes.SET_SELECTED_CONVERSATION, payload: { conversationId: convo.id } });
        handleNavigate(AppView.INBOX);
        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: false } });

    }, [artists, conversations, dispatch, handleNavigate]);

    const handleAriaNavigation = useCallback((view: AppView, entityName?: string, tab?: string) => {
        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: false } });

        if (tab) {
            dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab } });
        }
        
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
        handleAriaSendDocument,
        handleAriaNavigation,
        handleAriaGetDirections,
        handleAriaNudgeClick,
        handleDismissAriaNudge,
        ariaHistory,
        initialAriaCantataPrompt
    };
};