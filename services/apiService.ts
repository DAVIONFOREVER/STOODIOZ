import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Review, Post, Comment, Transaction, AnalyticsData, SubscriptionPlan, Message, AriaActionResponse, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData, Room, Instrumental, InHouseEngineerInfo, BaseUser, MixingDetails, Conversation, Label, LabelContract, RosterMember, LabelBudgetOverview, LabelBudgetMode, Following, MediaAsset, Project, ProjectTask, MarketInsight } from '../types';
import { BookingStatus, VerificationStatus, TransactionCategory, TransactionStatus, BookingRequestType, UserRole as UserRoleEnum, RankingTier, NotificationType, AssetCategory } from '../types';
import { getSupabase, performLogout } from '../lib/supabase';
import { USER_SILHOUETTE_URL, ARIA_EMAIL } from '../constants';

// --- HELPERS ---

/**
 * Global wrapper to handle Supabase Rec #2: Force signout on 401/JWT loops
 */
const wrapApiCall = async <T>(call: Promise<{ data: T | null; error: any }>): Promise<T | null> => {
    try {
        const { data, error } = await call;
        if (error) {
            // Check for Supabase Rec specific error codes
            if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
                console.error("Critical JWT/401 error. Performing nuclear logout.");
                await performLogout();
                window.location.replace('/login');
                return null;
            }
            throw error;
        }
        return data;
    } catch (e) {
        console.error("API Call Exception:", e);
        throw e;
    }
};

const uploadFile = async (file: File | Blob, bucket: string, path: string): Promise<string> => {
    const createLocalUrl = () => URL.createObjectURL(file as Blob);
    const supabase = getSupabase();
    if (!supabase) return createLocalUrl();
    try {
        const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
        if (error) return createLocalUrl();
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        return publicUrl || createLocalUrl();
    } catch (error: any) {
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

export const uploadRoomPhoto = async (file: File, stoodioId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${stoodioId}/rooms/${Date.now()}.${ext}`;
    return uploadFile(file, 'stoodio_assets', path);
};

export const uploadBeatFile = async (file: File, producerId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${producerId}/beats/${Date.now()}.${ext}`;
    return uploadFile(file, 'producer_assets', path);
};

export const uploadMixingSampleFile = async (file: File, engineerId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${engineerId}/samples/${Date.now()}.${ext}`;
    return uploadFile(file, 'engineer_assets', path);
};

export const uploadDocument = async (file: Blob, fileName: string, userId: string, category: string = 'OFFICIAL'): Promise<string> => {
    const path = `${userId}/documents/${Date.now()}_${fileName}`;
    const publicUrl = await uploadFile(file, 'documents', path);
    const supabase = getSupabase();
    if (supabase) {
        await supabase.from('documents').insert({
            owner_id: userId,
            name: fileName,
            url: publicUrl,
            category: category,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: file.type || 'application/pdf'
        });
    }
    return publicUrl;
};

// --- DATA ACCESS ---

export const fetchUserDocuments = async (userId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];
    return wrapApiCall(supabase.from('documents').select('*').eq('owner_id', userId).order('created_at', { ascending: false })) || [];
};

export const fetchUserAssets = async (userId: string): Promise<MediaAsset[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const data = await wrapApiCall(supabase.from('media_assets').select('*').eq('owner_id', userId).order('created_at', { ascending: false }));
    return (data || []) as MediaAsset[];
};

export const uploadAsset = async (file: File, userId: string, category: AssetCategory): Promise<MediaAsset> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/vault/${Date.now()}.${ext}`;
    const publicUrl = await uploadFile(file, 'vault', path);
    const supabase = getSupabase();
    
    const assetData = {
        id: crypto.randomUUID(),
        owner_id: userId,
        name: file.name,
        url: publicUrl,
        category: category,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type || 'application/octet-stream',
        created_at: new Date().toISOString()
    };

    if (supabase) {
        await wrapApiCall(supabase.from('media_assets').insert(assetData));
    }
    
    return assetData as MediaAsset;
};

export const scoutMarketInsights = async (region: string): Promise<MarketInsight[]> => {
    await new Promise(r => setTimeout(r, 500));
    return [
        { 
            genre: "Afrobeats", region: "Global", trendScore: 92, 
            description: `Afrobeats is seeing a 24% month-over-month increase in the ${region} region. High demand for cross-over collaborations.` 
        }
    ];
};

export const fetchAnalyticsData = async (uid: string, r: UserRole, d: number): Promise<AnalyticsData> => {
    return {
        kpis: { totalRevenue: 12500, profileViews: 450, newFollowers: 28, bookings: 12 },
        revenueOverTime: Array.from({ length: 7 }, (_, i) => ({ date: `2024-05-${10+i}`, revenue: Math.random() * 500 })),
        engagementOverTime: Array.from({ length: 7 }, (_, i) => ({ date: `2024-05-${10+i}`, views: 100, followers: 5, likes: 20 })),
        revenueSources: [
            { name: "Streaming", revenue: 8000 },
            { name: "Sessions", revenue: 4500 }
        ]
    };
};

export const fetchLabelBookings = async (labelId: string) => {
    return (await getSupabase()!.rpc('get_label_bookings', { label_id: labelId })).data || [];
};

export const fetchLabelProjects = async (labelId: string): Promise<Project[]> => {
    const data = await wrapApiCall(getSupabase()!.from('projects').select('*, tasks(*)').eq('label_id', labelId));
    return (data || []) as Project[];
};

export const createProjectTask = async (projectId: string, task: Partial<ProjectTask>) => {
    return wrapApiCall(getSupabase()!.from('project_tasks').insert({ ...task, project_id: projectId }).select().single());
};

export const updateProjectTask = async (id: string, updates: any) => {
    return wrapApiCall(getSupabase()!.from('project_tasks').update(updates).eq('id', id).select().single());
};

export const fetchCurrentUserProfile = async (id: string): Promise<{ user: Label | Artist | Engineer | Stoodio | Producer, role: UserRole } | null> => {
    const s = getSupabase(); if (!s) return null;
    // FIX: Add explicit generic to wrapApiCall to ensure correct type for profile metadata.
    const profile = await wrapApiCall<{ role: UserRole }>(s.from('profiles').select('role').eq('id', id).single());
    if (!profile) return null;
    const tables = {'ARTIST':'artists', 'ENGINEER':'engineers', 'PRODUCER':'producers', 'STOODIO':'stoodioz', 'LABEL':'labels'};
    const table = (tables as any)[profile.role || 'ARTIST'];
    // FIX: Cast return to any to support union of user types returned by various tables.
    const user = await wrapApiCall<any>(s.from(table).select('*').eq('id', id).single());
    return user ? { user, role: profile.role } : null;
};

export const fetchLabelRoster = async (id: string): Promise<RosterMember[]> => {
    // FIX: Use explicit generic for roster entries to ensure they are iterable.
    const rosterEntries = await wrapApiCall<any[]>(getSupabase()!.from('label_roster').select('*').eq('label_id', id));
    const hydrated = [];
    for(const e of rosterEntries||[]) {
        const res = await fetchCurrentUserProfile(e.user_id);
        // FIX: Added explicit cast to 'any' for spreading unknown profile data into roster members.
        if(res) hydrated.push({...(res.user as any), role_in_label: e.role, roster_id: e.id});
    }
    return hydrated as RosterMember[];
};

export const getLabelBudgetOverview = async (id: string) => (await getSupabase()!.rpc('get_label_budget_overview', { p_label_id: id })).data;
export const fetchLabelTransactions = async (id: string): Promise<Transaction[]> => {
    // FIX: Added generic type to wrapApiCall for label transaction retrieval.
    const data = await wrapApiCall<any>(getSupabase()!.from('labels').select('wallet_transactions').eq('id', id).single());
    return data?.wallet_transactions || [];
}
export const fetchLabelContracts = async (id: string): Promise<LabelContract[]> => {
    const data = await wrapApiCall<LabelContract[]>(getSupabase()!.from('label_contracts').select('*').eq('label_id', id));
    return data || [];
}
export const getRosterActivity = async (id: string) => (await getSupabase()!.rpc('get_roster_activity', { p_label_id: id })).data || [];
export const fetchLabelPerformance = async (id: string) => [];
export const createBooking = async (req: any, st: any, b: any, br: UserRole): Promise<Booking> => {
    const data = await wrapApiCall<Booking>(getSupabase()!.from('bookings').insert({ ...req, stoodio_id:st?.id, booked_by_id:b.id, booked_by_role:br, status:BookingStatus.CONFIRMED }).select().single());
    return data as Booking;
}
export const cancelBooking = async (b: any) => wrapApiCall<Booking>(getSupabase()!.from('bookings').update({ status: BookingStatus.CANCELLED }).eq('id', b.id).select().single());

export const createPost = async (pd: any, a: any, at: UserRole) => {
    const post = await wrapApiCall<Post>(getSupabase()!.from('posts').insert({ author_id: a.id, author_type: at, text: pd.text, image_url: pd.image_url, video_url: pd.video_url, created_at: new Date().toISOString() }).select().single());
    return { updatedAuthor: a, createdPost: post };
}
export const likePost = async (pid: string, uid: string, a: any) => ({ updatedAuthor: a });
export const commentOnPost = async (pid: string, t: string, c: any, pa: any) => ({ updatedAuthor: pa });
export const toggleFollow = async (cu: any, tu: any, t: string, f: boolean) => ({ updatedCurrentUser: cu, updatedTargetUser: tu });

export const createUser = async (u: any, r: UserRole) => {
    const s = getSupabase()!;
    const {data:ad, error} = await s.auth.signUp({email:u.email, password:u.password, options:{data:{full_name:u.name, user_role:r}}});
    if (error) throw error;
    const tableMap = {'ARTIST':'artists', 'ENGINEER':'engineers', 'PRODUCER':'producers', 'STOODIO':'stoodioz', 'LABEL':'labels'};
    const {data} = await s.from((tableMap as any)[r]).upsert({id:ad.user!.id, email:u.email, name:u.name, image_url:u.image_url||USER_SILHOUETTE_URL}).select().single();
    await s.from('profiles').upsert({id:ad.user!.id, role:r, email:u.email, full_name:u.name});
    return data;
};

export const fetchUserPosts = async (id: string): Promise<Post[]> => {
    // FIX: Specify type for post results to resolve mapping errors.
    const data = await wrapApiCall<any[]>(getSupabase()!.from('posts').select('*').eq('author_id', id));
    return data?.map((p:any)=>({ ...p, authorId:p.author_id, authorType:p.author_type, timestamp:p.created_at })) || [];
}

export const fetchGlobalFeed = async (l: number, b?: string): Promise<Post[]> => {
    let q = getSupabase()!.from('posts').select('*').order('created_at', { ascending: false }).limit(l);
    if(b) q = q.lt('created_at', b);
    const { data } = await q;
    return data?.map((p:any)=>({ ...p, authorId:p.author_id, authorType:p.author_type, timestamp:p.created_at })) || [];
};

export const fetchConversations = async (id: string): Promise<Conversation[]> => {
    const data = await wrapApiCall<Conversation[]>(getSupabase()!.from('conversations').select('*').contains('participant_ids', [id]));
    return data || [];
};
export const sendMessage = async (cid: string, sid: string, c: string, t: string = 'text', metadata: any = null): Promise<Message> => {
    const data = await wrapApiCall<Message>(getSupabase()!.from('messages').insert({ conversation_id: cid, sender_id: sid, content: c, message_type: t, metadata }).select().single());
    return data as Message;
}
export const createConversation = async (pids: string[]): Promise<Conversation> => {
    const data = await wrapApiCall<Conversation>(getSupabase()!.from('conversations').insert({ participant_ids: pids }).select().single());
    return data as Conversation;
};
export const updateUser = async (id: string, t: string, u: any): Promise<any> => wrapApiCall<any>(getSupabase()!.from(t).update(u).eq('id', id).select().single());
export const fetchFullArtist = async (id: string): Promise<Artist> => (await wrapApiCall<Artist>(getSupabase()!.from('artists').select('*').eq('id', id).single())) as Artist;
export const fetchFullEngineer = async (id: string): Promise<Engineer> => (await wrapApiCall<Engineer>(getSupabase()!.from('engineers').select('*, mixing_samples(*)').eq('id', id).single())) as Engineer;
export const fetchFullProducer = async (id: string): Promise<Producer> => (await wrapApiCall<Producer>(getSupabase()!.from('producers').select('*, instrumentals(*)').eq('id', id).single())) as Producer;
export const fetchFullStoodio = async (id: string): Promise<Stoodio> => (await wrapApiCall<Stoodio>(getSupabase()!.from('stoodioz').select('*, rooms(*), in_house_engineers(*)').eq('id', id).single())) as Stoodio;

export const getAllPublicUsers = async () => {
    const s = getSupabase()!;
    const [a,e,p,st,l] = await Promise.all([s.from('artists').select('*'), s.from('engineers').select('*'), s.from('producers').select('*'), s.from('stoodioz').select('*'), s.from('labels').select('*')]);
    return { artists: a.data||[], engineers: e.data||[], producers: p.data||[], stoodioz: st.data||[], labels: l.data||[] };
};

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