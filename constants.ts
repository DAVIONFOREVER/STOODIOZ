// FIX: Created mock data for the application. This file was previously a placeholder.
import { Stoodio, Engineer, Artist, Review, Conversation, UserRole, BookingStatus, BookingRequestType, NotificationType, VerificationStatus, Booking, SubscriptionPlan, SubscriptionStatus } from './types';

export const SERVICE_FEE_PERCENTAGE = 0.15;

const getTodayString = () => new Date().toISOString().split('T')[0];

/**
 * Dynamically generates available time slots for today, starting from the next hour.
 * This ensures there are always bookable slots for testing purposes.
 */
const generateTodaysAvailability = (): { date: string; times: string[] } => {
    const now = new Date();
    const nextHour = now.getHours() + 1;
    const futureTimes: string[] = [];

    // Generate all available hourly slots for the rest of the day until 10 PM (22:00).
    for (let hour = nextHour; hour < 23; hour++) {
        futureTimes.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    // If it's too late, there will be no times, which is realistic.
    // The future days will have plenty of slots.
    return { date: getTodayString(), times: futureTimes };
};


/**
 * Generates a full day of availability for a future date.
 * @param daysAhead The number of days from today.
 */
const generateFutureAvailability = (daysAhead: number): { date: string; times: string[] } => {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return {
        date: date.toISOString().split('T')[0],
        times: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
    };
};

export const MOCK_ARTISTS: Artist[] = [
  {
    id: 'artist-1',
    name: 'Luna Vance',
    email: 'luna@example.com',
    password: 'password',
    bio: 'Dream-pop artist from Los Angeles, inspired by hazy sunsets and city nights. Looking for producers to collaborate with.',
    imageUrl: 'https://source.unsplash.com/random/400x400/?woman,singer',
    followers: 1258,
    following: { stoodioz: ['studio-1'], engineers: ['eng-1', 'eng-2'], artists: [] },
    followerIds: ['eng-1', 'studio-1', 'artist-2'],
    coordinates: { lat: 34.0522, lon: -118.2437 },
    isSeekingSession: true,
    walletBalance: 1500,
    walletTransactions: [
        { id: 'txn-a1-1', description: 'Added funds', amount: 2000, date: new Date().toISOString(), type: 'credit' },
        { id: 'txn-a1-2', description: 'Session at Echo Chamber', amount: -500, date: new Date().toISOString(), type: 'debit' }
    ],
    posts: [
        {
            id: 'post-a1-1',
            authorId: 'artist-1',
            authorType: UserRole.ARTIST,
            text: 'Just wrapped up a session at Echo Chamber, feeling inspired! ✨',
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            likes: ['eng-1', 'studio-1'],
            comments: [
                { id: 'c-a1-1', authorId: 'eng-1', authorName: 'Alex Robinson', authorImageUrl: 'https://source.unsplash.com/random/400x400/?man,sound-engineer', text: 'Was a great session!', timestamp: new Date().toISOString() }
            ]
        }
    ],
    links: [
        { title: 'Official Website', url: 'https://lunavance.music' },
        { title: 'Spotify', url: 'https://spotify.com/artist/lunavance' },
        { title: 'SoundCloud', url: 'https://soundcloud.com/lunavance' },
    ],
    showOnMap: true,
    isOnline: true,
  },
  {
    id: 'artist-2',
    name: 'Static Bloom',
    email: 'static@example.com',
    password: 'password',
    bio: 'Indie rock band from Brooklyn with a love for fuzzy guitars and anthemic choruses. Releasing our new single next month!',
    imageUrl: 'https://source.unsplash.com/random/400x400/?band',
    followers: 8432,
    following: { stoodioz: ['studio-2'], engineers: ['eng-2'], artists: ['artist-1'] },
    followerIds: [],
    coordinates: { lat: 40.7128, lon: -74.0060 },
    isSeekingSession: false,
    walletBalance: 3200,
    walletTransactions: [],
    showOnMap: true,
    isOnline: false,
  },
];

export const ENGINEERS: Engineer[] = [
  {
    id: 'eng-1',
    name: 'Alex "Patch" Robinson',
    email: 'alex@example.com',
    password: 'password',
    bio: 'Seasoned audio engineer with over a decade of experience in both analog and digital domains. Passionate about helping artists achieve their perfect sound.',
    specialties: ['Indie Rock', 'Hip-Hop', 'Electronic', 'Folk'],
    rating: 4.9,
    sessionsCompleted: 238,
    imageUrl: 'https://source.unsplash.com/random/400x400/?man,sound-engineer',
    audioSampleUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-1-short.mp3',
    followers: 841,
    following: { artists: ['artist-1'], engineers: [], stoodioz: ['studio-1', 'studio-2'] },
    followerIds: ['artist-1'],
    coordinates: { lat: 34.06, lon: -118.25 },
    isAvailable: true,
    walletBalance: 5800,
    walletTransactions: [],
    posts: [
        {
            id: 'post-e1-1',
            authorId: 'eng-1',
            authorType: UserRole.ENGINEER,
            text: 'Just upgraded the monitors in my setup. Ready for some critical listening sessions! 🎧',
            timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
            likes: ['artist-1', 'studio-2'],
            comments: []
        }
    ],
    availability: [
       { date: new Date().toISOString().split('T')[0], times: ['13:00', '15:00', '17:00'] },
    ],
    showOnMap: true,
    notificationPreferences: {
        radius: 50, // 50 miles
        enabled: true,
    },
    minimumPayRate: 45,
    isOnline: true,
    subscription: {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
    },
  },
  {
    id: 'eng-2',
    name: 'Jenna Ortega',
    email: 'jenna@example.com',
    password: 'password',
    bio: 'Mixing and mastering specialist with a focus on modern pop and R&B. Let\'s make your track shine!',
    specialties: ['Pop', 'R&B', 'Vocal Production', 'Mastering'],
    rating: 5.0,
    sessionsCompleted: 152,
    imageUrl: 'https://source.unsplash.com/random/400x400/?woman,dj',
    audioSampleUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-2-short.mp3',
    followers: 1102,
    following: { artists: ['artist-2'], engineers: ['eng-1'], stoodioz: ['studio-2'] },
    followerIds: ['artist-1', 'artist-2'],
    coordinates: { lat: 40.72, lon: -74.01 },
    isAvailable: true,
    walletBalance: 7250,
    walletTransactions: [],
    posts: [],
    links: [
        { title: 'Portfolio', url: 'https://jennaortega.audio' },
        { title: 'Mix With The Masters', url: 'https://mixwiththemasters.com' }
    ],
    availability: [],
    showOnMap: true,
    notificationPreferences: {
        radius: 25, // 25 miles
        enabled: true,
    },
    minimumPayRate: 50,
    isOnline: false,
    subscription: {
        plan: SubscriptionPlan.ENGINEER_PLUS,
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
];

export const STOODIOZ: Stoodio[] = [
  {
    id: 'studio-1',
    name: 'Echo Chamber Stoodioz',
    email: 'echo@example.com',
    password: 'password',
    description: 'A state-of-the-art recording facility in the heart of Los Angeles, offering a perfect blend of vintage gear and modern technology.',
    location: 'Los Angeles, CA',
    hourlyRate: 120,
    engineerPayRate: 50,
    rating: 4.8,
    imageUrl: 'https://source.unsplash.com/random/600x400/?recording-studio',
    amenities: ['Neve 8078 Console', 'Vocal Booth', 'Lounge Area', 'Free Coffee & Wi-Fi'],
    coordinates: { lat: 34.05, lon: -118.25 },
    availability: [
      generateTodaysAvailability(),
      generateFutureAvailability(1),
      generateFutureAvailability(2),
      generateFutureAvailability(5),
      generateFutureAvailability(7),
    ],
    photos: [
      'https://source.unsplash.com/random/800x600/?mixing-console',
      'https://source.unsplash.com/random/800x600/?microphone',
      'https://source.unsplash.com/random/800x600/?studio-lounge',
    ],
    followers: 432,
    following: { artists: ['artist-1'], engineers: ['eng-1'], stoodioz: [] },
    followerIds: ['artist-1', 'eng-1'],
    walletBalance: 12500,
    walletTransactions: [],
    rooms: [
        { id: 'room-1a', name: 'Control Room A', description: 'The main mixing and recording room with our Neve console.', hourlyRate: 120, photos: [] },
        { id: 'room-1b', name: 'Vocal Booth B', description: 'A dedicated vocal and isolation booth.', hourlyRate: 80, photos: [] }
    ],
    posts: [],
    links: [
        { title: 'Studio Website', url: 'https://echochamber.com' },
        { title: 'Gear List', url: 'https://echochamber.com/gear' }
    ],
    inHouseEngineers: [
        { engineerId: 'eng-1', payRate: 65 }
    ],
    showOnMap: true,
    verificationStatus: VerificationStatus.VERIFIED,
    googleBusinessProfileUrl: 'https://maps.app.goo.gl/example',
    websiteUrl: 'https://echochamber.com',
    isOnline: true,
    subscription: {
        plan: SubscriptionPlan.STOODIO_PRO,
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: 'studio-2',
    name: 'The Groove Factory',
    email: 'groove@example.com',
    password: 'password',
    description: 'Your go-to spot in Brooklyn for tracking drums and laying down powerful grooves. We have a huge live room and a great mic selection.',
    location: 'Brooklyn, NY',
    hourlyRate: 90,
    engineerPayRate: 45,
    rating: 4.9,
    imageUrl: 'https://source.unsplash.com/random/600x400/?music-studio',
    amenities: ['Large Live Room', 'Vintage Drum Kits', 'API Console', 'Pro Tools HD'],
    coordinates: { lat: 40.71, lon: -74.00 },
    availability: [
       generateTodaysAvailability(),
       generateFutureAvailability(1),
       generateFutureAvailability(3),
       generateFutureAvailability(4),
       generateFutureAvailability(6),
    ],
    photos: [],
    followers: 781,
    following: { artists: [], engineers: ['eng-2'], stoodioz: [] },
    followerIds: ['eng-1', 'artist-2'],
    walletBalance: 21300,
    walletTransactions: [],
    rooms: [
        { id: 'room-2a', name: 'Main Live Room', description: 'Our flagship live tracking room.', hourlyRate: 90, photos: [] }
    ],
    posts: [
         {
            id: 'post-s2-1',
            authorId: 'studio-2',
            authorType: UserRole.STOODIO,
            text: 'Our live room just got a beautiful vintage drum kit. Come check it out!',
            imageUrl: 'https://source.unsplash.com/random/800x600/?drum-kit',
            timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
            likes: ['eng-2'],
            comments: []
        }
    ],
    inHouseEngineers: [
        { engineerId: 'eng-2', payRate: 50 }
    ],
    showOnMap: true,
    verificationStatus: VerificationStatus.UNVERIFIED,
    isOnline: false,
    subscription: {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
    },
  },
];

export const MOCK_BOOKINGS: Booking[] = [
    {
        id: 'BKG-12345',
        stoodio: STOODIOZ[0],
        artist: MOCK_ARTISTS[0],
        engineer: ENGINEERS[0],
        room: STOODIOZ[0].rooms[0],
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
        startTime: '14:00',
        duration: 4,
        totalCost: 828,
        engineerPayRate: 65,
        status: BookingStatus.CONFIRMED,
        requestType: BookingRequestType.SPECIFIC_ENGINEER,
        requestedEngineerId: 'eng-1',
        bookedById: 'artist-1',
        bookedByRole: UserRole.ARTIST,
    }
];

export const REVIEWS: Review[] = [
  {
    id: 'rev-1',
    reviewerName: 'Luna Vance',
    artistId: 'artist-1',
    stoodioId: 'studio-1',
    rating: 5,
    comment: 'Amazing studio! The Neve console sounds incredible and the vibe is perfect for creativity. Alex was fantastic to work with.',
    date: '2023-10-26',
  },
  {
    id: 'rev-2',
    reviewerName: 'Static Bloom',
    artistId: 'artist-2',
    engineerId: 'eng-2',
    rating: 5,
    comment: 'Jenna is a wizard! She took our raw tracks and made them sound huge. Her attention to detail is unmatched.',
    date: '2023-10-25',
  },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'convo-1',
    participant: ENGINEERS[0],
    unreadCount: 1,
    messages: [
      { id: 'msg-1', senderId: 'artist-1', text: 'Hey Alex! Loved the session last week. When are you free next?', timestamp: new Date(Date.now() - 172800000).toISOString(), type: 'text' },
      { id: 'msg-2', senderId: 'eng-1', text: 'Hey Luna! It was great. I have some openings next Tuesday.', timestamp: new Date(Date.now() - 86400000).toISOString(), type: 'text' },
    ],
    bookingId: MOCK_BOOKINGS[0].id,
  },
  {
    id: 'convo-2',
    participant: STOODIOZ[1],
    unreadCount: 0,
    messages: [
      { id: 'msg-3', senderId: 'artist-2', text: 'Inquiring about booking the live room for a full day.', timestamp: new Date().toISOString(), type: 'text' },
    ],
  },
];