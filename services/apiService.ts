import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Review, Post, Comment, Transaction, AnalyticsData } from '../types';
import { BookingStatus, VerificationStatus, TransactionCategory, TransactionStatus } from '../types';
import { getSupabase } from '../lib/supabase';
import { subDays, format } from 'date-fns';
import { USER_SILHOUETTE_URL } from '../constants';

// --- DATA FETCHING (GET Requests) ---

const fetchData = async <T>(tableName: string, query: string = '*'): Promise<T[]> => {
    const supabase = getSupabase();
    if (!supabase) {
        console.error("Supabase client is not initialized.");
        return [];
    }
    try {
        const { data, error } = await supabase.from(tableName).select(query);
        if (error) {
            console.error(`Error fetching from ${tableName}:`, error.message);
            throw error;
        }
        return data as T[];
    } catch (error: any) {
        console.error(`API service error for ${tableName}:`, error.message);
        return [];
    }
};

/*
 * Fetches main data and related nested data using Supabase resource embedding.
 * - The standard implicit join syntax `related_table(*)` is used. This requires that
 *   foreign key relationships are properly defined in the Supabase database schema.
 *   For example, for `rooms(*)` to work when querying `stoodioz`, the `rooms` table
 *   must have a `stoodio_id` foreign key column that references `stoodioz.id`.
 */
export const fetchStoodioz = (): Promise<Stoodio[]> => fetchData<Stoodio>('stoodioz', '*, rooms(*), in_house_engineers(*)');
export const fetchArtists = (): Promise<Artist[]> => fetchData<Artist>('artists', '*');
export const fetchEngineers = (): Promise<Engineer[]> => fetchData<Engineer>('engineers', '*, mixing_samples(*)');
export const fetchProducers = (): Promise<Producer[]> => fetchData<Producer>('producers', '*');
export const fetchReviews = (): Promise<Review[]> => fetchData<Review>('reviews', '*');
// The query for bookings uses aliasing (e.g., `stoodio:stoodioz(*)`) to map the fetched
// `stoodioz` table to the `stoodio` property on the Booking type. This is correct syntax.
// An error here likely indicates a missing Foreign Key constraint in the Supabase schema.
export const fetchBookings = (): Promise<Booking[]> => fetchData<Booking>('bookings', '*, stoodio:stoodioz(*), artist:artists(*), engineer:engineers(*), producer:producers(*)');


// --- DATA MUTATIONS (Simulated POST, PUT, DELETE Requests) ---

// FIX: Add findUserByCredentials function
export const findUserByCredentials = async (email: string, password: string): Promise<Artist | Engineer | Stoodio | Producer | null> => {
    const tables = ['artists', 'engineers', 'producers', 'stoodioz'];
    for (const table of tables) {
        const supabase = getSupabase();
        if (!supabase) return null;
        const { data, error } = await supabase.from(table).select('*').eq('email', email).eq('password', password).limit(1);
        if (error) {
            console.error(`Error finding user in ${table}:`, error);
            continue;
        }
        if (data && data.length > 0) {
            return data[0] as Artist | Engineer | Stoodio | Producer;
        }
    }
    return null;
};

// FIX: Add createUser function
export const createUser = async (userData: any, role: UserRole): Promise<Artist | Engineer | Stoodio | Producer | null> => {
    let tableName = '';
    let newUserScaffold: any = {};
    const baseData = {
        id: `${role.toLowerCase()}-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        password: userData.password,
        imageUrl: USER_SILHOUETTE_URL,
        followers: 0,
        following: { stoodioz: [], engineers: [], artists: [], producers: [] },
        followerIds: [],
        coordinates: { lat: 34.0522, lon: -118.2437 }, // LA
        walletBalance: 0,
        walletTransactions: [],
        posts: [],
        links: [],
        isOnline: true,
    };
    
    switch (role) {
        case 'ARTIST':
            tableName = 'artists';
            newUserScaffold = { ...baseData, bio: userData.bio, isSeekingSession: false, showOnMap: false };
            break;
        case 'ENGINEER':
            tableName = 'engineers';
            newUserScaffold = { ...baseData, bio: userData.bio, specialties: [], rating: 5, sessionsCompleted: 0, mixingSamples: [], isAvailable: true, showOnMap: true, displayExactLocation: false };
            break;
        case 'PRODUCER':
            tableName = 'producers';
            newUserScaffold = { ...baseData, bio: userData.bio, genres: [], rating: 5, instrumentals: [], isAvailable: true, showOnMap: true };
            break;
        case 'STOODIO':
            tableName = 'stoodioz';
            newUserScaffold = { ...baseData, description: userData.description, location: userData.location, hourlyRate: 100, engineerPayRate: 50, rating: 5, amenities: [], availability: [], photos: [baseData.imageUrl], rooms: [], verificationStatus: VerificationStatus.UNVERIFIED, showOnMap: true };
            break;
    }
    
    // This is a mock implementation
    return newUserScaffold;
};

// FIX: Add updateUser function
export const updateUser = async (userId: string, updates: Partial<Artist | Engineer | Stoodio | Producer>): Promise<any> => {
    // This is a mock. A real function would update the database.
    console.log(`Updating user ${userId} with`, updates);
    // This mock returns a partial object. The hook logic will merge it.
    return { id: userId, ...updates }; 
};


export const createBooking = async (
    bookingRequest: BookingRequest,
    stoodio: Stoodio | undefined,
    currentUser: Artist | Engineer | Stoodio | Producer,
    userRole: UserRole,
    engineers: Engineer[],
    producers: Producer[]
): Promise<Booking> => {
    // This logic mimics the original mock to determine status and assign engineers for "Find Available"
    let status = BookingStatus.PENDING;
    let engineer: Engineer | null = null;

    if (bookingRequest.mixingDetails?.type === 'REMOTE') {
         status = BookingStatus.PENDING_APPROVAL;
    } else {
        if (bookingRequest.requestType === 'BRING_YOUR_OWN' || !!bookingRequest.producerId) status = BookingStatus.CONFIRMED;
        else if (bookingRequest.requestType === 'SPECIFIC_ENGINEER') status = BookingStatus.PENDING_APPROVAL;
        else status = BookingStatus.CONFIRMED;
    }
    
    if (status === BookingStatus.CONFIRMED && bookingRequest.requestType === 'FIND_AVAILABLE') {
        engineer = engineers.find(e => e.isAvailable) || null;
    }

    const newBooking: Booking = {
        id: `booking-${Date.now()}`,
        ...bookingRequest,
        stoodio,
        engineer,
        producer: bookingRequest.producerId ? producers.find(p => p.id === bookingRequest.producerId) || null : null,
        artist: userRole === 'ARTIST' ? (currentUser as Artist) : null,
        status,
        requestedEngineerId: bookingRequest.requestedEngineerId || null,
        bookedById: currentUser.id,
        bookedByRole: userRole,
    };
    
    // In a real app, this would be an API call. Here we just return the new object.
    return newBooking;
};

export const endSession = async (booking: Booking): Promise<{ updatedBooking: Booking }> => {
    const updatedBooking = { ...booking, status: BookingStatus.COMPLETED };
    return { updatedBooking };
};

// FIX: `cancelBooking` now correctly receives a `Booking` object.
export const cancelBooking = async (booking: Booking): Promise<{ updatedBookings: Booking[] }> => {
    const updatedBooking = { ...booking, status: BookingStatus.CANCELLED };
    return { updatedBookings: [updatedBooking] };
};

// FIX: `addTip` now returns the expected shape for the hook.
export const addTip = async (booking: Booking, tipAmount: number): Promise<{ updatedBooking: Booking; updatedUsers: any[] }> => {
    const updatedBooking = { ...booking, tip: tipAmount };
    const updatedUsers: any[] = [];
    // A real API would update user wallets here. We'll return an empty array for the mock.
    return { updatedBooking, updatedUsers };
};

// FIX: `toggleFollow` now accepts all users to find the target and returns both updated users.
export const toggleFollow = async (currentUser: any, targetId: string, targetType: 'artist' | 'engineer' | 'stoodio' | 'producer', allUsers: any[]): Promise<{ updatedCurrentUser: any; updatedTargetUser: any; }> => {
    const listKey = `${targetType}s`;
    const isFollowing = (currentUser.following[listKey] || []).includes(targetId);
    
    let newFollowingList;
    if (isFollowing) {
        newFollowingList = (currentUser.following[listKey] || []).filter((id: string) => id !== targetId);
    } else {
        newFollowingList = [...(currentUser.following[listKey] || []), targetId];
    }
    const updatedCurrentUser = { ...currentUser, following: { ...currentUser.following, [listKey]: newFollowingList } };
    
    const targetUser = allUsers.find(u => u.id === targetId);
    if (!targetUser) return { updatedCurrentUser, updatedTargetUser: null };

    let newFollowerIds;
    if (isFollowing) {
        newFollowerIds = (targetUser.followerIds || []).filter((id: string) => id !== currentUser.id);
    } else {
        newFollowerIds = [...(targetUser.followerIds || []), currentUser.id];
    }
    const updatedTargetUser = { ...targetUser, followerIds: newFollowerIds, followers: newFollowerIds.length };

    return { updatedCurrentUser, updatedTargetUser };
};

export const createPost = async (postData: { text: string; imageUrl?: string; link?: any }, author: any, authorType: UserRole): Promise<any> => {
    const newPost: Post = { 
        id: `post-${Date.now()}`,
        authorId: author.id, 
        authorType, 
        timestamp: new Date().toISOString(), 
        likes: [], 
        comments: [],
        ...postData, 
    };

    const newPosts = [newPost, ...(author.posts || [])];
    return { ...author, posts: newPosts };
};

export const likePost = async (postId: string, userId: string, author: any): Promise<any> => {
    const postToUpdate = (author.posts || []).find((p: Post) => p.id === postId);
    if (!postToUpdate) return author;

    const newLikes = postToUpdate.likes.includes(userId)
        ? postToUpdate.likes.filter((id: string) => id !== userId)
        : [...postToUpdate.likes, userId];

    const updatedPosts = author.posts.map((p: Post) => p.id === postId ? { ...p, likes: newLikes } : p);
    return { ...author, posts: updatedPosts };
};

export const commentOnPost = async (postId: string, commentText: string, commentAuthor: any, postAuthor: any): Promise<any> => {
    const newComment: Comment = { 
        id: `comment-${Date.now()}`, 
        authorId: commentAuthor.id, 
        authorName: commentAuthor.name, 
        authorImageUrl: commentAuthor.imageUrl, 
        text: commentText, 
        timestamp: new Date().toISOString() 
    };

    const updatedPosts = postAuthor.posts.map((p: Post) => 
        p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
    );
    return { ...postAuthor, posts: updatedPosts };
};

export const respondToBooking = async (booking: Booking, action: 'accept' | 'deny', engineer: Engineer): Promise<{ updatedBooking: Booking }> => {
    const status = action === 'accept' ? BookingStatus.CONFIRMED : BookingStatus.PENDING;
    const updatedBooking = { ...booking, status, engineer: action === 'accept' ? engineer : null };
    return { updatedBooking };
};

// FIX: Add `submitForVerification` and `approveVerification` functions.
export const submitForVerification = async (stoodioId: string, verificationData: { googleBusinessProfileUrl: string; websiteUrl: string }): Promise<Partial<Stoodio>> => {
    // Simulate the API call, return a pending status for optimistic UI update.
    return { ...verificationData, verificationStatus: VerificationStatus.PENDING };
};

export const approveVerification = async (stoodioId: string): Promise<Partial<Stoodio>> => {
    // Simulate an admin approving the request
    return { verificationStatus: VerificationStatus.VERIFIED };
};

// FIX: Add `updateUserWallet` function
export const updateUserWallet = async (userId: string, userRole: UserRole, amount: number, category: string): Promise<any> => {
    console.warn('updateUserWallet is a mock and does not persist data.');
     const allUsers = [
        ...await fetchArtists(),
        ...await fetchEngineers(),
        ...await fetchProducers(),
        ...await fetchStoodioz(),
    ];
    const user = allUsers.find(u => u.id === userId);
    if (!user) return null;
    
    const newBalance = user.walletBalance + amount;
     const newTransaction: Transaction = {
        id: `tx-${Date.now()}`,
        description: category.replace('_', ' '),
        amount: amount,
        date: new Date().toISOString(),
        category: category as TransactionCategory,
        status: TransactionStatus.COMPLETED,
    };

    return { ...user, walletBalance: newBalance, walletTransactions: [...user.walletTransactions, newTransaction] };
};

export const fetchAnalyticsData = async (userId: string, days: number = 30): Promise<AnalyticsData> => {
    // This is a mock function. In a real app, you would query Supabase with aggregate functions (e.g., SUM, COUNT, GROUP BY date).
    // For now, we generate plausible random data.
    
    await new Promise(res => setTimeout(res, 800)); // Simulate network delay

    const revenueOverTime = [];
    const engagementOverTime = [];
    let totalRevenue = 0;
    
    for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateString = format(date, 'yyyy-MM-dd');
        
        const dailyRevenue = Math.random() * 300;
        totalRevenue += dailyRevenue;
        
        revenueOverTime.push({
            date: dateString,
            revenue: parseFloat(dailyRevenue.toFixed(2)),
        });
        
        engagementOverTime.push({
            date: dateString,
            views: Math.floor(Math.random() * 150) + 20,
            followers: Math.floor(Math.random() * 5),
            likes: Math.floor(Math.random() * 30),
        });
    }

    return {
        kpis: {
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            profileViews: Math.floor(Math.random() * 2000) + 500,
            newFollowers: Math.floor(Math.random() * 50) + 10,
            bookings: Math.floor(Math.random() * 20) + 5,
        },
        revenueOverTime,
        engagementOverTime,
        revenueSources: [
            { name: 'Studio Bookings', revenue: totalRevenue * 0.6 },
            { name: 'Beat Sales', revenue: totalRevenue * 0.3 },
            { name: 'Tips', revenue: totalRevenue * 0.1 },
        ]
    };
};