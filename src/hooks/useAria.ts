
import { useCallback } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { AppView, UserRole } from '../types';
import type { Artist, Engineer, Stoodio, Producer, Booking, VibeMatchResult, Message, AriaActionResponse, AriaCantataMessage, Location, FileAttachment, Label, BookingRequest } from '../types';
import * as apiService from '../services/apiService';
import { createPdfBytes } from '../lib/pdf';

interface AriaHookDependencies {
    startConversation: (participant: Artist | Engineer | Stoodio | Producer | Label) => void;
    navigate: (view: AppView) => void;
    viewStoodioDetails: (stoodio: Stoodio) => void;
    viewEngineerProfile: (engineer: Engineer) => void;
    viewProducerProfile: (producer: Producer) => void;
    viewArtistProfile: (artist: Artist) => void;
    navigateToStudio: (location: Location) => void;
    confirmBooking: (request: BookingRequest) => void; 
    updateProfile: (updates: any) => void;
    selectRoleToSetup: (role: UserRole) => void;
}

export const useAria = (deps: AriaHookDependencies) => {
    const dispatch = useAppDispatch();
    const { artists, engineers, producers, stoodioz, currentUser, userRole, bookings } = useAppState();

    const executeCommand = useCallback(async (command: AriaActionResponse, onClose: () => void) => {
        console.log("Aria Executing Command:", command);

        switch (command.type) {
            case 'navigate':
                if (command.target && command.target in AppView) {
                    deps.navigate(command.target as AppView);
                    
                    if (command.value && typeof command.value === 'object' && command.value.tab) {
                        dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: command.value.tab } });
                    }
                    onClose();
                } else if (command.target === 'ARTIST_PROFILE' && command.value) {
                    const artist = artists.find(a => a.name.toLowerCase().includes(command.value.toLowerCase()));
                    if (artist) { deps.viewArtistProfile(artist); onClose(); }
                } else if (command.target === 'ENGINEER_PROFILE' && command.value) {
                    const engineer = engineers.find(e => e.name.toLowerCase().includes(command.value.toLowerCase()));
                    if (engineer) { deps.viewEngineerProfile(engineer); onClose(); }
                } else if (command.target === 'PRODUCER_PROFILE' && command.value) {
                    const producer = producers.find(p => p.name.toLowerCase().includes(command.value.toLowerCase()));
                    if (producer) { deps.viewProducerProfile(producer); onClose(); }
                } else if (command.target === 'STOODIO_DETAIL' && command.value) {
                    const stoodio = stoodioz.find(s => s.name.toLowerCase().includes(command.value.toLowerCase()));
                    if (stoodio) { deps.viewStoodioDetails(stoodio); onClose(); }
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

            case 'generateDocument':
                if (command.value && currentUser) {
                    const { title, content } = command.value;
                    try {
                        const pdfBytes = await createPdfBytes(content);
                        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                        // Category: OFFICIAL
                        await apiService.uploadDocument(blob, `${title}.pdf`, currentUser.id, 'OFFICIAL');
                        
                        // Navigate to dashboard and show the docs tab
                        let dashboardView = AppView.ARTIST_DASHBOARD;
                        if (userRole === 'LABEL') dashboardView = AppView.LABEL_DASHBOARD;
                        else if (userRole === 'ENGINEER') dashboardView = AppView.ENGINEER_DASHBOARD;
                        else if (userRole === 'PRODUCER') dashboardView = AppView.PRODUCER_DASHBOARD;
                        else if (userRole === 'STOODIO') dashboardView = AppView.STOODIO_DASHBOARD;

                        deps.navigate(dashboardView);
                        dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: 'documents' } });
                        onClose();
                    } catch (e) {
                        console.error("Doc Gen Error", e);
                    }
                }
                break;

            case 'generateReport':
                if (command.value && currentUser) {
                    const { artistId, type } = command.value;
                    const artist = artists.find(a => a.id === artistId);
                    const reportTitle = `${artist?.name || 'Artist'} - ${type} Performance Report`;
                    const reportContent = `Sony Music - Executive A&R Summary\nArtist: ${artist?.name}\nReport Type: ${type}\nGenerated: ${new Date().toLocaleDateString()}\n\nEngagement is up 12% over the last 30 days.\nRecommended Action: Increase marketing spend in London market.`;
                    
                    try {
                        const pdfBytes = await createPdfBytes(reportContent);
                        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                        // Category: REPORT
                        await apiService.uploadDocument(blob, `${reportTitle}.pdf`, currentUser.id, 'REPORT');
                        
                        let dashboardView = userRole === 'LABEL' ? AppView.LABEL_DASHBOARD : AppView.ARTIST_DASHBOARD;
                        deps.navigate(dashboardView);
                        dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: 'documents' } });
                        onClose();
                    } catch (e) {
                        console.error("Report Gen Error", e);
                    }
                }
                break;

            case 'createBooking': 
                if (command.value && currentUser) {
                    const { targetId, date, time } = command.value;
                    const allTargets = [...engineers, ...producers, ...stoodioz];
                    const target = allTargets.find(t => t.id === targetId || t.name.toLowerCase() === targetId.toLowerCase());
                    
                    if (target) {
                        const request: BookingRequest = {
                            date: date || new Date().toISOString().split('T')[0],
                            start_time: time || '12:00',
                            duration: 2,
                            total_cost: 0, 
                            engineer_pay_rate: 0,
                            request_type: 'FIND_AVAILABLE' as any,
                            ...( 'specialties' in target ? { requested_engineer_id: target.id } : {} ),
                            ...( 'amenities' in target ? { room: (target as any).rooms?.[0] } : {} )
                        };
                        
                        try {
                           const newBooking = await apiService.createBooking(request, target as any, currentUser, userRole!);
                           dispatch({ type: ActionTypes.ADD_BOOKING, payload: { booking: newBooking } });
                           alert(`Booking request sent to ${target.name}!`);
                           onClose();
                        } catch (e) {
                           alert("Failed to create booking automatically.");
                        }
                    } else {
                        alert("Could not find that artist/studio.");
                    }
                }
                break;

            case 'socialAction':
                if (command.target === 'post' && command.value && currentUser) {
                     await apiService.createPost({ text: command.value }, currentUser, userRole!);
                     onClose();
                } else if (command.target === 'follow' && command.value) {
                     const target = [...artists, ...engineers, ...stoodioz].find(u => u.id === command.value);
                     if (target && currentUser) {
                         await apiService.toggleFollow(currentUser, target, 'artist', false); 
                     }
                }
                break;

            case 'updateProfile':
                if (command.value && currentUser) {
                    deps.updateProfile(command.value);
                    alert("Profile updated via Aria.");
                }
                break;

            case 'search':
                if (command.value) {
                    const { role, city } = command.value;
                    let results: any[] = [];
                    if (role === 'STOODIO') results = stoodioz;
                    else if (role === 'ENGINEER') results = engineers;
                    
                    if (city) results = results.filter(r => r.location.toLowerCase().includes(city.toLowerCase()));
                    if (results.length > 0) {
                        if (role === 'STOODIO') deps.viewStoodioDetails(results[0]);
                        else if (role === 'ENGINEER') deps.viewEngineerProfile(results[0]);
                        onClose();
                    } else {
                        alert("No matches found.");
                    }
                }
                break;

            case 'labelControl':
                if (command.target && command.value !== undefined && currentUser && userRole === 'LABEL') {
                     const keys = command.target.split('.');
                     let update = {};
                     if (keys.length === 2 && keys[0] === 'opportunities') {
                         update = { opportunities: { ...((currentUser as any).opportunities), [keys[1]]: command.value } };
                     } else {
                         update = { [command.target]: command.value };
                     }
                     deps.updateProfile(update);
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
                        onClose();
                    }
                }
                break;

            case 'error':
                console.warn("Aria reported an error:", command.value);
                break;

            default:
                break;
        }
    }, [dispatch, deps, artists, engineers, producers, stoodioz, currentUser, userRole, bookings]);

    const handleAriaNudgeClick = useCallback(() => {
        dispatch({ type: ActionTypes.SET_ARIA_CANTATA_OPEN, payload: { isOpen: true } });
        dispatch({ type: ActionTypes.SET_IS_NUDGE_VISIBLE, payload: { isVisible: false } });
    }, [dispatch]);

    const handleDismissAriaNudge = useCallback(() => {
        dispatch({ type: ActionTypes.SET_IS_NUDGE_VISIBLE, payload: { isVisible: false } });
    }, [dispatch]);

    return { executeCommand, handleAriaNudgeClick, handleDismissAriaNudge };
};
