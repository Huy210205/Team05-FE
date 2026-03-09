import React from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  shape?: 'default' | 'circle';
  size?: 'default' | 'sm' | 'lg' | 'xs';
}

const badgeVariants = {
  variant: {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground',
  },
  shape: {
    default: 'rounded-md',
    circle: 'rounded-full',
  },
  size: {
    default: 'px-2.5 py-0.5',
    sm: 'px-2 py-0.5',
    lg: 'px-3 py-1',
    xs: 'px-1.5 py-0.5 text-xs',
  },
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', shape = 'default', size = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          badgeVariants.variant[variant],
          badgeVariants.shape[shape],
          badgeVariants.size[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
