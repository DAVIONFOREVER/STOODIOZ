

import { useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { AppView, UserRole } from '../types';
import type { Artist, Engineer, Stoodio, Producer, Booking, VibeMatchResult, Message, AriaActionResponse, AriaCantataMessage, Location, FileAttachment } from '../types';

interface AriaHookDependencies {
    startConversation: (participant: Artist | Engineer | Stoodio | Producer) => void;
    navigate: (view: AppView) => void;
    viewStoodioDetails: (stoodio: Stoodio) => void;
    viewEngineerProfile: (engineer: Engineer) => void;
    viewProducerProfile: (producer: Producer) => void;
    viewArtistProfile: (artist: Artist) => void;
    navigateToStudio: (location: Location) => void;
    confirmBooking: (bookingRequest: any) => Promise<void>;
    updateProfile: (updates: Partial<Artist | Engineer | Stoodio | Producer>) => void;
    selectRoleToSetup: (role: UserRole) => void;
}

export const useAria = (dependencies: AriaHookDependencies) => {
    const dispatch = useAppDispatch();
    const { artists, engineers, producers, stoodioz, conversations, ariaNudge, currentUser, userRole } = useAppState();
    const allUsers = useMemo(() => [...artists, ...engineers, ...producers, ...stoodioz], [artists, engineers, producers, stoodioz]);

    const executeCommand = useCallback((command: AriaActionResponse, onClose: () => void) => {
        switch (command.type) {
            case 'navigate': {
                onClose(); // Close modal before navigating to prevent race conditions.
                const targetView = command.target as AppView;
                const entityName = typeof command.value === 'string' ? command.value : null;
                const tab = typeof command.value === 'object' && command.value !== null ? command.value.tab : null;

                if (tab) {
                    dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab } });
                }

                if (entityName) {
                    const targetUser = allUsers.find(u => u.name.toLowerCase().includes(entityName.toLowerCase()));
                    if (targetUser) {
                        if ('amenities' in targetUser) dependencies.viewStoodioDetails(targetUser);
                        else if ('specialties' in targetUser) dependencies.viewEngineerProfile(targetUser);
                        else if ('instrumentals' in targetUser) dependencies.viewProducerProfile(targetUser);
                        else dependencies.viewArtistProfile(targetUser as Artist);
                    } else {
                         dependencies.navigate(targetView);
                    }
                } else {
                    dependencies.navigate(targetView);
                }
                break;
            }
            case 'assistAccountSetup': {
                onClose(); // Close modal before navigating.
                const role = command.target as UserRole;
                dependencies.selectRoleToSetup(role);
                break;
            }
            case 'sendMessage': {
                if (!currentUser || !command.target || !command.value) break;
                
                onClose(); // Close modal before navigating to inbox.
                
                const recipient = allUsers.find(u => u.name.toLowerCase() === command.target!.toLowerCase());
                if (!recipient) break;

                dependencies.startConversation(recipient);
                setTimeout(() => {
                    const newMessage: Message = { type: 'text', text: command.value, id: `msg-${Date.now()}`, senderId: currentUser.id, timestamp: new Date().toISOString() };
                    const existingConvo = conversations.find(c => c.participants.length === 2 && c.participants.every(p => [currentUser.id, recipient.id].includes(p.id)));
                    const conversationId = existingConvo ? existingConvo.id : `convo-${currentUser.id}-${recipient.id}`;
                    const updatedConversations = conversations.map(convo => 
                        convo.id === conversationId ? { ...convo, messages: [...convo.messages, newMessage] } : convo
                    );
                    dispatch({ type: ActionTypes.SET_CONVERSATIONS, payload: { conversations: updatedConversations } });
                }, 100);
                break;
            }
             case 'sendDocumentMessage': {
                if (!command.value || !command.value.documentContent || !command.value.fileName || !currentUser) break;
        
                const { documentContent, fileName } = command.value;
                const ariaProfile = artists.find(a => a.id === 'artist-aria-cantata');
                if (!ariaProfile) break;
                
                const fileSize = new Blob([documentContent]).size;
                const fileAttachment: FileAttachment = { 
                    name: fileName, 
                    url: '#', // Placeholder URL, download will be handled by onClick
                    size: `${(fileSize / 1024).toFixed(1)} KB`,
                    rawContent: documentContent,
                };

                // 1. Add message to Aria's visual chat history
                const ariaMessage: AriaCantataMessage = {
                    role: 'model',
                    parts: [{ text: command.text || `As requested, I've prepared this document for you: ${fileName}` }],
                    files: [fileAttachment]
                };
                dispatch({ type: ActionTypes.ADD_ARIA_MESSAGE, payload: { message: ariaMessage } });

                // 2. Add message to the main conversations state for the Documents tab
                const regularMessage: Message = {
                    id: `msg-doc-${Date.now()}`,
                    senderId: ariaProfile.id,
                    timestamp: new Date().toISOString(),
                    type: 'files',
                    text: command.text || `As requested, I've prepared this document for you: ${fileName}`,
                    files: [fileAttachment],
                };

                let convo = conversations.find(c => c.participants.length === 2 && c.participants.every(p => [currentUser.id, ariaProfile.id].includes(p.id)));
                let updatedConversations;

                if (convo) {
                    updatedConversations = conversations.map(c => c.id === convo!.id ? { ...c, messages: [...c.messages, regularMessage] } : c);
                } else {
                    convo = { id: `convo-${currentUser.id}-${ariaProfile.id}`, participants: [currentUser, ariaProfile], messages: [regularMessage], unreadCount: 0, title: 'Aria Cantata', imageUrl: ariaProfile.imageUrl };
                    updatedConversations = [convo, ...conversations];
                }
                dispatch({ type: ActionTypes.SET_CONVERSATIONS, payload: { conversations: updatedConversations } });

                break;
            }
            case 'speak':
            case 'error':
                // Do nothing, the text is already displayed in the chat.
                break;
            default:
                console.warn("Unknown Aria command received:", command.type);
        }
    }, [dispatch, allUsers, conversations, currentUser, userRole, dependencies]);

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
        executeCommand,
        handleAriaNudgeClick,
        handleDismissAriaNudge,
    };
};
