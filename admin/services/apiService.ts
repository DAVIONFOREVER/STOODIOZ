// This is a MOCK API service for the admin dashboard.
// In a real application, this would make fetch calls to a backend API.

import type { PlatformUser, DashboardStats } from '../types';
import { UserRole } from '../../types';
import type { Booking } from '../../types';
import { MOCK_ARTISTS, ENGINEERS, STOODIOZ, MOCK_PRODUCERS } from '../../constants';
import { BookingStatus, BookingRequestType } from '../../types';

// Let's create some more mock data for a richer admin experience
const generateMockBookings = (): Booking[] => {
    const bookings: Booking[] = [];
    for (let i = 0; i < 25; i++) {
        const artist = MOCK_ARTISTS[Math.floor(Math.random() * MOCK_ARTISTS.length)];
        const stoodio = STOODIOZ[Math.floor(Math.random() * STOODIOZ.length)];
        const engineer = ENGINEERS[Math.floor(Math.random() * ENGINEERS.length)];
        const statusValues = Object.values(BookingStatus);
        const status = statusValues[Math.floor(Math.random() * statusValues.length)];
        const duration = Math.floor(Math.random() * 6) + 2;
        const totalCost = (stoodio.hourlyRate + stoodio.engineerPayRate) * duration * 1.15;
        
        bookings.push({
            id: `BKG-ADM-${Date.now() + i}`,
            stoodio,
            artist,
            engineer,
            producer: null,
            room: stoodio.rooms[0],
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            startTime: `${Math.floor(Math.random() * 10) + 10}:00`,
            duration,
            totalCost,
            engineerPayRate: stoodio.engineerPayRate,
            status,
            requestType: BookingRequestType.FIND_AVAILABLE,
            requestedEngineerId: null,
            bookedById: artist.id,
            bookedByRole: UserRole.ARTIST,
        });
    }
    return bookings;
};

const allUsers: PlatformUser[] = [
    ...MOCK_ARTISTS.map(a => ({...a, role: UserRole.ARTIST, joinedDate: new Date().toISOString() })),
    ...ENGINEERS.map(e => ({...e, role: UserRole.ENGINEER, joinedDate: new Date().toISOString() })),
    ...STOODIOZ.map(s => ({...s, role: UserRole.STOODIO, joinedDate: new Date().toISOString() })),
    ...MOCK_PRODUCERS.map(p => ({...p, role: UserRole.PRODUCER, joinedDate: new Date().toISOString() })),
];

const allBookings = generateMockBookings();

export const apiService = {
    getUsers: async (): Promise<PlatformUser[]> => {
        console.log("API: Fetching users...");
        return new Promise(resolve => setTimeout(() => resolve(allUsers), 500));
    },
    getBookings: async (): Promise<Booking[]> => {
        console.log("API: Fetching bookings...");
        return new Promise(resolve => setTimeout(() => resolve(allBookings), 800));
    },
    getDashboardStats: async (): Promise<DashboardStats> => {
        console.log("API: Fetching stats...");
        const completedBookings = allBookings.filter(b => b.status === BookingStatus.COMPLETED);
        const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalCost, 0);
        const platformFees = totalRevenue * (15 / 115); // Assuming 15% fee on top of subtotal

        const stats: DashboardStats = {
            totalRevenue,
            platformFees,
            artistCount: MOCK_ARTISTS.length,
            engineerCount: ENGINEERS.length,
            stoodioCount: STOODIOZ.length,
            producerCount: MOCK_PRODUCERS.length,
            totalBookings: allBookings.length,
        };
        return new Promise(resolve => setTimeout(() => resolve(stats), 300));
    }
};