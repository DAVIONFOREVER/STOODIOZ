import React from 'react';
import type { Artist, Engineer, Producer, Stoodio } from '../types';
import { HouseIcon, SoundWaveIcon, MusicNoteIcon, MicrophoneIcon } from './icons';
import { getProfileImageUrl } from '../constants';

interface ProfileCardProps {
  profile: Artist | Engineer | Producer | Stoodio;
  type: 'artist' | 'engineer' | 'producer' | 'stoodio';
  onClick: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, type, onClick }) => {
  let icon: React.ReactNode;
  let details: string | undefined;

  if (type === 'stoodio') {
    icon = <HouseIcon className="w-4 h-4" />;
    details = (profile as Stoodio).location;
  } else if (type === 'engineer') {
    icon = <SoundWaveIcon className="w-4 h-4" />;
    details = (profile as Engineer).specialties?.join(', ');
  } else if (type === 'producer') {
    icon = <MusicNoteIcon className="w-4 h-4" />;
    details = (profile as Producer).genres?.join(', ');
  } else { // artist
    icon = <MicrophoneIcon className="w-4 h-4" />;
    details = (profile as Artist).bio;
  }

  return (
    <button 
      onClick={onClick} 
      className="w-full flex items-center gap-3 p-4 text-left bg-zinc-900/50 hover:bg-zinc-800 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all"
    >
      <img 
        src={getProfileImageUrl(profile)} 
        alt={profile.name} 
        className="w-12 h-12 rounded-full object-cover object-top border-2 border-zinc-700" 
      />
      <div className="flex-grow overflow-hidden min-w-0">
        <p className="font-semibold text-sm text-slate-200 truncate">{profile.name}</p>
        {details && (
          <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-1">
            {icon}
            <span className="truncate">{details}</span>
          </p>
        )}
      </div>
    </button>
  );
};

export default ProfileCard;
