import * as React from 'react';
import { cn } from '@/lib/cn';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border-input bg-background text-primary',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'hover:border-ring',
        'cursor-pointer',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
