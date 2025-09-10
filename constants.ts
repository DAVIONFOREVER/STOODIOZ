// FIX: Created mock data for the application. This file was previously a placeholder.
import { Stoodio, Engineer, Artist, Producer, Instrumental, Review, Conversation, UserRole, BookingStatus, BookingRequestType, NotificationType, VerificationStatus, Booking, SubscriptionPlan, SubscriptionStatus, TransactionCategory, TransactionStatus } from './types';

export const USER_SILHOUETTE_URL = 'data:image/svg+xml,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23a1a1aa"%3e%3cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3e%3c/svg%3e';
export const STOODIO_ICON_URL = 'data:image/svg+xml,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23a1a1aa"%3e%3cpath d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/%3e%3c/svg%3e';

export const TOUR_IMAGE_DISCOVER = `data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450' fill='none'%3e%3crect width='800' height='450' rx='16' fill='%2318181b'/%3e%3crect x='20' y='20' width='760' height='40' rx='8' fill='%2327272a'/%3e%3ccircle cx='45' cy='40' r='6' fill='%233f3f46'/%3e%3crect x='65' y='32' width='200' height='16' rx='4' fill='%233f3f46'/%3e%3crect x='150' y='80' width='500' height='44' rx='22' fill='%2327272a'/%3e%3crect x='165' y='94' width='100' height='16' rx='4' fill='%233f3f46'/%3e%3crect x='80' y='160' width='200' height='220' rx='12' fill='%2327272a'/%3e%3crect x='80' y='160' width='200' height='120' rx='0' fill='%233f3f46' style='border-top-left-radius: 12px; border-top-right-radius: 12px;'/%3e%3crect x='95' y='295' width='120' height='16' rx='4' fill='%233f3f46'/%3e%3crect x='95' y='325' width='80' height='12' rx='3' fill='%233f3f46'/%3e%3crect x='300' y='160' width='200' height='220' rx='12' fill='%2327272a' stroke='%23f97316' stroke-width='2'/%3e%3crect x='300' y='160' width='200' height='120' rx='0' fill='%23f97316' fill-opacity='0.2' style='border-top-left-radius: 12px; border-top-right-radius: 12px;'/%3e%3crect x='315' y='295' width='120' height='16' rx='4' fill='%23f97316'/%3e%3crect x='315' y='325' width='80' height='12' rx='3' fill='%23a1a1aa'/%3e%3crect x='520' y='160' width='200' height='220' rx='12' fill='%2327272a'/%3e%3crect x='520' y='160' width='200' height='120' rx='0' fill='%233f3f46' style='border-top-left-radius: 12px; border-top-right-radius: 12px;'/%3e%3crect x='535' y='295' width='120' height='16' rx='4' fill='%233f3f46'/%3e%3crect x='535' y='325' width='80' height='12' rx='3' fill='%233f3f46'/%3e%3c/svg%3e`;
export const TOUR_IMAGE_BOOK = `data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450' fill='none'%3e%3crect width='800' height='450' rx='16' fill='%2318181b'/%3e%3crect x='40' y='40' width='450' height='370' rx='12' fill='%2327272a'/%3e%3crect x='60' y='60' width='150' height='20' rx='5' fill='%233f3f46'/%3e%3crect x='380' y='60' width='90' height='20' rx='5' fill='%233f3f46'/%3e%3cg%3e%3crect x='60' y='100' width='50' height='50' rx='8' fill='%233f3f46' fill-opacity='0.5'/%3e%3crect x='120' y='100' width='50' height='50' rx='8' fill='%233f3f46' fill-opacity='0.5'/%3e%3crect x='180' y='100' width='50' height='50' rx='8' fill='%233f3f46'/%3e%3crect x='240' y='100' width='50' height='50' rx='8' fill='%233f3f46'/%3e%3crect x='300' y='100' width='50' height='50' rx='8' fill='%233f3f46'/%3e%3crect x='360' y='100' width='50' height='50' rx='8' fill='%233f3f46'/%3e%3crect x='420' y='100' width='50' height='50' rx='8' fill='%233f3f46'/%3e%3crect x='60' y='160' width='50' height='50' rx='8' fill='%23f97316' fill-opacity='0.2'/%3e%3crect x='120' y='160' width='50' height='50' rx='8' fill='%23f97316' fill-opacity='0.2'/%3e%3crect x='180' y='160' width='50' height='50' rx='8' fill='%23f97316'/%3e%3crect x='240' y='160' width='50' height='50' rx='8' fill='%23f97316' fill-opacity='0.2'/%3e%3crect x='300' y='160' width='50' height='50' rx='8' fill='%23f97316' fill-opacity='0.2'/%3e%3crect x='360' y='160' width='50' height='50' rx='8' fill='%233f3f46' fill-opacity='0.5'/%3e%3crect x='420' y='160' width='50' height='50' rx='8' fill='%233f3f46' fill-opacity='0.5'/%3e%3c/g%3e%3crect x='520' y='40' width='240' height='370' rx='12' fill='%2327272a'/%3e%3crect x='540' y='60' width='180' height='16' rx='4' fill='%233f3f46'/%3e%3crect x='540' y='100' width='200' height='36' rx='8' fill='%233f3f46'/%3e%3crect x='540' y='146' width='200' height='36' rx='8' fill='%23f97316' stroke='%23fb923c' stroke-width='2'/%3e%3crect x='540' y='192' width='200' height='36' rx='8' fill='%233f3f46'/%3e%3crect x='540' y='238' width='200' height='36' rx='8' fill='%233f3f46'/%3e%3crect x='540' y='350' width='200' height='44' rx='10' fill='%23f97316'/%3e%3crect x='600' y='364' width='80' height='16' rx='4' fill='%23ffffff'/%3e%3c/svg%3e`;
export const TOUR_IMAGE_COLLABORATE = `data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450' fill='none'%3e%3crect width='800' height='450' rx='16' fill='%2318181b'/%3e%3crect x='100' y='40' width='600' height='370' rx='12' fill='%2327272a'/%3e%3crect x='100' y='40' width='600' height='60' rx='0' fill='%233f3f46' style='border-top-left-radius: 12px; border-top-right-radius: 12px;'/%3e%3ccircle cx='130' cy='70' r='16' fill='%2318181b'/%3e%3crect x='160' y='62' width='150' height='16' rx='4' fill='%2318181b'/%3e%3crect x='120' y='120' width='300' height='40' rx='16' fill='%233f3f46'/%3e%3crect x='380' y='180' width='300' height='60' rx='16' fill='%23f97316'/%3e%3crect x='120' y='260' width='250' height='40' rx='16' fill='%233f3f46'/%3e%3crect x='120' y='350' width='560' height='44' rx='22' fill='%2318181b'/%3e%3ccircle cx='650' cy='372' r='14' fill='%23f97316'/%3e%3c/svg%3e`;


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

export const MOCK_INSTRUMENTALS: Instrumental[] = [
    {
        id: 'inst-1',
        title: 'Midnight Drive',
        audioUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-1-short.mp3',
        coverArtUrl: `https://picsum.photos/seed/midnightdrive/200/200`,
        priceLease: 29.99,
        priceExclusive: 299.99,
        genre: 'Synthwave',
        bpm: 120,
        key: 'C Minor',
        tags: ['80s', 'Retro', 'Driving'],
    },
    {
        id: 'inst-2',
        title: 'Lo-Fi Dreams',
        audioUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-2-short.mp3',
        coverArtUrl: `https://picsum.photos/seed/lofidreams/200/200`,
        priceLease: 19.99,
        priceExclusive: 199.99,
        genre: 'Lo-Fi Hip-Hop',
        bpm: 85,
        key: 'F Major',
        tags: ['Chill', 'Study', 'Relaxing'],
        isFreeDownloadAvailable: true,
    },
    {
        id: 'inst-3',
        title: 'Trap Anthem',
        audioUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-3-short.mp3',
        coverArtUrl: `https://picsum.photos/seed/trapanthem/200/200`,
        priceLease: 49.99,
        priceExclusive: 499.99,
        genre: 'Trap',
        bpm: 145,
        key: 'D# Minor',
        tags: ['Hard', '808', 'Energetic'],
    },
     {
        id: 'inst-4',
        title: 'Summer Haze',
        audioUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-4-short.mp3',
        coverArtUrl: `https://picsum.photos/seed/summerhaze/200/200`,
        priceLease: 34.99,
        priceExclusive: 349.99,
        genre: 'House',
        bpm: 124,
        key: 'A Minor',
        tags: ['Deep House', 'Vibey', 'Summer'],
    },
    {
        id: 'inst-5',
        title: 'Free Flow',
        audioUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-5-short.mp3',
        coverArtUrl: `https://picsum.photos/seed/freeflow/200/200`,
        priceLease: 0,
        priceExclusive: 99.99,
        genre: 'Hip-Hop',
        bpm: 90,
        key: 'G Major',
        tags: ['Classic', 'Boom Bap', 'Free'],
        isFreeDownloadAvailable: true,
    }
];

export const MOCK_PRODUCERS: Producer[] = [
    {
        id: 'prod-1',
        name: 'Metro Boomin',
        email: 'metro@example.com',
        password: 'password',
        bio: 'Grammy-nominated producer from Atlanta. Specializing in chart-topping Trap and Hip-Hop instrumentals.',
        genres: ['Trap', 'Hip-Hop', 'R&B'],
        rating: 5.0,
        imageUrl: USER_SILHOUETTE_URL,
        followers: 15200,
        following: { stoodioz: [], engineers: [], artists: [], producers: [] },
        followerIds: [],
        coordinates: { lat: 33.7490, lon: -84.3880 }, // Atlanta
        isAvailable: true,
        walletBalance: 12500,
        walletTransactions: [],
        instrumentals: MOCK_INSTRUMENTALS.slice(0, 3),
        subscription: { plan: SubscriptionPlan.PRODUCER_PRO, status: SubscriptionStatus.ACTIVE },
        isOnline: true,
        showOnMap: true,
        pullUpPrice: 500,
        links: [
            { title: 'Official Website', url: 'https://www.boominatiworldwide.com/' },
            { title: 'Spotify', url: 'https://open.spotify.com/artist/0iEtIxbK0KxaSlF7G42ZOp' }
        ],
    },
    {
        id: 'prod-2',
        name: 'Kaytranada',
        email: 'kaytra@example.com',
        password: 'password',
        bio: 'Haitian-Canadian record producer and DJ. Known for signature blend of hip hop, funk, and house.',
        genres: ['House', 'Funk', 'Hip-Hop'],
        rating: 4.9,
        imageUrl: USER_SILHOUETTE_URL,
        followers: 8900,
        following: { stoodioz: [], engineers: [], artists: [], producers: [] },
        followerIds: [],
        coordinates: { lat: 45.5017, lon: -73.5673 }, // Montreal
        isAvailable: false,
        walletBalance: 8750,
        walletTransactions: [],
        instrumentals: MOCK_INSTRUMENTALS.slice(3, 4),
        subscription: { plan: SubscriptionPlan.FREE, status: SubscriptionStatus.ACTIVE },
        isOnline: false,
        showOnMap: true,
        pullUpPrice: 850,
        links: [
            { title: 'Spotify', url: 'https://open.spotify.com/artist/kaytranada' }
        ]
    },
    {
        id: 'prod-3',
        name: 'Southside',
        email: 'southside@example.com',
        password: 'password',
        bio: 'Pioneer of the trap sound and co-founder of 808 Mafia. I make beats that hit different.',
        genres: ['Trap', 'Drill', 'Hip-Hop'],
        rating: 4.9,
        imageUrl: USER_SILHOUETTE_URL,
        followers: 11500,
        following: { stoodioz: [], engineers: [], artists: [], producers: ['prod-1'] },
        followerIds: [],
        coordinates: { lat: 33.75, lon: -84.4 }, // Atlanta
        isAvailable: true,
        walletBalance: 9200,
        walletTransactions: [],
        instrumentals: MOCK_INSTRUMENTALS.slice(4, 5),
        subscription: { plan: SubscriptionPlan.PRODUCER_PRO, status: SubscriptionStatus.ACTIVE },
        isOnline: true,
        showOnMap: true,
        pullUpPrice: 600,
        links: [
            { title: 'Official Website', url: 'https://808mafia.com' }
        ]
    }
];

export const MOCK_ARTISTS: Artist[] = [
  {
    id: 'artist-1',
    name: 'Luna Vance',
    email: 'luna@example.com',
    password: 'password',
    bio: 'Dream-pop artist from Los Angeles, inspired by hazy sunsets and city nights. Looking for producers to collaborate with.',
    imageUrl: USER_SILHOUETTE_URL,
    followers: 1258,
    following: { stoodioz: ['studio-1'], engineers: ['eng-1', 'eng-2'], artists: [], producers: ['prod-1'] },
    followerIds: ['eng-1', 'studio-1', 'artist-2'],
    coordinates: { lat: 34.0522, lon: -118.2437 },
    isSeekingSession: true,
    walletBalance: 1500,
    walletTransactions: [
        { 
            id: 'txn-a1-1', 
            description: 'Loaded funds into wallet', 
            amount: 2000, 
            date: new Date(Date.now() - 86400000 * 2).toISOString(), 
            category: TransactionCategory.ADD_FUNDS,
            status: TransactionStatus.COMPLETED
        },
        { 
            id: 'txn-a1-2', 
            description: 'Session at Echo Chamber Stoodioz', 
            amount: -500, 
            date: new Date().toISOString(), 
            category: TransactionCategory.SESSION_PAYMENT,
            status: TransactionStatus.COMPLETED,
            relatedBookingId: 'BKG-OLD-123',
            relatedUserName: 'Echo Chamber Stoodioz'
        }
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
                { id: 'c-a1-1', authorId: 'eng-1', authorName: 'Alex Robinson', authorImageUrl: USER_SILHOUETTE_URL, text: 'Was a great session!', timestamp: new Date().toISOString() }
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
    imageUrl: USER_SILHOUETTE_URL,
    followers: 8432,
    following: { stoodioz: ['studio-2'], engineers: ['eng-2'], artists: ['artist-1'], producers: [] },
    followerIds: [],
    coordinates: { lat: 40.7128, lon: -74.0060 },
    isSeekingSession: false,
    walletBalance: 3200,
    walletTransactions: [],
    showOnMap: true,
    isOnline: false,
  },
  {
    id: 'artist-3',
    name: 'Ken Carson',
    email: 'ken@example.com',
    password: 'password',
    bio: 'Atlanta-based rapper and producer signed to Opium. My sound is experimental and genre-bending.',
    imageUrl: USER_SILHOUETTE_URL,
    followers: 25000,
    following: { stoodioz: ['studio-1', 'studio-3'], engineers: ['eng-3'], artists: [], producers: ['prod-1', 'prod-3'] },
    followerIds: [],
    coordinates: { lat: 33.75, lon: -84.39 },
    isSeekingSession: true,
    walletBalance: 5000,
    walletTransactions: [],
    showOnMap: true,
    isOnline: true,
  },
  // This artist profile shares an email with an engineer for multi-profile login testing
  {
    id: 'artist-alex-robinson',
    name: 'Alex Robinson (Artist)',
    email: 'alex@example.com',
    password: 'password',
    bio: 'Singer-songwriter by night, audio engineer by day. Exploring acoustic and folk sounds.',
    imageUrl: USER_SILHOUETTE_URL,
    followers: 150,
    following: { stoodioz: ['studio-1'], engineers: [], artists: [], producers: [] },
    followerIds: [],
    coordinates: { lat: 34.06, lon: -118.25 },
    isSeekingSession: true,
    walletBalance: 300,
    walletTransactions: [],
    posts: [],
    showOnMap: false,
    isOnline: true,
  }
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
    imageUrl: USER_SILHOUETTE_URL,
    audioSampleUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-1-short.mp3',
    followers: 841,
    following: { artists: ['artist-1'], engineers: [], stoodioz: ['studio-1', 'studio-2'], producers: [] },
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
        },
        {
            id: 'post-e1-2',
            authorId: 'eng-1',
            authorType: UserRole.ENGINEER,
            text: 'Looking for a vocalist for a dream pop track. DM me if interested!',
            timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
            likes: ['artist-1'],
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
    mixingServices: {
        isEnabled: true,
        pricePerTrack: 150,
        description: "Professional mixdown for your track, includes 2 revisions. Up to 48 stems.",
        turnaroundTime: "3-5 business days"
    }
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
    imageUrl: USER_SILHOUETTE_URL,
    audioSampleUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-2-short.mp3',
    followers: 1102,
    following: { artists: ['artist-2'], engineers: ['eng-1'], stoodioz: ['studio-2'], producers: [] },
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
     mixingServices: {
        isEnabled: true,
        pricePerTrack: 250,
        description: "Radio-ready mix & master package. Quick turnaround, unlimited stems, 3 revisions.",
        turnaroundTime: "2-4 business days"
    }
  },
   {
    id: 'eng-3',
    name: 'Derek "MixedByAli" Ali',
    email: 'ali@example.com',
    password: 'password',
    bio: 'Grammy-winning engineer known for my work with Top Dawg Entertainment artists. My mixes are clean, punchy, and dynamic.',
    specialties: ['Hip-Hop', 'Rap', 'Vocal Mixing', 'Analog'],
    rating: 5.0,
    sessionsCompleted: 500,
    imageUrl: USER_SILHOUETTE_URL,
    audioSampleUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-3-short.mp3',
    followers: 25000,
    following: { artists: ['artist-3'], engineers: [], stoodioz: ['studio-1'], producers: [] },
    followerIds: [],
    coordinates: { lat: 34.0, lon: -118.3 },
    isAvailable: false,
    walletBalance: 15000,
    walletTransactions: [],
    posts: [],
    showOnMap: true,
    notificationPreferences: {
        radius: 10,
        enabled: true,
    },
    minimumPayRate: 150,
    isOnline: true,
    subscription: {
        plan: SubscriptionPlan.ENGINEER_PLUS,
        status: SubscriptionStatus.ACTIVE,
    },
    mixingServices: {
        isEnabled: false,
        pricePerTrack: 500,
        description: "Not currently accepting new remote mixing clients.",
        turnaroundTime: "N/A"
    }
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
    imageUrl: STOODIO_ICON_URL,
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
      'https://images.unsplash.com/photo-1598935838039-cbf2a2731871?w=800&q=80',
      'https://images.unsplash.com/photo-1590602848952-a735ff48654b?w=800&q=80',
      'https://images.unsplash.com/photo-1616594511218-c24aa2338600?w=800&q=80',
    ],
    followers: 432,
    following: { artists: ['artist-1'], engineers: ['eng-1'], stoodioz: [], producers: [] },
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
    imageUrl: STOODIO_ICON_URL,
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
    following: { artists: [], engineers: ['eng-2'], stoodioz: [], producers: [] },
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
            imageUrl: 'https://images.unsplash.com/photo-1594122230689-45899d9e6f69?w=800&q=80',
            timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
            likes: ['eng-2'],
            comments: []
        },
        {
            id: 'post-s2-2',
            authorId: 'studio-2',
            authorType: UserRole.STOODIO,
            text: 'We have some open slots next week! Book now before they are gone.',
            timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
            likes: [],
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
  {
    id: 'studio-3',
    name: 'Patchwerk Recording Studios',
    email: 'patchwerk@example.com',
    password: 'password',
    description: 'A legendary Atlanta recording studio that has been a staple in the music industry for over 25 years. Home to countless hit records.',
    location: 'Atlanta, GA',
    hourlyRate: 150,
    engineerPayRate: 75,
    rating: 5.0,
    imageUrl: STOODIO_ICON_URL,
    amenities: ['SSL 9000J Console', 'Multiple Live Rooms', 'Mastering Suite', 'Client Lounge'],
    coordinates: { lat: 33.77, lon: -84.39 },
    availability: [
       generateTodaysAvailability(),
       generateFutureAvailability(2),
       generateFutureAvailability(3),
    ],
    photos: [],
    followers: 12000,
    following: { artists: ['artist-3'], engineers: ['eng-3'], stoodioz: [], producers: ['prod-1', 'prod-3'] },
    followerIds: ['artist-3', 'prod-1', 'prod-3'],
    walletBalance: 50000,
    walletTransactions: [],
    rooms: [
        { id: 'room-3a', name: 'Studio 9000', description: 'The flagship SSL room.', hourlyRate: 150, photos: [] },
        { id: 'room-3b', name: 'Studio 1019', description: 'A cozy writing and production room.', hourlyRate: 75, photos: [] }
    ],
    posts: [],
    inHouseEngineers: [
        { engineerId: 'eng-3', payRate: 100 }
    ],
    showOnMap: true,
    verificationStatus: VerificationStatus.VERIFIED,
    isOnline: true,
    subscription: {
        plan: SubscriptionPlan.STOODIO_PRO,
        status: SubscriptionStatus.ACTIVE,
    },
  }
];

export const MOCK_BOOKINGS: Booking[] = [
    {
        id: 'BKG-12345',
        stoodio: STOODIOZ[0],
        artist: MOCK_ARTISTS[0],
        engineer: ENGINEERS[0],
        producer: null,
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
    participants: [MOCK_ARTISTS[0], ENGINEERS[0]],
    title: ENGINEERS[0].name,
    imageUrl: ENGINEERS[0].imageUrl,
    unreadCount: 1,
    messages: [
      { id: 'msg-1', senderId: 'artist-1', text: 'Hey Alex! Loved the session last week. When are you free next?', timestamp: new Date(Date.now() - 172800000).toISOString(), type: 'text' },
      { id: 'msg-2', senderId: 'eng-1', text: 'Hey Luna! It was great. I have some openings next Tuesday.', timestamp: new Date(Date.now() - 86400000).toISOString(), type: 'text' },
    ],
    bookingId: MOCK_BOOKINGS[0].id,
  },
  {
    id: 'convo-2',
    participants: [MOCK_ARTISTS[1], STOODIOZ[1]],
    title: STOODIOZ[1].name,
    imageUrl: STOODIOZ[1].imageUrl,
    unreadCount: 0,
    messages: [
      { id: 'msg-3', senderId: 'artist-2', text: 'Inquiring about booking the live room for a full day.', timestamp: new Date().toISOString(), type: 'text' },
    ],
  },
];