import React, { useState, useMemo } from 'react';
import type { AdminUser, PlatformUser, DashboardStats } from './types';
import { AdminView } from './types';
import { UserRole } from '../types';
import type { Booking } from '../types';
import { MOCK_ARTISTS, ENGINEERS, STOODIOZ } from '../constants';
import { apiService } from './services/apiService';
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import FinancialDashboard from './components/FinancialDashboard';
import UserManagement from './components/UserManagement';
import BookingManagement from './components/BookingManagement';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
    const [currentView, setCurrentView] = useState<AdminView>(AdminView.DASHBOARD);
    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);

    React.useEffect(() => {
        if (currentUser) {
            const fetchData = async () => {
                const [fetchedUsers, fetchedBookings, fetchedStats] = await Promise.all([
                    apiService.getUsers(),
                    apiService.getBookings(),
                    apiService.getDashboardStats(),
                ]);
                setUsers(fetchedUsers);
                setBookings(fetchedBookings);
                setStats(fetchedStats);
            };
            fetchData();
        }
    }, [currentUser]);

    const handleLogin = (email: string, password: string) => {
        if (email === 'admin@stoodioz.com' && password === 'password') {
            setCurrentUser({ id: 'admin-1', name: 'Admin User', email });
        } else {
            alert('Invalid admin credentials.');
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    const renderContent = () => {
        switch (currentView) {
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

export default App;
