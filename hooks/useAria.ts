
import { useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { AppView, UserRole } from '../types';
import type { Artist, Engineer, Stoodio, Producer, Booking, VibeMatchResult, Message, AriaActionResponse, AriaCantataMessage, Location, FileAttachment, Label } from '../types';

interface AriaHookDependencies {
    startConversation: (participant: Artist | Engineer | Stoodio | Producer | Label) => void;
    navigate: (view: AppView) => void;
    viewStoodioDetails: (stoodio: Stoodio) => void;
    viewEngineerProfile: (engineer: Engineer) => void;
    viewProducerProfile: (producer: Producer) => void;
    viewArtistProfile: (artist: Artist) => void;
    navigateToStudio: (location: Location) => void;
    confirmBooking: (bookingRequest: any) => Promise<void>;
    updateProfile: (updates: Partial<Artist | Engineer | Stoodio | Producer | Label>) => void;
    selectRoleToSetup: (role: UserRole) => void;
}

export const useAria = (dependencies: AriaHookDependencies) => {
    const dispatch = useAppDispatch();
    const { artists, engineers, producers, stoodioz, labels, conversations, ariaNudge, currentUser, userRole } = useAppState();
    const allUsers = useMemo(() => [...artists, ...engineers, ...producers, ...stoodioz, ...labels], [artists, engineers, producers, stoodioz, labels]);

    const executeCommand = useCallback(async (command: AriaActionResponse, onClose: () => void) => {
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
                        else if ('bio' in targetUser && !('is_seeking_session' in targetUser)) {
                            // Basic heuristic for Label, might need proper routing
                            // For now navigate to their dashboard if it's the current user, or maybe list view
                            // Or default to artist view as a fallback
                            dependencies.navigate(AppView.LABEL_DASHBOARD); 
                        }
                        else dependencies.viewArtistProfile(targetUser as Artist);
                    } else {
                         dependencies.navigate(targetView);
                    }
                } else {
                    dependencies.navigate(targetView);
                }
                break;
            }
            case 'openModal': {
                onClose();
                const modalTarget = command.target;
                switch (modalTarget) {
                    case 'VIBE_MATCHER':
                        dispatch({ type: ActionTypes.SET_VIBE_MATCHER_OPEN, payload: { isOpen: true } });
                        break;
                    case 'ADD_FUNDS':
                        dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: true } });
                        break;
                    case 'PAYOUT':
                        if (currentUser && userRole !== UserRole.ARTIST) {
                            dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: true } });
                        }
                        break;
                }
                break;
            }
            case 'showVibeMatchResults': {
                onClose();
                const resultData = command.value;
                if (!resultData || !resultData.recommendations) break;

                const fullRecommendations = resultData.recommendations.map((rec: { type: 'stoodio' | 'engineer' | 'producer'; name: string; reason: string }) => {
                    const entity = allUsers.find(u => u.name.toLowerCase() === rec.name.toLowerCase());
                    if (!entity) return null;
                    return {
                        type: rec.type,
                        entity: entity,
                        reason: rec.reason
                    };
                }).filter((r): r is NonNullable<typeof r> => r !== null);

                const vibeMatchResult: VibeMatchResult = {
                    vibeDescription: resultData.vibeDescription,
                    tags: resultData.tags,
                    recommendations: fullRecommendations,
                };

                dispatch({ type: ActionTypes.SET_VIBE_RESULTS, payload: { results: vibeMatchResult } });
                dependencies.navigate(AppView.VIBE_MATCHER_RESULTS);
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
                    const newMessage: Message = { type: 'text', text: command.value, id: `msg-${Date.now()}`, sender_id: currentUser.id, timestamp: new Date().toISOString() };
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
                if (!command.value?.fileName || !command.value?.pdfBytes || !currentUser) break;
        
                const { fileName, pdfBytes } = command.value;
                const ariaProfile = artists.find(a => a.id === 'artist-aria-cantata');
                if (!ariaProfile) break;
                
                const fileAttachment: FileAttachment = { 
                    name: fileName, 
                    url: '#',
                    size: `${(pdfBytes.length / 1024).toFixed(1)} KB`,
                    rawContent: pdfBytes,
                };

                const regularMessage: Message = {
                    id: `msg-doc-${Date.now()}`,
                    sender_id: ariaProfile.id,
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
                    convo = { id: `convo-${currentUser.id}-${ariaProfile.id}`, participants: [currentUser, ariaProfile], messages: [regularMessage], unread_count: 0, title: 'Aria Cantata', image_url: ariaProfile.image_url };
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
        if (!ariaNudge) return;

        dispatch({ type: ActionTypes.SET_IS_NUDGE_VISIBLE, payload: { isVisible: false } });

        const { action } = ariaNudge;
        switch (action.type) {
            case 'OPEN_MODAL':
                if (action.payload === 'VIBE_MATCHER') {
                    dispatch({ type: ActionTypes.SET_VIBE_MATCHER_OPEN, payload: { isOpen: true } });
                }
                break;
            case 'NAVIGATE_DASHBOARD_TAB':
                dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: action.payload } });
                if (userRole === UserRole.ENGINEER) dependencies.navigate(AppView.ENGINEER_DASHBOARD);
                else if (userRole === UserRole.PRODUCER) dependencies.navigate(AppView.PRODUCER_DASHBOARD);
                else if (userRole === UserRole.STOODIO) dependencies.navigate(AppView.STOODIO_DASHBOARD);
                else if (userRole === UserRole.ARTIST) dependencies.navigate(AppView.ARTIST_DASHBOARD);
                else if (userRole === UserRole.LABEL) dependencies.navigate(AppView.LABEL_DASHBOARD);
                break;
        }

        // Clear the nudge from state after handling it
        setTimeout(() => dispatch({ type: ActionTypes.SET_ARIA_NUDGE, payload: { nudge: null } }), 300);

    }, [ariaNudge, dispatch, userRole, dependencies.navigate]);

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
