import React from 'react';
import { getAvatarDataUrl } from '@/utils/avatar';

interface AvatarProps {
  username: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export const Avatar: React.FC<AvatarProps> = React.memo(({ 
  username, 
  size = 'md', 
  className = '' 
}) => {
  const avatarUrl = getAvatarDataUrl(username);

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-night-raised ring-1 ring-night-border flex-shrink-0 ${className}`}
    >
      <img 
        src={avatarUrl} 
        alt={username}
        className="w-full h-full object-cover"
        decoding="async"
      />
    </div>
  );
});

Avatar.displayName = 'Avatar';

