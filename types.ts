
export enum AppView {
    LANDING_PAGE = 'LANDING_PAGE',
    LOGIN = 'LOGIN',
    CHOOSE_PROFILE = 'CHOOSE_PROFILE',
    ARTIST_SETUP = 'ARTIST_SETUP',
    ENGINEER_SETUP = 'ENGINEER_SETUP',
    PRODUCER_SETUP = 'PRODUCER_SETUP',
    STOODIO_SETUP = 'STOODIO_SETUP',
    PRIVACY_POLICY = 'PRIVACY_POLICY',
    STOODIO_LIST = 'STOODIO_LIST',
    STOODIO_DETAIL = 'STOODIO_DETAIL',
    BOOKING_MODAL = 'BOOKING_MODAL',
    CONFIRMATION = 'CONFIRMATION',
    MY_BOOKINGS = 'MY_BOOKINGS',
    STOODIO_DASHBOARD = 'STOODIO_DASHBOARD',
    ENGINEER_DASHBOARD = 'ENGINEER_DASHBOARD',
    PRODUCER_DASHBOARD = 'PRODUCER_DASHBOARD',
    ARTIST_DASHBOARD = 'ARTIST_DASHBOARD',
    INBOX = 'INBOX',
    ACTIVE_SESSION = 'ACTIVE_SESSION',
    ARTIST_LIST = 'ARTIST_LIST',
    ARTIST_PROFILE = 'ARTIST_PROFILE',
    ENGINEER_LIST = 'ENGINEER_LIST',
    ENGINEER_PROFILE = 'ENGINEER_PROFILE',
    PRODUCER_LIST = 'PRODUCER_LIST',
    PRODUCER_PROFILE = 'PRODUCER_PROFILE',
    MAP_VIEW = 'MAP_VIEW',
    THE_STAGE = 'THE_STAGE',
    VIBE_MATCHER_RESULTS = 'VIBE_MATCHER_RESULTS',
    SUBSCRIPTION_PLANS = 'SUBSCRIPTION_PLANS',
}

export enum UserRole {
    ARTIST = 'ARTIST',
    ENGINEER = 'ENGINEER',
    STOODIO = 'STOODIO',
    PRODUCER = 'PRODUCER',
}

export enum BookingStatus {
    PENDING = 'PENDING',
    PENDING_APPROVAL = 'PENDING_APPROVAL',
    CONFIRMED = 'CONFIRMED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export enum BookingRequestType {
    FIND_AVAILABLE = 'FIND_AVAILABLE',
    SPECIFIC_ENGINEER = 'SPECIFIC_ENGINEER',
    BRING_YOUR_OWN = 'BRING_YOUR_OWN',
}

export enum NotificationType {
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

export enum SmokingPolicy {
    NON_SMOKING = 'NON_SMOKING',
    SMOKING_ALLOWED = 'SMOKING_ALLOWED',
}

export enum SubscriptionPlan {
    ARTIST_FREE = 'ARTIST_FREE',
    ENGINEER_PLUS = 'ENGINEER_PLUS',
    PRODUCER_PRO = 'PRODUCER_PRO',
    STOODIO_PRO = 'STOODIO_PRO',
}

export enum TransactionCategory {
    ADD_FUNDS = 'ADD_FUNDS',
    WITHDRAWAL = 'WITHDRAWAL',
    SESSION_PAYMENT = 'SESSION_PAYMENT',
    SESSION_PAYOUT = 'SESSION_PAYOUT',
    TIP_PAYMENT = 'TIP_PAYMENT',
    TIP_PAYOUT = 'TIP_PAYOUT',
    REFUND = 'REFUND',
    BEAT_PURCHASE = 'BEAT_PURCHASE',
    BEAT_PAYOUT = 'BEAT_PAYOUT',
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export interface Location {
    lat: number;
    lon: number;
}

export interface Following {
    stoodioz: string[];
    engineers: string[];
    artists: string[];
    producers: string[];
}

export interface LinkAttachment {
    url: string;
    title: string;
    description: string;
    imageUrl?: string;
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

export interface Instrumental {
    id: string;
    title: string;
    audioUrl: string;
    priceLease: number;
    priceExclusive: number;
    genre: string;
    tags: string[];
    coverArtUrl?: string;
    isFreeDownloadAvailable?: boolean;
}

export interface MixingSample {
    id: string;
    title: string;
    description: string;
    audioUrl: string;
}

export interface MixingServices {
    isEnabled: boolean;
    pricePerTrack: number;
    description: string;
    turnaroundTime: string; // e.g., "3-5 business days"
}

// FIX: Renamed WalletTransaction to Transaction to fix multiple import errors.
export interface Transaction {
    id: string;
    description: string;
    amount: number;
    date: string;
    category: TransactionCategory;
    status: TransactionStatus;
    relatedBookingId?: string;
    relatedUserName?: string;
}

export interface BaseUser {
    id: string;
    name: string;
    email: string;
    password?: string;
    imageUrl: string;
    followers: number;
    following: Following;
    followerIds: string[];
    coordinates: Location;
    isOnline?: boolean;
    walletBalance: number;
    // FIX: Changed Transaction to WalletTransaction to match the interface name. Now changed back as interface is renamed.
    walletTransactions: Transaction[];
    posts?: Post[];
    links?: { title: string, url: string }[];
    subscription?: {
        plan: SubscriptionPlan;
        validUntil: string;
    }
}

export interface Artist extends BaseUser {
    bio: string;
    isSeekingSession: boolean;
    showOnMap: boolean;
}

export interface Engineer extends BaseUser {
    bio: string;
    specialties: string[];
    rating: number;
    sessionsCompleted: number;
    isAvailable: boolean;
    showOnMap: boolean;
    displayExactLocation: boolean;
    mixingSamples?: MixingSample[];
    minimumPayRate?: number;
    notificationPreferences?: {
        enabled: boolean;
        radius: number;
    };
    mixingServices?: MixingServices;
    // FIX: Added optional availability property for consistency with AvailabilityManager component.
    availability?: { date: string; times: string[] }[];
}

export interface InHouseEngineerInfo {
    engineerId: string;
    payRate: number;
}
export interface Room {
    id: string;
    name: string;
    description: string;
    hourlyRate: number;
    photos: string[];
    smokingPolicy: SmokingPolicy;
}

export interface Stoodio extends BaseUser {
    description: string;
    location: string;
    businessAddress?: string;
    hourlyRate: number;
    engineerPayRate: number;
    rating: number;
    amenities: string[];
    availability: { date: string; times: string[] }[];
    photos: string[];
    inHouseEngineers?: InHouseEngineerInfo[];
    rooms: Room[];
    verificationStatus: VerificationStatus;
    googleBusinessProfileUrl?: string;
    websiteUrl?: string;
    showOnMap?: boolean;
    animatedLogoUrl?: string;
}

export interface Producer extends BaseUser {
    bio: string;
    genres: string[];
    rating: number;
    instrumentals: Instrumental[];
    isAvailable: boolean;
    showOnMap: boolean;
    pullUpPrice?: number;
    // FIX: Added optional availability property for consistency with AvailabilityManager component.
    availability?: { date: string; times: string[] }[];
}

export interface Booking {
    id: string;
    stoodio: Stoodio | null;
    artist: Artist | null;
    engineer: Engineer | null;
    producer: Producer | null;
    date: string;
    startTime: string;
    duration: number;
    totalCost: number;
    status: BookingStatus;
    bookedById: string;
    bookedByRole: UserRole;
    requestType: BookingRequestType;
    requestedEngineerId: string | null;
    engineerPayRate: number;
    tip?: number;
    instrumentalsPurchased?: Instrumental[];
    mixingDetails?: MixingDetails;
    postedBy?: UserRole;
}

export interface BookingRequest {
    // FIX: Made room optional to accommodate remote mixing requests without a physical room.
    room?: Room;
    date: string;
    startTime: string;
    duration: number;
    totalCost: number;
    requestType: BookingRequestType;
    requestedEngineerId?: string;
    engineerPayRate: number;
    producerId?: string;
    instrumentalsToPurchase?: Instrumental[];
    pullUpFee?: number;
    mixingDetails?: MixingDetails;
    requiredSkills?: string[];
}

export interface MixingDetails {
    type: 'REMOTE' | 'IN_STUDIO';
    trackCount: number;
    notes: string;
}

export interface Review {
    id: string;
    reviewerName: string;
    artistId?: string;
    stoodioId?: string;
    engineerId?: string;
    producerId?: string;
    rating: number;
    comment: string;
    date: string;
}

export interface AppNotification {
    id: string;
    type: NotificationType;
    message: string;
    timestamp: string;
    read: boolean;
    actor?: {
        id: string;
        name: string;
        imageUrl: string;
    };
    link?: {
        view: AppView;
        entityId: string;
    };
}

export interface FileAttachment {
    name: string;
    url: string;
    size: string;
}

export interface Message {
    id: string;
    senderId: string;
    timestamp: string;
    text?: string;
    imageUrl?: string;
    audioUrl?: string;
    audioInfo?: { filename: string, duration: string };
    link?: { title: string, url: string };
    files?: FileAttachment[];
    type: 'text' | 'image' | 'audio' | 'link' | 'system' | 'files';
}

export interface Conversation {
    id: string;
    participants: (Artist | Stoodio | Engineer | Producer)[];
    messages: Message[];
    unreadCount: number;
    title?: string;
    imageUrl?: string;
    bookingId?: string;
}

export interface VibeMatchResult {
    vibeDescription: string;
    tags: string[];
    recommendations: {
        entity: Stoodio | Engineer | Producer;
        type: 'stoodio' | 'engineer' | 'producer';
        reason: string;
    }[];
}

export type AriaCantataMessage = {
    role: 'user' | 'model';
    parts: { text: string }[];
};

export type AriaActionResponse = {
    type: 'text' | 'function';
    text: string;
    action?: string;
    payload?: any;
};

// Analytics Types
export interface RevenueDataPoint {
    date: string;
    revenue: number;
}

export interface EngagementDataPoint {
    date: string;
    views: number;
    followers: number;
    likes: number;
}

export interface RevenueSource {
    name: string;
    revenue: number;
}

export interface AnalyticsData {
    kpis: {
        totalRevenue: number;
        profileViews: number;
        newFollowers: number;
        bookings: number;
    };
    revenueOverTime: RevenueDataPoint[];
    engagementOverTime: EngagementDataPoint[];
    revenueSources: RevenueSource[];
}