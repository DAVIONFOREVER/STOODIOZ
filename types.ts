// All type definitions for the Stoodioz application

export enum AppView {
    LANDING_PAGE = 'LANDING_PAGE',
    LOGIN = 'LOGIN',
    CHOOSE_PROFILE = 'CHOOSE_PROFILE',
    ARTIST_SETUP = 'ARTIST_SETUP',
    ENGINEER_SETUP = 'ENGINEER_SETUP',
    PRODUCER_SETUP = 'PRODUCER_SETUP',
    STOODIO_SETUP = 'STOODIO_SETUP',
    PRIVACY_POLICY = 'PRIVACY_POLICY',
    SUBSCRIPTION_PLANS = 'SUBSCRIPTION_PLANS',
    STOODIO_LIST = 'STOODIO_LIST',
    STOODIO_DETAIL = 'STOODIO_DETAIL',
    BOOKING_MODAL = 'BOOKING_MODAL',
    CONFIRMATION = 'CONFIRMATION',
    MY_BOOKINGS = 'MY_BOOKINGS',
    INBOX = 'INBOX',
    MAP_VIEW = 'MAP_VIEW',
    ARTIST_LIST = 'ARTIST_LIST',
    ARTIST_PROFILE = 'ARTIST_PROFILE',
    ENGINEER_LIST = 'ENGINEER_LIST',
    ENGINEER_PROFILE = 'ENGINEER_PROFILE',
    PRODUCER_LIST = 'PRODUCER_LIST',
    PRODUCER_PROFILE = 'PRODUCER_PROFILE',
    THE_STAGE = 'THE_STAGE',
    VIBE_MATCHER_RESULTS = 'VIBE_MATCHER_RESULTS',
    ARTIST_DASHBOARD = 'ARTIST_DASHBOARD',
    STOODIO_DASHBOARD = 'STOODIO_DASHBOARD',
    ENGINEER_DASHBOARD = 'ENGINEER_DASHBOARD',
    PRODUCER_DASHBOARD = 'PRODUCER_DASHBOARD',
    ACTIVE_SESSION = 'ACTIVE_SESSION',
    ADMIN_RANKINGS = 'ADMIN_RANKINGS',
    STUDIO_INSIGHTS = 'STUDIO_INSIGHTS',
    LEADERBOARD = 'LEADERBOARD',
}

export enum UserRole {
    ARTIST = 'ARTIST',
    ENGINEER = 'ENGINEER',
    PRODUCER = 'PRODUCER',
    STOODIO = 'STOODIO',
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

export enum TransactionCategory {
    ADD_FUNDS = 'ADD_FUNDS',
    SESSION_PAYMENT = 'SESSION_PAYMENT',
    SESSION_PAYOUT = 'SESSION_PAYOUT',
    TIP_PAYMENT = 'TIP_PAYMENT',
    TIP_PAYOUT = 'TIP_PAYOUT',
    REFUND = 'REFUND',
    WITHDRAWAL = 'WITHDRAWAL',
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
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

export enum SubscriptionPlan {
    ENGINEER_PLUS = 'ENGINEER_PLUS',
    PRODUCER_PRO = 'PRODUCER_PRO',
    STOODIO_PRO = 'STOODIO_PRO',
}

export enum RankingTier {
    Provisional = 'Provisional',
    Bronze = 'Bronze',
    Silver = 'Silver',
    Gold = 'Gold',
    Platinum = 'Platinum',
    Elite = 'Elite',
}

export interface Location {
    lat: number;
    lon: number;
}

export interface Following {
    artists: string[];
    engineers: string[];
    stoodioz: string[];
    producers: string[];
}

export interface Link {
    title: string;
    url: string;
}

export interface LinkAttachment {
    url: string;
    title: string;
    description?: string;
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
    timestamp: string;
    text: string;
    imageUrl?: string;
    videoUrl?: string;
    videoThumbnailUrl?: string;
    link?: LinkAttachment;
    likes: string[];
    comments: Comment[];
}

export interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: TransactionCategory;
    status: TransactionStatus;
    relatedBookingId?: string;
    relatedUserName?: string;
}

export interface Subscription {
    plan: SubscriptionPlan;
    status: 'active' | 'cancelled' | 'past_due';
    startDate: string;
    endDate: string | null;
}

export interface BaseUser {
    id: string;
    name: string;
    email: string;
    password?: string;
    imageUrl: string;
    coverImageUrl?: string;
    followers: number;
    followerIds: string[];
    following: Following;
    posts?: Post[];
    walletBalance: number;
    walletTransactions: Transaction[];
    coordinates: Location;
    showOnMap: boolean;
    isOnline: boolean;
    links?: Link[];
    isAdmin?: boolean;
    subscription?: Subscription;
    rating_overall: number;
    sessions_completed: number;
    ranking_tier: RankingTier;
    is_on_streak: boolean;
    on_time_rate: number;
    completion_rate: number;
    repeat_hire_rate: number;
    strength_tags: string[];
    local_rank_text: string;
}

export interface Artist extends BaseUser {
    bio: string;
    isSeekingSession: boolean;
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
    turnaroundTime: string;
}

export interface Engineer extends BaseUser {
    bio: string;
    specialties: string[];
    mixingSamples?: MixingSample[];
    isAvailable: boolean;
    displayExactLocation?: boolean;
    notificationPreferences?: {
        enabled: boolean;
        radius: number;
    };
    minimumPayRate?: number;
    mixingServices?: MixingServices;
}

export interface Instrumental {
    id: string;
    title: string;
    genre: string;
    tags: string[];
    priceLease: number;
    priceExclusive: number;
    audioUrl: string;
    coverArtUrl?: string;
    isFreeDownloadAvailable?: boolean;
}

export interface Producer extends BaseUser {
    bio: string;
    genres: string[];
    instrumentals: Instrumental[];
    pullUpPrice?: number;
    isAvailable: boolean;
}

export interface Room {
    id: string;
    name: string;
    description: string;
    hourlyRate: number;
    photos: string[];
    smokingPolicy: SmokingPolicy;
}

export interface InHouseEngineerInfo {
    engineerId: string;
    payRate: number;
}

export interface Stoodio extends BaseUser {
    description: string;
    location: string;
    businessAddress?: string;
    hourlyRate: number; // Base rate
    engineerPayRate: number;
    amenities: string[];
    availability: { date: string, times: string[] }[];
    photos: string[];
    rooms: Room[];
    inHouseEngineers?: InHouseEngineerInfo[];
    verificationStatus: VerificationStatus;
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
    producerId?: string;
    instrumentalsToPurchase?: Instrumental[];
    pullUpFee?: number;
    mixingDetails?: MixingDetails;
    requiredSkills?: string[];
}

export interface Booking {
    id: string;
    date: string;
    startTime: string;
    duration: number;
    totalCost: number;
    status: BookingStatus;
    stoodio?: Stoodio;
    artist?: Artist;
    engineer?: Engineer;
    producer?: Producer;
    bookedById: string;
    requestType: BookingRequestType;
    requestedEngineerId?: string;
    engineerPayRate: number;
    instrumentalsPurchased?: Instrumental[];
    tip?: number;
    coordinates?: Location;
    mixingDetails?: MixingDetails;
    postedBy?: UserRole;
}

export interface Review {
    id: string;
    stoodioId?: string;
    engineerId?: string;
    artistId?: string;
    reviewerName: string;
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
        entityId?: string;
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
    type: 'text' | 'image' | 'link' | 'audio' | 'files' | 'system';
    text?: string;
    imageUrl?: string;
    link?: Link;
    audioUrl?: string;
    audioInfo?: { filename: string; duration: string };
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

export interface VibeMatchResult {
    vibeDescription: string;
    tags: string[];
    recommendations: {
        type: 'stoodio' | 'engineer' | 'producer';
        entity: Stoodio | Engineer | Producer;
        reason: string;
    }[];
}

export interface AriaCantataMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface AriaActionResponse {
    type: 'text' | 'function';
    text: string;
    action?: string;
    payload?: any;
}

export interface AnalyticsData {
    kpis: {
        totalRevenue: number;
        profileViews: number;
        newFollowers: number;
        bookings: number;
    };
    revenueOverTime: { date: string; revenue: number }[];
    engagementOverTime: { date: string; views: number; followers: number; likes: number }[];
    revenueSources: { name: string; revenue: number }[];
}

export interface SessionFeedback {
    id: string;
    booking_id: string;
    target_user_id: string;
    star_rating: number;
    pro_tags: string[];
    con_tags: string[];
    timestamp: string;
}