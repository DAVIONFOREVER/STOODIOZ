import React, { createContext, useReducer, useContext, type Dispatch, type ReactNode } from 'react';
// FIX: Add Review to import
import type { Stoodio, Booking, Engineer, Artist, AppNotification, Conversation, Producer, AriaCantataMessage, VibeMatchResult, Room, Following, Review } from '../types';
import { AppView, UserRole } from '../types';

// --- STATE AND ACTION TYPES ---

export interface AppState {
    history: AppView[];
    historyIndex: number;
    stoodioz: Stoodio[];
    engineers: Engineer[];
    artists: Artist[];
    producers: Producer[];
    // FIX: Add reviews to state
    reviews: Review[];
    bookings: Booking[];
    conversations: Conversation[];
    notifications: AppNotification[];
    currentUser: Artist | Engineer | Stoodio | Producer | null;
    userRole: UserRole | null;
    loginError: string | null;
    selectedStoodio: Stoodio | null;
    selectedArtist: Artist | null;
    selectedEngineer: Engineer | null;
    selectedProducer: Producer | null;
    latestBooking: Booking | null;
    isLoading: boolean;
    bookingTime: { date: string; time: string; room: Room } | null;
    activeSession: Booking | null;
    tipModalBooking: Booking | null;
    bookingToCancel: Booking | null;
    selectedConversationId: string | null;
    isVibeMatcherOpen: boolean;
    vibeMatchResults: VibeMatchResult | null;
    isVibeMatcherLoading: boolean;
    bookingIntent: { engineer?: Engineer; producer?: Producer; date?: string; time?: string; mixingDetails?: any; pullUpFee?: number; } | null;
    smartReplies: string[];
    isSmartRepliesLoading: boolean;
    isAddFundsOpen: boolean;
    isPayoutOpen: boolean;
    isMixingModalOpen: boolean;
    isAriaCantataOpen: boolean;
    ariaHistory: AriaCantataMessage[];
    initialAriaCantataPrompt: string | null;
    ariaNudge: string | null;
    isNudgeVisible: boolean;
    dashboardInitialTab: string | null;
}

type ActionMap<M extends { [index: string]: any }> = {
  [Key in keyof M]: M[Key] extends undefined
    ? {
        type: Key;
      }
    : {
        type: Key;
        payload: M[Key];
      }
};

export enum ActionTypes {
    NAVIGATE = 'NAVIGATE',
    GO_BACK = 'GO_BACK',
    GO_FORWARD = 'GO_FORWARD',
    SET_INITIAL_DATA = 'SET_INITIAL_DATA',
    SET_LOADING = 'SET_LOADING',
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    LOGIN_FAILURE = 'LOGIN_FAILURE',
    LOGOUT = 'LOGOUT',
    COMPLETE_SETUP = 'COMPLETE_SETUP',
    VIEW_STOODIO_DETAILS = 'VIEW_STOODIO_DETAILS',
    VIEW_ARTIST_PROFILE = 'VIEW_ARTIST_PROFILE',
    VIEW_ENGINEER_PROFILE = 'VIEW_ENGINEER_PROFILE',
    VIEW_PRODUCER_PROFILE = 'VIEW_PRODUCER_PROFILE',
    OPEN_BOOKING_MODAL = 'OPEN_BOOKING_MODAL',
    CLOSE_BOOKING_MODAL = 'CLOSE_BOOKING_MODAL',
    CONFIRM_BOOKING_SUCCESS = 'CONFIRM_BOOKING_SUCCESS',
    SET_LATEST_BOOKING = 'SET_LATEST_BOOKING',
    SET_BOOKINGS = 'SET_BOOKINGS',
    ADD_BOOKING = 'ADD_BOOKING',
    UPDATE_USERS = 'UPDATE_USERS',
    SET_CURRENT_USER = 'SET_CURRENT_USER',
    UPDATE_FOLLOWING = 'UPDATE_FOLLOWING',
    START_SESSION = 'START_SESSION',
    END_SESSION = 'END_SESSION',
    OPEN_TIP_MODAL = 'OPEN_TIP_MODAL',
    CLOSE_TIP_MODAL = 'CLOSE_TIP_MODAL',
    OPEN_CANCEL_MODAL = 'OPEN_CANCEL_MODAL',
    CLOSE_CANCEL_MODAL = 'CLOSE_CANCEL_MODAL',
    SET_NOTIFICATIONS = 'SET_NOTIFICATIONS',
    SET_CONVERSATIONS = 'SET_CONVERSATIONS',
    SET_SELECTED_CONVERSATION = 'SET_SELECTED_CONVERSATION',
    SET_SMART_REPLIES = 'SET_SMART_REPLIES',
    SET_IS_SMART_REPLIES_LOADING = 'SET_IS_SMART_REPLIES_LOADING',
    SET_VIBE_MATCHER_OPEN = 'SET_VIBE_MATCHER_OPEN',
    SET_VIBE_MATCHER_LOADING = 'SET_VIBE_MATCHER_LOADING',
    SET_VIBE_RESULTS = 'SET_VIBE_RESULTS',
    SET_BOOKING_INTENT = 'SET_BOOKING_INTENT',
    SET_ADD_FUNDS_MODAL_OPEN = 'SET_ADD_FUNDS_MODAL_OPEN',
    SET_PAYOUT_MODAL_OPEN = 'SET_PAYOUT_MODAL_OPEN',
    SET_MIXING_MODAL_OPEN = 'SET_MIXING_MODAL_OPEN',
    SET_ARIA_CANTATA_OPEN = 'SET_ARIA_CANTATA_OPEN',
    SET_ARIA_HISTORY = 'SET_ARIA_HISTORY',
    SET_INITIAL_ARIA_PROMPT = 'SET_INITIAL_ARIA_PROMPT',
    SET_ARIA_NUDGE = 'SET_ARIA_NUDGE',
    SET_IS_NUDGE_VISIBLE = 'SET_IS_NUDGE_VISIBLE',
    RESET_PROFILE_SELECTIONS = 'RESET_PROFILE_SELECTIONS',
    SET_DASHBOARD_TAB = 'SET_DASHBOARD_TAB',
}

type Payload = {
    [ActionTypes.NAVIGATE]: { view: AppView };
    [ActionTypes.GO_BACK]: undefined;
    [ActionTypes.GO_FORWARD]: undefined;
    // FIX: Add reviews to SET_INITIAL_DATA payload
    [ActionTypes.SET_INITIAL_DATA]: { artists: Artist[]; engineers: Engineer[]; producers: Producer[]; stoodioz: Stoodio[]; reviews: Review[] };
    [ActionTypes.SET_LOADING]: { isLoading: boolean };
    [ActionTypes.LOGIN_SUCCESS]: { user: Artist | Engineer | Stoodio | Producer };
    [ActionTypes.LOGIN_FAILURE]: { error: string };
    [ActionTypes.LOGOUT]: undefined;
    [ActionTypes.COMPLETE_SETUP]: { newUser: Artist | Engineer | Stoodio | Producer, role: UserRole };
    [ActionTypes.VIEW_STOODIO_DETAILS]: { stoodio: Stoodio };
    [ActionTypes.VIEW_ARTIST_PROFILE]: { artist: Artist };
    [ActionTypes.VIEW_ENGINEER_PROFILE]: { engineer: Engineer };
    [ActionTypes.VIEW_PRODUCER_PROFILE]: { producer: Producer };
    [ActionTypes.OPEN_BOOKING_MODAL]: { date: string; time: string; room: Room };
    [ActionTypes.CLOSE_BOOKING_MODAL]: undefined;
    [ActionTypes.CONFIRM_BOOKING_SUCCESS]: { booking: Booking };
    [ActionTypes.SET_LATEST_BOOKING]: { booking: Booking | null };
    [ActionTypes.SET_BOOKINGS]: { bookings: Booking[] };
    [ActionTypes.ADD_BOOKING]: { booking: Booking };
    [ActionTypes.UPDATE_USERS]: { users: (Artist | Engineer | Stoodio | Producer)[] };
    [ActionTypes.SET_CURRENT_USER]: { user: Artist | Engineer | Stoodio | Producer | null };
    [ActionTypes.UPDATE_FOLLOWING]: { userId: string; newFollowing: Following };
    [ActionTypes.START_SESSION]: { booking: Booking };
    [ActionTypes.END_SESSION]: undefined;
    [ActionTypes.OPEN_TIP_MODAL]: { booking: Booking };
    [ActionTypes.CLOSE_TIP_MODAL]: undefined;
    [ActionTypes.OPEN_CANCEL_MODAL]: { booking: Booking };
    [ActionTypes.CLOSE_CANCEL_MODAL]: undefined;
    [ActionTypes.SET_NOTIFICATIONS]: { notifications: AppNotification[] };
    [ActionTypes.SET_CONVERSATIONS]: { conversations: Conversation[] };
    [ActionTypes.SET_SELECTED_CONVERSATION]: { conversationId: string | null };
    [ActionTypes.SET_SMART_REPLIES]: { replies: string[] };
    [ActionTypes.SET_IS_SMART_REPLIES_LOADING]: { isLoading: boolean };
    [ActionTypes.SET_VIBE_MATCHER_OPEN]: { isOpen: boolean };
    [ActionTypes.SET_VIBE_MATCHER_LOADING]: { isLoading: boolean };
    [ActionTypes.SET_VIBE_RESULTS]: { results: VibeMatchResult | null };
    [ActionTypes.SET_BOOKING_INTENT]: { intent: AppState['bookingIntent'] };
    [ActionTypes.SET_ADD_FUNDS_MODAL_OPEN]: { isOpen: boolean };
    [ActionTypes.SET_PAYOUT_MODAL_OPEN]: { isOpen: boolean };
    [ActionTypes.SET_MIXING_MODAL_OPEN]: { isOpen: boolean };
    [ActionTypes.SET_ARIA_CANTATA_OPEN]: { isOpen: boolean };
    [ActionTypes.SET_ARIA_HISTORY]: { history: AriaCantataMessage[] };
    [ActionTypes.SET_INITIAL_ARIA_PROMPT]: { prompt: string | null };
    [ActionTypes.SET_ARIA_NUDGE]: { nudge: string | null };
    [ActionTypes.SET_IS_NUDGE_VISIBLE]: { isVisible: boolean };
    [ActionTypes.RESET_PROFILE_SELECTIONS]: undefined;
    [ActionTypes.SET_DASHBOARD_TAB]: { tab: string | null };
};

export type AppAction = ActionMap<Payload>[keyof ActionMap<Payload>];


// --- INITIAL STATE ---
const initialState: AppState = {
    history: [AppView.LANDING_PAGE],
    historyIndex: 0,
    stoodioz: [],
    engineers: [],
    artists: [],
    producers: [],
    // FIX: Add reviews to initial state
    reviews: [],
    bookings: [],
    conversations: [],
    notifications: [],
    currentUser: null,
    userRole: null,
    loginError: null,
    selectedStoodio: null,
    selectedArtist: null,
    selectedEngineer: null,
    selectedProducer: null,
    latestBooking: null,
    isLoading: true,
    bookingTime: null,
    activeSession: null,
    tipModalBooking: null,
    bookingToCancel: null,
    selectedConversationId: null,
    isVibeMatcherOpen: false,
    vibeMatchResults: null,
    isVibeMatcherLoading: false,
    bookingIntent: null,
    smartReplies: [],
    isSmartRepliesLoading: false,
    isAddFundsOpen: false,
    isPayoutOpen: false,
    isMixingModalOpen: false,
    isAriaCantataOpen: false,
    ariaHistory: [],
    initialAriaCantataPrompt: null,
    ariaNudge: null,
    isNudgeVisible: false,
    dashboardInitialTab: null,
};

// --- REDUCER ---
const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case ActionTypes.NAVIGATE: {
            const { view } = action.payload;
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(view);
            return {
                ...state,
                loginError: null,
                history: newHistory,
                historyIndex: newHistory.length - 1,
            };
        }
        case ActionTypes.GO_BACK:
            return { ...state, historyIndex: Math.max(0, state.historyIndex - 1) };
        case ActionTypes.GO_FORWARD:
            return { ...state, historyIndex: Math.min(state.history.length - 1, state.historyIndex + 1) };
        
        case ActionTypes.RESET_PROFILE_SELECTIONS:
             return {
                ...state,
                selectedStoodio: null,
                selectedArtist: null,
                selectedEngineer: null,
                selectedProducer: null,
            };

        case ActionTypes.SET_INITIAL_DATA:
            return {
                ...state,
                ...action.payload,
                isLoading: false,
            };
        case ActionTypes.SET_LOADING:
            return { ...state, isLoading: action.payload.isLoading };

        case ActionTypes.LOGIN_SUCCESS: {
            const user = action.payload.user;
            let role: UserRole | null = null;
            if ('amenities' in user) role = UserRole.STOODIO;
            else if ('specialties' in user) role = UserRole.ENGINEER;
            else if ('instrumentals' in user) role = UserRole.PRODUCER;
            else role = UserRole.ARTIST;
            
            return {
                ...state,
                currentUser: user,
                userRole: role,
                loginError: null,
                history: [AppView.THE_STAGE],
                historyIndex: 0,
                ariaHistory: [],
            };
        }
        case ActionTypes.LOGIN_FAILURE:
            return { ...state, loginError: action.payload.error };
        case ActionTypes.LOGOUT:
            return {
                ...state,
                currentUser: null,
                userRole: null,
                history: [AppView.LANDING_PAGE],
                historyIndex: 0,
                ariaHistory: [],
            };
        
        case ActionTypes.COMPLETE_SETUP: {
            const { newUser, role } = action.payload;
            let updatedState = { ...state };
            if (role === UserRole.ARTIST) updatedState.artists = [...state.artists, newUser as Artist];
            else if (role === UserRole.ENGINEER) updatedState.engineers = [...state.engineers, newUser as Engineer];
            else if (role === UserRole.PRODUCER) updatedState.producers = [...state.producers, newUser as Producer];
            else if (role === UserRole.STOODIO) updatedState.stoodioz = [...state.stoodioz, newUser as Stoodio];

            return {
                ...updatedState,
                currentUser: newUser,
                userRole: role,
                history: [AppView.THE_STAGE],
                historyIndex: 0,
                ariaHistory: [],
            };
        }
        
        case ActionTypes.VIEW_STOODIO_DETAILS:
            return { ...state, selectedStoodio: action.payload.stoodio };
        case ActionTypes.VIEW_ARTIST_PROFILE:
            return { ...state, selectedArtist: action.payload.artist };
        case ActionTypes.VIEW_ENGINEER_PROFILE:
            return { ...state, selectedEngineer: action.payload.engineer };
        case ActionTypes.VIEW_PRODUCER_PROFILE:
            return { ...state, selectedProducer: action.payload.producer };
        
        case ActionTypes.OPEN_BOOKING_MODAL:
            return { ...state, bookingTime: action.payload };
        
        case ActionTypes.CONFIRM_BOOKING_SUCCESS:
            return {
                ...state,
                bookings: [...state.bookings, action.payload.booking],
                latestBooking: action.payload.booking,
                selectedStoodio: null,
                bookingTime: null,
                bookingIntent: null,
            };

        case ActionTypes.SET_LATEST_BOOKING:
            return { ...state, latestBooking: action.payload.booking };
        
        case ActionTypes.SET_BOOKINGS:
            return { ...state, bookings: action.payload.bookings };
        case ActionTypes.ADD_BOOKING:
            return { ...state, bookings: [...state.bookings, action.payload.booking] };

        case ActionTypes.UPDATE_USERS: {
            const users = action.payload.users;
            const currentUser = state.currentUser ? users.find(u => u.id === state.currentUser!.id) || state.currentUser : null;
            return {
                ...state,
                artists: users.filter(u => 'bio' in u && !('specialties' in u) && !('instrumentals' in u)) as Artist[],
                engineers: users.filter(u => 'specialties' in u) as Engineer[],
                producers: users.filter(u => 'instrumentals' in u) as Producer[],
                stoodioz: users.filter(u => 'amenities' in u) as Stoodio[],
                currentUser,
            };
        }
        
        case ActionTypes.SET_CURRENT_USER:
            return { ...state, currentUser: action.payload.user };

        case ActionTypes.START_SESSION:
            return { ...state, activeSession: action.payload.booking };
        case ActionTypes.END_SESSION:
            return { ...state, activeSession: null };

        case ActionTypes.OPEN_TIP_MODAL:
            return { ...state, tipModalBooking: action.payload.booking };
        case ActionTypes.CLOSE_TIP_MODAL:
            return { ...state, tipModalBooking: null };
        
        case ActionTypes.OPEN_CANCEL_MODAL:
            return { ...state, bookingToCancel: action.payload.booking };
        case ActionTypes.CLOSE_CANCEL_MODAL:
            return { ...state, bookingToCancel: null };

        case ActionTypes.SET_NOTIFICATIONS:
            return { ...state, notifications: action.payload.notifications };
        case ActionTypes.SET_CONVERSATIONS:
            return { ...state, conversations: action.payload.conversations };
        case ActionTypes.SET_SELECTED_CONVERSATION:
            return { ...state, selectedConversationId: action.payload.conversationId };

        case ActionTypes.SET_VIBE_MATCHER_OPEN:
            return { ...state, isVibeMatcherOpen: action.payload.isOpen };
        case ActionTypes.SET_VIBE_MATCHER_LOADING:
            return { ...state, isVibeMatcherLoading: action.payload.isLoading };
        case ActionTypes.SET_VIBE_RESULTS:
            return { ...state, vibeMatchResults: action.payload.results };

        case ActionTypes.SET_BOOKING_INTENT:
            return { ...state, bookingIntent: action.payload.intent };
        
        case ActionTypes.SET_SMART_REPLIES:
            return { ...state, smartReplies: action.payload.replies };
        case ActionTypes.SET_IS_SMART_REPLIES_LOADING:
            return { ...state, isSmartRepliesLoading: action.payload.isLoading };
            
        case ActionTypes.SET_ADD_FUNDS_MODAL_OPEN:
            return { ...state, isAddFundsOpen: action.payload.isOpen };
        case ActionTypes.SET_PAYOUT_MODAL_OPEN:
            return { ...state, isPayoutOpen: action.payload.isOpen };
        case ActionTypes.SET_MIXING_MODAL_OPEN:
            return { ...state, isMixingModalOpen: action.payload.isOpen };

        case ActionTypes.SET_ARIA_CANTATA_OPEN:
            return { ...state, isAriaCantataOpen: action.payload.isOpen };
        case ActionTypes.SET_ARIA_HISTORY:
            return { ...state, ariaHistory: action.payload.history };
        case ActionTypes.SET_INITIAL_ARIA_PROMPT:
            return { ...state, initialAriaCantataPrompt: action.payload.prompt };
        case ActionTypes.SET_ARIA_NUDGE:
            return { ...state, ariaNudge: action.payload.nudge };
        case ActionTypes.SET_IS_NUDGE_VISIBLE:
            return { ...state, isNudgeVisible: action.payload.isVisible };
        
        case ActionTypes.SET_DASHBOARD_TAB:
            return { ...state, dashboardInitialTab: action.payload.tab };

        default:
            return state;
    }
};

// --- CONTEXT & PROVIDER ---
const StateContext = createContext<AppState | undefined>(undefined);
const DispatchContext = createContext<Dispatch<AppAction> | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>
                {children}
            </DispatchContext.Provider>
        </StateContext.Provider>
    );
};

// --- HOOKS ---
export const useAppState = (): AppState => {
    const context = useContext(StateContext);
    if (!context) {
        throw new Error('useAppState must be used within an AppProvider');
    }
    return context;
};

export const useAppDispatch = (): Dispatch<AppAction> => {
    const context = useContext(DispatchContext);
    if (!context) {
        throw new Error('useAppDispatch must be used within an AppProvider');
    }
    return context;
};