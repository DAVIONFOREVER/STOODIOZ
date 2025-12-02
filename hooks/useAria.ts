
import { useCallback } from 'react';
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
    confirmBooking: (request: any) => void; // Using any for brevity, strictly it's BookingRequest
    updateProfile: (updates: any) => void;
    selectRoleToSetup: (role: UserRole) => void;
}

export const useAria = (deps: AriaHookDependencies) => {
    const dispatch = useAppDispatch();
    const { artists, engineers, producers, stoodioz } = useAppState();

    const executeCommand = useCallback(async (command: AriaActionResponse, onClose: () => void) => {
        console.log("Aria Executing Command:", command);

        switch (command.type) {
            case 'navigate':
                if (command.target && command.target in AppView) {
                    deps.navigate(command.target as AppView);
                    
                    if (command.value && typeof command.value === 'object' && command.value.tab) {
                        // Handle dashboard tab navigation
                        dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: command.value.tab } });
                    }
                    
                    onClose();
                } else if (command.target === 'ARTIST_PROFILE' && command.value) {
                    const artist = artists.find(a => a.name.toLowerCase().includes(command.value.toLowerCase()));
                    if (artist) {
                        deps.viewArtistProfile(artist);
                        onClose();
                    }
                } else if (command.target === 'ENGINEER_PROFILE' && command.value) {
                    const engineer = engineers.find(e => e.name.toLowerCase().includes(command.value.toLowerCase()));
                    if (engineer) {
                        deps.viewEngineerProfile(engineer);
                        onClose();
                    }
                } else if (command.target === 'PRODUCER_PROFILE' && command.value) {
                    const producer = producers.find(p => p.name.toLowerCase().includes(command.value.toLowerCase()));
                    if (producer) {
                        deps.viewProducerProfile(producer);
                        onClose();
                    }
                } else if (command.target === 'STOODIO_DETAIL' && command.value) {
                    const stoodio = stoodioz.find(s => s.name.toLowerCase().includes(command.value.toLowerCase()));
                    if (stoodio) {
                        deps.viewStoodioDetails(stoodio);
                        onClose();
                    }
                }
                break;

            case 'openModal':
                if (command.target === 'VIBE_MATCHER') {
                    dispatch({ type: ActionTypes.SET_VIBE_MATCHER_OPEN, payload: { isOpen: true } });
                    onClose();
                } else if (command.target === 'ADD_FUNDS') {
                    dispatch({ type: ActionTypes.SET_ADD_FUNDS_MODAL_OPEN, payload: { isOpen: true } });
                    onClose();
                } else if (command.target === 'PAYOUT') {
                    dispatch({ type: ActionTypes.SET_PAYOUT_MODAL_OPEN, payload: { isOpen: true } });
                    onClose();
                }
                break;

            case 'showVibeMatchResults':
                if (command.value) {
                    dispatch({ type: ActionTypes.SET_VIBE_RESULTS, payload: { results: command.value } });
                    deps.navigate(AppView.VIBE_MATCHER_RESULTS);
                    // We don't close Aria here so user can ask follow up questions about results
                }
                break;
            
            case 'assistAccountSetup':
                if (command.target && command.target in UserRole) {
                    deps.selectRoleToSetup(command.target as UserRole);
                    onClose();
                }
                break;

            case 'sendMessage':
                if (command.target && command.value) {
                    const allUsers = [...artists, ...engineers, ...producers, ...stoodioz];
                    const recipient = allUsers.find(u => u.name.toLowerCase().includes(command.target!.toLowerCase()));
                    if (recipient) {
                        deps.startConversation(recipient);
                        // We might want to pre-fill the message or send it directly.
                        // For now, startConversation navigates to inbox.
                        onClose();
                    }
                }
                break;
            
            case 'sendDocumentMessage':
                // Handled in UI layer (AriaAssistant.tsx) primarily by adding to history
                // This hook just acknowledges it.
                break;

            case 'error':
                console.warn("Aria reported an error:", command.value);
                break;

            default:
                break;
        }
    }, [dispatch, deps, artists, engineers, producers, stoodioz]);

    const handleAriaNudgeClick = useCallback(() => {
        // Logic to handle when the user clicks on a nudge toast
        // This usually just opens Aria with context
        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
        dispatch({ type: ActionTypes.SET_IS_NUDGE_VISIBLE, payload: { isVisible: false } });
    }, [dispatch]);

    const handleDismissAriaNudge = useCallback(() => {
        dispatch({ type: ActionTypes.SET_IS_NUDGE_VISIBLE, payload: { isVisible: false } });
    }, [dispatch]);

    return { executeCommand, handleAriaNudgeClick, handleDismissAriaNudge };
};
