import React from 'react';
import { ShieldCheckIcon } from './icons';

interface VerifiedBadgeProps {
  /** When true, shows the label-verified badge (user is on a label's roster and not dropped). */
  labelVerified?: boolean;
  className?: string;
  title?: string;
}

/** Badge shown on profile and dashboard when the artist/engineer/producer is verified by a label (on roster, not dropped). */
const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ labelVerified, className = '', title = 'Verified by label' }) => {
  if (!labelVerified) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 ${className}`}
      title={title}
    >
      <ShieldCheckIcon className="w-3.5 h-3.5" />
      Verified
    </span>
  );
};

export default VerifiedBadge;
