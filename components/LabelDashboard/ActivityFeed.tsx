
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CalendarIcon, UsersIcon, CheckCircleIcon } from '../icons';

const ActivityItem: React.FC<{ type: string, message: string, time: string }> = ({ type, message, time }) => (
    <div className="flex gap-4 p-4 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            type === 'booking' ? 'bg-green-500/10 text-green-400' : 
            type === 'roster' ? 'bg-blue-500/10 text-blue-400' : 
            'bg-orange-500/10 text-orange-400'
        }`}>
            {type === 'booking' && <CalendarIcon className="w-5 h-5" />}
            {type === 'roster' && <UsersIcon className="w-5 h-5" />}
            {type === 'system' && <CheckCircleIcon className="w-5 h-5" />}
        </div>
        <div>
            <p className="text-zinc-300 text-sm">{message}</p>
            <p className="text-zinc-500 text-xs mt-1">{time}</p>
        </div>
    </div>
);

const ActivityFeed: React.FC = () => {
    // Mock data for demo - in production this would fetch from 'audit_logs' or similar
    const activities = [
        { id: 1, type: 'booking', message: 'Booking confirmed for Nova at Patchwerk', time: '2 mins ago' },
        { id: 2, type: 'roster', message: 'Kai added to roster as Artist', time: '2 hours ago' },
        { id: 3, type: 'system', message: 'Monthly analytics report generated', time: '1 day ago' },
        { id: 4, type: 'booking', message: 'Session payment processed ($450.00)', time: '1 day ago' },
    ];

    return (
        <div className="cardSurface h-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-800">
                <h3 className="font-bold text-lg text-zinc-100">Activity Feed</h3>
            </div>
            <div className="overflow-y-auto flex-grow">
                {activities.map(act => (
                    <ActivityItem key={act.id} type={act.type} message={act.message} time={act.time} />
                ))}
            </div>
        </div>
    );
};

export default ActivityFeed;
