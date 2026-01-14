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

// FIX: Added missing uploadRoomPhoto function to support room image uploads
export const uploadRoomPhoto = async (file: File, stoodioId: string): Promise<string> => {
    const path = `${stoodioId}/rooms/${Date.now()}_${file.name}`;
    return uploadFile(file, 'rooms', path);
};

// FIX: Added missing uploadBeatFile function to support beat uploads
export const uploadBeatFile = async (file: File, producerId: string): Promise<string> => {
    const path = `${producerId}/beats/${Date.now()}_${file.name}`;
    return uploadFile(file, 'beats', path);
};

// FIX: Added missing uploadMixingSampleFile function to support engineer sample uploads
export const uploadMixingSampleFile = async (file: File, engineerId: string): Promise<string> => {
    const path = `${engineerId}/samples/${Date.now()}_${file.name}`;
    return uploadFile(file, 'samples', path);
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
    if (error) {
        console.error("Error fetching assets:", error);
        return [];
    }
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
        const { error } = await supabase.from('media_assets').insert(assetData);
        if (error) {
            console.error("Error inserting asset record:", error);
            throw error;
        }
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
    const s = getSupabase();
    if (!s) return [];
    return (await s.rpc('get_label_bookings', { label_id: labelId })).data || [];
};

export const fetchLabelProjects = async (labelId: string): Promise<Project[]> => {
    const s = getSupabase();
    if (!s) return [];
    return (await s.from('projects').select('*, tasks(*)').eq('label_id', labelId)).data || [];
};

export const createProjectTask = async (projectId: string, task: Partial<ProjectTask>) => {
    const s = getSupabase();
    if (!s) return null;
    return (await s.from('project_tasks').insert({ ...task, project_id: projectId }).select().single()).data;
};

export const updateProjectTask = async (id: string, updates: any) => {
    const s = getSupabase();
    if (!s) return null;
    return (await s.from('project_tasks').update(updates).eq('id', id).select().single()).data;
};

export const fetchCurrentUserProfile = async (id: string) => {
    const s = getSupabase(); 
    if (!s) return null;

    console.log(`[apiService] Hydrating user ${id}...`);
    
    // 1. Get role from public.profiles
   const { data: profile, error: profileErr } =
  await s.from('profiles').select('role, full_name').eq('id', id).maybeSingle();

    
    if (profileErr || !profile) {
        console.warn("[apiService] No public profile record found. User may be brand new.");
        return null;
    }

    const role = profile.role as UserRoleEnum;
    const tableMap: Record<string, string> = {
        [UserRoleEnum.ARTIST]: 'artists', 
        [UserRoleEnum.ENGINEER]: 'engineers', 
        [UserRoleEnum.PRODUCER]: 'producers', 
        [UserRoleEnum.STOODIO]: 'stoodioz', 
        [UserRoleEnum.LABEL]: 'labels'
    };
    
    const tableName = tableMap[role] || 'artists';

    // 2. Fetch detailed record
    const { data: userDetails, error: detailsErr } = await s.from(tableName).select('*').eq('id', id).single();
    
    if (detailsErr || !userDetails) {
        console.warn(`[apiService] Detail row missing in ${tableName}. Returning profile stub.`);
        return { 
            user: { id, name: profile.full_name, role: role, image_url: USER_SILHOUETTE_URL, wallet_balance: 0, wallet_transactions: [] }, 
            role: role 
        };
    }

    return { user: { ...userDetails, role: role }, role: role };
};

export const fetchLabelRoster = async (id: string) => {
    const s = getSupabase();
    if (!s) return [];
    const {data:re} = await s.from('label_roster').select('*').eq('label_id', id);
    const hydrated = [];
    for(const e of re||[]) {
        const res = await fetchCurrentUserProfile(e.user_id);
        if(res) hydrated.push({...res.user, role_in_label: e.role, roster_id: e.id});
    }
    return hydrated;
};

export const getLabelBudgetOverview = async (id: string) => {
    const s = getSupabase();
    if (!s) return null;
    return (await s.rpc('get_label_budget_overview', { p_label_id: id })).data;
}

export const fetchLabelTransactions = async (id: string) => {
    const s = getSupabase();
    if (!s) return [];
    return (await s.from('labels').select('wallet_transactions').eq('id', id).single()).data?.wallet_transactions || [];
}

export const fetchLabelContracts = async (id: string) => {
    const s = getSupabase();
    if (!s) return [];
    return (await s.from('label_contracts').select('*').eq('label_id', id)).data || [];
}

export const getRosterActivity = async (id: string) => {
    const s = getSupabase();
    if (!s) return [];
    return (await s.rpc('get_roster_activity', { p_label_id: id })).data || [];
}

export const fetchLabelPerformance = async (id: string) => [];

export const createBooking = async (req: any, st: any, b: any, br: UserRole) => {
    const s = getSupabase();
    if (!s) return null;
    return (await s.from('bookings').insert({ ...req, stoodio_id:st?.id, booked_by_id:b.id, booked_by_role:br, status:BookingStatus.CONFIRMED }).select().single()).data;
}

export const cancelBooking = async (b: any) => {
    const s = getSupabase();
    if (!s) return null;
    return (await s.from('bookings').update({ status: BookingStatus.CANCELLED }).eq('id', b.id).select().single()).data;
}

export const createPost = async (pd: any, a: any, at: UserRole) => {
    const s = getSupabase();
    if (!s) return null;
    const {data: createdPost} = await s.from('posts').insert({ author_id: a.id, author_type: at, text: pd.text, image_url: pd.image_url, video_url: pd.video_url, created_at: new Date().toISOString() }).select().single();
    return { updatedAuthor: a, createdPost };
}

export const likePost = async (pid: string, uid: string, a: any) => ({ updatedAuthor: a });
export const commentOnPost = async (pid: string, t: string, c: any, pa: any) => ({ updatedAuthor: pa });
export const toggleFollow = async (cu: any, tu: any, t: string, f: boolean) => ({ updatedCurrentUser: cu, updatedTargetUser: tu });

export const createUser = async (u: any, r: UserRole) => {
  const s = getSupabase();
  if (!s) throw new Error('Supabase client not available');

  const { data: ad, error: authErr } = await s.auth.signUp({
    email: u.email,
    password: u.password,
    options: {
      data: { full_name: u.name, user_role: r },
    },
  });

  if (authErr) throw authErr;

  // If email confirmations are enabled, Supabase returns session = null here.
  // In that case we MUST NOT try to write into protected tables yet.
  if (!ad?.session || !ad?.user) {
    return { email_confirmation_required: true };
  }

  const userId = ad.user.id;

 const tableMap: Record<UserRoleEnum, string> = {
  [UserRoleEnum.ARTIST]: 'artists',
  [UserRoleEnum.ENGINEER]: 'engineers',
  [UserRoleEnum.PRODUCER]: 'producers',
  [UserRoleEnum.STOODIO]: 'stoodioz',
  [UserRoleEnum.LABEL]: 'labels',
};

const tableName = tableMap[r as UserRoleEnum] ?? 'artists';

  const { data: roleRow, error: roleErr } = await s
    .from(tableName)
    .upsert({
      id: userId,
      name: u.name,
      email: u.email,
      image_url: u.image_url || USER_SILHOUETTE_URL,
    })
    .select()
    .single();

  if (roleErr) throw roleErr;

  const { error: profileErr } = await s
    .from('profiles')
    .upsert({
      id: userId,
      role: r,
      email: u.email,
      full_name: u.name,
    });

  if (profileErr) throw profileErr;

  return roleRow;
};


export const fetchUserPosts = async (id: string) => {
    const s = getSupabase();
    if (!s) return [];
    return (await s.from('posts').select('*').eq('author_id', id)).data?.map((p:any)=>({ ...p, authorId:p.author_id, authorType:p.author_type, timestamp:p.created_at })) || [];
}

export const fetchGlobalFeed = async (l: number, b?: string) => {
    const s = getSupabase();
    if (!s) return [];
    let q = s.from('posts').select('*').order('created_at', { ascending: false }).limit(l);
    if(b) q = q.lt('created_at', b);
    return (await q).data?.map((p:any)=>({ ...p, authorId:p.author_id, authorType:p.author_type, timestamp:p.created_at })) || [];
};

export const fetchConversations = async (id: string) => [];
export const sendMessage = async (cid: string, sid: string, c: string, t: string = 'text', fileData?: any) => {
    const s = getSupabase();
    if (!s) return null;
    return (await s.from('messages').insert({ conversation_id: cid, sender_id: sid, content: c, message_type: t, file_data: fileData }).select().single()).data;
}

export const createConversation = async (pids: string[]) => {
    const s = getSupabase();
    if (!s) return null;
    return (await s.from('conversations').insert({ participant_ids: pids }).select().single()).data;
}

export const updateUser = async (id: string, t: string, u: any) => {
    const s = getSupabase();
    if (!s) return null;
    return (await s.from(t).update(u).eq('id', id).select().single()).data;
}

export const fetchFullArtist = async (id: string) => {
    const s = getSupabase();
    if (!s) return null;
    return (await s.from('artists').select('*').eq('id', id).single()).data;
}

export const fetchFullEngineer = async (id: string) => {
    const s = getSupabase();
    if (!s) return null;
    return (await s.from('engineers').select('*, mixing_samples(*)').eq('id', id).single()).data;
}

export const fetchFullProducer = async (id: string) => {
    const s = getSupabase();
    if (!s) return null;
    return (await s.from('producers').select('*, instrumentals(*)').eq('id', id).single()).data;
}

export const fetchFullStoodio = async (id: string) => {
    const s = getSupabase();
    if (!s) return null;
    return (await s.from('stoodioz').select('*, rooms(*), in_house_engineers(*)').eq('id', id).single()).data;
}

export const getAllPublicUsers = async () => {
    const s = getSupabase();
    if (!s) return { artists: [], engineers: [], producers: [], stoodioz: [], labels: [] };
    const [a,e,p,st,l] = await Promise.all([s.from('artists').select('*'), s.from('engineers').select('*'), s.from('producers').select('*'), s.from('stoodioz').select('*'), s.from('labels').select('*')]);
    return { artists: a.data||[], engineers: e.data||[], producers: p.data||[], stoodioz: st.data||[], labels: l.data||[] };
};

export const createShadowProfile = async (r: any, lid: string, d: any) => ({id: 'shadow'});
export const removeArtistFromLabelRoster = async (lid: string, rid: string) => true;
export const updateLabelBudgetMode = async (id: string, m: any, a?: number, d?: number) => null;
export const addLabelFunds = async (id: string, a: number, n: string) => true;
export const setLabelBudget = async (id: string, t: number) => null;
export const setArtistAllocation = async (id: string, aid: string, a: number) => null;
export const claimProfileByCode = async (c: string, id: string) => ({role: 'ARTIST' as UserRoleEnum});
export const claimProfileByToken = async (t: string, id: string) => ({role: 'ARTIST' as UserRoleEnum});
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
