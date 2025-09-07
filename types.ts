// FIX: Created the full type definitions for the application based on usage in other files. This file was previously a placeholder.

export enum AppView {
    LANDING_PAGE = 'LANDING_PAGE',
    LOGIN = 'LOGIN',
    CHOOSE_PROFILE = 'CHOOSE_PROFILE',
    ARTIST_SETUP = 'ARTIST_SETUP',
    ENGINEER_SETUP = 'ENGINEER_SETUP',
    STOODIO_SETUP = 'STOODIO_SETUP',
    PRIVACY_POLICY = 'PRIVACY_POLICY',
    THE_STAGE = 'THE_STAGE',
    STOODIO_LIST = 'STOODIO_LIST',
    STOODIO_DETAIL = 'STOODIO_DETAIL',
    ENGINEER_LIST = 'ENGINEER_LIST',
    ENGINEER_PROFILE = 'ENGINEER_PROFILE',
    ARTIST_LIST = 'ARTIST_LIST',
    ARTIST_PROFILE = 'ARTIST_PROFILE',
    MAP_VIEW = 'MAP_VIEW',
    BOOKING_MODAL = 'BOOKING_MODAL',
    CONFIRMATION = 'CONFIRMATION',
    MY_BOOKINGS = 'MY_BOOKINGS',
    STOODIO_DASHBOARD = 'STOODIO_DASHBOARD',
    ENGINEER_DASHBOARD = 'ENGINEER_DASHBOARD',
    ARTIST_DASHBOARD = 'ARTIST_DASHBOARD',
    INBOX = 'INBOX',
    ACTIVE_SESSION = 'ACTIVE_SESSION',
    VIBE_MATCHER_RESULTS = 'VIBE_MATCHER_RESULTS',
}

export enum UserRole {
    ARTIST = 'ARTIST',
    STOODIO = 'STOODIO',
    ENGINEER = 'ENGINEER',
}

export enum BookingStatus {
    PENDING = 'PENDING',
    PENDING_APPROVAL = 'PENDING_APPROVAL',
    CONFIRMED = 'CONFIRMED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export enum BookingRequestType {
    FIND_AVAILABLE = 'FIND_AVAILABLE',
    SPECIFIC_ENGINEER = 'SPECIFIC_ENGINEER',
    BRING_YOUR_OWN = 'BRING_YOUR_OWN',
}

export enum NotificationType {
    GENERAL = 'GENERAL',
    BOOKING_REQUEST = 'BOOKING_REQUEST',
    BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
    BOOKING_DENIED = 'BOOKING_DENIED',
    NEW_FOLLOWER = 'NEW_FOLLOWER',
    NEW_LIKE = 'NEW_LIKE',
    NEW_COMMENT = 'NEW_COMMENT',
    NEW_TIP = 'NEW_TIP',
}

export enum VerificationStatus {
    UNVERIFIED = 'UNVERIFIED',
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
}

export interface Location {
    lat: number;
    lon: number;
}

export interface Room {
    id: string;
    name: string;
    description: string;
    hourlyRate: number;
    photos: string[];
}

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    date: string;
    type: 'credit' | 'debit';
}

export interface Following {
    stoodioz: string[];
    engineers: string[];
    artists: string[];
}

export interface Link {
    title: string;
    url: string;
}

export interface LinkAttachment {
    title: string;
    url: string;
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
    likes: string[];
    comments: Comment[];
}

interface BaseUser {
    id: string;
    name: string;
    email: string;
    password?: string;
    imageUrl: string;
    followers: number;
    following: Following;
    followerIds: string[];
    coordinates: Location;
    walletBalance: number;
    walletTransactions: Transaction[];
    posts?: Post[];
    links?: Link[];
}

export interface Artist extends BaseUser {
    bio: string;
    isSeekingSession: boolean;
    showOnMap?: boolean;
}

export interface Engineer extends BaseUser {
    bio: string;
    specialties: string[];
    rating: number;
    sessionsCompleted: number;
    audioSampleUrl: string;
    isAvailable: boolean;
    showOnMap?: boolean;
    displayExactLocation?: boolean;
    availability?: { date: string; times: string[] }[];
    notificationPreferences?: {
        radius: number; // in miles
        enabled: boolean;
    };
    minimumPayRate?: number;
}

export interface InHouseEngineerInfo {
    engineerId: string;
    payRate: number;
}

export interface Stoodio extends BaseUser {
    description: string;
    location: string;
    hourlyRate: number;
    engineerPayRate: number;
    rating: number;
    amenities: string[];
    availability: { date: string; times: string[] }[];
    photos: string[];
    rooms: Room[];
    inHouseEngineers?: InHouseEngineerInfo[];
    showOnMap?: boolean;
    verificationStatus: VerificationStatus;
    googleBusinessProfileUrl?: string;
    websiteUrl?: string;
}

export interface BookingRequest {
    room: Room;
    date: string;
    startTime: string;
    duration: number;
    totalCost: number;
    engineerPayRate: number;
    requestType: BookingRequestType;
    requestedEngineerId?: string;
    requiredSkills?: string[];
}

export interface Booking {
    id: string;
    room: Room;
    date: string;
    startTime: string;
    duration: number;
    totalCost: number;
    engineerPayRate: number;
    requestType: BookingRequestType;
    status: BookingStatus;
    stoodio: Stoodio;
    artist: Artist | null;
    engineer: Engineer | null;
    requestedEngineerId: string | null;
    bookedById: string;
    bookedByRole: UserRole;
    requiredSkills?: string[];
    postedBy?: UserRole;
    tip?: number;
}

export interface Review {
    id: string;
    reviewerName: string;
    artistId?: string;
    stoodioId?: string;
    engineerId?: string;
    rating: number;
    comment: string;
    date: string;
}

export interface Message {
    id: string;
    senderId: string;
    text?: string;
    timestamp: string;
    type: 'text' | 'image' | 'link' | 'audio';
    imageUrl?: string;
    link?: LinkAttachment;
    audioUrl?: string;
    audioInfo?: {
        filename: string;
        duration: string;
    };
}

export interface Conversation {
    id: string;
    participant: Artist | Engineer | Stoodio;
    messages: Message[];
    unreadCount: number;
}

export interface AppNotification {
    id: string;
    userId: string;
    message: string;
    timestamp: string;
    type: NotificationType;
    read: boolean;
    actor?: {
        name: string;
        imageUrl: string;
    };
    link?: {
        view: AppView;
        entityId?: string;
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