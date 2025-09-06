
import React, { useState, useEffect } from 'react';
import type { AdminUser, PlatformUser, DashboardStats } from './types';
import { AdminView } from './types';
import type { Booking } from '../types';
import * as api from './services/apiService';
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import FinancialDashboard from './components/FinancialDashboard';
import UserManagement from './components/UserManagement';
import BookingManagement from './components/BookingManagement';

const AdminApp: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
    const [currentView, setCurrentView] = useState<AdminView>(AdminView.DASHBOARD);
    
    // Data state
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);

    useEffect(() => {
        if (currentUser) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const [statsData, usersData, bookingsData] = await Promise.all([
                        api.getDashboardStats(),
                        api.getAllUsers(),
                        api.getAllBookings()
                    ]);
                    setStats(statsData);
                    setUsers(usersData);
                    setBookings(bookingsData);
                } catch (error) {
                    console.error("Failed to fetch admin data", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [currentUser]);


    const handleLogin = (email: string, password: string) => {
        if (email.toLowerCase() === 'admin@stoodioz.com') {
            setCurrentUser({
                id: 'admin-1',
                name: 'Stoodioz Admin',
                email: 'admin@stoodioz.com'
            });
        }
    };
    
    const handleLogout = () => {
        setCurrentUser(null);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                 <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                </div>
            )
        }
        switch(currentView) {
            case AdminView.DASHBOARD:
                return <FinancialDashboard stats={stats} />;
            case AdminView.USER_MANAGEMENT:
                return <UserManagement users={users} />;
            case AdminView.BOOKING_MANAGEMENT:
                return <BookingManagement bookings={bookings} users={users} />;
            default:
                return <FinancialDashboard stats={stats} />;
        }
    };

    if (!currentUser) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <DashboardLayout 
            user={currentUser}
            onLogout={handleLogout}
            currentView={currentView}
            onNavigate={setCurrentView}
        >
            {renderContent()}
        </DashboardLayout>
    );
};

export default AdminApp;