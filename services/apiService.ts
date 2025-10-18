import type { Stoodio, Artist, Engineer, Producer, Booking, BookingRequest, UserRole, Transaction, Post, Comment } from '../types';
import { BookingStatus, BookingRequestType, TransactionCategory, TransactionStatus, VerificationStatus } from '../types';
import { differenceInHours } from 'date-fns';

const API_BASE_URL = '/api'; // In a real app, this would be your backend URL. For this demo, it points to the public/api folder.

// --- DATA FETCHING (GET Requests) ---

const fetchData = async <T>(endpoint: string): Promise<T> => {
    // In a real app, you might have headers for authentication, etc.
    const response = await fetch(`${API_BASE_URL}/${endpoint}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }
    return await response.json();
}

export const fetchStoodioz = (): Promise<Stoodio[]> => fetchData('stoodioz.json');
export const fetchArtists = (): Promise<Artist[]> => fetchData('artists.json');
export const fetchEngineers = (): Promise<Engineer[]> => fetchData('engineers.json');
export const fetchProducers = (): Promise<Producer[]> => fetchData('producers.json');

// --- DATA MUTATION (POST, PUT, DELETE simulations) ---
// These functions simulate backend operations by taking the current state,
// performing mutations, and returning the newly updated state objects.

export const createBooking = async (
    bookingRequest: BookingRequest,
    stoodio: Stoodio | undefined, // Can be undefined for remote mixes
    currentUser: Artist | Engineer | Stoodio | Producer,
    userRole: UserRole,
    engineers: Engineer[],
    producers: Producer[]
): Promise<Booking> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    let status = BookingStatus.PENDING;
    let engineer: Engineer | null = null;
    
    // Remote Mix logic
    if (bookingRequest.mixingDetails?.type === 'REMOTE') {
         status = BookingStatus.PENDING_APPROVAL;
    } 
    // In-Studio logic
    else {
        const isProducerBooking = !!bookingRequest.producerId;
        if (isProducerBooking) {
            status = BookingStatus.CONFIRMED;
            if (bookingRequest.requestType === BookingRequestType.FIND_AVAILABLE) {
                engineer = engineers.find(e => e.isAvailable) || null;
            } else if (bookingRequest.requestType === BookingRequestType.SPECIFIC_ENGINEER && bookingRequest.requestedEngineerId) {
                engineer = engineers.find(e => e.id === bookingRequest.requestedEngineerId) || null;
            }
        } else {
            if (bookingRequest.requestType === BookingRequestType.BRING_YOUR_OWN) {
                status = BookingStatus.CONFIRMED;
            } else if (bookingRequest.requestType === BookingRequestType.SPECIFIC_ENGINEER) {
                status = BookingStatus.PENDING_APPROVAL;
            } else {
                status = BookingStatus.CONFIRMED;
                engineer = engineers.find(e => e.isAvailable) || null;
            }
        }
    }


    const newBooking: Booking = {
        id: `BKG-${Date.now()}`,
        ...bookingRequest,
        stoodio: stoodio,
        engineer: engineer,
        producer: bookingRequest.producerId ? producers.find(p => p.id === bookingRequest.producerId) || null : null,
        artist: userRole === 'ARTIST' ? (currentUser as Artist) : null,
        status: status,
        requestedEngineerId: bookingRequest.requestedEngineerId || null,
        bookedById: currentUser.id,
        bookedByRole: userRole,
        instrumentalsPurchased: bookingRequest.instrumentalsToPurchase || [],
        pullUpFee: bookingRequest.pullUpFee || 0,
    };

    console.log('Simulating POST /api/bookings with:', bookingRequest);
    console.log('Simulated backend response:', newBooking);
    return newBooking;
};

export const cancelBooking = async (
    bookingId: string,
    bookings: Booking[],
    allUsers: (Artist | Engineer | Stoodio | Producer)[]
): Promise<{ updatedBookings: Booking[], updatedUsers: (Artist | Engineer | Stoodio | Producer)[] }> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const bookingToCancel = bookings.find(b => b.id === bookingId);
    if (!bookingToCancel) throw new Error("Booking not found");

    const bookingStartTime = new Date(`${bookingToCancel.date}T${bookingToCancel.startTime}`);
    const hoursUntilSession = differenceInHours(bookingStartTime, new Date());

    let refundPercentage = 0;
    if (hoursUntilSession > 48) refundPercentage = 1.0;
    else if (hoursUntilSession > 24) refundPercentage = 0.5;

    const refundAmount = bookingToCancel.totalCost * refundPercentage;
    let updatedUsers = [...allUsers];

    if (refundAmount > 0) {
        const userIndex = updatedUsers.findIndex(u => u.id === bookingToCancel.bookedById);
        if (userIndex > -1) {
            const userToUpdate = { ...updatedUsers[userIndex] };
            const refundTx: Transaction = {
                id: `txn-refund-${Date.now()}`,
                description: `Refund for cancelled session`,
                amount: refundAmount,
                date: new Date().toISOString(),
                category: TransactionCategory.REFUND,
                status: TransactionStatus.COMPLETED,
                relatedBookingId: bookingToCancel.id,
            };
            userToUpdate.walletBalance += refundAmount;
            userToUpdate.walletTransactions = [refundTx, ...userToUpdate.walletTransactions];
            updatedUsers[userIndex] = userToUpdate;
        }
    }

    const updatedBookings = bookings.map(b => b.id === bookingId ? { ...b, status: BookingStatus.CANCELLED } : b);

    return { updatedBookings, updatedUsers };
};

export const endSession = async (
    bookingId: string,
    bookings: Booking[],
    allUsers: (Artist | Engineer | Stoodio | Producer)[]
): Promise<{ updatedBookings: Booking[], updatedUsers: (Artist | Engineer | Stoodio | Producer)[] }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let bookingToEnd = bookings.find(b => b.id === bookingId);
    if (!bookingToEnd) throw new Error("Booking not found");

    const updatedBookings = bookings.map(b => b.id === bookingId ? { ...b, status: BookingStatus.COMPLETED } : b);
    bookingToEnd = updatedBookings.find(b => b.id === bookingId)!;

    const booker = allUsers.find(u => u.id === bookingToEnd.bookedById);
    const bookerName = booker?.name || 'A User';
    const now = new Date().toISOString();
    let updatedUsers = [...allUsers];

    const updateUserWallet = (userId: string, transaction: Transaction) => {
        const userIndex = updatedUsers.findIndex(u => u.id === userId);
        if (userIndex > -1) {
            const user = { ...updatedUsers[userIndex] };
            user.walletBalance += transaction.amount;
            user.walletTransactions = [transaction, ...user.walletTransactions];
            updatedUsers[userIndex] = user;
        }
    };
    
    // 1. Debit the booker
    if (bookingToEnd.totalCost > 0) {
        const paymentTx: Transaction = {
            id: `txn-pay-${Date.now()}`,
            description: `Session Payment`,
            amount: -bookingToEnd.totalCost,
            date: now,
            category: TransactionCategory.SESSION_PAYMENT,
            status: TransactionStatus.COMPLETED,
            relatedBookingId: bookingToEnd.id,
        };
        updateUserWallet(bookingToEnd.bookedById, paymentTx);
    }

    // 2. Credit the Stoodio
    if (bookingToEnd.stoodio && bookingToEnd.room) {
        const stoodioPayout = bookingToEnd.room.hourlyRate * bookingToEnd.duration;
        const stoodioPayoutTx: Transaction = {
            id: `txn-payout-s-${Date.now()}`,
            description: `Payout from ${bookerName}`,
            amount: stoodioPayout,
            date: now,
            category: TransactionCategory.SESSION_PAYOUT,
            status: TransactionStatus.COMPLETED,
            relatedBookingId: bookingToEnd.id,
        };
        updateUserWallet(bookingToEnd.stoodio.id, stoodioPayoutTx);
    }
    
    // 3. Credit the Engineer
    if (bookingToEnd.engineer) {
        const isRemoteMix = !!bookingToEnd.mixingDetails && !bookingToEnd.stoodio;
        const engineerPayout = isRemoteMix ? bookingToEnd.totalCost : (bookingToEnd.engineerPayRate * bookingToEnd.duration);
        const engineerPayoutTx: Transaction = {
            id: `txn-payout-e-${Date.now()}`,
            description: `Payout from ${bookerName}`,
            amount: engineerPayout,
            date: now,
            category: isRemoteMix ? TransactionCategory.MIXING_PAYOUT : TransactionCategory.SESSION_PAYOUT,
            status: TransactionStatus.COMPLETED,
            relatedBookingId: bookingToEnd.id
        };
        updateUserWallet(bookingToEnd.engineer.id, engineerPayoutTx);
    }

    return { updatedBookings, updatedUsers };
};

export const addTip = async (
    bookingId: string,
    tipAmount: number,
    bookings: Booking[],
    allUsers: (Artist | Engineer | Stoodio | Producer)[],
): Promise<{ updatedBookings: Booking[], updatedUsers: (Artist | Engineer | Stoodio | Producer)[] }> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking || !booking.engineer || !booking.artist) throw new Error("Invalid booking for tip");

    const updatedBookings = bookings.map(b => b.id === bookingId ? { ...b, tip: tipAmount } : b);
    let updatedUsers = [...allUsers];
    const now = new Date().toISOString();

    const updateUserWallet = (userId: string, transaction: Transaction) => {
        const userIndex = updatedUsers.findIndex(u => u.id === userId);
        if (userIndex > -1) {
            const user = { ...updatedUsers[userIndex] };
            user.walletBalance += transaction.amount;
            user.walletTransactions = [transaction, ...user.walletTransactions];
            updatedUsers[userIndex] = user;
        }
    };
    
    // Debit Artist
    const tipPaymentTx: Transaction = { id: `txn-tip-pay-${Date.now()}`, description: `Tip for ${booking.engineer.name}`, amount: -tipAmount, date: now, category: TransactionCategory.TIP_PAYMENT, status: TransactionStatus.COMPLETED, relatedBookingId: booking.id };
    updateUserWallet(booking.artist.id, tipPaymentTx);

    // Credit Engineer
    const tipPayoutTx: Transaction = { id: `txn-tip-payout-${Date.now()}`, description: `Tip from ${booking.artist.name}`, amount: tipAmount, date: now, category: TransactionCategory.TIP_PAYOUT, status: TransactionStatus.COMPLETED, relatedBookingId: booking.id };
    updateUserWallet(booking.engineer.id, tipPayoutTx);

    return { updatedBookings, updatedUsers };
};

export const toggleFollow = async (
    currentUser: Artist | Engineer | Stoodio | Producer,
    targetId: string,
    targetType: 'stoodio' | 'engineer' | 'artist' | 'producer',
    allUsers: (Artist | Engineer | Stoodio | Producer)[]
): Promise<(Artist | Engineer | Stoodio | Producer)[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));

    let updatedUsers = [...allUsers];
    const listKey = `${targetType}s` as keyof typeof currentUser.following;

    // Update current user's following list
    const currentUserIndex = updatedUsers.findIndex(u => u.id === currentUser.id);
    if (currentUserIndex > -1) {
        const userToUpdate = { ...updatedUsers[currentUserIndex] };
        const isFollowing = (userToUpdate.following[listKey] as string[]).includes(targetId);
        if (isFollowing) {
            (userToUpdate.following[listKey] as string[]) = (userToUpdate.following[listKey] as string[]).filter(id => id !== targetId);
        } else {
            (userToUpdate.following[listKey] as string[]).push(targetId);
        }
        updatedUsers[currentUserIndex] = userToUpdate;
    }

    // Update target user's followers list
    const targetUserIndex = updatedUsers.findIndex(u => u.id === targetId);
    if (targetUserIndex > -1) {
        const targetToUpdate = { ...updatedUsers[targetUserIndex] };
        const isFollower = targetToUpdate.followerIds.includes(currentUser.id);
        if (isFollower) {
            targetToUpdate.followerIds = targetToUpdate.followerIds.filter(id => id !== currentUser.id);
        } else {
            targetToUpdate.followerIds.push(currentUser.id);
        }
        targetToUpdate.followers = targetToUpdate.followerIds.length;
        updatedUsers[targetUserIndex] = targetToUpdate;
    }
    
    return updatedUsers;
};

export const createPost = async (
    postData: { text: string; imageUrl?: string; videoUrl?: string; videoThumbnailUrl?: string; link?: any },
    author: Artist | Engineer | Stoodio | Producer,
    authorType: UserRole,
    allUsers: (Artist | Engineer | Stoodio | Producer)[]
): Promise<(Artist | Engineer | Stoodio | Producer)[]> => {
     await new Promise(resolve => setTimeout(resolve, 600));

    const newPost: Post = {
        id: `post-${Date.now()}`,
        authorId: author.id,
        authorType: authorType,
        text: postData.text,
        timestamp: new Date().toISOString(),
        likes: [],
        comments: [],
    };

    const updatedUsers = allUsers.map(u => {
        if (u.id === author.id) {
            return { ...u, posts: [newPost, ...(u.posts || [])] };
        }
        return u;
    });

    return updatedUsers;
};

export const likePost = async (
    postId: string,
    userId: string,
    allUsers: (Artist | Engineer | Stoodio | Producer)[]
): Promise<(Artist | Engineer | Stoodio | Producer)[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));

    const updateLikes = (posts: Post[] | undefined) =>
        posts?.map(p => {
            if (p.id === postId) {
                const newLikes = p.likes.includes(userId)
                    ? p.likes.filter(id => id !== userId)
                    : [...p.likes, userId];
                return { ...p, likes: newLikes };
            }
            return p;
        });

    return allUsers.map(u => ({ ...u, posts: updateLikes(u.posts) }));
};

export const commentOnPost = async (
    postId: string,
    commentText: string,
    author: Artist | Engineer | Stoodio | Producer,
    allUsers: (Artist | Engineer | Stoodio | Producer)[]
): Promise<(Artist | Engineer | Stoodio | Producer)[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newComment: Comment = {
        id: `comment-${Date.now()}`,
        authorId: author.id,
        authorName: author.name,
        authorImageUrl: author.imageUrl,
        text: commentText,
        timestamp: new Date().toISOString(),
    };

    const updateComments = (posts: Post[] | undefined) =>
        posts?.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p);

    return allUsers.map(u => ({ ...u, posts: updateComments(u.posts) }));
};

export const respondToBooking = async (
    bookingId: string,
    action: 'accept' | 'deny',
    engineer: Engineer,
    bookings: Booking[],
): Promise<{ updatedBooking: Booking, notification?: any }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error("Booking not found");

    let updatedBooking: Booking;
    let notification;

    if (action === 'accept') {
        updatedBooking = { ...booking, status: BookingStatus.CONFIRMED, engineer };
        if (updatedBooking.artist) {
            notification = {
                userId: updatedBooking.artist.id,
                message: `Your session is confirmed with ${engineer.name}!`,
            };
        }
    } else { // deny
        updatedBooking = { ...booking, status: BookingStatus.PENDING, requestedEngineerId: null };
         if (updatedBooking.artist) {
            notification = {
                userId: updatedBooking.artist.id,
                message: `${engineer.name} was unavailable. We are now searching for other engineers.`,
            };
        }
    }
    return { updatedBooking, notification };
};

export const submitForVerification = async (
    stoodioId: string,
    data: { googleBusinessProfileUrl: string; websiteUrl: string },
    stoodioz: Stoodio[]
): Promise<{ updatedStoodioz: Stoodio[], temporaryStoodio: Stoodio }> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let tempStoodio: Stoodio | null = null;
    const updatedStoodioz = stoodioz.map(s => {
        if (s.id === stoodioId) {
            tempStoodio = {
                ...s,
                verificationStatus: VerificationStatus.PENDING,
                ...data
            };
            return tempStoodio;
        }
        return s;
    });

    // Simulate backend processing and final approval after a delay
    setTimeout(() => {
        // This part would be a webhook or separate API call in a real app.
        // For the mock, we can't update state here, so the UI will have to simulate this.
        console.log(`Simulating verification approval for ${stoodioId}`);
    }, 4000);

    return { updatedStoodioz, temporaryStoodio: tempStoodio! };
}
