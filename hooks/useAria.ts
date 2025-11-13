



import { useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { AppView, UserRole } from '../types';
import type { Artist, Engineer, Stoodio, Producer, Booking, VibeMatchResult, Message, AriaActionResponse, AriaCantataMessage, Location } from '../types';

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
                onClose();
                break;
            }
            case 'assistAccountSetup': {
                const role = command.target as UserRole;
                dependencies.selectRoleToSetup(role);
                onClose();
                break;
            }
            case 'sendMessage': {
                if (!currentUser || !command.target || !command.value) break;
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
                onClose();
                break;
            }
             case 'sendDocumentMessage': {
                if (!command.value || !command.value.recipient || !command.value.documentContent || !command.value.fileName || !currentUser || !userRole) break;
                const { recipient, documentContent, fileName } = command.value;
                
                if(recipient.id !== currentUser.id) break;

                const ariaProfile = artists.find(a => a.id === 'artist-aria-cantata');
                if (!ariaProfile) break;

                const fileUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(documentContent);
                const fileSize = new Blob([documentContent]).size;

                const newMessage: Message = {
                    id: `msg-doc-${Date.now()}`,
                    senderId: ariaProfile.id,
                    timestamp: new Date().toISOString(),
                    type: 'files',
                    text: command.text || `As requested, I've prepared this document for you: ${fileName}`,
                    files: [{ name: fileName, url: fileUri, size: `${(fileSize / 1024).toFixed(1)} KB` }],
                };
                
                let convo = conversations.find(c => c.participants.length === 2 && c.participants.every(p => [currentUser.id, ariaProfile.id].includes(p.id)));
                let updatedConversations;

                if (convo) {
                    updatedConversations = conversations.map(c => c.id === convo!.id ? { ...c, messages: [...c.messages, newMessage] } : c);
                } else {
                    convo = { id: `convo-${currentUser.id}-${ariaProfile.id}`, participants: [currentUser, ariaProfile], messages: [newMessage], unreadCount: 0 };
                    updatedConversations = [convo, ...conversations];
                }

                dispatch({ type: ActionTypes.SET_CONVERSATIONS, payload: { conversations: updatedConversations } });
                
                let dashboardView: AppView;
                switch(userRole){
                    case UserRole.ARTIST: dashboardView = AppView.ARTIST_DASHBOARD; break;
                    case UserRole.ENGINEER: dashboardView = AppView.ENGINEER_DASHBOARD; break;
                    case UserRole.PRODUCER: dashboardView = AppView.PRODUCER_DASHBOARD; break;
                    case UserRole.STOODIO: dashboardView = AppView.STOODIO_DASHBOARD; break;
                    default: dashboardView = AppView.THE_STAGE;
                }

                dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: 'documents' } });
                dependencies.navigate(dashboardView);

                onClose();
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