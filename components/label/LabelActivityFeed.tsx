import React, { useEffect, useState } from 'react';
import { useAppState } from '../../contexts/AppContext';
import * as apiService from '../../services/apiService';
import { CalendarIcon, UsersIcon, DollarSignIcon, BellIcon } from '../../icons';

type ActivityEvent = {
    id: string;
    type: 'booking' | 'financial' | 'roster' | 'system';
    title: string;
    description: string;
    date: string;
    icon: React.ReactNode;
};

const LabelActivityFeed: React.FC = () => {
    const { currentUser, userRole } = useAppState();
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser || userRole !== 'LABEL') return;

        const load = async () => {
            setLoading(true);
            try {
                const [bookings, budget, roster] = await Promise.all([
                    apiService.fetchLabelBookings(currentUser.id),
                    apiService.getLabelBudgetOverview(currentUser.id),
                    // FIX: Renamed fetchRoster to fetchLabelRoster to match apiService exports
                    apiService.fetchLabelRoster(currentUser.id)
                ]);

                let feed: ActivityEvent[] = [];

                (bookings as any[]).forEach(b => {
                    feed.push({
                        id: `booking-${b.id}`,
                        type: 'booking',
                        title: `Session ${b.status}`,
                        description: `${b.artist?.name || 'Artist'} • ${b.stoodio?.name || 'Remote'}`,
                        date: b.date,
                        icon: <CalendarIcon className="w-6 h-6 text-orange-400"/>
                    });
                });

                if (budget?.budget) {
                    feed.push({
                        id: 'finance-1',
                        type: 'financial',
                        title: 'Budget Updated',
                        description: `Total Spent: $${budget.budget.amount_spent.toLocaleString()}`,
                        date: new Date().toISOString(),
                        icon: <DollarSignIcon className="w-6 h-6 text-green-400"/>
                    });
                }

                roster?.forEach((a: any) => {
                    feed.push({
                        id: `artist-${a.id}`,
                        type: 'roster',
                        title: 'Artist Added to Roster',
                        description: a.name,
                        date: a.created_at || new Date().toISOString(),
                        icon: <UsersIcon className="w-6 h-6 text-blue-400"/>
                    });
                });

                feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setEvents(feed);
            } catch (err) {
                console.error('Activity feed error:', err);
            }
            setLoading(false);
        };

        load();
    }, [currentUser, userRole]);

    if (loading) {
        return <div className="p-20 text-center text-zinc-500">Loading activity...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in pb-20">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-500/10 rounded-xl">
                    <BellIcon className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-zinc-100">Activity Feed</h1>
                    <p className="text-zinc-400 text-sm">Recent label events and system updates</p>
                </div>
            </div>

            <div className="cardSurface divide-y divide-zinc-800">
                {events.length === 0 && (
                    <p className="p-6 text-center text-zinc-500">No activity yet.</p>
                )}

                {events.map(e => (
                    <div key={e.id} className="flex items-start p-4 gap-4 hover:bg-zinc-900/50 transition-colors">
                        <div>{e.icon}</div>
                        <div className="flex-grow">
                            <p className="text-zinc-200 font-bold">{e.title}</p>
                            <p className="text-zinc-400 text-sm">{e.description}</p>
                        </div>
                        <div className="text-xs text-zinc-500 whitespace-nowrap">
                            {new Date(e.date).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LabelActivityFeed;
