import React, { useEffect, useState } from 'react';
import type { AppNotification } from '../types';
import { CloseIcon, BellIcon } from './icons';

interface NotificationToastsProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}

const NotificationToast: React.FC<{ notification: AppNotification, onDismiss: (id: string) => void }> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 8000); // Auto-dismiss after 8 seconds

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl p-4 flex items-start gap-4 animate-slide-in-right w-full">
      {/* Icon */}
      <div className="bg-orange-500/20 text-orange-400 p-2 rounded-full flex-shrink-0 mt-1">
        {notification.actor ? (
            <img src={notification.actor.imageUrl} alt={notification.actor.name} className="w-6 h-6 rounded-full object-cover" />
        ) : (
            <BellIcon className="w-5 h-5" />
        )}
      </div>
      {/* Content */}
      <div className="flex-grow">
        <p className="font-bold text-slate-100">New Notification</p>
        <p className="text-sm text-slate-300">{notification.message}</p>
      </div>
      {/* Dismiss button */}
      <button onClick={() => onDismiss(notification.id)} className="text-slate-500 hover:text-slate-200 flex-shrink-0">
        <CloseIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

const NotificationToasts: React.FC<NotificationToastsProps> = ({ notifications, onDismiss }) => {
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);

  useEffect(() => {
    // When the notifications prop changes, find any new ones that aren't already active.
    const newNotifications = notifications.filter(n => !activeToasts.some(at => at.id === n.id));
    if (newNotifications.length > 0) {
      setActiveToasts(prev => [...prev, ...newNotifications]);
    }
  }, [notifications, activeToasts]);

  const handleDismiss = (id: string) => {
    // Remove from local active toasts
    setActiveToasts(prev => prev.filter(n => n.id !== id));
    // Call parent handler to mark as read globally
    onDismiss(id); 
  };
  
  return (
    <div className="fixed top-24 right-4 z-[100] space-y-3 w-full max-w-sm">
      {activeToasts.map(notification => (
        <NotificationToast key={notification.id} notification={notification} onDismiss={handleDismiss} />
      ))}
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
      `}</style>
    </div>
  );
};

export default NotificationToasts;
