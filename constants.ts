import type { Stoodio, Engineer, Review, Conversation, Artist, Post, Comment } from './types';
import { UserRole } from './types';

const generateAvailability = (): { date: string; times: string[] }[] => {
    const availability = [];
    const today = new Date();
    const times = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        // Randomly decide if a day has bookings
        if (Math.random() > 0.2) {
            const availableTimes = times.filter(() => Math.random() > 0.3); // Randomly remove some time slots
            if (availableTimes.length > 0) {
                 availability.push({
                    date: date.toISOString().split('T')[0],
                    times: availableTimes,
                });
            }
        }
    }
    return availability;
};


export const STOODIOZ: Stoodio[] = [
    {
        id: 'studio-1',
        name: 'Echo Chamber Stoodioz',
        location: 'Los Angeles, CA',
        hourlyRate: 75, // Fallback, use room rate instead
        engineerPayRate: 40,
        rating: 4.8,
        imageUrl: 'https://picsum.photos/seed/studio1/600/400',
        followers: 1258,
        followerIds: ['artist-3'],
        following: {
            artists: ['artist-3', 'artist-1'],
            engineers: ['eng-2', 'eng-3'],
            stoodioz: ['studio-2'],
        },
        links: [{ title: 'Official Website', url: 'https://example.com' }],
        photos: [
            'https://picsum.photos/seed/studio1-a/600/400',
            'https://picsum.photos/seed/studio1-b/600/400',
            'https://picsum.photos/seed/studio1-c/600/400',
            'https://picsum.photos/seed/studio1-d/600/400',
        ],
        amenities: ['Neve 8078 Console', 'Pro Tools HDX', 'Vocal Booth', 'Lounge Area', 'EMT 140 Plate Reverb', 'Fairchild 670'],
        description: 'A legendary space in the heart of LA, Echo Chamber offers a vintage Neve console and a curated collection of classic outboard gear. Perfect for tracking full bands or detailed vocal sessions.',
        coordinates: { lat: 34.0522, lon: -118.2437 },
        availability: generateAvailability(),
        email: 'studio@echo.com',
        password: 'password123',
        posts: [],
        walletBalance: 1250.00,
        walletTransactions: [
            { id: 'txn-s1-1', description: 'Payout for session BKG-123', amount: 300, date: new Date(Date.now() - 86400000 * 2).toISOString(), type: 'credit' },
            { id: 'txn-s1-2', description: 'Payout for session BKG-124', amount: 225, date: new Date(Date.now() - 86400000 * 5).toISOString(), type: 'credit' },
            { id: 'txn-s1-3', description: 'Withdrawal to bank', amount: -500, date: new Date(Date.now() - 86400000 * 7).toISOString(), type: 'debit' },
        ],
        notificationsEnabled: true,
        rooms: [
            { id: 'room-1a', name: 'Control Room A (Neve)', description: 'The main control room featuring our vintage Neve 8078 console.', hourlyRate: 75, photos: ['https://picsum.photos/seed/room1a-1/600/400'] },
            { id: 'room-1b', name: 'Live Room', description: 'A spacious, acoustically treated live room perfect for full bands.', hourlyRate: 60, photos: ['https://picsum.photos/seed/room1b-1/600/400'] },
            { id: 'room-1c', name: 'Vocal Booth', description: 'An isolated vocal booth for pristine vocal recordings.', hourlyRate: 40, photos: ['https://picsum.photos/seed/room1c-1/600/400'] },
        ]
    },
    {
        id: 'studio-2',
        name: 'Vibe Factory',
        location: 'New York, NY',
        hourlyRate: 90,
        engineerPayRate: 50,
        rating: 4.9,
        imageUrl: 'https://picsum.photos/seed/studio2/600/400',
        followers: 2304,
        followerIds: ['artist-1'],
        following: {
            artists: ['artist-1'],
            engineers: [],
            stoodioz: [],
        },
        photos: [
            'https://picsum.photos/seed/studio2-a/600/400',
            'https://picsum.photos/seed/studio2-b/600/400',
            'https://picsum.photos/seed/studio2-c/600/400',
        ],
        amenities: ['SSL 4000 G+ Console', 'Logic Pro X', 'Live Room', 'Kitchenette', 'Yamaha NS-10 Monitors'],
        description: 'Located in Brooklyn, Vibe Factory is a modern production house with an iconic SSL console. The spacious live room and top-tier monitoring make it ideal for pop, R&B, and hip-hop.',
        coordinates: { lat: 40.7128, lon: -74.0060 },
        availability: generateAvailability(),
        walletBalance: 2300.50,
        walletTransactions: [],
        notificationsEnabled: true,
        rooms: [
             { id: 'room-2a', name: 'SSL Control Room', description: 'The heart of Vibe Factory with the SSL 4000 G+.', hourlyRate: 90, photos: ['https://picsum.photos/seed/room2a-1/600/400'] },
             { id: 'room-2b', name: 'Production Suite B', description: 'A smaller suite perfect for writing and overdubs.', hourlyRate: 55, photos: ['https://picsum.photos/seed/room2b-1/600/400'] },
        ]
    },
    {
        id: 'studio-3',
        name: 'Beat Haven',
        location: 'Atlanta, GA',
        hourlyRate: 60,
        engineerPayRate: 35,
        rating: 4.7,
        imageUrl: 'https://picsum.photos/seed/studio3/600/400',
        followers: 890,
        followerIds: ['artist-2'],
        following: {
            artists: ['artist-2'],
            engineers: ['eng-1'],
            stoodioz: [],
        },
        photos: [
             'https://picsum.photos/seed/studio3-a/600/400',
             'https://picsum.photos/seed/studio3-b/600/400',
             'https://picsum.photos/seed/studio3-c/600/400',
             'https://picsum.photos/seed/studio3-d/600/400',
             'https://picsum.photos/seed/studio3-e/600/400',
        ],
        amenities: ['Apollo x8p Interface', 'FL Studio & Ableton', 'ISO Booth', 'Free Coffee', 'Subwoofer'],
        description: 'The premier spot for Atlanta\'s trap and hip-hop scene. Beat Haven provides a comfortable, creative atmosphere with state-of-the-art digital production tools and a perfectly treated vocal booth.',
        coordinates: { lat: 33.7490, lon: -84.3880 },
        availability: generateAvailability(),
        walletBalance: 890.00,
        walletTransactions: [],
        notificationsEnabled: true,
        rooms: [
             { id: 'room-3a', name: 'Main Production Room', description: 'The primary room for beat making and recording.', hourlyRate: 60, photos: ['https://picsum.photos/seed/room3a-1/600/400'] },
        ]
    },
    {
        id: 'studio-4',
        name: 'Sonic Sanctuary',
        location: 'Nashville, TN',
        hourlyRate: 85,
        engineerPayRate: 45,
        rating: 4.8,
        imageUrl: 'https://picsum.photos/seed/studio4/600/400',
        followers: 954,
        followerIds: [],
        following: {
            artists: [],
            engineers: [],
            stoodioz: [],
        },
         photos: [
            'https://picsum.photos/seed/studio4-a/600/400',
            'https://picsum.photos/seed/studio4-b/600/400',
        ],
        amenities: ['API 2448 Console', 'Extensive Mic Collection', 'Grand Piano', 'Parking', 'Tape Machine'],
        description: 'Music City\'s finest. Sonic Sanctuary combines the warmth of an API console with an unparalleled microphone locker and a beautiful Yamaha grand piano, catering to country, rock, and folk artists.',
        coordinates: { lat: 36.1627, lon: -86.7816 },
        availability: generateAvailability(),
        walletBalance: 1540.25,
        walletTransactions: [],
        notificationsEnabled: true,
        rooms: [
             { id: 'room-4a', name: 'API Control Room', description: 'The main room with our API 2448 Console and access to the live floor.', hourlyRate: 85, photos: ['https://picsum.photos/seed/room4a-1/600/400'] },
        ]
    },
    {
        id: 'studio-5',
        name: 'Rhythm Room',
        location: 'Chicago, IL',
        hourlyRate: 65,
        engineerPayRate: 35,
        rating: 4.6,
        imageUrl: 'https://picsum.photos/seed/studio5/600/400',
        followers: 612,
        followerIds: ['artist-3'],
        following: {
            artists: ['artist-3'],
            engineers: [],
            stoodioz: [],
        },
         photos: [
            'https://picsum.photos/seed/studio5-a/600/400',
            'https://picsum.photos/seed/studio5-b/600/400',
            'https://picsum.photos/seed/studio5-c/600/400',
        ],
        amenities: ['Mackie 32-8 Console', 'Reaper', 'Drum Kit', 'Vending Machines', 'Guitar Amp Collection'],
        description: 'A no-frills, high-quality tracking room in Chicago. The Rhythm Room is built for bands, featuring a great-sounding drum kit, a collection of vintage amps, and a classic analog workflow.',
        coordinates: { lat: 41.8781, lon: -87.6298 },
        availability: generateAvailability(),
        walletBalance: 730.00,
        walletTransactions: [],
        notificationsEnabled: true,
        rooms: [
            { id: 'room-5a', name: 'Live Tracking Room', description: 'Our main live room for full band tracking.', hourlyRate: 65, photos: ['https://picsum.photos/seed/room5a-1/600/400'] },
        ]
    },
    {
        id: 'studio-6',
        name: 'Groove Grove',
        location: 'Miami, FL',
        hourlyRate: 95,
        engineerPayRate: 55,
        rating: 4.9,
        imageUrl: 'https://picsum.photos/seed/studio6/600/400',
        followers: 1843,
        followerIds: ['artist-1'],
        following: {
            artists: ['artist-1'],
            engineers: [],
            stoodioz: [],
        },
         photos: [
            'https://picsum.photos/seed/studio6-a/600/400',
            'https://picsum.photos/seed/studio6-b/600/400',
            'https://picsum.photos/seed/studio6-c/600/400',
        ],
        amenities: ['Custom Console', 'Ocean View', 'Vocal Tuning', 'Valet', 'ATC Monitors'],
        description: 'A luxury recording experience in South Beach. Groove Grove boasts a custom-built console, breathtaking ocean views, and world-class ATC monitoring for Latin, pop, and electronic music producers.',
        coordinates: { lat: 25.7617, lon: -80.1918 },
        availability: generateAvailability(),
        walletBalance: 3105.75,
        walletTransactions: [],
        notificationsEnabled: true,
        rooms: [
            { id: 'room-6a', name: 'Ocean View Suite', description: 'The premier suite with our custom console and an inspiring view of the ocean.', hourlyRate: 95, photos: ['https://picsum.photos/seed/room6a-1/600/400'] },
        ]
    },
];

export const ENGINEERS: Engineer[] = [
    {
        id: 'eng-1',
        name: 'Alex "Patch" Robinson',
        bio: 'A seasoned audio engineer with over a decade of experience in both analog and digital domains. Passionate about helping artists achieve their perfect sound.',
        specialties: ['Indie Rock', 'Hip-Hop', 'Electronic', 'Folk'],
        rating: 4.9,
        sessionsCompleted: 238,
        followers: 841,
        followerIds: ['artist-3'],
        following: {
            artists: ['artist-3'],
            engineers: ['eng-2'],
            stoodioz: ['studio-1', 'studio-5'],
        },
        links: [{ title: 'Portfolio', url: 'https://example.com' }],
        imageUrl: 'https://picsum.photos/seed/eng1/200/200',
        audioSampleUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-1-short.mp3',
        coordinates: { lat: 34.06, lon: -118.25 },
        isAvailable: true,
        displayExactLocation: false,
        showOnMap: true,
        email: 'alex@patch.com',
        password: 'password123',
        posts: [],
        walletBalance: 450.75,
        walletTransactions: [
            { id: 'txn-e1-1', description: 'Payout for session BKG-123', amount: 160.00, date: new Date(Date.now() - 86400000 * 2).toISOString(), type: 'credit' },
            { id: 'txn-e1-2', description: 'Tip from Luna Vance', amount: 40.00, date: new Date(Date.now() - 86400000 * 2).toISOString(), type: 'credit' },
        ],
        availability: generateAvailability(),
        notificationsEnabled: true,
        minHourlyRate: 45,
    },
    {
        id: 'eng-2',
        name: 'Maya "Vibe" Chen',
        bio: 'Specializing in vocal production and modern pop, Maya brings a fresh and creative approach to every session, ensuring your tracks shine.',
        specialties: ['Pop', 'R&B', 'Vocal Production', 'Synthwave'],
        rating: 5.0,
        sessionsCompleted: 152,
        followers: 1102,
        followerIds: ['artist-1'],
        following: {
            artists: ['artist-1'],
            engineers: [],
            stoodioz: [],
        },
        imageUrl: 'https://picsum.photos/seed/eng2/200/200',
        audioSampleUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-2-short.mp3',
        coordinates: { lat: 40.72, lon: -73.99 },
        isAvailable: false,
        displayExactLocation: true,
        showOnMap: false,
        walletBalance: 680.00,
        walletTransactions: [],
        availability: generateAvailability(),
        notificationsEnabled: true,
        minHourlyRate: 55,
    },
    {
        id: 'eng-3',
        name: 'Jordan "Groove" Smith',
        bio: 'With a background as a session drummer, Jordan has an incredible ear for rhythm and feel, making him the go-to engineer for live bands.',
        specialties: ['Funk', 'Soul', 'Jazz', 'Live Band Recording'],
        rating: 4.8,
        sessionsCompleted: 310,
        followers: 789,
        followerIds: ['artist-3'],
        following: {
            artists: [],
            engineers: [],
            stoodioz: [],
        },
        imageUrl: 'https://picsum.photos/seed/eng3/200/200',
        audioSampleUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-3-short.mp3',
        coordinates: { lat: 36.17, lon: -86.79 },
        isAvailable: true,
        displayExactLocation: false,
        showOnMap: true,
        walletBalance: 230.50,
        walletTransactions: [],
        availability: generateAvailability(),
        notificationsEnabled: true,
        minHourlyRate: 40,
    },
    {
        id: 'eng-4',
        name: 'Samantha "Sonic" Keyes',
        bio: 'An expert in experimental and electronic music, Samantha loves pushing boundaries and using the stoodio as an instrument itself.',
        specialties: ['Ambient', 'Techno', 'Sound Design', 'Experimental'],
        rating: 4.9,
        sessionsCompleted: 98,
        followers: 530,
        followerIds: ['artist-4'],
        following: {
            artists: ['artist-4'],
            engineers: [],
            stoodioz: [],
        },
        imageUrl: 'https://picsum.photos/seed/eng4/200/200',
        audioSampleUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-4-short.mp3',
        coordinates: { lat: 41.89, lon: -87.64 },
        isAvailable: true,
        displayExactLocation: false,
        showOnMap: true,
        walletBalance: 125.00,
        walletTransactions: [],
        availability: generateAvailability(),
        notificationsEnabled: true,
        minHourlyRate: 50,
    },
];


export const REVIEWS: Review[] = [
    // Engineer Reviews
    {
        id: 'rev-1',
        reviewerName: 'The Blue Moons',
        rating: 5,
        comment: 'Alex is an absolute professional. The mix on our single sounds incredible. Can\'t wait to work with him again!',
        date: '2024-05-15',
    },
    {
        id: 'rev-2',
        reviewerName: 'Lila Verse',
        rating: 5,
        comment: 'He has a great ear and really understood the vibe I was going for with my vocal takes. Super patient and creative.',
        date: '2024-05-10',
    },
     {
        id: 'rev-3',
        reviewerName: 'Static Bloom',
        artistId: 'artist-3',
        rating: 4,
        comment: 'Patch knows his gear! Helped us dial in some amazing guitar tones. The session ran a little long but the results were worth it.',
        date: '2024-04-28',
    },
    // Stoodio Reviews
    {
        id: 'rev-s1',
        stoodioId: 'studio-1',
        reviewerName: 'Static Bloom',
        artistId: 'artist-3',
        rating: 5,
        comment: 'Incredible vibe and gear. The Neve console is a dream. Will be back!',
        date: '2024-06-01',
    },
    {
        id: 'rev-s2',
        stoodioId: 'studio-2',
        reviewerName: 'Luna Vance',
        artistId: 'artist-1',
        rating: 5,
        comment: 'The SSL desk is amazing and the live room sounds huge. Perfect spot for tracking drums.',
        date: '2024-05-20',
    },
    {
        id: 'rev-s3',
        stoodioId: 'studio-3',
        reviewerName: 'KAIRO',
        artistId: 'artist-2',
        rating: 4,
        comment: 'Great vocal booth, super clean sound. The engineer they paired me with was solid too.',
        date: '2024-05-18',
    },
];


export const ENGINEER_FEE_PERCENTAGE = 0.20; // 20%
export const SERVICE_FEE_PERCENTAGE = 0.15; // 15%

export const MOCK_ARTISTS: Artist[] = [
    {
        id: 'artist-1',
        name: 'Luna Vance',
        imageUrl: 'https://picsum.photos/seed/artist1/100/100',
        bio: 'Dream-pop vocalist and producer exploring ethereal soundscapes. Inspired by hazy sunsets and late-night drives.',
        followers: 2,
        following: {
            stoodioz: ['studio-2', 'studio-6'],
            engineers: ['eng-2'],
            artists: ['artist-3'],
        },
        followerIds: ['artist-2', 'artist-3'],
        links: [
            { title: 'Spotify', url: 'https://open.spotify.com' },
            { title: 'SoundCloud', url: 'https://soundcloud.com' },
        ],
        coordinates: { lat: 40.73, lon: -73.99 },
        isSeekingSession: true,
        email: 'luna@vance.com',
        password: 'password123',
        posts: [],
        walletBalance: 1500.00,
        walletTransactions: [
            { id: 'txn-a1-1', description: 'Added funds', amount: 2000, date: new Date(Date.now() - 86400000 * 10).toISOString(), type: 'credit' },
            { id: 'txn-a1-2', description: 'Session at Vibe Factory', amount: -495, date: new Date(Date.now() - 86400000 * 3).toISOString(), type: 'debit' },
        ],
        notificationsEnabled: true,
    },
    {
        id: 'artist-2',
        name: 'KAIRO',
        imageUrl: 'https://picsum.photos/seed/artist2/100/100',
        bio: 'Hip-hop lyricist and beatmaker from Atlanta. Telling stories from the streets with a modern trap twist.',
        followers: 0,
        following: {
            stoodioz: ['studio-3'],
            engineers: [],
            artists: ['artist-1'],
        },
        followerIds: [],
        coordinates: { lat: 33.75, lon: -84.39 },
        isSeekingSession: false,
        walletBalance: 850.50,
        walletTransactions: [],
        notificationsEnabled: true,
    },
    {
        id: 'artist-3',
        name: 'Static Bloom',
        imageUrl: 'https://picsum.photos/seed/artist3/100/100',
        bio: 'Indie rock band known for fuzzy guitars and anthemic choruses. We just want to make music you can shout along to.',
        followers: 1,
        following: {
            stoodioz: ['studio-1', 'studio-5'],
            engineers: ['eng-1', 'eng-3'],
            artists: ['artist-1'],
        },
        followerIds: ['artist-1'],
        coordinates: { lat: 34.07, lon: -118.26 },
        isSeekingSession: true,
        walletBalance: 2300.00,
        walletTransactions: [],
        notificationsEnabled: true,
    },
    {
        id: 'artist-4',
        name: 'Celeste',
        imageUrl: 'https://picsum.photos/seed/artist4/100/100',
        bio: 'Ambient and experimental producer creating immersive sonic worlds. Best experienced with headphones.',
        followers: 0,
        following: {
            stoodioz: [],
            engineers: ['eng-4'],
            artists: [],
        },
        followerIds: [],
        coordinates: { lat: 25.77, lon: -80.19 },
        isSeekingSession: false,
        walletBalance: 500.00,
        walletTransactions: [],
        notificationsEnabled: true,
    }
];

export const MOCK_POSTS: Post[] = [
    {
        id: 'post-1',
        authorId: 'studio-1',
        authorType: UserRole.STOODIO,
        text: 'Just got a vintage Telefunken U47 in the studio! Who wants to be the first to track vocals on this beauty? 🔥🎤',
        imageUrl: 'https://picsum.photos/seed/mic-post/800/600',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        likes: ['artist-1', 'eng-1'],
        comments: [],
    },
    {
        id: 'post-5',
        authorId: 'artist-3',
        authorType: UserRole.ARTIST,
        text: 'Quick snippet from our upcoming music video! Dropping next Friday. 🤘',
        videoUrl: 'https://storage.googleapis.com/studiogena-assets/waves_video.mp4',
        videoThumbnailUrl: 'https://picsum.photos/seed/video-thumb-1/800/450',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        likes: ['artist-1', 'eng-1', 'studio-1'],
        comments: [],
    },
    {
        id: 'post-2',
        authorId: 'artist-1',
        authorType: UserRole.ARTIST,
        text: 'Working on a new dream-pop track. The vibes are immaculate today. ✨',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
        likes: ['artist-3', 'eng-2', 'studio-2'],
        comments: [
             { id: 'comment-1', authorId: 'artist-3', authorName: 'Static Bloom', authorImageUrl: 'https://picsum.photos/seed/artist3/100/100', text: "Can't wait to hear it!", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }
        ],
    },
    {
        id: 'post-3',
        authorId: 'eng-1',
        authorType: UserRole.ENGINEER,
        text: 'Mixing tip of the day: Use parallel compression on your drum bus to add punch without sacrificing dynamics. Send your drums to an aux track, compress it heavily, and blend it in with the original signal.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        likes: ['eng-3', 'artist-3'],
        comments: [],
    },
    {
        id: 'post-4',
        authorId: 'studio-1',
        authorType: UserRole.STOODIO,
        text: 'Our live room just got a fresh acoustic treatment. The drum sounds are tighter than ever. Book a session to check it out!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        likes: [],
        comments: [],
    },
];

// Assign posts to mock users
STOODIOZ[0].posts = [MOCK_POSTS[0], MOCK_POSTS[4]];
MOCK_ARTISTS[0].posts = [MOCK_POSTS[2]];
ENGINEERS[0].posts = [MOCK_POSTS[3]];
MOCK_ARTISTS[2].posts = [MOCK_POSTS[1]];


export const MOCK_ARTIST: Artist = MOCK_ARTISTS[0];

export const CONVERSATIONS: Conversation[] = [
    {
        id: 'convo-1',
        participant: ENGINEERS[1], // Maya Chen
        unreadCount: 2,
        messages: [
            {
                id: 'msg-1-1',
                senderId: 'eng-2',
                type: 'text',
                text: "Hey! Just listened to the demo you sent over. Absolutely love the vibe, your voice is amazing!",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            },
            {
                id: 'msg-1-2',
                senderId: 'artist-user',
                type: 'text',
                text: "Thanks so much, Maya! I'm really excited to work with you.",
                timestamp: new Date(Date.now() - 1000 * 60 * 55 * 24).toISOString(),
            },
             {
                id: 'msg-1-5',
                senderId: 'artist-user',
                type: 'link',
                text: "Here's a link to the vibe I'm going for on the chorus.",
                link: {
                    title: "Inspo Track on SoundCloud",
                    url: "https://soundcloud.com"
                },
                timestamp: new Date(Date.now() - 1000 * 60 * 50 * 24).toISOString(),
            },
            {
                id: 'msg-1-3',
                senderId: 'eng-2',
                type: 'text',
                text: "Me too! For the session on Friday, do you want to start with the main vocals for 'Starlight' or track some of the harmonies first?",
                timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            },
            {
                id: 'msg-1-4',
                senderId: 'eng-2',
                type: 'text',
                text: "Also, let me know if you need me to prep any specific vocal effects. I have some cool ideas for a vintage plate reverb sound.",
                timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
            },
        ]
    },
    {
        id: 'convo-2',
        participant: ENGINEERS[0], // Alex Robinson
        unreadCount: 0,
        messages: [
            {
                id: 'msg-2-1',
                senderId: 'artist-user',
                type: 'text',
                text: "Hey Alex, just wanted to confirm our session for next Tuesday at Echo Chamber. Still good for 2 PM?",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            },
            {
                id: 'msg-2-2',
                senderId: 'eng-1',
                type: 'text',
                text: "You got it! All confirmed. I've already blocked it out in my calendar. Looking forward to it.",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
            },
            {
                id: 'msg-2-4',
                senderId: 'eng-1',
                type: 'image',
                imageUrl: 'https://picsum.photos/seed/gear-setup/400/300',
                text: "Got the vocal mic setup ready for you.",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 46.5).toISOString(),
            },
            {
                id: 'msg-2-5',
                senderId: 'artist-user',
                type: 'audio',
                text: "Awesome! Here's a rough mix of the track for reference.",
                audioUrl: 'https://storage.googleapis.com/studiogena-assets/SoundHelix-Song-2-short.mp3',
                audioInfo: {
                    filename: 'ReferenceTrack_V1.mp3',
                    duration: '0:28'
                },
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 46.2).toISOString(),
            },
             {
                id: 'msg-2-3',
                senderId: 'artist-user',
                type: 'text',
                text: "Perfect, see you then!",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString(),
            },
        ]
    },
    {
        id: 'convo-3',
        participant: STOODIOZ[2], // Beat Haven
        unreadCount: 1,
        messages: [
            {
                id: 'msg-3-1',
                senderId: 'studio-3',
                type: 'text',
                text: "Thanks for booking with Beat Haven! Your session is confirmed. Please let us know if you have any questions.",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
            }
        ]
    },
     {
        id: 'convo-4',
        participant: ENGINEERS[3], // Samantha Keyes
        unreadCount: 0,
        messages: [
            {
                id: 'msg-4-1',
                senderId: 'eng-4',
                type: 'text',
                text: "The synth textures on your last track were wild! I'd love to experiment with some granular synthesis if you're up for it during our session.",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
            },
             {
                id: 'msg-4-2',
                senderId: 'artist-user',
                type: 'text',
                text: "That sounds awesome, I'm totally down for that. Let's get weird with it!",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 95).toISOString(),
            },
        ]
    }
];