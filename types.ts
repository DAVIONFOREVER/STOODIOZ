
// All type definitions for the Stoodioz application

export enum AppView {
    LANDING_PAGE = 'LANDING_PAGE',
    LOGIN = 'LOGIN',
    CHOOSE_PROFILE = 'CHOOSE_PROFILE',
    ARTIST_SETUP = 'ARTIST_SETUP',
    ENGINEER_SETUP = 'ENGINEER_SETUP',
    PRODUCER_SETUP = 'PRODUCER_SETUP',
    STOODIO_SETUP = 'STOODIO_SETUP',
    VIDEOGRAPHER_SETUP = 'VIDEOGRAPHER_SETUP',
    LABEL_SETUP = 'LABEL_SETUP',
    LABEL_SCOUTING = 'LABEL_SCOUTING',
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
    LABEL_DASHBOARD = 'LABEL_DASHBOARD',
    LABEL_IMPORT = 'LABEL_IMPORT',
    ACTIVE_SESSION = 'ACTIVE_SESSION',
    ADMIN_RANKINGS = 'ADMIN_RANKINGS',
    STUDIO_INSIGHTS = 'STUDIO_INSIGHTS',
    LEADERBOARD = 'LEADERBOARD',
    CLAIM_PROFILE = 'CLAIM_PROFILE',
    CLAIM_ENTRY = 'CLAIM_ENTRY',
    CLAIM_CONFIRM = 'CLAIM_CONFIRM',
    CLAIM_LABEL_PROFILE = 'CLAIM_LABEL_PROFILE',
    LABEL_PROFILE = 'LABEL_PROFILE',
    ASSET_VAULT = 'ASSET_VAULT',
    MASTER_CALENDAR = 'MASTER_CALENDAR',
}

export enum UserRole {
    ARTIST = 'ARTIST',
    ENGINEER = 'ENGINEER',
    PRODUCER = 'PRODUCER',
    STOODIO = 'STOODIO',
    VIDEOGRAPHER = 'VIDEOGRAPHER',
    LABEL = 'LABEL',
}

// --- PROJECT MANAGEMENT TYPES ---
export interface Project {
    id: string;
    label_id: string;
    artist_id: string;
    name: string;
    status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
    deadline?: string;
    created_at: string;
    tasks?: ProjectTask[];
}

export interface ProjectTask {
    id: string;
    project_id: string;
    title: string;
    assignee_id?: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    deadline?: string;
    created_at: string;
}

export interface MarketInsight {
    genre: string;
    region: string;
    trendScore: number; // 0-100
    description: string;
    suggestedArtists?: string[];
}

export enum AssetCategory {
    DEMO = 'DEMO',
    MASTER = 'MASTER',
    ARTWORK = 'ARTWORK',
    LEGAL = 'LEGAL',
    PRESS_KIT = 'PRESS_KIT'
}

export interface MediaAsset {
    id: string;
    name: string;
    url: string;
    type: string;
    category: AssetCategory;
    owner_id: string;
    project_id?: string;
    created_at: string;
    size: string;
    metadata?: any;
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
    CONTRACT_PAYOUT = 'CONTRACT_PAYOUT',
    CONTRACT_RECOUP = 'CONTRACT_RECOUP',
    LABEL_TOP_UP = 'LABEL_TOP_UP',
    MONTHLY_ALLOCATION = 'MONTHLY_ALLOCATION'
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
    PRODUCT_PURCHASE = 'PRODUCT_PURCHASE',
    VIDEOGRAPHY = 'VIDEOGRAPHY',
}

export enum NotificationType {
    BOOKING_REQUEST = 'BOOKING_REQUEST',
    BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
    BOOKING_DENIED = 'BOOKING_DENIED',
    NEW_FOLLOWER = 'NEW_FOLLOWER',
    NEW_LIKE = 'NEW_LIKE',
    NEW_COMMENT = 'NEW_COMMENT',
    NEW_TIP = 'NEW_TIP',
    SCHEDULE_REMINDER = 'SCHEDULE_REMINDER',
    TASK_ASSIGNED = 'TASK_ASSIGNED',
    CONTRACT_EXPIRING = 'CONTRACT_EXPIRING'
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

export type LabelContractType = 'FULL_RECOUP' | 'PERCENTAGE';
export type LabelContractStatus = 'active' | 'paused' | 'completed' | 'expiring';
export type LabelBudgetMode = 'MANUAL' | 'MONTHLY_FIXED' | 'MONTHLY_ROLLING';
export type PaymentSource = 'ARTIST' | 'LABEL';

export interface LabelContract {
    id: string;
    label_id: string;
    talent_user_id: string;
    talent_role: string;
    contract_type: LabelContractType;
    split_percent: number; // 0 to 100
    recoup_balance: number;
    advance_amount?: number;
    status: LabelContractStatus;
    created_at: string;
    updated_at: string;
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
    videographers: string[];
    labels: string[];
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
    // Revenue routing metadata
    contract_id?: string;
    recoup_applied?: number;
    label_amount?: number;
    provider_amount?: number;
    label_id?: string;
    source?: string;
    artist_name?: string;
    note?: string;
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
    role?: string;
}

export interface LabelPublicMetrics {
    total_streams?: number;
    charted_records?: number;
    countries_distributed?: number;
    certifications?: number;
}

export interface LabelRosterMetadata {
    [artistId: string]: {
        display: boolean;
        status: 'Developing' | 'Breakout' | 'Established';
        highlight_metric?: string;
    };
}

export interface LabelOpportunities {
    accepting_demos: boolean;
    hiring_producers: boolean;
    hiring_engineers: boolean;
    booking_studios: boolean;
    scouting: boolean;
}

export interface Label extends BaseUser {
    bio: string;
    company_name?: string;
    contact_phone?: string;
    website?: string;
    parent_company?: string;
    primary_genres?: string[];
    primary_regions?: string[];
    years_active?: number;
    mission_statement?: string;
    public_metrics?: LabelPublicMetrics;
    services_offered?: string[];
    affiliations?: string[];
    opportunities?: LabelOpportunities;
    roster_display_settings?: LabelRosterMetadata;
    is_public_profile_enabled?: boolean;
    section_visibility?: {
        mission?: boolean;
        roster?: boolean;
        metrics?: boolean;
        services?: boolean;
        partnerships?: boolean;
        opportunities?: boolean;
    };
}

export interface Artist extends BaseUser {
    bio: string;
    is_seeking_session: boolean;
    label_id?: string | null;
}

export interface Engineer extends BaseUser {
    bio: string;
    specialties: string[];
    is_available: boolean;
    availability: { date: string; times: string[] }[];
    mixing_services?: MixingServices;
    mixing_samples?: MixingSample[];
    masterclass?: Masterclass;
    notification_preferences?: {
        enabled: boolean;
        radius: number; // in miles
    };
    minimum_pay_rate?: number;
    label_id?: string | null;
}

export interface MixingServices {
    is_enabled: boolean;
    price_per_track: number;
    description: string;
    turnaround_time: string;
}

export interface MixingSample {
    id: string;
    title: string;
    description: string;
    audio_url: string;
    engineer_id: string;
    avg_rating?: number;
    rating_count?: number;
    user_rating?: number; // Current user's rating if they've rated it
}

export interface InHouseEngineerInfo {
    engineer_id: string;
    pay_rate: number;
}

export interface Stoodio extends BaseUser {
    description: string;
    location: string;
    business_address?: string;
    verification_status: VerificationStatus;
    amenities: string[];
    rooms: Room[];
    in_house_engineers: InHouseEngineerInfo[];
    availability: { date: string; times: string[] }[];
    photos: string[];
    hourly_rate?: number; // Base rate for search display
    engineer_pay_rate?: number; // Default pay rate for freelance engineers
}

export interface Room {
    id: string;
    name: string;
    description: string;
    hourly_rate: number;
    photos: string[];
    smoking_policy: SmokingPolicy;
}

export interface Producer extends BaseUser {
    bio: string;
    genres: string[];
    is_available: boolean;
    availability: { date: string; times: string[] }[];
    instrumentals: Instrumental[];
    pull_up_price?: number;
    masterclass?: Masterclass;
    label_id?: string | null;
}

export interface Instrumental {
    id: string;
    title: string;
    genre: string;
    price_lease: number;
    price_lease_wav?: number;
    price_exclusive: number;
    audio_url: string;
    wav_url?: string;
    stems_url?: string;
    cover_art_url?: string;
    tags: string[];
    producer_id?: string;
    is_free_download_available?: boolean;
}

/** Beat purchase tier: MP3 lease, WAV lease, or exclusive (WAV + stems). */
export type BeatPurchaseType = 'lease_mp3' | 'lease_wav' | 'exclusive';

export type ProducerProductType = 'drum_kit' | 'vst_preset' | 'sample_pack' | 'other';
export type ProducerProductDeliveryType = 'link' | 'file';

export interface ProducerProduct {
    id: string;
    producer_id: string;
    type: ProducerProductType;
    title: string;
    description?: string;
    price: number;
    delivery_type: ProducerProductDeliveryType;
    delivery_value: string;
    preview_url?: string;
    cover_url?: string;
    created_at?: string;
    updated_at?: string;
}

export interface MixingDetails {
    type: 'REMOTE' | 'IN_STUDIO';
    track_count: number;
    notes: string;
}

export interface BookingRequest {
    room?: Room; // Optional for remote/beat purchase
    date: string;
    start_time: string;
    duration: number;
    total_cost: number;
    engineer_pay_rate: number;
    request_type: BookingRequestType;
    requested_engineer_id?: string;
    producer_id?: string;
    instrumentals_to_purchase?: Instrumental[];
    mixing_details?: MixingDetails;
    pull_up_fee?: number;
    payment_source?: PaymentSource;
}

export interface Booking {
    id: string;
    stoodio?: Stoodio;
    engineer?: Engineer;
    producer?: Producer;
    room?: Room;
    artist?: Artist; // The user who booked (if Artist)
    date: string;
    start_time: string;
    duration: number;
    total_cost: number;
    status: BookingStatus;
    request_type: BookingRequestType;
    engineer_pay_rate: number;
    requested_engineer_id?: string;
    tip?: number;
    invoice_url?: string;
    instrumentals_purchased?: Instrumental[];
    /** For BEAT_PURCHASE: which tier was bought (determines MP3, WAV, or WAV+stems delivery). */
    beat_purchase_type?: BeatPurchaseType;
    /** Set when request_type is PRODUCT_PURCHASE; used for kit/preset delivery after payment. */
    product_purchase?: { product_id: string; delivery_type: 'link' | 'file'; delivery_value: string };
    mixing_details?: MixingDetails;
    posted_by?: UserRole;
    payment_source?: PaymentSource;
}

export interface SessionFeedback {
    id: string;
    booking_id: string;
    target_user_id: string; // The ID of who is being reviewed
    reviewer_id: string;
    star_rating: number; // 1-5
    pro_tags: string[]; // e.g. "Punctual", "Great Gear", "Fast Workflow"
    timestamp: string;
}

export interface Review {
    id: string;
    stoodio_id?: string;
    engineer_id?: string;
    producer_id?: string;
    artist_id?: string;
    masterclass_id?: string;
    reviewer_name: string;
    rating: number;
    comment: string;
    date: string;
}

export interface Message {
    id: string;
    sender_id: string;
    text: string;
    timestamp: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'link' | 'system' | 'files';
    image_url?: string;
    video_url?: string;
    audio_url?: string;
    link?: LinkAttachment;
    audio_info?: {
        filename: string;
        duration: string;
    };
    files?: FileAttachment[];
}

export interface FileAttachment {
    name: string;
    url: string;
    size: string;
    rawContent?: Uint8Array; // For client-side generation
}

export interface Conversation {
    id: string;
    participants: (Artist | Engineer | Stoodio | Producer | Label)[];
    messages: Message[];
    unread_count: number;
    title?: string;
    image_url?: string;
    booking_id?: string;
}

export interface AppNotification {
    id: string;
    recipient_id: string;
    type: NotificationType;
    message: string;
    read: boolean;
    timestamp: string;
    link?: { view: AppView; entityId?: string };
    actor?: Artist | Engineer | Stoodio | Producer | Label;
}

// FIX: Added 'generateReport' and 'scheduleReminder' actions to AriaActionResponse type to fix type mismatch in useAria hook.
export interface AriaActionResponse {
    type: 'navigate' | 'openModal' | 'showVibeMatchResults' | 'assistAccountSetup' | 'speak' | 'error' | 'sendMessage' | 'sendDocumentMessage' | 'createBooking' | 'updateProfile' | 'socialAction' | 'generateDocument' | 'labelControl' | 'mediaControl' | 'search' | 'generateReport' | 'scheduleReminder' | 'manageProject' | 'scoutMarket' | 'logout';
    target: string | null;
    value: any;
    text: string;
}

export interface AriaCantataMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
    files?: FileAttachment[];
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

export interface AriaNudgeData {
    text: string;
    action: {
        type: 'OPEN_MODAL' | 'NAVIGATE_DASHBOARD_TAB';
        payload: string;
    };
}

export interface ArtistScoutingData {
    id: string;
    name: string;
    image_url: string | null;
    city: string | null;
    genre: string[];
    followers: number;
    growth_30d: number;
    engagement_score: number; 
}

export interface AandRNote {
    artist_id: string;
    note: string;
    created_at: string;
}

export interface RosterImportRow {
    name: string;
    email: string;
    role: 'artist' | 'producer' | 'engineer';
    phone?: string;
    instagram?: string;
    notes?: string;
}

export interface ShadowProfile extends BaseUser {
    is_shadow: boolean;
    claimed_by_email?: string;
}

export interface RosterMember extends BaseUser {
    roster_id: string;
    role_in_label: string;

    // Invitation / claim state
    is_pending?: boolean;
    shadow_profile?: boolean;
    claim_token?: string;
    claim_code?: string;

    // Activity metrics
    posts_created?: number;
    uploads_count?: number;
    mixes_delivered?: number;
    output_score?: number;
    engagement_score?: number;
    songs_finished?: number;
    avg_session_rating?: number | null;
}

export interface LabelRosterEntry extends BaseUser {
    roster_id: string;
    role_in_label: string;
    shadow_profile: boolean;
    is_pending?: boolean;
}

export interface LabelBudget {
    id: string;
    label_id: string;
    total_budget: number;
    amount_spent: number;
    currency: string;
    fiscal_year: string;
    budget_mode?: LabelBudgetMode;
    monthly_allowance?: number;
    reset_day?: number;
}

export interface ArtistBudget {
    artist_id: string;
    artist_name: string;
    artist_image_url: string;
    allocation_amount: number;
    amount_spent: number;
}

export interface LabelBudgetOverview {
    budget: LabelBudget | null;
    artists: ArtistBudget[];
}
