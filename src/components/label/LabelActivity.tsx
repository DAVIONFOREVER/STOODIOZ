import React, { useEffect, useState, useMemo } from 'react';
import { useAppState } from '../contexts/AppContext';
import * as apiService from '../services/apiService';
import { CalendarIcon, UsersIcon, DollarSignIcon, BellIcon, CheckCircleIcon } from '../icons';
import type { Booking, RosterMember, Transaction, LabelBudgetOverview } from '../types';

type ActivityEvent = {
    id: string;
    type: 'booking' | 'financial' | 'roster' | 'system';
    title: string;
    description: string;
    date: string; // ISO string or "N/A"
    icon: React.ReactNode;
};

const groupEventsByDate = (events: ActivityEvent[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    return events.reduce((acc, event) => {
        if (event.date === 'N/A') {
            const key = 'Unsorted Activity';
            if (!acc[key]) acc[key] = [];
            acc[key].push(event);
            return acc;
        }

        const eventDate = new Date(event.date);
        const eventDateStr = eventDate.toISOString().split('T')[0];
        
        let dateLabel: string;
        if (eventDateStr === todayStr) {
            dateLabel = 'Today';
        } else if (eventDateStr === yesterdayStr) {
            dateLabel = 'Yesterday';
        } else {
            dateLabel = eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
        
        if (!acc[dateLabel]) {
            acc[dateLabel] = [];
        }
        acc[dateLabel].push(event);
        return acc;
    }, {} as Record<string, ActivityEvent[]>);
};


const LabelActivity: React.FC = () => {
    const { currentUser, userRole } = useAppState();
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const processedEvents = useMemo(() => {
        const sorted = [...events].sort((a, b) => {
            if (a.date === 'N/A' && b.date === 'N/A') return 0;
            if (a.date === 'N/A') return 1;
            if (b.date === 'N/A') return -1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        return groupEventsByDate(sorted);
    }, [events]);

    useEffect(() => {
        if (!currentUser || userRole !== 'LABEL') return;

        const loadActivity = async () => {
            setLoading(true);
            try {
                const [bookingsData, transactionsData, rosterData, budgetData] = await Promise.all([
                    apiService.fetchLabelBookings(currentUser.id),
                    apiService.fetchLabelTransactions(currentUser.id),
                    apiService.fetchLabelRoster(currentUser.id),
                    apiService.getLabelBudgetOverview(currentUser.id)
                ]);

                let feed: ActivityEvent[] = [];

                (bookingsData as Booking[])?.forEach(b => {
                    feed.push({
                        id: `booking-created-${b.id}`,
                        type: 'booking',
                        title: 'Booking Created',
                        description: `${b.artist?.name || 'An artist'} at ${b.stoodio?.name || 'Remote'}`,
                        date: b.date,
                        icon: <CalendarIcon className="w-5 h-5 text-orange-400"/>
                    });
                    if (b.status === 'COMPLETED') {
                         feed.push({
                            id: `booking-completed-${b.id}`,
                            type: 'booking',
                            title: 'Session Completed',
                            description: `For ${b.artist?.name || 'An artist'}. Total: $${b.total_cost.toFixed(2)}`,
                            date: b.date,
                            icon: <CheckCircleIcon className="w-5 h-5 text-green-400"/>
                        });
                    }
                });

                (transactionsData as Transaction[])?.forEach(t => {
                     feed.push({
                        id: `txn-${t.id}`,
                        type: 'financial',
                        title: 'Label Transaction',
                        description: `${t.description} - $${Math.abs(t.amount).toFixed(2)}`,
                        date: t.date,
                        icon: <DollarSignIcon className="w-5 h-5 text-purple-400"/>
                    });
                });
                
                (rosterData as RosterMember[])?.forEach(a => {
                    feed.push({
                        id: `roster-${a.id}`,
                        type: 'roster',
                        title: 'Artist Added to Roster',
                        description: a.name,
                        date: 'N/A', // As per prompt, timestamp might not be available.
                        icon: <UsersIcon className="w-5 h-5 text-blue-400"/>
                    });
                });

                if (budgetData?.budget) {
                     feed.push({
                        id: 'budget-update-1',
                        type: 'system',
                        title: 'Budget Updated',
                        description: `Total budget is now $${budgetData.budget.total_budget.toLocaleString()}`,
                        date: 'N/A', // No reliable timestamp for this derived event
                        icon: <BellIcon className="w-5 h-5 text-zinc-400"/>
                    });
                }

                setEvents(feed);

            } catch (err) {
                console.error('Activity feed error:', err);
            }
            setLoading(false);
        };

        loadActivity();
    }, [currentUser, userRole]);

    if (loading) {
        return <div className="p-20 text-center text-zinc-500">Loading activity...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in pb-20">
            <h1 className="text-3xl font-bold text-zinc-100">Activity Feed</h1>
            
            <div className="space-y-6">
                {Object.keys(processedEvents).length === 0 ? (
                    <div className="p-10 text-center text-zinc-500 cardSurface">
                        <BellIcon className="w-12 h-12 mx-auto text-zinc-600 mb-4"/>
                        <p className="font-semibold">No activity to report yet.</p>
                        <p className="text-sm">Bookings, transactions, and roster changes will appear here.</p>
                    </div>
                ) : (
                    Object.entries(processedEvents).map(([dateLabel, dayEvents]) => (
                        <div key={dateLabel}>
                            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3 px-2">{dateLabel}</h2>
                            <div className="cardSurface divide-y divide-zinc-800">
                                {dayEvents.map(e => (
                                    <div key={e.id} className="flex items-start p-4 gap-4 hover:bg-zinc-900/50 transition-colors">
                                        <div className="p-2 bg-zinc-800 rounded-full mt-1">{e.icon}</div>
                                        <div className="flex-grow">
                                            <p className="text-zinc-200 font-bold">{e.title}</p>
                                            <p className="text-zinc-400 text-sm">{e.description}</p>
                                        </div>
                                        <div className="text-xs text-zinc-500 whitespace-nowrap pt-1">
                                            {e.date !== 'N/A' && new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LabelActivity;
