import * as React from 'react';
import { cn } from '@/lib/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'block text-sm font-medium text-foreground mb-1.5',
        'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-0.5" aria-label="required">*</span>}
    </label>
  )
);
Label.displayName = 'Label';

export { Label };
