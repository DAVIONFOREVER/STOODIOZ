import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Review, Post, Comment, Transaction, AnalyticsData, SubscriptionPlan, Message, AriaActionResponse, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData, Room, Instrumental, InHouseEngineerInfo, BaseUser, MixingDetails, Conversation, Label, LabelContract, RosterMember, LabelBudgetOverview, LabelBudgetMode, Following, MediaAsset, Project, ProjectTask, MarketInsight } from '../types';
import { BookingStatus, VerificationStatus, TransactionCategory, TransactionStatus, BookingRequestType, UserRole as UserRoleEnum, RankingTier, NotificationType, AssetCategory } from '../types';
import { getSupabase } from '../lib/supabase';
import { USER_SILHOUETTE_URL, ARIA_EMAIL } from '../constants';

// --- HELPER FUNCTIONS ---

const timeoutPromise = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timed out after ${ms/1000} seconds`)), ms));

const uploadFile = async (file: File | Blob, bucket: string, path: string): Promise<string> => {
    const createLocalUrl = () => URL.createObjectURL(file as Blob);
    const supabase = getSupabase();
    if (!supabase) return createLocalUrl();
    try {
        const uploadTask = supabase.storage.from(bucket).upload(path, file, { upsert: true });
        const result: any = await Promise.race([uploadTask, timeoutPromise(10000)]);
        if (result.error) return createLocalUrl();
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        return publicUrl || createLocalUrl();
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
    const { data } = await supabase.from('documents').select('*').eq('owner_id', userId).order('created_at', { ascending: false });
    return data || [];
};

export const fetchUserAssets = async (userId: string): Promise<MediaAsset[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from('media_assets').select('*').eq('owner_id', userId).order('created_at', { ascending: false });
    if (error) return [];
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
        await supabase.from('media_assets').insert(assetData);
    }
    
    return assetData as MediaAsset;
};

export const scoutMarketInsights = async (region: string): Promise<MarketInsight[]> => {
    await new Promise(r => setTimeout(r, 500));
    return [
        { 
            genre: "Afrobeats", region: "Global", trendScore: 92, 
            description: `Afrobeats is seeing significant growth in the ${region} region. High demand for cross-over collaborations.` 
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
    const supabase = getSupabase();
    if (!supabase) return [];
    return (await supabase.rpc('get_label_bookings', { label_id: labelId })).data || [];
};

export const fetchLabelProjects = async (labelId: string): Promise<Project[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    return (await supabase.from('projects').select('*, tasks(*)').eq('label_id', labelId)).data || [];
};

export const createProjectTask = async (projectId: string, task: Partial<ProjectTask>) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    return (await supabase.from('project_tasks').insert({ ...task, project_id: projectId }).select().single()).data;
};

export const updateProjectTask = async (id: string, updates: any) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    return (await supabase.from('project_tasks').update(updates).eq('id', id).select().single()).data;
};

export const fetchCurrentUserProfile = async (id: string): Promise<{ user: Artist | Engineer | Stoodio | Producer | Label, role: UserRole } | null> => {
    const s = getSupabase(); if (!s) return null;
    const {data:p} = await s.from('profiles').select('role').eq('id', id).single();
    if (!p) return null;
    const tables = {'ARTIST':'artists', 'ENGINEER':'engineers', 'PRODUCER':'producers', 'STOODIO':'stoodioz', 'LABEL':'labels'};
    const table = (tables as any)[p.role];
    const {data:u} = await s.from(table).select('*').eq('id', id).single();
    return u ? { user: u as any, role: p.role as UserRole } : null;
};

export const fetchLabelRoster = async (id: string): Promise<RosterMember[]> => {
    const s = getSupabase(); if (!s) return [];
    const {data:re} = await s.from('label_roster').select('*').eq('label_id', id);
    const hydrated = [];
    for(const e of re||[]) {
        const res = await fetchCurrentUserProfile(e.user_id);
        if(res) hydrated.push({...(res.user as any), role_in_label: e.role, roster_id: e.id});
    }
    return hydrated as RosterMember[];
};

export const getLabelBudgetOverview = async (id: string) => {
    const s = getSupabase(); if (!s) return null;
    return (await s.rpc('get_label_budget_overview', { p_label_id: id })).data;
};

export const fetchLabelTransactions = async (id: string): Promise<Transaction[]> => {
    const s = getSupabase(); if (!s) return [];
    const { data } = await s.from('labels').select('wallet_transactions').eq('id', id).single();
    return data?.wallet_transactions || [];
};

export const fetchLabelContracts = async (id: string): Promise<LabelContract[]> => {
    const s = getSupabase(); if (!s) return [];
    const { data } = await s.from('label_contracts').select('*').eq('label_id', id);
    return (data || []) as LabelContract[];
};

export const getRosterActivity = async (id: string) => {
    const s = getSupabase(); if (!s) return [];
    return (await s.rpc('get_roster_activity', { p_label_id: id })).data || [];
};

export const fetchLabelPerformance = async (id: string) => [];

export const createBooking = async (req: any, st: any, b: any, br: UserRole): Promise<Booking> => {
    const s = getSupabase(); if (!s) throw new Error("Supabase not initialized");
    const { data } = await s.from('bookings').insert({ ...req, stoodio_id:st?.id, booked_by_id:b.id, booked_by_role:br, status:BookingStatus.CONFIRMED }).select().single();
    return data as Booking;
};

export const cancelBooking = async (b: any) => {
    const s = getSupabase(); if (!s) throw new Error("Supabase not initialized");
    const { data } = await s.from('bookings').update({ status: BookingStatus.CANCELLED }).eq('id', b.id).select().single();
    return data as Booking;
};

export const createPost = async (pd: any, a: any, at: UserRole) => {
    const s = getSupabase(); if (!s) throw new Error("Supabase not initialized");
    const { data } = await s.from('posts').insert({ author_id: a.id, author_type: at, text: pd.text, image_url: pd.image_url, video_url: pd.video_url, created_at: new Date().toISOString() }).select().single();
    return { updatedAuthor: a, createdPost: data as Post };
};

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
    const s = getSupabase(); if (!s) return [];
    const { data } = await s.from('posts').select('*').eq('author_id', id);
    return data?.map((p:any)=>({ ...p, authorId:p.author_id, authorType:p.author_type, timestamp:p.created_at })) || [];
};

export const fetchGlobalFeed = async (l: number, b?: string): Promise<Post[]> => {
    const s = getSupabase(); if (!s) return [];
    let q = s.from('posts').select('*').order('created_at', { ascending: false }).limit(l);
    if(b) q = q.lt('created_at', b);
    const { data } = await q;
    return data?.map((p:any)=>({ ...p, authorId:p.author_id, authorType:p.author_type, timestamp:p.created_at })) || [];
};

export const fetchConversations = async (id: string): Promise<Conversation[]> => {
    const s = getSupabase(); if (!s) return [];
    const { data } = await s.from('conversations').select('*').contains('participant_ids', [id]);
    return (data || []) as Conversation[];
};

export const sendMessage = async (cid: string, sid: string, c: string, t: string = 'text', metadata: any = null): Promise<Message> => {
    const s = getSupabase(); if (!s) throw new Error("Supabase not initialized");
    const { data } = await s.from('messages').insert({ conversation_id: cid, sender_id: sid, content: c, message_type: t, metadata }).select().single();
    return data as Message;
};

export const createConversation = async (pids: string[]): Promise<Conversation> => {
    const s = getSupabase(); if (!s) throw new Error("Supabase not initialized");
    const { data } = await s.from('conversations').insert({ participant_ids: pids }).select().single();
    return data as Conversation;
};

export const updateUser = async (id: string, t: string, u: any): Promise<any> => {
    const s = getSupabase(); if (!s) throw new Error("Supabase not initialized");
    const { data } = await s.from(t).update(u).eq('id', id).select().single();
    return data;
};

export const fetchFullArtist = async (id: string): Promise<Artist> => {
    const s = getSupabase(); if (!s) throw new Error("Supabase not initialized");
    const { data } = await s.from('artists').select('*').eq('id', id).single();
    return data as Artist;
};

export const fetchFullEngineer = async (id: string): Promise<Engineer> => {
    const s = getSupabase(); if (!s) throw new Error("Supabase not initialized");
    const { data } = await s.from('engineers').select('*, mixing_samples(*)').eq('id', id).single();
    return data as Engineer;
};

export const fetchFullProducer = async (id: string): Promise<Producer> => {
    const s = getSupabase(); if (!s) throw new Error("Supabase not initialized");
    const { data } = await s.from('producers').select('*, instrumentals(*)').eq('id', id).single();
    return data as Producer;
};

export const fetchFullStoodio = async (id: string): Promise<Stoodio> => {
    const s = getSupabase(); if (!s) throw new Error("Supabase not initialized");
    const { data } = await s.from('stoodioz').select('*, rooms(*), in_house_engineers(*)').eq('id', id).single();
    return data as Stoodio;
};

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
export const purchaseBeat = async (bt: any, t: string, b: any, p: any, r: UserRole) => ({updatedBooking: bt as any});
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