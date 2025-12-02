
import React from 'react';
import { UserRole } from '../types';
import { MicrophoneIcon, SoundWaveIcon, HouseIcon, ChevronRightIcon, MusicNoteIcon, BriefcaseIcon } from './icons';

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
        className="p-8 transition-all duration-300 text-left w-full group cardSurface border border-zinc-700/50 hover:border-orange-500/50"
    >
        <div className="flex items-center gap-4 mb-4">
            {icon}
            <h3 className="text-2xl font-bold text-slate-100">{title}</h3>
        </div>
        <p className="text-slate-400 mb-6 leading-relaxed">{description}</p>
        <span className="font-semibold text-orange-400 flex items-center gap-2 group-hover:gap-3 transition-all">
            Continue as {title} <ChevronRightIcon className="w-5 h-5" />
        </span>
    </button>
);

const ChooseProfile: React.FC<ChooseProfileProps> = ({ onSelectRole }) => {
    return (
        <div className="max-w-5xl mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-100 mb-6">
                How will you use <span className="text-orange-400">Stoodioz?</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-12">
                Choose a profile type to get started. This will tailor your experience on the platform.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <RoleCard
                    icon={<MicrophoneIcon className="w-10 h-10 text-green-400" />}
                    title="Artist"
                    description="Book recording stoodioz, hire talented engineers, and connect with other creators to bring your musical vision to life."
                    onClick={() => onSelectRole(UserRole.ARTIST)}
                />
                <RoleCard
                    icon={<MusicNoteIcon className="w-10 h-10 text-purple-400" />}
                    title="Producer"
                    description="Sell or lease your instrumentals, get hired for custom production work, and manage your beat catalog."
                    onClick={() => onSelectRole(UserRole.PRODUCER)}
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
                <div className="md:col-span-2">
                    <RoleCard
                        icon={<BriefcaseIcon className="w-10 h-10 text-blue-400" />}
                        title="Label / Management"
                        description="For record labels and management teams. Manage multiple artists, book sessions for your roster, and track expenses."
                        onClick={() => onSelectRole(UserRole.LABEL)}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChooseProfile;
