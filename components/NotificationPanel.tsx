import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { AppNotification } from '../types';
import { AppView, NotificationType } from '../types';
import { BellIcon, CalendarIcon, UserPlusIcon, HeartIcon, ChatBubbleIcon, DollarSignIcon, CheckCircleIcon } from './icons';
import { getProfileImageUrl, getDisplayName } from '../constants';

interface NotificationPanelProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigate: (view: AppView, entityId?: string) => void;
  onClose: () => void;
}

const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
    const baseClasses = "w-6 h-6";
    switch (type) {
        case NotificationType.BOOKING_REQUEST:
        case NotificationType.BOOKING_CONFIRMED:
        case NotificationType.BOOKING_DENIED:
            return <CalendarIcon className={`${baseClasses} text-orange-400`} />;
        case NotificationType.NEW_FOLLOWER:
            return <UserPlusIcon className={`${baseClasses} text-blue-400`} />;
        case NotificationType.NEW_LIKE:
            return <HeartIcon className={`${baseClasses} text-red-400`} />;
        case NotificationType.NEW_COMMENT:
        case NotificationType.NEW_MESSAGE:
            return <ChatBubbleIcon className={`${baseClasses} text-green-400`} />;
        case NotificationType.NEW_TIP:
            return <DollarSignIcon className={`${baseClasses} text-yellow-400`} />;
        default:
            return <BellIcon className={`${baseClasses} text-slate-400`} />;
    }
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onMarkAsRead, onMarkAllAsRead, onNavigate, onClose }) => {
    
    const handleNotificationClick = (notification: AppNotification) => {
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }
        if (notification.link) {
            onNavigate(notification.link.view, notification.link.entityId);
        }
        onClose();
    };

    return (
        <div className="absolute top-full right-0 mt-3 w-80 md:w-96 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl z-50 text-slate-200 animate-fade-in-down" role="dialog">
            <div className="flex justify-between items-center p-4 border-b border-zinc-700">
                <h3 className="font-bold text-lg">Notifications</h3>
                <button onClick={onMarkAllAsRead} className="text-sm font-semibold text-orange-400 hover:underline disabled:text-slate-500 disabled:no-underline" disabled={notifications.every(n => n.read)}>
                    Mark all as read
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <BellIcon className="w-12 h-12 mx-auto text-slate-600" />
                        <p className="mt-2 text-slate-400 font-semibold">No new notifications</p>
                        <p className="text-sm text-slate-500">You're all caught up!</p>
                    </div>
                ) : (
                    <ul>
                        {notifications.map(notification => (
                            <li key={notification.id} className={`border-b border-zinc-700 last:border-b-0 ${!notification.read ? 'bg-orange-500/5' : ''}`}>
                                <button onClick={() => handleNotificationClick(notification)} className="w-full flex items-start gap-4 p-4 text-left hover:bg-zinc-700/50 transition-colors">
                                    <div className="relative flex-shrink-0 mt-1">
                                        {notification.actor ? (
                                             <img src={getProfileImageUrl(notification.actor)} alt={getDisplayName(notification.actor)} className="w-10 h-10 rounded-xl object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-zinc-700 flex items-center justify-center">
                                                <NotificationIcon type={notification.type} />
                                            </div>
                                        )}
                                        {!notification.read && <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-orange-500 ring-2 ring-zinc-800" />}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm">{notification.message}</p>
                                        <p className="text-xs text-slate-400 mt-1">{formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}</p>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <style>{`
                 @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down { animation: fade-in-down 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default NotificationPanel;