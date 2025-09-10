// FIX: Created the full type definitions for the application based on usage in other files. This file was previously a placeholder.

export enum AppView {
    LANDING_PAGE = 'LANDING_PAGE',
    LOGIN = 'LOGIN',
    CHOOSE_PROFILE = 'CHOOSE_PROFILE',
    CHOOSE_ACTIVE_PROFILE = 'CHOOSE_ACTIVE_PROFILE',
    ARTIST_SETUP = 'ARTIST_SETUP',
    ENGINEER_SETUP = 'ENGINEER_SETUP',
    STOODIO_SETUP = 'STOODIO_SETUP',
    PRODUCER_SETUP = 'PRODUCER_SETUP',
    PRIVACY_POLICY = 'PRIVACY_POLICY',
    SUBSCRIPTION_PLANS = 'SUBSCRIPTION_PLANS',
    THE_STAGE = 'THE_STAGE',
    STOODIO_LIST = 'STOODIO_LIST',
    STOODIO_DETAIL = 'STOODIO_DETAIL',
    ENGINEER_LIST = 'ENGINEER_LIST',
    ENGINEER_PROFILE = 'ENGINEER_PROFILE',
    ARTIST_LIST = 'ARTIST_LIST',
    ARTIST_PROFILE = 'ARTIST_PROFILE',
    PRODUCER_LIST = 'PRODUCER_LIST',
    PRODUCER_PROFILE = 'PRODUCER_PROFILE',
    MAP_VIEW = 'MAP_VIEW',
    BOOKING_MODAL = 'BOOKING_MODAL',
    CONFIRMATION = 'CONFIRMATION',
    MY_BOOKINGS = 'MY_BOOKINGS',
    STOODIO_DASHBOARD = 'STOODIO_DASHBOARD',
    ENGINEER_DASHBOARD = 'ENGINEER_DASHBOARD',
    ARTIST_DASHBOARD = 'ARTIST_DASHBOARD',
    PRODUCER_DASHBOARD = 'PRODUCER_DASHBOARD',
    INBOX = 'INBOX',
    ACTIVE_SESSION = 'ACTIVE_SESSION',
    VIBE_MATCHER_RESULTS = 'VIBE_MATCHER_RESULTS',
}

export enum UserRole {
    ARTIST = 'ARTIST',
    STOODIO = 'STOODIO',
    ENGINEER = 'ENGINEER',
    PRODUCER = 'PRODUCER',
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

export enum SubscriptionPlan {
    FREE = 'FREE',
    STOODIO_PRO = 'STOODIO_PRO',
    ENGINEER_PLUS = 'ENGINEER_PLUS',
    PRODUCER_PRO = 'PRODUCER_PRO',
}

export enum SubscriptionStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    TRIAL = 'TRIAL',
}

export enum TransactionCategory {
    SESSION_PAYMENT = 'SESSION_PAYMENT',
    SESSION_PAYOUT = 'SESSION_PAYOUT',
    TIP_PAYMENT = 'TIP_PAYMENT',
    TIP_PAYOUT = 'TIP_PAYOUT',
    REFUND = 'REFUND',
    ADD_FUNDS = 'ADD_FUNDS',
    WITHDRAWAL = 'WITHDRAWAL',
    PLATFORM_FEE = 'PLATFORM_FEE',
    BEAT_SALE = 'BEAT_SALE',
    BEAT_PURCHASE = 'BEAT_PURCHASE',
    MIXING_PAYMENT = 'MIXING_PAYMENT',
    MIXING_PAYOUT = 'MIXING_PAYOUT',
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}


export interface Subscription {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    nextBillingDate?: string;
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
    amount: number; // Positive for credit, negative for debit
    date: string;
    category: TransactionCategory;
    status: TransactionStatus;
    relatedBookingId?: string;
    relatedUserName?: string; // Name of the other party in the transaction
}


export interface Following {
    stoodioz: string[];
    engineers: string[];
    artists: string[];
    producers: string[];
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
    isOnline?: boolean;
}

export interface Artist extends BaseUser {
    bio: string;
    isSeekingSession: boolean;
    showOnMap?: boolean;
}

export interface MixingServices {
    isEnabled: boolean;
    pricePerTrack: number;
    description: string;
    turnaroundTime: string; // e.g., "3-5 business days"
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
    subscription?: Subscription;
    mixingServices?: MixingServices;
}

export interface Instrumental {
    id: string;
    title: string;
    audioUrl: string;
    coverArtUrl?: string;
    priceLease: number;
    priceExclusive: number;
    genre: string;
    bpm?: number;
    key?: string;
    tags: string[];
    isFreeDownloadAvailable?: boolean;
}

export interface Producer extends BaseUser {
    bio: string;
    genres: string[];
    rating: number;
    imageUrl: string;
    isAvailable: boolean;
    showOnMap?: boolean;
    availability?: { date: string; times: string[] }[];
    instrumentals: Instrumental[];
    subscription?: Subscription;
    pullUpPrice?: number;
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
    subscription?: Subscription;
}

export interface MixingDetails {
    type: 'REMOTE' | 'IN_STUDIO';
    trackCount: number;
    notes: string;
}

export interface BookingRequest {
    room?: Room;
    date: string;
    startTime: string;
    duration: number;
    totalCost: number;
    engineerPayRate: number;
    requestType: BookingRequestType;
    requestedEngineerId?: string;
    requiredSkills?: string[];
    producerId?: string;
    instrumentalsToPurchase?: Instrumental[];
    pullUpFee?: number;
    mixingDetails?: MixingDetails;
}

export interface Booking {
    id: string;
    room?: Room;
    date: string;
    startTime: string;
    duration: number;
    totalCost: number;
    engineerPayRate: number;
    requestType: BookingRequestType;
    status: BookingStatus;
    stoodio?: Stoodio;
    artist: Artist | null;
    engineer: Engineer | null;
    producer: Producer | null;
    requestedEngineerId: string | null;
    bookedById: string;
    bookedByRole: UserRole;
    requiredSkills?: string[];
    postedBy?: UserRole;
    tip?: number;
    instrumentalsPurchased?: Instrumental[];
    pullUpFee?: number;
    mixingDetails?: MixingDetails;
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

export interface FileAttachment {
    name: string;
    url: string;
    size: string;
}

export interface Message {
    id: string;
    senderId: string;
    text?: string;
    timestamp: string;
    type: 'text' | 'image' | 'link' | 'audio' | 'agreement' | 'files' | 'system';
    imageUrl?: string;
    link?: LinkAttachment;
    audioUrl?: string;
    audioInfo?: {
        filename: string;
        duration: string;
    };
    files?: FileAttachment[];
}

export interface Conversation {
    id: string;
    participants: (Artist | Engineer | Stoodio | Producer)[];
    messages: Message[];
    unreadCount: number;
    bookingId?: string;
    title?: string;
    imageUrl?: string;
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
        type: 'stoodio' | 'engineer' | 'producer';
        entity: Stoodio | Engineer | Producer;
        reason: string;
    }[];
}