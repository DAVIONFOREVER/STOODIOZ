import type { Artist, Engineer, Stoodio, UserRole, Producer } from '../types';

export enum AdminView {
    DASHBOARD = 'DASHBOARD',
    USER_MANAGEMENT = 'USER_MANAGEMENT',
    BOOKING_MANAGEMENT = 'BOOKING_MANAGEMENT',
}

export interface AdminUser {
    id: string;
    name: string;
    email: string;
}

export type PlatformUser = (Artist | Engineer | Stoodio | Producer) & { role: UserRole, joinedDate: string };

export interface DashboardStats {
    totalRevenue: number;
    platformFees: number;
    artistCount: number;
    engineerCount: number;
    stoodioCount: number;
    producerCount: number;
    totalBookings: number;
}
