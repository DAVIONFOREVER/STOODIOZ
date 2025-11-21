
import React from 'react';
import type { Artist, Engineer, Stoodio, Producer } from '../types';
import { AppView, UserRole } from '../types';

interface UserProfileCardProps {
    user: Artist | Engineer | Stoodio | Producer;
    userRole?: UserRole | null;
    onNavigate: (view: AppView) => void;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user, userRole, onNavigate }) => {
    
    const handleNavigateToDashboard = () => {
        // Priority 1: Use explicit role if provided (Robust)
        if (userRole) {
            switch (userRole) {
                case UserRole.STOODIO: return onNavigate(AppView.STOODIO_DASHBOARD);
                case UserRole.ENGINEER: return onNavigate(AppView.ENGINEER_DASHBOARD);
                case UserRole.PRODUCER: return onNavigate(AppView.PRODUCER_DASHBOARD);
                case UserRole.ARTIST: return onNavigate(AppView.ARTIST_DASHBOARD);
            }
        }

        // Priority 2: Fallback to property checking (Legacy/Backup)
        if ('amenities' in user) onNavigate(AppView.STOODIO_DASHBOARD);
        else if ('specialties' in user) onNavigate(AppView.ENGINEER_DASHBOARD);
        else if ('instrumentals' in user) onNavigate(AppView.PRODUCER_DASHBOARD);
        else onNavigate(AppView.ARTIST_DASHBOARD);
    };

    return (
        <div className="overflow-hidden cardSurface">
            <div className="h-20 bg-gradient-to-r from-orange-500 to-amber-500"></div>
            <div className="p-4 pt-0 -mt-10">
                {/* FIX: Changed `imageUrl` to `image_url` to match the user type definition. */}
                <img 
                    src={user.image_url} 
                    alt={user.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-zinc-800 mx-auto"
                />
                <h2 className="text-center text-xl font-bold text-slate-100 mt-2">{user.name}</h2>
                <div className="text-center mt-4 space-y-2">
                     <button 
                        onClick={handleNavigateToDashboard}
                        className="w-full bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-all text-sm shadow-md shadow-orange-500/20"
                    >
                        My Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfileCard;
