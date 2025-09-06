import type { PlatformUser, DashboardStats } from '../types';
import type { Booking } from '/types.ts';
import { UserRole, BookingStatus, BookingRequestType } from '/types.ts';
import { STOODIOZ, ENGINEERS, MOCK_ARTISTS, SERVICE_FEE_PERCENTAGE } from '/constants.ts';

// --- MOCK DATABASE ---
const allUsers: PlatformUser[] = [
    ...MOCK_ARTISTS.map((u, i) => ({ ...u, role: UserRole.ARTIST, joinedDate: `2023-10-${15+i}` })),
    ...ENGINEERS.map((u, i) => ({ ...u, role: UserRole.ENGINEER, joinedDate: `2023-11-${10+i}` })),
    ...STOODIOZ.map((u, i) => ({ ...u, role: UserRole.STOODIO, joinedDate: `2023-09-${5+i}` })),
];

const mockBookings: Booking[] = [
    {
        id: 'BKG-1672532400',
        artist: MOCK_ARTISTS[0],
        stoodio: STOODIOZ[0],
        engineer: ENGINEERS[0],
        date: '2024-07-20',
        startTime: '14:00',
        duration: 4,
        totalCost: 390,
        // FIX: Property 'engineerPayRate' is missing in type but required in type 'Booking'.
        engineerPayRate: STOODIOZ[0].engineerPayRate,
        status: BookingStatus.COMPLETED,
        requestType: BookingRequestType.SPECIFIC_ENGINEER,
        requestedEngineerId: 'eng-1',
        tip: 50,
        // FIX: Added missing properties `bookedById` and `bookedByRole` to satisfy the Booking type.
        bookedById: MOCK_ARTISTS[0].id,
        bookedByRole: UserRole.ARTIST,
    },
    {
        id: 'BKG-1672618800',
        artist: MOCK_ARTISTS[1],
        stoodio: STOODIOZ[2],
        engineer: ENGINEERS[1],
        date: '2024-07-22',
        startTime: '18:00',
        duration: 3,
        totalCost: 234,
        // FIX: Property 'engineerPayRate' is missing in type but required in type 'Booking'.
        engineerPayRate: STOODIOZ[2].engineerPayRate,
        status: BookingStatus.CONFIRMED,
        requestType: BookingRequestType.FIND_AVAILABLE,
        requestedEngineerId: null,
        // FIX: Added missing properties `bookedById` and `bookedByRole` to satisfy the Booking type.
        bookedById: MOCK_ARTISTS[1].id,
        bookedByRole: UserRole.ARTIST,
    },
     {
        id: 'BKG-1672705200',
        artist: MOCK_ARTISTS[2],
        stoodio: STOODIOZ[1],
        engineer: null,
        date: '2024-07-25',
        startTime: '12:00',
        duration: 6,
        totalCost: 594,
        // FIX: Property 'engineerPayRate' is missing in type but required in type 'Booking'.
        engineerPayRate: STOODIOZ[1].engineerPayRate,
        status: BookingStatus.PENDING,
        requestType: BookingRequestType.FIND_AVAILABLE,
        requestedEngineerId: null,
        // FIX: Added missing properties `bookedById` and `bookedByRole` to satisfy the Booking type.
        bookedById: MOCK_ARTISTS[2].id,
        bookedByRole: UserRole.ARTIST,
    },
     {
        id: 'BKG-1672791600',
        artist: MOCK_ARTISTS[3],
        stoodio: STOODIOZ[4],
        engineer: null,
        date: '2024-08-01',
        startTime: '10:00',
        duration: 8,
        totalCost: 572,
        // FIX: Property 'engineerPayRate' is missing in type but required in type 'Booking'.
        engineerPayRate: STOODIOZ[4].engineerPayRate,
        status: BookingStatus.PENDING_APPROVAL,
        requestType: BookingRequestType.SPECIFIC_ENGINEER,
        requestedEngineerId: 'eng-3',
        // FIX: Added missing properties `bookedById` and `bookedByRole` to satisfy the Booking type.
        bookedById: MOCK_ARTISTS[3].id,
        bookedByRole: UserRole.ARTIST,
    }
];


// --- API FUNCTIONS ---

const simulateDelay = <T>(data: T): Promise<T> => {
    return new Promise(resolve => {
        setTimeout(() => resolve(data), 800);
    });
};

export const getAllUsers = async (): Promise<PlatformUser[]> => {
    return simulateDelay(allUsers);
};

export const getAllBookings = async (): Promise<Booking[]> => {
    return simulateDelay(mockBookings);
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const completedBookings = mockBookings.filter(b => b.status === BookingStatus.COMPLETED);
    
    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalCost, 0);

    // The service fee is included in the totalCost. To calculate the platform's portion, we reverse the calculation.
    // totalCost = subtotal * (1 + SERVICE_FEE_PERCENTAGE)
    // platformFee = totalCost - (totalCost / (1 + SERVICE_FEE_PERCENTAGE))
    const platformFees = completedBookings.reduce((sum, booking) => {
        const subtotal = booking.totalCost / (1 + SERVICE_FEE_PERCENTAGE);
        const feeForBooking = booking.totalCost - subtotal;
        return sum + feeForBooking;
    }, 0);

    const stats: DashboardStats = {
        totalRevenue: totalRevenue,
        platformFees: platformFees,
        artistCount: MOCK_ARTISTS.length,
        engineerCount: ENGINEERS.length,
        stoodioCount: STOODIOZ.length,
        totalBookings: mockBookings.length,
    };
    return simulateDelay(stats);
};