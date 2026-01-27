import React from 'react';
import appIcon from '../assets/stoodioz-app-icon.png';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-16 w-16'
  };

  return (
    <img 
      src={appIcon} 
      alt="Loading" 
      className={`${sizeClasses[size]} animate-spin ${className}`}
    />
  );
};

export default Spinner;
