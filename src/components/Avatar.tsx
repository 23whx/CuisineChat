import React from 'react';
import { getAvatarDataUrl } from '@/utils/avatar';

interface AvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export const Avatar: React.FC<AvatarProps> = ({ 
  username, 
  size = 'md', 
  className = '' 
}) => {
  const avatarUrl = getAvatarDataUrl(username);

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 ${className}`}
    >
      <img 
        src={avatarUrl} 
        alt={username}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

