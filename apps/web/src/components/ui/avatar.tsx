import { cn } from '@/lib/cn';
import { getInitials } from '@/lib/format';

interface AvatarProps {
  src?: string | null;
  firstName: string;
  lastName?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

export function Avatar({ src, firstName, lastName, size = 'md', className }: AvatarProps) {
  const initials = getInitials(firstName, lastName);

  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName ?? ''}`}
        className={cn('rounded-full object-cover flex-shrink-0', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 font-semibold bg-primary/15 text-primary',
        sizeClasses[size],
        className,
      )}
      aria-label={`${firstName} ${lastName ?? ''}`}
    >
      {initials}
    </div>
  );
}
