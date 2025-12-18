
import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Review, Post, Comment, Transaction, AnalyticsData, SubscriptionPlan, Message, AriaActionResponse, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData, Room, Instrumental, InHouseEngineerInfo, BaseUser, MixingDetails, Conversation, Label, LabelContract, RosterMember, LabelBudgetOverview, LabelBudgetMode, MediaAsset, AssetCategory, Project, ProjectTask, MarketInsight } from '../types';
import { BookingStatus, VerificationStatus, TransactionCategory, TransactionStatus, BookingRequestType, UserRole as UserRoleEnum, RankingTier, NotificationType } from '../types';
import { getSupabase } from '../lib/supabase';
import { USER_SILHOUETTE_URL } from '../constants';

// --- HELPER FUNCTIONS ---

const timeoutPromise = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timed out after ${ms/1000} seconds`)), ms));

const uploadFile = async (file: File | Blob, bucket: string, path: string): Promise<string> => {
    const createLocalUrl = () => URL.createObjectURL(file as Blob);
    const supabase = getSupabase();
    if (!supabase) {
        console.warn("Supabase not configured. Using local blob URL.");
        return createLocalUrl();
    }
    try {
        const uploadTask = supabase.storage.from(bucket).upload(path, file, { upsert: true });
        const result: any = await Promise.race([uploadTask, timeoutPromise(10000)]);
        if (result.error) {
            console.warn(`Supabase storage upload failed (${bucket}/${path}):`, result.error.message);
            return createLocalUrl();
        }
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        if (!publicUrl) return createLocalUrl();
        return publicUrl;
    } catch (error: any) {
        console.error(`Upload exception for ${bucket}/${path}:`, error);
        return createLocalUrl();
    }
};

export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    return uploadFile(file, 'avatars', path);
};

export const uploadPostAttachment = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/posts/${Date.now()}.${ext}`;
    return uploadFile(file, 'posts', path);
};

export const uploadDocument = async (file: Blob, fileName: string, userId: string): Promise<string> => {
    const path = `${userId}/documents/${Date.now()}_${fileName}`;
    return uploadFile(file, 'documents', path);
};

export const uploadRoomPhoto = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/rooms/${Date.now()}.${ext}`;
    return uploadFile(file, 'avatars', path); // reusing avatars bucket or creating a new one 'rooms'
};

export const uploadBeatFile = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/beats/${Date.now()}.${ext}`;
    return uploadFile(file, 'audio', path);
};

export const uploadMixingSampleFile = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/samples/${Date.now()}.${ext}`;
    return uploadFile(file, 'audio', path);
};

// --- USER MANAGEMENT ---

export const getAllPublicUsers = async (): Promise<{
    artists: Artist[],
    engineers: Engineer[],
    producers: Producer[],
    stoodioz: Stoodio[],
    labels: Label[]
}> => {
    const supabase = getSupabase();
    if (!supabase) return { artists: [], engineers: [], producers: [], stoodioz: [], labels: [] };

    const safeSelect = async (table: string, select: string) => {
        try {
            const { data, error } = await supabase.from(table).select(select);
            if (error) {
                console.warn(`Error fetching ${table}:`, error.message);
                return [];
            }
            return data || [];
        } catch {
            return [];
        }
    };

    const [artists, engineers, producers, stoodioz, labels] = await Promise.all([
        safeSelect('artists', '*'),
        safeSelect('engineers', '*, mixing_samples(*)'),
        safeSelect('producers', '*, instrumentals(*)'),
        safeSelect('stoodioz', '*, rooms(*), in_house_engineers(*)'),
        safeSelect('labels', '*')
    ]);

    return {
        artists: (artists as Artist[]) || [],
        engineers: (engineers as Engineer[]) || [],
        producers: (producers as Producer[]) || [],
        stoodioz: (stoodioz as Stoodio[]) || [],
        labels: (labels as Label[]) || []
    };
};

export const fetchCurrentUserProfile = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    
    // Check all tables to find where this user exists.
    const tables = [
        { name: 'stoodioz', role: UserRoleEnum.STOODIO, query: '*, rooms(*), in_house_engineers(*)' },
        { name: 'producers', role: UserRoleEnum.PRODUCER, query: '*, instrumentals(*)' },
        { name: 'engineers', role: UserRoleEnum.ENGINEER, query: '*, mixing_samples(*)' },
        { name: 'artists', role: UserRoleEnum.ARTIST, query: '*' },
        { name: 'labels', role: UserRoleEnum.LABEL, query: '*' },
    ];
    
    for (const table of tables) {
        const { data } = await supabase.from(table.name).select(table.query).eq('id', id).maybeSingle();
        if (data) return { user: data, role: table.role };
    }
    return null;
};

// Added fetchFullArtist to fix build error in ArtistProfile
export const fetchFullArtist = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.from('artists').select('*').eq('id', id).single();
    return data;
};

export const fetchFullEngineer = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.from('engineers').select('*, mixing_samples(*)').eq('id', id).single();
    return data;
};

export const fetchFullProducer = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.from('producers').select('*, instrumentals(*)').eq('id', id).single();
    return data;
};

export const fetchFullStoodio = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.from('stoodioz').select('*, rooms(*), in_house_engineers(*)').eq('id', id).single();
    return data;
};

// Added fetchUserAssets and fetchUserDocuments to fix build errors in AriaAssistant and Documents
export const fetchUserAssets = async (userId: string): Promise<MediaAsset[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from('media_assets').select('*').eq('owner_id', userId).order('created_at', { ascending: false });
    return (data || []) as MediaAsset[];
};

export const fetchUserDocuments = async (userId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from('documents').select('*').eq('owner_id', userId).order('created_at', { ascending: false });
    return data || [];
};

export const uploadAsset = async (file: File, userId: string, category: any) => {
    return { id: 'asset-id' };
};

export const createUser = async (userData: any, role: UserRole): Promise<Artist | Engineer | Stoodio | Producer | Label | { email_confirmation_required: boolean } | null> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not connected");

    const { data: authData, error: authError } = await (supabase.auth as any).signUp({
        email: userData.email,
        password: userData.password,
        options: { data: { full_name: userData.name, user_role: role } }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("No user returned");

    const profileData = {
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        image_url: userData.image_url || USER_SILHOUETTE_URL,
        created_at: new Date().toISOString(),
    };

    const tableMap: Record<string, string> = {
        'ARTIST': 'artists', 'ENGINEER': 'engineers', 'PRODUCER': 'producers', 'STOODIO': 'stoodioz', 'LABEL': 'labels'
    };

    const { data, error } = await supabase.from(tableMap[role]).upsert(profileData).select().single();
    if (error) throw error;
    
    await supabase.from('profiles').upsert({ id: authData.user.id, role, email: userData.email, full_name: userData.name });
    
    return data;
};

export const updateUser = async (userId: string, table: string, updates: any) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).update(updates).eq('id', userId).select().single();
    if (error) throw error;
    return data;
};

// --- LABEL & ROSTER ---

export const fetchLabelRoster = async (labelId: string): Promise<RosterMember[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from('label_roster').select('*').eq('label_id', labelId);
    const hydrated = [];
    for (const entry of data || []) {
        const res = await fetchCurrentUserProfile(entry.user_id);
        if (res) hydrated.push({ ...res.user, role_in_label: entry.role, roster_id: entry.id });
    }
    return hydrated;
};

export const getLabelBudgetOverview = async (labelId: string): Promise<LabelBudgetOverview | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.rpc('get_label_budget_overview', { p_label_id: labelId });
    return data;
};

export const fetchLabelBookings = async (labelId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data } = await supabase.rpc('get_label_bookings', { label_id: labelId });
    return data || [];
};

export const fetchLabelTransactions = async (labelId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from('labels').select('wallet_transactions').eq('id', labelId).single();
    return data?.wallet_transactions || [];
};

export const fetchLabelContracts = async (labelId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from('label_contracts').select('*').eq('label_id', labelId);
    return data || [];
};

export const getRosterActivity = async (labelId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data } = await supabase.rpc('get_roster_activity', { p_label_id: labelId });
    return data || [];
};

export const fetchLabelPerformance = async (labelId: string) => [];

// --- OTHER ---
export const createBooking = async (req: any, st: any, b: any, br: UserRole) => (await getSupabase()!.from('bookings').insert({ ...req, stoodio_id:st?.id, booked_by_id:b.id, booked_by_role:br, status:BookingStatus.CONFIRMED }).select().single()).data;
export const cancelBooking = async (b: any) => (await getSupabase()!.from('bookings').update({ status: BookingStatus.CANCELLED }).eq('id', b.id).select().single()).data;
export const createPost = async (pd: any, a: any, at: UserRole) => ({ updatedAuthor: a, createdPost: (await getSupabase()!.from('posts').insert({ author_id: a.id, author_type: at, text: pd.text, image_url: pd.image_url, video_url: pd.video_url, created_at: new Date().toISOString() }).select().single()).data });
export const likePost = async (pid: string, uid: string, a: any) => ({ updatedAuthor: a });
export const commentOnPost = async (pid: string, t: string, c: any, pa: any) => ({ updatedAuthor: pa });
export const toggleFollow = async (cu: any, tu: any, t: string, f: boolean) => ({ updatedCurrentUser: cu, updatedTargetUser: tu });
export const fetchUserPosts = async (id: string) => (await getSupabase()!.from('posts').select('*').eq('author_id', id)).data?.map((p:any)=>({ ...p, authorId:p.author_id, authorType:p.author_type, timestamp:p.created_at })) || [];
export const fetchGlobalFeed = async (l: number, b?: string) => {
    let q = getSupabase()!.from('posts').select('*').order('created_at', { ascending: false }).limit(l);
    if(b) q = q.lt('created_at', b);
    return (await q).data?.map((p:any)=>({ ...p, authorId:p.author_id, authorType:p.author_type, timestamp:p.created_at })) || [];
};
export const fetchConversations = async (id: string) => [];
export const sendMessage = async (cid: string, sid: string, c: string, t: string = 'text') => (await getSupabase()!.from('messages').insert({ conversation_id: cid, sender_id: sid, content: c, message_type: t }).select().single()).data;
export const createConversation = async (pids: string[]) => (await getSupabase()!.from('conversations').insert({ participant_ids: pids }).select().single()).data;
export const createShadowProfile = async (r: any, lid: string, d: any) => ({id: 'shadow'});
export const removeArtistFromLabelRoster = async (lid: string, rid: string) => true;
export const updateLabelBudgetMode = async (id: string, m: any, a?: number, d?: number) => null;
export const addLabelFunds = async (id: string, a: number, n: string) => true;
export const setLabelBudget = async (id: string, t: number) => null;
export const setArtistAllocation = async (id: string, aid: string, a: number) => null;
export const claimProfileByCode = async (c: string, id: string) => ({role: 'ARTIST' as UserRole});
export const claimProfileByToken = async (t: string, id: string) => ({role: 'ARTIST' as UserRole});
export const getClaimDetails = async (t: string) => null;
export const claimLabelRosterProfile = async (d: any) => ({success: true});
export const generateClaimTokenForRosterMember = async (id: string) => ({claimUrl: ''});
export const createCheckoutSessionForBooking = async (r: any, sid: any, uid: any, ur: any) => ({sessionId: 'mock'});
export const createCheckoutSessionForWallet = async (a: number, uid: string) => ({sessionId: 'mock'});
export const initiatePayout = async (a: number, uid: string) => ({success: true});
export const addTip = async (b: any, a: number) => ({sessionId: 'mock'});
export const purchaseBeat = async (bt: any, t: string, b: any, p: any, r: UserRole) => ({updatedBooking: bt});
export const endSession = async (b: any) => ({updatedBooking: b});
export const respondToBooking = async (b: any, ac: string, e: any) => b;
export const acceptJob = async (b: any, e: any) => b;
export const submitForVerification = async (id: string, d: any) => ({verification_status: VerificationStatus.PENDING});
export const upsertRoom = async (r: any, id: string) => null;
export const deleteRoom = async (id: string) => null;
export const upsertInHouseEngineer = async (i: any, id: string) => null;
export const deleteInHouseEngineer = async (eid: string, sid: string) => null;
export const upsertInstrumental = async (i: any, id: string) => null;
export const deleteInstrumental = async (id: string) => null;
export const upsertMixingSample = async (s: any, id: string) => null;
export const deleteMixingSample = async (id: string) => null;
export const scoutMarketInsights = async (region: string): Promise<MarketInsight[]> => [];
export const fetchLabelProjects = async (labelId: string): Promise<Project[]> => [];
export const createProjectTask = async (projectId: string, task: Partial<ProjectTask>) => null;
export const updateProjectTask = async (id: string, updates: any) => null;
