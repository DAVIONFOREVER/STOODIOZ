import React from 'react';
import type { Artist, Engineer, Stoodio, Producer } from '../types';
import { UserRole } from '../types';
import { MicrophoneIcon, SoundWaveIcon, HouseIcon, MusicNoteIcon, ChevronRightIcon } from './icons';
import { getProfileImageUrl } from '../constants';

type UserProfile = Artist | Engineer | Stoodio | Producer;

interface ChooseActiveProfileProps {
    profiles: UserProfile[];
    onSelectProfile: (profile: UserProfile) => void;
}

const getRoleInfo = (profile: UserProfile) => {
    if ('amenities' in profile) return { role: UserRole.STOODIO, icon: <HouseIcon className="w-10 h-10 text-red-400" /> };
    if ('specialties' in profile) return { role: UserRole.ENGINEER, icon: <SoundWaveIcon className="w-10 h-10 text-orange-400" /> };
    if ('instrumentals' in profile) return { role: UserRole.PRODUCER, icon: <MusicNoteIcon className="w-10 h-10 text-purple-400" /> };
    return { role: UserRole.ARTIST, icon: <MicrophoneIcon className="w-10 h-10 text-green-400" /> };
};

const ProfileCard: React.FC<{
    profile: UserProfile;
    onClick: () => void;
}> = ({ profile, onClick }) => {
    const { role } = getRoleInfo(profile);
    
    return (
        <button
            onClick={onClick}
            className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-700 hover:border-orange-500/50 hover:bg-zinc-800 transition-all duration-300 text-left w-full group shadow-lg"
        >
            <div className="flex items-center gap-4 mb-2">
                <img src={getProfileImageUrl(profile)} alt={profile.name} className="w-16 h-16 rounded-xl object-cover border-2 border-zinc-700" />
                <div>
                    <h3 className="text-2xl font-bold text-slate-100">{profile.name}</h3>
                    <p className="text-slate-400 font-semibold capitalize">{role.toLowerCase()}</p>
                </div>
            </div>
            <span className="font-semibold text-orange-400 flex items-center gap-2 group-hover:gap-3 transition-all mt-4">
                Continue as {role} <ChevronRightIcon className="w-5 h-5" />
            </span>
        </button>
    );
};


const ChooseActiveProfile: React.FC<ChooseActiveProfileProps> = ({ profiles, onSelectProfile }) => {
    return (
        <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-100">
                Choose Your Profile
            </h1>
            <p className="max-w-2xl mx-auto mt-4 text-lg text-slate-400">
                You have multiple roles associated with this account. Select which one you'd like to use for this session.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-6">
                {profiles.map(profile => (
                    <ProfileCard 
                        key={profile.id} 
                        profile={profile} 
                        onClick={() => onSelectProfile(profile)} 
                    />
                ))}
            </div>
        </div>
    );
};

export default ChooseActiveProfile;