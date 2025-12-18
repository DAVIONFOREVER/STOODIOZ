import React, { createContext, useReducer, useContext, type Dispatch, type ReactNode } from 'react';
import type { Stoodio, Booking, Engineer, Artist, AppNotification, Conversation, Producer, AriaCantataMessage, VibeMatchResult, Room, Following, Review, FileAttachment, Masterclass, AriaNudgeData, Label } from '../types';
import { AppView, UserRole } from '../types';

export interface AppState {
    history: AppView[];
    historyIndex: number;
    stoodioz: Stoodio[];
    engineers: Engineer[];
    artists: Artist[];
    producers: Producer[];
    labels: Label[];
    reviews: Review[];
    bookings: Booking[];
    conversations: Conversation[];
    notifications: AppNotification[];
    currentUser: Artist | Engineer | Stoodio | Producer | Label | null;
    userRole: UserRole | null;
    loginError: string | null;
    selectedStoodio: Stoodio | null;
    selectedArtist: Artist | null;
    selectedEngineer: Engineer | null;
    selectedProducer: Producer | null;
    selectedLabel: Label | null;
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
    ariaNudge: AriaNudgeData | null;
    isNudgeVisible: boolean;
    dashboardInitialTab: string | null;
    isSaved: boolean;
    masterclassToPurchase: { masterclass: Masterclass, owner: Engineer | Producer } | null;
    masterclassToWatch: { masterclass: Masterclass, owner: Engineer | Producer } | null;
    masterclassToReview: { masterclass: Masterclass, owner: Engineer | Producer } | null;
    directionsIntent: { bookingId: string } | null;
}

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
    VIEW_LABEL_PROFILE = 'VIEW_LABEL_PROFILE',
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
    ADD_ARIA_MESSAGE = 'ADD_ARIA_MESSAGE',
    SET_INITIAL_ARIA_PROMPT = 'SET_INITIAL_ARIA_PROMPT',
    SET_ARIA_NUDGE = 'SET_ARIA_NUDGE',
    SET_IS_NUDGE_VISIBLE = 'SET_IS_NUDGE_VISIBLE',
    RESET_PROFILE_SELECTIONS = 'RESET_PROFILE_SELECTIONS',
    SET_DASHBOARD_TAB = 'SET_DASHBOARD_TAB',
    OPEN_PURCHASE_MASTERCLASS_MODAL = 'OPEN_PURCHASE_MASTERCLASS_MODAL',
    CLOSE_PURCHASE_MASTERCLASS_MODAL = 'CLOSE_PURCHASE_MASTERCLASS_MODAL',
    OPEN_WATCH_MASTERCLASS_MODAL = 'OPEN_WATCH_MASTERCLASS_MODAL',
    CLOSE_WATCH_MASTERCLASS_MODAL = 'CLOSE_WATCH_MASTERCLASS_MODAL',
    OPEN_REVIEW_MASTERCLASS_MODAL = 'OPEN_REVIEW_MASTERCLASS_MODAL',
    CLOSE_REVIEW_MASTERCLASS_MODAL = 'CLOSE_REVIEW_MASTERCLASS_MODAL',
    SET_REVIEWS = 'SET_REVIEWS',
    SET_DIRECTIONS_INTENT = 'SET_DIRECTIONS_INTENT',
}

type ActionMap<M extends { [index: string]: any }> = {
  [Key in keyof M]: M[Key] extends undefined ? { type: Key } : { type: Key; payload: M[Key] }
};

type Payload = {
    [ActionTypes.NAVIGATE]: { view: AppView };
    [ActionTypes.GO_BACK]: undefined;
    [ActionTypes.GO_FORWARD]: undefined;
    [ActionTypes.SET_INITIAL_DATA]: { artists: Artist[]; engineers: Engineer[]; producers: Producer[]; stoodioz: Stoodio[]; labels: Label[]; reviews: Review[] };
    [ActionTypes.SET_LOADING]: { isLoading: boolean };
    [ActionTypes.LOGIN_SUCCESS]: { user: Artist | Engineer | Stoodio | Producer | Label, role?: UserRole };
    [ActionTypes.LOGIN_FAILURE]: { error: string | null };
    [ActionTypes.LOGOUT]: undefined;
    [ActionTypes.COMPLETE_SETUP]: { newUser: Artist | Engineer | Stoodio | Producer | Label, role: UserRole };
    [ActionTypes.VIEW_STOODIO_DETAILS]: { stoodio: Stoodio };
    [ActionTypes.VIEW_ARTIST_PROFILE]: { artist: Artist };
    [ActionTypes.VIEW_ENGINEER_PROFILE]: { engineer: Engineer };
    [ActionTypes.VIEW_PRODUCER_PROFILE]: { producer: Producer };
    [ActionTypes.VIEW_LABEL_PROFILE]: { label: Label };
    [ActionTypes.OPEN_BOOKING_MODAL]: { date: string; time: string; room: Room };
    [ActionTypes.CLOSE_BOOKING_MODAL]: undefined;
    [ActionTypes.CONFIRM_BOOKING_SUCCESS]: { booking: Booking };
    [ActionTypes.SET_LATEST_BOOKING]: { booking: Booking | null };
    [ActionTypes.SET_BOOKINGS]: { bookings: Booking[] };
    [ActionTypes.ADD_BOOKING]: { booking: Booking };
    [ActionTypes.UPDATE_USERS]: { users: (Artist | Engineer | Stoodio | Producer | Label)[] };
    [ActionTypes.SET_CURRENT_USER]: { user: Artist | Engineer | Stoodio | Producer | Label | null };
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
    [ActionTypes.ADD_ARIA_MESSAGE]: { message: AriaCantataMessage };
    [ActionTypes.SET_INITIAL_ARIA_PROMPT]: { prompt: string | null };
    [ActionTypes.SET_ARIA_NUDGE]: { nudge: AriaNudgeData | null };
    [ActionTypes.SET_IS_NUDGE_VISIBLE]: { isVisible: boolean };
    [ActionTypes.RESET_PROFILE_SELECTIONS]: undefined;
    [ActionTypes.SET_DASHBOARD_TAB]: { tab: string | null };
    [ActionTypes.OPEN_PURCHASE_MASTERCLASS_MODAL]: { masterclass: Masterclass, owner: Engineer | Producer };
    [ActionTypes.CLOSE_PURCHASE_MASTERCLASS_MODAL]: undefined;
    [ActionTypes.OPEN_WATCH_MASTERCLASS_MODAL]: { masterclass: Masterclass, owner: Engineer | Producer };
    [ActionTypes.CLOSE_WATCH_MASTERCLASS_MODAL]: undefined;
    [ActionTypes.OPEN_REVIEW_MASTERCLASS_MODAL]: { masterclass: Masterclass, owner: Engineer | Producer };
    [ActionTypes.CLOSE_REVIEW_MASTERCLASS_MODAL]: undefined;
    [ActionTypes.SET_REVIEWS]: { reviews: Review[] };
    [ActionTypes.SET_DIRECTIONS_INTENT]: { bookingId: string | null };
}

export type AppAction = ActionMap<Payload>[keyof ActionMap<Payload>];

const initialState: AppState = {
    history: [AppView.LANDING_PAGE],
    historyIndex: 0,
    stoodioz: [],
    engineers: [],
    artists: [],
    producers: [],
    labels: [],
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
    selectedLabel: null,
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
    isSaved: false,
    masterclassToPurchase: null,
    masterclassToWatch: null,
    masterclassToReview: null,
    directionsIntent: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case ActionTypes.NAVIGATE: {
            const { view } = action.payload;
            if (view === state.history[state.historyIndex]) return state;
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
                selectedLabel: null,
            };

        case ActionTypes.SET_INITIAL_DATA:
            return { ...state, ...action.payload };
            
        case ActionTypes.SET_LOADING:
            return { ...state, isLoading: action.payload.isLoading };

        case ActionTypes.LOGIN_SUCCESS: {
            const { user, role: explicitRole } = action.payload;
            let role = explicitRole;

            // STRICT ROLE DETECTION
            if (!role) {
                if ('amenities' in user) role = UserRole.STOODIO;
                else if ('specialties' in user) role = UserRole.ENGINEER;
                else if ('instrumentals' in user) role = UserRole.PRODUCER;
                else if ('company_name' in user) role = UserRole.LABEL; 
                else role = UserRole.ARTIST;
            }

            // FORCE correct dashboard on login - prevent stale 'last_view' from hijacking
            let landingView = AppView.ARTIST_DASHBOARD;
            if (role === UserRole.STOODIO) landingView = AppView.STOODIO_DASHBOARD;
            else if (role === UserRole.ENGINEER) landingView = AppView.ENGINEER_DASHBOARD;
            else if (role === UserRole.PRODUCER) landingView = AppView.PRODUCER_DASHBOARD;
            else if (role === UserRole.LABEL) landingView = AppView.LABEL_DASHBOARD;

            // Clear legacy stale state
            localStorage.setItem('last_view', landingView);
            
            return {
                ...state,
                currentUser: user,
                userRole: role,
                loginError: null,
                history: [landingView],
                historyIndex: 0,
                ariaHistory: [],
                isLoading: false, 
            };
        }
        case ActionTypes.LOGIN_FAILURE:
            return { ...state, loginError: action.payload.error, isLoading: false };
        case ActionTypes.LOGOUT:
            return {
                ...initialState,
                isLoading: false,
                artists: state.artists,
                engineers: state.engineers,
                producers: state.producers,
                stoodioz: state.stoodioz,
                labels: state.labels,
            };
        
        case ActionTypes.COMPLETE_SETUP: {
            const { newUser, role } = action.payload;
            let landingView = AppView.ARTIST_DASHBOARD;
            if (role === UserRole.STOODIO) landingView = AppView.STOODIO_DASHBOARD;
            else if (role === UserRole.ENGINEER) landingView = AppView.ENGINEER_DASHBOARD;
            else if (role === UserRole.PRODUCER) landingView = AppView.PRODUCER_DASHBOARD;
            else if (role === UserRole.LABEL) landingView = AppView.LABEL_DASHBOARD;

            return {
                ...state,
                currentUser: newUser,
                userRole: role,
                history: [landingView],
                historyIndex: 0,
                isLoading: false,
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
        case ActionTypes.VIEW_LABEL_PROFILE:
            return { ...state, selectedLabel: action.payload.label };
        case ActionTypes.OPEN_BOOKING_MODAL:
            return { ...state, bookingTime: action.payload };
        case ActionTypes.CLOSE_BOOKING_MODAL:
            return { ...state, bookingTime: null, bookingIntent: null };
        case ActionTypes.CONFIRM_BOOKING_SUCCESS:
            return { ...state, bookingTime: null, bookingIntent: null, latestBooking: action.payload.booking, bookings: [...state.bookings, action.payload.booking] };
        case ActionTypes.UPDATE_USERS: {
            const newUsers = action.payload.users;
            const uniqueUsers = Array.from(new Map([...state.artists, ...state.engineers, ...state.producers, ...state.stoodioz, ...state.labels, ...newUsers].map(u => [u.id, u])).values());
            return {
                ...state,
                artists: uniqueUsers.filter(u => 'is_seeking_session' in u) as Artist[],
                engineers: uniqueUsers.filter(u => 'specialties' in u) as Engineer[],
                producers: uniqueUsers.filter(u => 'instrumentals' in u) as Producer[],
                stoodioz: uniqueUsers.filter(u => 'amenities' in u) as Stoodio[],
                labels: uniqueUsers.filter(u => 'company_name' in u) as Label[],
            };
        }
        case ActionTypes.SET_CURRENT_USER:
            return { ...state, currentUser: action.payload.user };
        case ActionTypes.SET_NOTIFICATIONS:
            return { ...state, notifications: action.payload.notifications };
        case ActionTypes.SET_CONVERSATIONS:
            return { ...state, conversations: action.payload.conversations };
        case ActionTypes.SET_SELECTED_CONVERSATION:
            return { ...state, selectedConversationId: action.payload.conversationId };
        case ActionTypes.SET_ARIA_CANTATA_OPEN:
            return { ...state, isAriaCantataOpen: action.payload.isOpen };
        case ActionTypes.SET_ARIA_HISTORY:
            return { ...state, ariaHistory: action.payload.history };
        case ActionTypes.ADD_ARIA_MESSAGE:
            return { ...state, ariaHistory: [...state.ariaHistory, action.payload.message] };
        default:
            return state;
    }
};

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<Dispatch<AppAction> | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    return (
        <AppStateContext.Provider value={state}>
            <AppDispatchContext.Provider value={dispatch}>
                {children}
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    );
};

export const useAppState = (): AppState => {
    const context = useContext(AppStateContext);
    if (context === undefined) throw new Error('useAppState must be used within an AppProvider');
    return context;
};

export const useAppDispatch = (): Dispatch<AppAction> => {
    const context = useContext(AppDispatchContext);
    if (context === undefined) throw new Error('useAppDispatch must be used within an AppProvider');
    return context;
};