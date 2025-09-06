import React from 'react';
import { UserRole } from '../types';
import { MicrophoneIcon, SoundWaveIcon, HouseIcon, ChevronRightIcon } from './icons';

interface ChooseProfileProps {
    onSelectRole: (role: UserRole) => void;
}

const RoleCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="bg-zinc-800 p-8 rounded-2xl border border-zinc-700 hover:border-orange-500 hover:bg-zinc-700/50 transition-all duration-300 text-left w-full group"
    >
        <div className="flex items-center gap-4 mb-4">
            {icon}
            <h3 className="text-3xl font-bold text-slate-100">{title}</h3>
        </div>
        <p className="text-slate-400 mb-6">{description}</p>
        <span className="font-semibold text-orange-400 flex items-center gap-2 group-hover:gap-3 transition-all">
            Continue as {title} <ChevronRightIcon className="w-5 h-5" />
        </span>
    </button>
);

const ChooseProfile: React.FC<ChooseProfileProps> = ({ onSelectRole }) => {
    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-orange-500">
                How will you use Stoodioz?
            </h1>
            <p className="max-w-2xl mx-auto mt-4 text-lg text-slate-300">
                Choose a profile type to get started. This will tailor your experience on the platform.
            </p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-1 gap-8">
                <RoleCard
                    icon={<MicrophoneIcon className="w-10 h-10 text-green-400" />}
                    title="Artist"
                    description="Book recording stoodioz, hire talented engineers, and connect with other creators to bring your musical vision to life."
                    onClick={() => onSelectRole(UserRole.ARTIST)}
                />
                <RoleCard
                    icon={<SoundWaveIcon className="w-10 h-10 text-orange-400" />}
                    title="Engineer"
                    description="Offer your audio engineering skills, find new artists to work with, and manage your session bookings all in one place."
                    onClick={() => onSelectRole(UserRole.ENGINEER)}
                />
                <RoleCard
                    icon={<HouseIcon className="w-10 h-10 text-red-400" />}
                    title="Stoodio Owner"
                    description="List your recording space, manage your calendar with ease, and connect with a vibrant community of artists and engineers."
                    onClick={() => onSelectRole(UserRole.STOODIO)}
                />
            </div>
        </div>
    );
};

export default ChooseProfile;