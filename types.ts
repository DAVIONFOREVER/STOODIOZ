
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
    // Label Routes
    LABEL_DASHBOARD = 'LABEL_DASHBOARD',
    LABEL_ROSTER = 'LABEL_ROSTER',
    LABEL_BOOKINGS = 'LABEL_BOOKINGS',
    LABEL_ANALYTICS = 'LABEL_ANALYTICS',
    LABEL_TEAM = 'LABEL_TEAM',
    LABEL_GLOBAL_RANKINGS = 'LABEL_GLOBAL_RANKINGS',
    LABEL_SETTINGS = 'LABEL_SETTINGS',
}

export enum UserRole {
    ARTIST = 'ARTIST',
    ENGINEER = 'ENGINEER',
    PRODUCER = 'PRODUCER',
    STOODIO = 'STOODIO',
    LABEL = 'LABEL',
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
    MASTERCLASS_PURCHASE = 'MASTERCLASS_PURCHASE',
    MASTERCLASS_PAYOUT = 'MASTERCLASS_PAYOUT',
    BEAT_PURCHASE = 'BEAT_PURCHASE',
    BEAT_SALE = 'BEAT_SALE',
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
    BEAT_PURCHASE = 'BEAT_PURCHASE',
}

export enum NotificationType {
    BOOKING_REQUEST = 'BOOKING_REQUEST',
    BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
    BOOKING_DENIED = 'BOOKING_DENIED',
    NEW_FOLLOWER = 'NEW_FOLLOWER',
    NEW_LIKE = 'NEW_LIKE',
    NEW_COMMENT = 'NEW_COMMENT',
    NEW_TIP = 'NEW_TIP',
    ROSTER_INVITE = 'ROSTER_INVITE',
    TEAM_INVITE = 'TEAM_INVITE',
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
    image_url?: string;
}

export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    author_image_url: string;
    text: string;
    timestamp: string;
}

export interface Post {
    id: string;
    authorId: string;
    authorType: UserRole;
    timestamp: string;
    text: string;
    image_url?: string;
    video_url?: string;
    video_thumbnail_url?: string;
    link?: LinkAttachment;
    likes: string[];
    comments: Comment[];
    display_mode?: 'fit' | 'fill';
    focus_point?: { x: number; y: number };
}

export interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: TransactionCategory;
    status: TransactionStatus;
    related_booking_id?: string;
    related_user_name?: string;
}

export interface Subscription {
    plan: SubscriptionPlan;
    status: 'active' | 'cancelled' | 'past_due';
    startDate: string;
    endDate: string | null;
}

export interface Masterclass {
    id: string;
    is_enabled: boolean;
    title: string;
    description: string;
    video_url: string;
    price: number;
}

export interface BaseUser {
    id: string;
    name: string;
    email: string;
    password?: string;
    image_url: string;
    cover_image_url?: string;
    animated_logo_url?: string;
    followers: number;
    follower_ids: string[];
    following: Following;
    posts?: Post[];
    wallet_balance: number;
    wallet_transactions: Transaction[];
    coordinates: Location;
    show_on_map: boolean;
    is_online: boolean;
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
    purchased_masterclass_ids?: string[];
}

export interface Artist extends BaseUser {
    bio: string;
    is_seeking_session: boolean;
}

export interface MixingSample {
    id: string;
    title: string;
    description: string;
    audio_url: string;
}

export interface MixingServices {
    is_enabled: boolean;
    price_per_track: number;
    description: string;
    turnaround_time: string;
}

export interface Engineer extends BaseUser {
    bio: string;
    specialties: string[];
    mixing_samples?: MixingSample[];
    is_available: boolean;
    display_exact_location?: boolean;
    notification_preferences?: {
        enabled: boolean;
        radius: number;
    };
    minimum_pay_rate?: number;
    mixing_services?: MixingServices;
    masterclass?: Masterclass;
    availability?: { date: string, times: string[] }[];
}

export interface Instrumental {
    id: string;
    title: string;
    genre: string;
    tags: string[];
    price_lease: number;
    price_exclusive: number;
    audio_url: string;
    cover_art_url?: string;
    is_free_download_available?: boolean;
}

export interface Producer extends BaseUser {
    bio: string;
    genres: string[];
    instrumentals: Instrumental[];
    pull_up_price?: number;
    is_available: boolean;
    masterclass?: Masterclass;
    availability?: { date: string, times: string[] }[];
}

export interface Room {
    id: string;
    name: string;
    description: string;
    hourly_rate: number;
    photos: string[];
    smoking_policy: SmokingPolicy;
}

export interface InHouseEngineerInfo {
    engineer_id: string;
    pay_rate: number;
}

export interface Stoodio extends BaseUser {
    description: string;
    location: string;
    business_address: string;
    hourly_rate: number;
    engineer_pay_rate: number;
    amenities: string[];
    availability: { date: string, times: string[] }[];
    photos: string[];
    rooms: Room[];
    verification_status: VerificationStatus;
    in_house_engineers?: InHouseEngineerInfo[];
}

export interface Label extends BaseUser {
    display_name: string;
    company_name?: string;
    contact_phone?: string;
    notes?: string;
}

export interface LabelMember {
    id: string;
    label_id: string;
    user_id: string;
    role: 'owner' | 'anr' | 'assistant' | 'finance';
    invited_email?: string;
}

export interface MixingDetails {
    type: 'REMOTE' | 'IN_STUDIO';
    track_count: number;
    notes: string;
}

export interface Booking {
    id: string;
    date: string;
    start_time: string;
    duration: number;
    total_cost: number;
    status: BookingStatus;
    booked_by_id: string;
    booked_by_role: UserRole;
    request_type: BookingRequestType;
    engineer_pay_rate: number;
    stoodio?: Stoodio;
    artist?: Artist;
    engineer?: Engineer;
    producer?: Producer;
    requested_engineer_id?: string;
    mixing_details?: MixingDetails;
    posted_by?: UserRole;
    coordinates?: Location;
    instrumentals_purchased?: Instrumental[];
    tip?: number;
    invoice_url?: string;
    label_id?: string;
    payer_type?: 'artist' | 'label' | 'split';
    payer_notes?: string;
    created_by_user?: string;
}

export interface BookingRequest {
    date: string;
    start_time: string;
    duration: number;
    total_cost: number;
    request_type: BookingRequestType;
    engineer_pay_rate: number;
    room?: Room;
    requested_engineer_id?: string;
    producer_id?: string;
    instrumentals_to_purchase?: Instrumental[];
    pull_up_fee?: number;
    mixing_details?: MixingDetails;
    requiredSkills?: string[]; // For job posts
    payer_type?: 'artist' | 'label' | 'split';
    payer_notes?: string;
    artist_id?: string; // For label bookings
}

export interface FileAttachment {
    name: string;
    url: string;
    size: string;
    rawContent?: Uint8Array | string;
}

export interface Message {
    id: string;
    sender_id: string;
    timestamp: string;
    type: 'text' | 'image' | 'link' | 'audio' | 'files' | 'system';
    text?: string;
    image_url?: string;
    link?: { title: string; url: string };
    audio_url?: string;
    audio_info?: { filename: string; duration: string };
    files?: FileAttachment[];
}

export interface Conversation {
    id: string;
    participants: (Artist | Stoodio | Engineer | Producer | Label)[];
    messages: Message[];
    unread_count: number;
    title?: string;
    image_url?: string;
    booking_id?: string;
}

export interface AppNotification {
    id: string;
    type: NotificationType;
    message: string;
    timestamp: string;
    read: boolean;
    actor?: { id: string, name: string, image_url: string };
    link?: { view: AppView, entityId?: string };
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

export interface AriaActionResponse {
    type: 'navigate' | 'openModal' | 'showVibeMatchResults' | 'assistAccountSetup' | 'sendMessage' | 'sendDocumentMessage' | 'speak' | 'error' | 'rosterAction' | 'bookingAction' | 'teamAction' | 'analyticsAction' | 'rankingAction';
    target: string | null;
    value: any | null;
    text: string;
}

export interface AriaCantataMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
    files?: FileAttachment[];
}

export interface AriaNudgeData {
    text: string;
    action: {
        type: 'OPEN_MODAL' | 'NAVIGATE_DASHBOARD_TAB';
        payload: string;
    };
}

export interface Review {
    id: string;
    stoodio_id?: string;
    engineer_id?: string;
    producer_id?: string;
    masterclass_id?: string;
    artist_id?: string;
    reviewer_name: string;
    rating: number;
    comment: string;
    date: string;
}

export interface AnalyticsData {
    kpis: {
        totalRevenue: number;
        profileViews: number;
        newFollowers: number;
        bookings: number;
    };
    revenueOverTime: { date: string, revenue: number }[];
    engagementOverTime: { date: string, views: number, followers: number, likes: number }[];
    revenueSources: { name: string, revenue: number }[];
}

export interface SessionFeedback {
    id: string;
    target_user_id: string;
    timestamp: string;
    star_rating: number;
    pro_tags: string[];
}
