

// FIX: Removed self-import of `LinkAttachment` which was causing a conflict.

export interface Location {
    lat: number;
    lon: number;
}

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    date: string;
    type: 'credit' | 'debit';
}

export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorImageUrl: string;
    text: string;
    timestamp: string;
}

export interface Post {
    id: string;
    authorId: string;
    authorType: UserRole;
    text: string;
    imageUrl?: string;
    videoUrl?: string;
    videoThumbnailUrl?: string;
    link?: LinkAttachment;
    timestamp: string;
    likes: string[]; // Array of user IDs
    comments: Comment[];
}

export interface Stoodio {
    id: string;
    name: string;
    location: string;
    hourlyRate: number;
    engineerPayRate: number;
    rating: number;
    imageUrl: string;
    amenities: string[];
    description: string;
    coordinates: Location;
    availability: {
        date: string; // YYYY-MM-DD
        times: string[]; // HH:MM
    }[];
    photos: string[]; // Gallery images
    followers: number;
    following: {
        artists: string[];
        engineers: string[];
        stoodioz: string[];
    };
    followerIds: string[];
    links?: { title: string; url: string }[];
    email?: string;
    password?: string;
    posts?: Post[];
    walletBalance: number;
    walletTransactions: Transaction[];
    notificationsEnabled?: boolean;
}

export interface Artist {
    id: string;
    name: string;
    imageUrl: string;
    bio: string;
    followers: number;
    following: {
        stoodioz: string[];
        engineers: string[];
        artists: string[];
    };
    followerIds: string[];
    links?: { title: string; url: string }[];
    coordinates: Location;
    isSeekingSession: boolean;
    email?: string;
    password?: string;
    posts?: Post[];
    walletBalance: number;
    walletTransactions: Transaction[];
    notificationsEnabled?: boolean;
}

export interface Engineer {
    id: string;
    name: string;
    bio: string;
    specialties: string[];
    rating: number;
    sessionsCompleted: number;
    imageUrl: string;
    audioSampleUrl: string;
    followers: number;
    following: {
        artists: string[];
        engineers: string[];
        stoodioz: string[];
    };
    followerIds: string[];
    links?: { title: string; url: string }[];
    coordinates: Location;
    isAvailable: boolean;
    displayExactLocation?: boolean;
    showOnMap?: boolean;
    email?: string;
    password?: string;
    posts?: Post[];
    walletBalance: number;
    walletTransactions: Transaction[];
    availability?: {
        date: string; // YYYY-MM-DD
        times: string[]; // HH:MM
    }[];
    notificationsEnabled?: boolean;
    minHourlyRate?: number;
}

export enum BookingRequestType {
    FIND_AVAILABLE = 'FIND_AVAILABLE',
    SPECIFIC_ENGINEER = 'SPECIFIC_ENGINEER',
    BRING_YOUR_OWN = 'BRING_YOUR_OWN'
}

export interface BookingRequest {
    date: string;
    startTime: string;
    duration: number; // in hours
    totalCost: number;
    engineerPayRate: number;
    requestType: BookingRequestType;
    requestedEngineerId?: string;
    requiredSkills?: string[];
    postedBy?: UserRole;
}

export enum BookingStatus {
    PENDING = 'PENDING', // Open on the job board
    PENDING_APPROVAL = 'PENDING_APPROVAL', // Sent to a specific engineer
    CONFIRMED = 'CONFIRMED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}


export interface Booking extends BookingRequest {
    id:string;
    stoodio: Stoodio;
    engineer: Engineer | null;
    artist: Artist | null;
    status: BookingStatus;
    bookedById: string;
    bookedByRole: UserRole;
    tip?: number;
    requestedEngineerId: string | null;
}

export interface Review {
    id: string;
    reviewerName: string;
    artistId?: string;
    stoodioId?: string;
    rating: number;
    comment: string;
    date: string; // YYYY-MM-DD
}

export type MessageType = 'text' | 'image' | 'link' | 'audio';

export interface LinkAttachment {
    url: string;
    title: string;
}

export interface AudioAttachment {
    filename: string;
    duration: string; // e.g. "3:45"
}

export interface Message {
    id: string;
    senderId: string; // 'artist-user' or engineer/stoodio id
    timestamp: string; // ISO 8601
    type: MessageType;
    text?: string; // Optional for images (as a caption) or links
    imageUrl?: string;
    link?: LinkAttachment;
    audioUrl?: string;
    audioInfo?: AudioAttachment;
}

export interface Conversation {
    id: string;
    participant: Engineer | Stoodio | Artist;
    messages: Message[];
    unreadCount: number;
}
export enum NotificationType {
    BOOKING_REQUEST = 'BOOKING_REQUEST',
    BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
    BOOKING_DENIED = 'BOOKING_DENIED',
    SESSION_COMPLETED = 'SESSION_COMPLETED',
    NEW_FOLLOWER = 'NEW_FOLLOWER',
    NEW_LIKE = 'NEW_LIKE',
    NEW_COMMENT = 'NEW_COMMENT',
    NEW_TIP = 'NEW_TIP',
    GENERAL = 'GENERAL',
}

export interface AppNotification {
    id: string;
    userId: string;
    message: string;
    timestamp: string;
    type: NotificationType;
    read: boolean;
    link?: {
        view: AppView;
        entityId?: string;
    };
    actor?: {
        id: string;
        name: string;
        imageUrl: string;
    };
}


export interface VibeMatchResult {
    vibeDescription: string;
    tags: string[];
    recommendations: {
        type: 'stoodio' | 'engineer';
        entity: Stoodio | Engineer;
        reason: string;
    }[];
}

export enum AppView {
    LANDING_PAGE = 'LANDING_PAGE',
    LOGIN = 'LOGIN',
    CHOOSE_PROFILE = 'CHOOSE_PROFILE',
    ARTIST_SETUP = 'ARTIST_SETUP',
    ENGINEER_SETUP = 'ENGINEER_SETUP',
    STOODIO_SETUP = 'STOODIO_SETUP',
    PRIVACY_POLICY = 'PRIVACY_POLICY',
    THE_STAGE = 'THE_STAGE',
    ARTIST_DASHBOARD = 'ARTIST_DASHBOARD',
    STOODIO_LIST = 'STOODIO_LIST',
    STOODIO_DETAIL = 'STOODIO_DETAIL',
    BOOKING_MODAL = 'BOOKING_MODAL',
    CONFIRMATION = 'CONFIRMATION',
    MY_BOOKINGS = 'MY_BOOKINGS',
    INBOX = 'INBOX',
    FOLLOWING = 'FOLLOWING',
    ARTIST_LIST = 'ARTIST_LIST',
    ARTIST_PROFILE = 'ARTIST_PROFILE',
    ENGINEER_LIST = 'ENGINEER_LIST',
    ENGINEER_PROFILE = 'ENGINEER_PROFILE',
    STOODIO_DASHBOARD = 'STOODIO_DASHBOARD',
    ENGINEER_DASHBOARD = 'ENGINEER_DASHBOARD',
    MAP_VIEW = 'MAP_VIEW',
    ACTIVE_SESSION = 'ACTIVE_SESSION',
    VIBE_MATCHER_RESULTS = 'VIBE_MATCHER_RESULTS',
}

export enum UserRole {
    ARTIST = 'ARTIST',
    STOODIO = 'STOODIO',
    ENGINEER = 'ENGINEER'
}