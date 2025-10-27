import React from 'react';
import type { Artist, Engineer, Stoodio, Producer } from '../types';
import { RankingTier } from '../types';
import RankingBadge from './RankingBadge';
import { USER_SILHOUETTE_URL } from '../constants';

type Profile = Artist | Engineer | Stoodio | Producer;

interface ProfileHeroHeaderProps {
    profile: Profile;
}

const ProfileHeroHeader: React.FC<ProfileHeroHeaderProps> = ({ profile }) => {
    
    const bannerStyle: React.CSSProperties = profile.cover_image_url
        ? { backgroundImage: `url(${profile.cover_image_url})` }
        : { backgroundImage: 'linear-gradient(to top, #18181b 20%, #f97316 250%)' };

    const followingCount = ('following' in profile) 
        ? (profile.following.artists?.length || 0) + 
          (profile.following.engineers?.length || 0) + 
          (profile.following.producers?.length || 0) + 
          (profile.following.stoodioz?.length || 0)
        : 0;

    return (
        <div className="w-full mb-24 md:mb-20">
            {/* Banner Section */}
            <div className="h-48 md:h-64 bg-cover bg-center relative rounded-t-2xl" style={bannerStyle}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20"></div>
                <div className="absolute -bottom-px left-0 w-full h-16 bg-gradient-to-t from-black via-orange-500/10 to-transparent"
                     style={{ filter: 'blur(8px)' }} />
            </div>

            {/* Content block: Avatar + Info */}
            <div className="relative px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center text-center -mt-20">
                    {/* Avatar */}
                    <div className="relative mb-4">
                        <img 
                            src={profile.imageUrl || USER_SILHOUETTE_URL} 
                            alt={profile.name}
                            className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-black"
                            style={{ boxShadow: '0 0 35px rgba(249, 115, 22, 0.4), 0 5px 15px rgba(0,0,0,0.5)' }} 
                        />
                        <div className="absolute inset-0 rounded-full ring-2 ring-orange-500/50 animate-pulse" style={{ animationDuration: '4s' }}></div>
                    </div>

                    {/* Info Block */}
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100 text-glow">{profile.name}</h1>
                        {'location' in profile && <p className="text-zinc-400 mt-1">{profile.location}</p>}
                        
                        <div className="flex items-center justify-center gap-4 mt-3 text-zinc-300 text-sm">
                             <span><span className="font-bold text-white">{profile.followers.toLocaleString()}</span> Followers</span>
                             <span className="text-zinc-600">|</span>
                             <span><span className="font-bold text-white">{followingCount.toLocaleString()}</span> Following</span>
                        </div>

                        <div className="mt-4 flex flex-col items-center gap-2">
                             <RankingBadge tier={profile.ranking_tier} isOnStreak={profile.is_on_streak} />
                             {profile.ranking_tier !== RankingTier.Provisional && profile.local_rank_text &&
                                <p className="text-sm font-semibold text-orange-400">{profile.local_rank_text}</p>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeroHeader;
