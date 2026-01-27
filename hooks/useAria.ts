
import { useCallback } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import { AppView, UserRole } from '../types';
import type { Artist, Engineer, Stoodio, Producer, Booking, AriaActionResponse, AriaCantataMessage, Location, FileAttachment, Label, BookingRequest, Project, ProjectTask } from '../types';
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
    logout: () => void;
}

export const useAria = (deps: AriaHookDependencies) => {
    const dispatch = useAppDispatch();
    const { artists, engineers, producers, stoodioz, currentUser, userRole, bookings } = useAppState();

    const executeCommand = useCallback(async (command: AriaActionResponse, onClose: () => void) => {
        console.log("Aria Executing Command:", command);

        switch (command.type) {
            case 'logout':
                deps.logout();
                onClose();
                break;

            case 'generateReport':
                if (currentUser) {
                    const reportTitle = command.target || "Performance Report";
                    const reportContent = command.value || "This report summarizes recent activity.";
                    try {
                        const pdfBytes = await createPdfBytes(reportContent);
                        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                        const file = new File([blob], `${reportTitle}.pdf`, { type: 'application/pdf' });
                        await apiService.uploadDocument(currentUser.id, file, { name: reportTitle, type: 'REPORT', category: 'REPORT' });
                        alert("I've generated your report and saved it to your Documents vault.");
                        deps.navigate(userRole === 'LABEL' ? AppView.LABEL_DASHBOARD : AppView.ARTIST_DASHBOARD);
                        dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: 'documents' } });
                    } catch (e) { alert("Report generation failed."); }
                }
                onClose();
                break;

            case 'scoutMarket':
                if (command.target) {
                    const insights = await apiService.scoutMarketInsights(command.target);
                    alert(`A&R Intelligence Report (${command.target}): ${insights[0].description}`);
                } else {
                    deps.navigate(AppView.LABEL_SCOUTING);
                }
                onClose();
                break;

            case 'manageProject':
                if (command.value && currentUser) {
                    const { action, projectId, taskTitle, priority } = command.value;
                    if (action === 'CREATE_TASK') {
                        await apiService.createProjectTask(projectId, { 
                            title: taskTitle, 
                            priority: priority || 'NORMAL',
                            status: 'TODO'
                        });
                        alert(`Aria: Project updated. Task "${taskTitle}" assigned.`);
                    }
                    onClose();
                }
                break;

            case 'generateDocument':
                if (command.value && currentUser) {
                    const { title, content } = command.value;
                    try {
                        const pdfBytes = await createPdfBytes(content);
                        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                        const file = new File([blob], `${title}.pdf`, { type: 'application/pdf' });
                        await apiService.uploadDocument(currentUser.id, file, { name: title, type: 'OFFICIAL', category: 'DOCUMENT' });
                        
                        let dashboardView = AppView.ARTIST_DASHBOARD;
                        if (userRole === 'LABEL') dashboardView = AppView.LABEL_DASHBOARD;
                        
                        deps.navigate(dashboardView);
                        dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: 'documents' } });
                        onClose();
                    } catch (e) { console.error("Aria Doc Gen Error:", e); }
                }
                break;

            case 'navigate':
                if (command.target && command.target in AppView) {
                    deps.navigate(command.target as AppView);
                    if (command.value?.tab) {
                        dispatch({ type: ActionTypes.SET_DASHBOARD_TAB, payload: { tab: command.value.tab } });
                    }
                    onClose();
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

            case 'updateProfile':
                if (command.value && currentUser) {
                    try {
                        await deps.updateProfile(command.value);
                        onClose();
                    } catch (e) {
                        console.error('Aria updateProfile:', e);
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
                            start_time: time || '12:00', duration: 2, total_cost: 0, engineer_pay_rate: 0,
                            request_type: 'FIND_AVAILABLE' as any,
                            ...( 'specialties' in target ? { requested_engineer_id: target.id } : {} ),
                            ...( 'amenities' in target ? { room: (target as any).rooms?.[0] } : {} )
                        };
                        try {
                           const newBooking = await apiService.createBooking(request, target as any, currentUser, userRole!);
                           dispatch({ type: ActionTypes.ADD_BOOKING, payload: { booking: newBooking } });
                           alert(`Aria: Session booked at ${target.name}. Check your schedule.`);
                           onClose();
                        } catch (e) { alert("Execution failed."); }
                    }
                }
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
