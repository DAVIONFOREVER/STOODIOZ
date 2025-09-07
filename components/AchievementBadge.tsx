import React from 'react';

interface AchievementBadgeProps {
    achievement: {
        name: string;
        icon: string; // Could be an emoji or an SVG component
        description: string;
    };
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement }) => {
    return (
        <div className="bg-zinc-800 p-4 rounded-lg flex items-center gap-4 border border-zinc-700" title={achievement.description}>
            <div className="text-3xl">{achievement.icon}</div>
            <div>
                <p className="font-bold text-slate-100">{achievement.name}</p>
                <p className="text-sm text-slate-400">{achievement.description}</p>
            </div>
        </div>
    );
};

export default AchievementBadge;
