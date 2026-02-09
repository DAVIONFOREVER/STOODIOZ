import React, {
  createContext,
  useReducer,
  useContext,
  type Dispatch,
  type ReactNode,
} from 'react';
import type {
  Stoodio,
  Booking,
  Engineer,
  Artist,
  AppNotification,
  Conversation,
  Producer,
  AriaCantataMessage,
  VibeMatchResult,
  Room,
  Following,
  Review,
  FileAttachment,
  Masterclass,
  AriaNudgeData,
  Label,
  ReviewTarget,
} from '../types';
import { AppView, UserRole } from '../types';

// --- STATE AND ACTION TYPES ---

export interface AppState {
  history: AppView[];
  historyIndex: number;
  stoodioz: Stoodio[];
  engineers: Engineer[];
  artists: Artist[];
  producers: Producer[];
  labels: Label[];
  reviews: Review[];
  reviewTarget: ReviewTarget | null;
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
  bookingIntent: {
    engineer?: Engineer;
    producer?: Producer;
    date?: string;
    time?: string;
    mixingDetails?: any;
    pullUpFee?: number;
  } | null;
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
  masterclassToPurchase: { masterclass: Masterclass; owner: Engineer | Producer } | null;
  masterclassToWatch: { masterclass: Masterclass; owner: Engineer | Producer } | null;
  masterclassToReview: { masterclass: Masterclass; owner: Engineer | Producer } | null;
  directionsIntent: { bookingId?: string | null; destination?: { lat: number; lon: number } } | null;
}

type ActionMap<M extends { [index: string]: any }> = {
  [Key in keyof M]: M[Key] extends undefined
    ? { type: Key }
    : { type: Key; payload: M[Key] };
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
  RESET_APP = 'RESET_APP', // ✅ NEW: hard reset action
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
  ADD_NOTIFICATION = 'ADD_NOTIFICATION',
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
  SET_REVIEW_TARGET = 'SET_REVIEW_TARGET',
  SET_DIRECTIONS_INTENT = 'SET_DIRECTIONS_INTENT',
}

type Payload = {
  [ActionTypes.NAVIGATE]: { view: AppView };
  [ActionTypes.GO_BACK]: undefined;
  [ActionTypes.GO_FORWARD]: undefined;
  [ActionTypes.SET_INITIAL_DATA]: {
    artists: Artist[];
    engineers: Engineer[];
    producers: Producer[];
    stoodioz: Stoodio[];
    labels: Label[];
    reviews: Review[];
  };
  [ActionTypes.SET_LOADING]: { isLoading: boolean };
  [ActionTypes.LOGIN_SUCCESS]: { user: Artist | Engineer | Stoodio | Producer | Label; role?: UserRole };
  [ActionTypes.LOGIN_FAILURE]: { error: string | null };
  [ActionTypes.LOGOUT]: undefined;
  [ActionTypes.RESET_APP]: undefined; // ✅ NEW
  [ActionTypes.COMPLETE_SETUP]: { newUser: Artist | Engineer | Stoodio | Producer | Label; role: UserRole };
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
  [ActionTypes.ADD_NOTIFICATION]: { notification: AppNotification };
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
  [ActionTypes.OPEN_PURCHASE_MASTERCLASS_MODAL]: { masterclass: Masterclass; owner: Engineer | Producer };
  [ActionTypes.CLOSE_PURCHASE_MASTERCLASS_MODAL]: undefined;
  [ActionTypes.OPEN_WATCH_MASTERCLASS_MODAL]: { masterclass: Masterclass; owner: Engineer | Producer };
  [ActionTypes.CLOSE_WATCH_MASTERCLASS_MODAL]: undefined;
  [ActionTypes.OPEN_REVIEW_MASTERCLASS_MODAL]: { masterclass: Masterclass; owner: Engineer | Producer };
  [ActionTypes.CLOSE_REVIEW_MASTERCLASS_MODAL]: undefined;
  [ActionTypes.SET_REVIEWS]: { reviews: Review[] };
  [ActionTypes.SET_REVIEW_TARGET]: { target: ReviewTarget | null };
  [ActionTypes.SET_DIRECTIONS_INTENT]: { bookingId: string | null };
};

export type AppAction = ActionMap<Payload>[keyof ActionMap<Payload>];


// --- INITIAL STATE HELPERS ---
const getInitialHistory = (): { history: AppView[]; historyIndex: number } => {
  try {
    const raw = localStorage.getItem('last_view');
    const values = Object.values(AppView) as string[];
    const isValid = raw && values.includes(raw);

    const blocked = new Set<string>([
      AppView.LOGIN,
      AppView.LANDING_PAGE,
      AppView.CHOOSE_PROFILE,
      AppView.ARTIST_SETUP,
      AppView.ENGINEER_SETUP,
      AppView.PRODUCER_SETUP,
      AppView.STOODIO_SETUP,
      AppView.LABEL_SETUP,
      AppView.SUBSCRIPTION_PLANS,
      AppView.PRIVACY_POLICY,
    ]);

    if (isValid && !blocked.has(raw!)) {
      return { history: [raw as AppView], historyIndex: 0 };
    }
  } catch {
    // ignore
  }
  return { history: [AppView.LANDING_PAGE], historyIndex: 0 };
};

// --- INITIAL STATE ---
const initialState: AppState = {
  ...getInitialHistory(),
  stoodioz: [],
  engineers: [],
  artists: [],
  producers: [],
  labels: [],
  reviews: [],
  reviewTarget: null,
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
  isLoading: false,
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

// --- REDUCER ---
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
      return {
        ...state,
        historyIndex: Math.min(state.history.length - 1, state.historyIndex + 1),
      };

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

      if (!role) {
        if ('amenities' in user) role = UserRole.STOODIO;
        else if ('specialties' in user) role = UserRole.ENGINEER;
        else if ('instrumentals' in user) role = UserRole.PRODUCER;
        else if ('bio' in user && !('is_seeking_session' in user)) role = UserRole.LABEL;
        else role = UserRole.ARTIST;
      }

      return {
        ...state,
        currentUser: user,
        userRole: role,
        loginError: null,
        isLoading: false,
      };
    }

    case ActionTypes.LOGIN_FAILURE:
      return { ...state, loginError: action.payload.error, isLoading: false };

    // ✅ NEW: true hard reset (use this anywhere you want to guarantee a clean slate)
    case ActionTypes.RESET_APP:
      return { ...initialState };

    // ✅ FIXED: make LOGOUT a hard reset too (prevents cross-user bleed)
    case ActionTypes.LOGOUT:
      return { ...initialState };

    case ActionTypes.COMPLETE_SETUP: {
      const { newUser, role } = action.payload;
      const updatedState: AppState = { ...state };

      if (role === UserRole.ARTIST) updatedState.artists = [...state.artists, newUser as Artist];
      else if (role === UserRole.ENGINEER) updatedState.engineers = [...state.engineers, newUser as Engineer];
      else if (role === UserRole.PRODUCER) updatedState.producers = [...state.producers, newUser as Producer];
      else if (role === UserRole.STOODIO) updatedState.stoodioz = [...state.stoodioz, newUser as Stoodio];
      else if (role === UserRole.LABEL) updatedState.labels = [...state.labels, newUser as Label];

      let landingView = AppView.THE_STAGE;
      if (role === UserRole.STOODIO) landingView = AppView.STOODIO_DASHBOARD;
      else if (role === UserRole.ENGINEER) landingView = AppView.ENGINEER_DASHBOARD;
      else if (role === UserRole.PRODUCER) landingView = AppView.PRODUCER_DASHBOARD;
      else if (role === UserRole.LABEL) landingView = AppView.LABEL_DASHBOARD;
      else if (role === UserRole.ARTIST) landingView = AppView.ARTIST_DASHBOARD;

      return {
        ...updatedState,
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
      return {
        ...state,
        bookingTime: null,
        bookingIntent: null,
        latestBooking: action.payload.booking,
        bookings: [...state.bookings, action.payload.booking],
      };

    case ActionTypes.SET_LATEST_BOOKING:
      return { ...state, latestBooking: action.payload.booking };

    case ActionTypes.SET_BOOKINGS:
      return { ...state, bookings: action.payload.bookings };

    case ActionTypes.ADD_BOOKING:
      return { ...state, bookings: [...state.bookings, action.payload.booking] };

    case ActionTypes.UPDATE_USERS: {
      const newUsers = action.payload.users;
      if (!newUsers.length) return state;

      // Merge updates into existing role arrays by id/profile_id. Do not re-partition by type
      // shape, or directory users (narrow selects, no bio/is_seeking_session etc.) get dropped
      // and "Who to follow" / lists appear to lose everyone after a follow.
      const sameUser = (a: any, b: any) =>
        a?.id === b?.id || a?.profile_id === b?.profile_id || a?.id === b?.profile_id || a?.profile_id === b?.id;
      const mergeInto = (arr: (Artist | Engineer | Stoodio | Producer | Label)[]) =>
        arr.map((u) => {
          const updated = newUsers.find((nu) => sameUser(u, nu));
          return updated ? { ...u, ...updated } : u;
        });

      const artists = mergeInto(state.artists);
      const engineers = mergeInto(state.engineers);
      const producers = mergeInto(state.producers);
      const stoodioz = mergeInto(state.stoodioz);
      const labels = mergeInto(state.labels);

      const allUsersMap = new Map<string, Artist | Engineer | Stoodio | Producer | Label>();
      [...artists, ...engineers, ...producers, ...stoodioz, ...labels].forEach((u) => {
        if (u.id) allUsersMap.set(u.id, u);
        if ((u as any).profile_id && (u as any).profile_id !== u.id) allUsersMap.set((u as any).profile_id, u);
      });
      const findUser = (id: string | null | undefined) => (id ? allUsersMap.get(id) ?? null : null);
      const findSelected = <T,>(sel: T | null, idKey: keyof T, profileKey: keyof T): T | null =>
        sel ? (findUser((sel as any)?.[idKey]) as T) ?? (findUser((sel as any)?.[profileKey]) as T) ?? sel : null;

      return {
        ...state,
        artists,
        engineers,
        producers,
        stoodioz,
        labels,
        currentUser: (findUser(state.currentUser?.id) as any) || (findUser((state.currentUser as any)?.profile_id) as any) || state.currentUser,
        selectedArtist: findSelected(state.selectedArtist, 'id', 'profile_id') as Artist | null,
        selectedEngineer: findSelected(state.selectedEngineer, 'id', 'profile_id') as Engineer | null,
        selectedProducer: findSelected(state.selectedProducer, 'id', 'profile_id') as Producer | null,
        selectedStoodio: (findUser(state.selectedStoodio?.id) as Stoodio) || (findUser((state.selectedStoodio as any)?.profile_id) as Stoodio) || state.selectedStoodio,
        selectedLabel: (findUser(state.selectedLabel?.id) as Label) || (findUser((state.selectedLabel as any)?.profile_id) as Label) || state.selectedLabel,
      };
    }

    case ActionTypes.SET_CURRENT_USER:
      return { ...state, currentUser: action.payload.user };

    case ActionTypes.UPDATE_FOLLOWING: {
      if (!state.currentUser) return state;
      const updatedUser = { ...state.currentUser, following: action.payload.newFollowing };
      return { ...state, currentUser: updatedUser };
    }

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

    case ActionTypes.ADD_NOTIFICATION:
      return { ...state, notifications: [...(state.notifications || []), action.payload.notification] };

    case ActionTypes.SET_CONVERSATIONS:
      return { ...state, conversations: action.payload.conversations };

    case ActionTypes.SET_SELECTED_CONVERSATION:
      return { ...state, selectedConversationId: action.payload.conversationId };

    case ActionTypes.SET_SMART_REPLIES:
      return { ...state, smartReplies: action.payload.replies };

    case ActionTypes.SET_IS_SMART_REPLIES_LOADING:
      return { ...state, isSmartRepliesLoading: action.payload.isLoading };

    case ActionTypes.SET_VIBE_MATCHER_OPEN:
      return { ...state, isVibeMatcherOpen: action.payload.isOpen };

    case ActionTypes.SET_VIBE_MATCHER_LOADING:
      return { ...state, isVibeMatcherLoading: action.payload.isLoading };

    case ActionTypes.SET_VIBE_RESULTS:
      return { ...state, vibeMatchResults: action.payload.results };

    case ActionTypes.SET_BOOKING_INTENT:
      return { ...state, bookingIntent: action.payload.intent };

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

    case ActionTypes.ADD_ARIA_MESSAGE:
      return { ...state, ariaHistory: [...state.ariaHistory, action.payload.message] };

    case ActionTypes.SET_INITIAL_ARIA_PROMPT:
      return { ...state, initialAriaCantataPrompt: action.payload.prompt };

    case ActionTypes.SET_ARIA_NUDGE:
      return { ...state, ariaNudge: action.payload.nudge };

    case ActionTypes.SET_IS_NUDGE_VISIBLE:
      return { ...state, isNudgeVisible: action.payload.isVisible };

    case ActionTypes.SET_DASHBOARD_TAB:
      return { ...state, dashboardInitialTab: action.payload.tab };

    case ActionTypes.OPEN_PURCHASE_MASTERCLASS_MODAL:
      return { ...state, masterclassToPurchase: action.payload };

    case ActionTypes.CLOSE_PURCHASE_MASTERCLASS_MODAL:
      return { ...state, masterclassToPurchase: null };

    case ActionTypes.OPEN_WATCH_MASTERCLASS_MODAL:
      return { ...state, masterclassToWatch: action.payload };

    case ActionTypes.CLOSE_WATCH_MASTERCLASS_MODAL:
      return { ...state, masterclassToWatch: null };

    case ActionTypes.OPEN_REVIEW_MASTERCLASS_MODAL:
      return { ...state, masterclassToReview: action.payload };

    case ActionTypes.CLOSE_REVIEW_MASTERCLASS_MODAL:
      return { ...state, masterclassToReview: null };

    case ActionTypes.SET_REVIEWS:
      return { ...state, reviews: action.payload.reviews };

    case ActionTypes.SET_REVIEW_TARGET:
      return { ...state, reviewTarget: action.payload.target };

    case ActionTypes.SET_DIRECTIONS_INTENT:
      return {
        ...state,
        directionsIntent: (action.payload.bookingId || action.payload.destination) 
          ? { 
              bookingId: action.payload.bookingId || null,
              destination: action.payload.destination || undefined
            } 
          : null,
      };

    default:
      return state;
  }
};

// --- CONTEXT AND PROVIDER ---

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<Dispatch<AppAction> | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>{children}</AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

// --- HOOKS ---

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
