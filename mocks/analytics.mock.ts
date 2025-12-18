import type { AnalyticsData } from '../types';

export const mockAnalyticsData: AnalyticsData = {
    kpis: {
        totalRevenue: 125000,
        profileViews: 14200,
        newFollowers: 850,
        bookings: 64
    },
    revenueOverTime: [
        { date: '2024-05-01', revenue: 4500 },
        { date: '2024-05-05', revenue: 5200 },
        { date: '2024-05-10', revenue: 7800 },
        { date: '2024-05-15', revenue: 6100 },
        { date: '2024-05-20', revenue: 9400 },
        { date: '2024-05-25', revenue: 11200 },
        { date: '2024-05-30', revenue: 12500 }
    ],
    engagementOverTime: [
        { date: '2024-05-01', views: 800, followers: 20, likes: 50 },
        { date: '2024-05-05', views: 1200, followers: 35, likes: 80 },
        { date: '2024-05-10', views: 1500, followers: 45, likes: 120 },
        { date: '2024-05-15', views: 1100, followers: 25, likes: 90 },
        { date: '2024-05-20', views: 1900, followers: 60, likes: 150 },
        { date: '2024-05-25', views: 2400, followers: 85, likes: 210 },
        { date: '2024-05-30', views: 3000, followers: 110, likes: 300 }
    ],
    revenueSources: [
        { name: 'Streaming', revenue: 80000 },
        { name: 'Sessions', revenue: 30000 },
        { name: 'Merchandise', revenue: 15000 }
    ]
};

export const fetchMockAnalyticsData = async (): Promise<AnalyticsData> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockAnalyticsData;
};