import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Review, Post, Comment, Transaction, AnalyticsData, SubscriptionPlan, Message, AriaActionResponse, VibeMatchResult, AriaCantataMessage, Location, LinkAttachment, MixingSample, AriaNudgeData, Room, Instrumental, InHouseEngineerInfo, BaseUser, MixingDetails, Conversation, Label, LabelContract, RosterMember, LabelBudgetOverview, LabelBudgetMode, Following, MediaAsset } from '../types';
import { BookingStatus, VerificationStatus, TransactionCategory, TransactionStatus, BookingRequestType, UserRole as UserRoleEnum, RankingTier, NotificationType } from '../types';
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

// FIX: Added missing helper function uploadAvatar
export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    return uploadFile(file, 'avatars', path);
};

// FIX: Added missing helper function uploadPostAttachment
export const uploadPostAttachment = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/posts/${Date.now()}.${ext}`;
    return uploadFile(file, 'posts', path);
};

// FIX: Added missing helper function fetchLabelTransactions
export const fetchLabelTransactions = async (labelId: string): Promise<Transaction[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data: labelUser, error } = await supabase
        .from('labels')
        .select('wallet_transactions')
        .eq('id', labelId)
        .single();
    if (error || !labelUser) return [];
    return (labelUser.wallet_transactions || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// --- DOCUMENT & ASSET DB PERSISTENCE ---

export const fetchUserDocuments = async (userId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
    
    if (error) return [];
    return data;
};

export const uploadDocument = async (file: Blob, fileName: string, userId: string, category: string = 'OFFICIAL'): Promise<string> => {
    const path = `${userId}/documents/${Date.now()}_${fileName}`;
    const publicUrl = await uploadFile(file, 'documents', path);
    
    const supabase = getSupabase();
    if (supabase) {
        // Register document in DB so it shows up in the Documents tab
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

export const fetchUserAssets = async (userId: string): Promise<MediaAsset[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from('assets').select('*').eq('owner_id', userId).order('created_at', { ascending: false });
    return data || [];
};

export const uploadAsset = async (file: File, userId: string, category: string): Promise<MediaAsset> => {
    const path = `${userId}/assets/${category.toLowerCase()}/${Date.now()}_${file.name}`;
    const url = await uploadFile(file, 'assets', path);
    
    const asset: Partial<MediaAsset> = {
        id: crypto.randomUUID(),
        name: file.name,
        url,
        type: file.type,
        category: category as any,
        owner_id: userId,
        created_at: new Date().toISOString(),
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    };

    const supabase = getSupabase();
    if (supabase) {
        await supabase.from('assets').insert(asset);
    }
    return asset as MediaAsset;
};

// --- PROFILE SERVICES ---

export const fetchCurrentUserProfile = async (userId: string): Promise<{ user: any, role: UserRole } | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: profile } = await supabase.from('profiles').select('role, email').eq('id', userId).maybeSingle();
    const tables = [
        { name: 'artists', role: UserRoleEnum.ARTIST, query: '*' },
        { name: 'stoodioz', role: UserRoleEnum.STOODIO, query: '*, rooms(*), in_house_engineers(*)' },
        { name: 'producers', role: UserRoleEnum.PRODUCER, query: '*, instrumentals(*)' },
        { name: 'engineers', role: UserRoleEnum.ENGINEER, query: '*, mixing_samples(*)' },
        { name: 'labels', role: UserRoleEnum.LABEL, query: '*' }
    ];
    let targetRole = profile?.role;
    if (profile?.email === ARIA_EMAIL) targetRole = UserRoleEnum.ARTIST;
    if (targetRole) {
        const t = tables.find(x => x.role === targetRole);
        if (t) {
            const { data } = await supabase.from(t.name).select(t.query).eq('id', userId).maybeSingle();
            if (data) return { user: data, role: t.role };
        }
    }
    for (const t of tables) {
        const { data } = await supabase.from(t.name).select(t.query).eq('id', userId).maybeSingle();
        if (data) return { user: data, role: t.role };
    }
    return null;
};

export const fetchFullArtist = async (id: string): Promise<Artist | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.from('artists').select('*').eq('id', id).maybeSingle();
    return data;
};

export const fetchFullStoodio = async (id: string): Promise<Stoodio | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.from('stoodioz').select('*, rooms(*), in_house_engineers(*)').eq('id', id).maybeSingle();
    return data;
};

export const fetchFullEngineer = async (id: string): Promise<Engineer | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.from('engineers').select('*, mixing_samples(*)').eq('id', id).maybeSingle();
    return data;
};

export const fetchFullProducer = async (id: string): Promise<Producer | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.from('producers').select('*, instrumentals(*)').eq('id', id).maybeSingle();
    return data;
};

export const updateUser = async (userId: string, table: string, updates: any) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).update(updates).eq('id', userId).select().single();
    if (error) throw error;
    return data;
};

export const getAllPublicUsers = async (): Promise<{
    artists: Artist[],
    engineers: Engineer[],
    producers: Producer[],
    stoodioz: Stoodio[],
    labels: Label[]
}> => {
    const supabase = getSupabase();
    if (!supabase) return { artists: [], engineers: [], producers: [], stoodioz: [], labels: [] };
    const safeSelect = async (table: string) => {
        const { data } = await supabase.from(table).select('*');
        return data || [];
    };
    const [artists, engineers, producers, stoodioz, labels] = await Promise.all([
        safeSelect('artists'),
        safeSelect('engineers'),
        safeSelect('producers'),
        safeSelect('stoodioz'),
        safeSelect('labels')
    ]);
    return {
        artists: artists as Artist[],
        engineers: engineers as Engineer[],
        producers: producers as Producer[],
        stoodioz: stoodioz as Stoodio[],
        labels: labels as Label[]
    };
};

export const createUser = async (userData: any, role: UserRole): Promise<Artist | Engineer | Stoodio | Producer | Label | { email_confirmation_required: boolean } | null> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not connected");
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: { data: { full_name: userData.name, user_role: role } }
    });
    if (authError) throw authError;
    if (!authData.session && !authData.user?.email_confirmed_at) return { email_confirmation_required: true };
    const userId = authData.user!.id;
    let imageUrl = userData.image_url || USER_SILHOUETTE_URL;
    if (userData.imageFile) imageUrl = await uploadAvatar(userData.imageFile, userId);
    const profileData = {
        id: userId,
        email: userData.email,
        name: userData.name,
        image_url: imageUrl,
        ...(role === 'ARTIST' && { bio: userData.bio }),
        ...(role === 'ENGINEER' && { bio: userData.bio, specialties: [] }),
        ...(role === 'PRODUCER' && { bio: userData.bio, genres: [] }),
        ...(role === 'LABEL' && { bio: userData.bio, company_name: userData.companyName }),
        ...(role === 'STOODIO' && { description: userData.description, location: userData.location, amenities: [], rooms: [] }),
        created_at: new Date().toISOString(),
    };
    const tableMap: Record<string, string> = { 'ARTIST': 'artists', 'ENGINEER': 'engineers', 'PRODUCER': 'producers', 'STOODIO': 'stoodioz', 'LABEL': 'labels' };
    const { data, error } = await supabase.from(tableMap[role]).upsert(profileData).select().single();
    if (error) throw error;
    await supabase.from('profiles').upsert({ id: userId, role, email: userData.email, full_name: userData.name });
    return data;
};

export const toggleFollow = async (currentUser: any, targetUser: any, type: string, isCurrentlyFollowing: boolean) => {
    const supabase = getSupabase();
    if (!supabase) return { updatedCurrentUser: currentUser, updatedTargetUser: targetUser };
    const roleToTable: Record<string, string> = { 'ARTIST': 'artists', 'ENGINEER': 'engineers', 'PRODUCER': 'producers', 'STOODIO': 'stoodioz', 'LABEL': 'labels' };
    let originTable = 'artists';
    if ('amenities' in currentUser) originTable = 'stoodioz';
    else if ('specialties' in currentUser) originTable = 'engineers';
    else if ('instrumentals' in currentUser) originTable = 'producers';
    else if ('company_name' in currentUser) originTable = 'labels';
    const { data: userData } = await supabase.from(originTable).select('following').eq('id', currentUser.id).single();
    let following: Following = userData?.following || { artists: [], engineers: [], stoodioz: [], producers: [], videographers: [], labels: [] };
    const key = `${type}s` as keyof Following;
    if (!following[key]) (following[key] as any) = [];
    if (isCurrentlyFollowing) (following[key] as string[]) = following[key].filter(id => id !== targetUser.id);
    else if (!following[key].includes(targetUser.id)) following[key].push(targetUser.id);
    const { data: updatedUser } = await supabase.from(originTable).update({ following }).eq('id', currentUser.id).select('*').single();
    const targetTable = roleToTable[type.toUpperCase()] || 'artists';
    const { data: tData } = await supabase.from(targetTable).select('follower_ids').eq('id', targetUser.id).single();
    let fIds = tData?.follower_ids || [];
    if (isCurrentlyFollowing) fIds = fIds.filter((id: string) => id !== currentUser.id);
    else if (!fIds.includes(currentUser.id)) fIds.push(currentUser.id);
    const { data: updatedTarget } = await supabase.from(targetTable).update({ follower_ids: fIds, followers: fIds.length }).eq('id', targetUser.id).select('*').single();
    if (!isCurrentlyFollowing) {
        await supabase.from('notifications').insert({ recipient_id: targetUser.id, type: NotificationType.NEW_FOLLOWER, message: `${currentUser.name} followed you.`, read: false, actor_id: currentUser.id, timestamp: new Date().toISOString() });
    }
    return { updatedCurrentUser: updatedUser || currentUser, updatedTargetUser: updatedTarget || targetUser };
};

export const createBooking = async (request: BookingRequest, stoodio: Stoodio | undefined, booker: any, bookerRole: UserRole): Promise<Booking> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not connected");
    const bookingData = {
        date: request.date,
        start_time: request.start_time,
        duration: request.duration,
        total_cost: request.total_cost,
        status: BookingStatus.CONFIRMED, 
        booked_by_id: booker.id,
        booked_by_role: bookerRole,
        request_type: request.request_type,
        engineer_pay_rate: request.engineer_pay_rate,
        stoodio_id: stoodio?.id,
        room_id: request.room?.id,
        artist_id: bookerRole === 'ARTIST' ? booker.id : undefined,
        created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('bookings').insert(bookingData).select().single();
    if (error) throw error;
    return data;
};

export const createCheckoutSessionForBooking = async (bookingRequest: BookingRequest, stoodioId: string | undefined, userId: string, userRole: UserRole) => { return { sessionId: 'mock_session_id' }; };

export const cancelBooking = async (booking: Booking) => {
    const supabase = getSupabase();
    if (!supabase) return booking;
    const { data } = await supabase.from('bookings').update({ status: BookingStatus.CANCELLED }).eq('id', booking.id).select().single();
    return data || booking;
};

export const fetchGlobalFeed = async (limit: number, beforeTimestamp?: string): Promise<Post[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    let query = supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(limit);
    if (beforeTimestamp) query = query.lt('created_at', beforeTimestamp);
    const { data } = await query;
    return (data || []).map((p: any) => ({
        id: p.id, authorId: p.author_id, authorType: p.author_type, text: p.text, image_url: p.image_url, video_url: p.video_url, video_thumbnail_url: p.video_thumbnail_url, link: p.link, timestamp: p.created_at, likes: p.likes || [], comments: p.comments || [], display_mode: p.display_mode, focus_point: p.focus_point
    }));
};

export const fetchUserPosts = async (userId: string): Promise<Post[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from('posts').select('*').eq('author_id', userId).order('created_at', { ascending: false });
    return (data || []).map((p: any) => ({
        id: p.id, authorId: p.author_id, authorType: p.author_type, text: p.text, image_url: p.image_url, video_url: p.video_url, video_thumbnail_url: p.video_thumbnail_url, link: p.link, timestamp: p.created_at, likes: p.likes || [], comments: p.comments || [], display_mode: p.display_mode, focus_point: p.focus_point
    }));
};

export const createPost = async (postData: any, author: any, authorType: UserRole) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No DB");
    const { data, error } = await supabase.from('posts').insert({ author_id: author.id, author_type: authorType, text: postData.text, image_url: postData.image_url, video_url: postData.video_url, video_thumbnail_url: postData.video_thumbnail_url, link: postData.link, likes: [], comments: [], created_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return { updatedAuthor: author, createdPost: data as unknown as Post }; 
};

export const likePost = async (postId: string, userId: string, author: any) => {
    const supabase = getSupabase();
    if (!supabase) return { updatedAuthor: author };
    const { data: post } = await supabase.from('posts').select('likes').eq('id', postId).single();
    let likes = post?.likes || [];
    if (likes.includes(userId)) likes = likes.filter((id: string) => id !== userId);
    else likes.push(userId);
    await supabase.from('posts').update({ likes }).eq('id', postId);
    return { updatedAuthor: author };
};

export const commentOnPost = async (postId: string, text: string, commenter: any, postAuthor: any) => {
    const supabase = getSupabase();
    if (!supabase) return { updatedAuthor: postAuthor };
    const { data: post } = await supabase.from('posts').select('comments').eq('id', postId).single();
    const newComment = { id: crypto.randomUUID(), authorId: commenter.id, authorName: commenter.name, author_image_url: commenter.image_url, text, timestamp: new Date().toISOString() };
    await supabase.from('posts').update({ comments: [...(post?.comments || []), newComment] }).eq('id', postId);
    return { updatedAuthor: postAuthor };
};

export const fetchConversations = async (userId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from('conversations').select('*').contains('participant_ids', [userId]);
    const full = await Promise.all((data || []).map(async (convo: any) => {
        const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id', convo.id).order('created_at', { ascending: true });
        let participants: any[] = [];
        for (const pid of convo.participant_ids) {
            const res = await fetchCurrentUserProfile(pid);
            if (res) participants.push(res.user);
        }
        return { id: convo.id, participants, messages: (msgs || []).map((m: any) => ({ id: m.id, sender_id: m.sender_id, timestamp: m.created_at, type: m.message_type, text: m.content, media_url: m.media_url, files: m.file_attachments })), unread_count: 0 };
    }));
    return full;
};

export const sendMessage = async (conversationId: string, senderId: string, content: string, type: string = 'text', fileData?: any) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: senderId, content, message_type: type, media_url: fileData?.url, file_attachments: type === 'files' ? fileData : null }).select().single();
    return data;
};

export const createConversation = async (participantIds: string[]) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.from('conversations').insert({ participant_ids: participantIds }).select().single();
    return data;
}

export const fetchLabelContracts = async (labelId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from('label_contracts').select('*').eq('label_id', labelId);
    return data || [];
};

export const fetchLabelRoster = async (labelId: string) => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data: rosterEntries } = await supabase.from('label_roster').select('*').eq('label_id', labelId);
    const hydrated: RosterMember[] = [];
    for (const entry of rosterEntries || []) {
        if (!entry.user_id) continue;
        const res = await fetchCurrentUserProfile(entry.user_id);
        if (res) hydrated.push({ ...res.user, role_in_label: entry.role, roster_id: entry.id });
    }
    return hydrated;
};

export const getLabelBudgetOverview = async (labelId: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.rpc('get_label_budget_overview', { p_label_id: labelId });
    return data;
};

export const fetchAnalyticsData = async (userId: string, role: UserRole, days: number) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not connected");
    const { data: user } = await supabase.from(role === 'ARTIST' ? 'artists' : role === 'ENGINEER' ? 'engineers' : role === 'PRODUCER' ? 'producers' : role === 'STOODIO' ? 'stoodioz' : 'labels').select('wallet_transactions').eq('id', userId).single();
    const relevant = (user?.wallet_transactions || []).filter((t: any) => new Date(t.date) >= new Date(Date.now() - days * 24 * 60 * 60 * 1000));
    return { kpis: { totalRevenue: relevant.reduce((s: number, t: any) => s + (t.amount > 0 ? t.amount : 0), 0), profileViews: 0, newFollowers: 0, bookings: 0 }, revenueOverTime: relevant.map((t: any) => ({ date: t.date, revenue: t.amount })), engagementOverTime: [], revenueSources: [] };
};

export const endSession = async (booking: Booking) => { return { updatedBooking: { ...booking, status: BookingStatus.COMPLETED } }; };
export const purchaseBeat = async (beat: Instrumental, type: string, buyer: any, producer: Producer, role: UserRole) => { return { updatedBooking: { ...beat, id: crypto.randomUUID(), status: BookingStatus.COMPLETED } as any }; };
export const respondToBooking = async (booking: Booking, action: string, engineer: Engineer) => { return { ...booking, status: action === 'accept' ? BookingStatus.CONFIRMED : BookingStatus.CANCELLED }; };
export const acceptJob = async (booking: Booking, engineer: Engineer) => { return { ...booking, status: BookingStatus.CONFIRMED, engineer }; };
export const addTip = async (booking: Booking, amount: number) => { return { sessionId: 'mock' }; };
export const initiatePayout = async (amount: number, userId: string) => { return true; };
export const createCheckoutSessionForSubscription = async (plan: string, userId: string) => { return { sessionId: 'mock' }; };
export const createCheckoutSessionForWallet = async (amount: number, userId: string) => { return { sessionId: 'mock' }; };
export const updateLabelBudgetMode = async (labelId: string, mode: LabelBudgetMode, allowance: number, day: number) => { return null; };
export const addLabelFunds = async (labelId: string, amount: number, note: string) => { return true; };
export const setLabelBudget = async (labelId: string, total: number) => { return null; };
export const setArtistAllocation = async (labelId: string, artistId: string, amount: number) => { return null; };
export const submitForVerification = async (stoodioId: string, data: any) => { return { verification_status: VerificationStatus.PENDING }; };
export const upsertRoom = async (room: Room, stoodioId: string) => { return null; };
export const deleteRoom = async (roomId: string) => { return null; };
export const upsertInHouseEngineer = async (info: InHouseEngineerInfo, stoodioId: string) => { return null; };
export const deleteInHouseEngineer = async (engineerId: string, stoodioId: string) => { return null; };
export const upsertInstrumental = async (inst: Instrumental, producerId: string) => { return null; };
export const deleteInstrumental = async (instId: string) => { return null; };
export const upsertMixingSample = async (sample: MixingSample, engineerId: string) => { return null; };
export const deleteMixingSample = async (sampleId: string) => { return null; };
export const generateClaimTokenForRosterMember = async (rosterId: string) => { return { claimUrl: `/claim/${crypto.randomUUID()}` }; };
export const removeArtistFromLabelRoster = async (labelId: string, rosterId: string, artistId?: string) => { return true; };
export const claimProfileByCode = async (code: string, userId: string) => { return { role: UserRoleEnum.ARTIST }; };
export const claimProfileByToken = async (token: string, userId: string) => { return { role: UserRoleEnum.ARTIST }; };
export const getClaimDetails = async (token: string) => { return null; };
export const claimLabelRosterProfile = async (details: any) => { return { success: true }; };
export const fetchLabelPerformance = async (labelId: string) => { return []; };
export const getRosterActivity = async (labelId: string) => { return []; };
export const fetchLabelBookings = async (labelId: string): Promise<Booking[]> => { return []; };

export const createShadowProfile = async (
    role: 'ARTIST' | 'PRODUCER' | 'ENGINEER', 
    labelId: string, 
    data: { name: string; email?: string }
): Promise<{ profileId: string; roleId: string }> => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase client not initialized");

    const shadowId = crypto.randomUUID();

    const { error: profileError } = await supabase.from('profiles').insert({
        id: shadowId,
        email: data.email || null,
        role: 'UNCLAIMED', // Shadow role
        full_name: data.name,
        created_at: new Date().toISOString()
    });

    if (profileError) throw profileError;

    const tableMap: Record<string, string> = {
        'ARTIST': 'artists',
        'PRODUCER': 'producers',
        'ENGINEER': 'engineers'
    };
    
    const tableName = tableMap[role];
    const userRecord = {
        id: shadowId,
        name: data.name,
        email: data.email || null,
        image_url: USER_SILHOUETTE_URL,
        label_id: labelId, // Directly assign label ownership
        created_at: new Date().toISOString(),
        wallet_balance: 0,
        wallet_transactions: []
    };

    if (role === 'ENGINEER') (userRecord as any).specialties = [];
    if (role === 'PRODUCER') (userRecord as any).genres = [];
    if (role === 'ARTIST') (userRecord as any).bio = '';

    const { error: roleError } = await supabase.from(tableName).insert(userRecord);
    if (roleError) throw roleError;

    const rosterEntry = {
        id: crypto.randomUUID(),
        label_id: labelId,
        user_id: shadowId,
        role: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(), 
        email: data.email,
        created_at: new Date().toISOString()
    };

    await supabase.from('label_roster').insert(rosterEntry);

    return { profileId: shadowId, roleId: shadowId };
};
